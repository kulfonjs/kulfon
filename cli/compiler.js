// Copyright 2016 Zaiste & contributors. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const Promise = require("bluebird");
const sass = Promise.promisifyAll(require("node-sass"));

const nunjucks = require("nunjucks");
const markdown = require("nunjucks-markdown");
const hljs = require("highlight.js");
const md = require("markdown-it")({
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (_) {}
    }
    return ""; // use external default escaping
  }
});
const fs = Promise.promisifyAll(require("fs-extra"));
const path = require("path");
const yaml = require("js-yaml");
const rollup = require("rollup").rollup;
const uglify = require("rollup-plugin-uglify");
const minify = require("uglify-js").minify;
const sha1 = require("sha1");
const matter = require("gray-matter");
const Sugar = require("sugar-date");
const livereload = require("rollup-plugin-livereload");
const svgo = require("svgo");

const spawn = require("child_process").spawnSync;

const {
  unique,
  concat,
  merge,
  isEmpty,
  slugify,
  exists,
  print,
  println
} = require("./util");

const currentDirectory = process.cwd();
const cwd = process.cwd();
Sugar.Date.extend();
const svgOptimizer = new svgo({});

EXTENSIONS = {
  images: [".jpg", ".png", ".jpeg", ".svg"]
};

let cache;
let config;

let __data = {};
let __pages = {};
let __tags = {};

function scan(directory, recursive = true) {
  return fs
    .readdirAsync(directory)
    .map(el =>
      fs.statAsync(path.join(directory, el)).then(stat => {
        if (stat.isFile()) {
          return el;
        } else {
          return !recursive
            ? []
            : scan(path.join(directory, el))
                .reduce(concat, [])
                .map(_ => path.join(el, _));
        }
      })
    )
    .reduce(concat, []);
}

function __public(filename, inside = "") {
  return path.join(currentDirectory, "public", inside, filename);
}

function __current(prefix, f = "") {
  return path.join(currentDirectory, "website", prefix, f);
}

function profile(func, prefix, allowedExtensions) {
  return async file => {
    println(`-> ${file.yellow}`);
    const result = await func(file);

    return result;
  };
}

function filterBy(entities) {
  return prefix => {
    return Object.entries(entities)
      .filter(
        ([p, meta]) => (prefix ? p.split(path.sep).includes(prefix) : true)
      )
      .map(([path, meta]) =>
        Object.assign({}, meta.data, { path: pathname(path) })
      )
      .sort((a, b) => b.created_at - a.created_at);
  };
}

function compile(prefix) {
  const ENV = process.env.KULFON_ENV;
  const { stylesheets, javascripts, includePaths } = config;

  let javascriptBundleFingerprint;
  let output;
  let filename;

  let compiler;

  switch (prefix) {
    case "images":
      compiler = async file => {
        const imageExists = await exists(__public(file, "images"));
        if (imageExists) return;

        switch (path.extname(file)) {
          case ".svg":
            const data = await fs.readFileAsync(
              __current("images", file),
              "utf8"
            );
            const result = await svgOptimizer.optimize(data);
            fs.writeFileSync(__public(file, "images"), result.data);
            break;
          default:
            fs.copyAsync(__current("images", file), __public(file, "images"));
        }
      };
      break;
    case "javascripts":
      compiler = async file => {
        const dependencies = (javascripts || [])
          .map(name => name.split("/")[3].split("@")[0])
          .reduce((acc, name) => Object.assign(acc, { [name]: name }), {});

        let options = {
          entry: path.join(currentDirectory, "website/javascripts", "main.js"),
          cache: cache,
          external: Object.keys(dependencies)
        };

        if (ENV === "production") {
          Object.assign(options, { plugins: [uglify({}, minify)] });
        } else {
          Object.assign(options, {
            plugins: [livereload({ watch: "public", verbose: false })]
          });
        }

        try {
          let bundle = await rollup(options);
          cache = bundle;

          if (ENV === "production") {
            // XXX Ugly, only for `main.js`
            javascriptBundleFingerprint = sha1(bundle.modules[0].code);
          }

          options = {
            format: "iife",
            dest: __public(
              ENV === "production"
                ? `bundle.${javascriptBundleFingerprint}.js`
                : "bundle.js"
            )
          };
          return bundle.write(options);
        } catch (error) {
          println(error.message);
        }
      };
      break;
    case "stylesheets":
      compiler = async file => {
        let filePath = __current(prefix, file);

        try {
          let result = await sass.renderAsync({
            file: filePath,
            includePaths: includePaths || [],
            outputStyle: "compressed",
            sourceMap: true,
            outFile: __public("styles.css")
          });

          output = result.css;
          filename = `${path.basename(file, path.extname(file))}.css`;

          await fs.writeFileAsync(__public(filename), output);
        } catch (error) {
          println(error.formatted);
        }
      };
      break;
    case "pages":
      compiler = async file => {
        const env = nunjucks.configure("website", { autoescape: true });

        env.addFilter("date", (date, format) => {
          return Date.create(date).format(format || "{yyyy}-{MM}-{dd}");
        });

        try {
          markdown.register(env, md.render.bind(md));

          let m = matter.read(__current(prefix, file));

          // remove `pages` segment from the path
          __pages[file] = { data: m.data, content: m.content };

          const content = md.render(m.content);
          let data = merge(
            { page: isEmpty(__pages[file].data) ? false : __pages[file].data },
            __data
          );

          if (false && path.extname(file) === ".md") {
            const parentDir = path.parse(file).dir.split(path.sep).slice(-1)[0];
            const layout = (await fs.pathExists(__current("pages", parentDir)))
              ? parentDir
              : "base";

            output = nunjucks.render(`layouts/${layout}.html`, {
              config,
              content,
              data,
              javascripts,
              stylesheets,
              javascriptBundleFingerprint,
              pages: filterBy(__pages)
            });
          } else {
            output = nunjucks.renderString(__pages[file].content, {
              config,
              data,
              javascripts,
              stylesheets,
              javascriptBundleFingerprint,
              pages: filterBy(__pages)
            });
          }

          filename = pathname(file);

          if (filename === "index/") {
            await fs.outputFileAsync(__public("index.html"), output);
          } else {
            await fs.outputFileAsync(__public("index.html", filename), output);
          }
        } catch (error) {
          println(error.message);
        }
      };
      break;
    default:
      break;
  }

  return profile(compiler, prefix, EXTENSIONS[prefix]);
}

function pathname(file) {
  const { name, dir } = path.parse(file);

  // detect if date in the `name`
  // XXX ugly
  const segments = name.split("_");
  let d = Date.parse(segments[0]);

  if (d) {
    d = new Date(d);

    const year = String(d.getFullYear());
    const month = ("0" + (d.getMonth() + 1)).slice(-2);
    const day = String(d.getDate());
    const rest = segments.slice(1).join("_");

    return path.join(dir, year, month, rest, "/");
  } else if (name === "index") {
    return "";
  } else {
    return path.join(dir, name, "/");
  }
}

async function loadConfig() {
  const yamlContent = await fs.readFileAsync(
    path.join(currentDirectory, "config.yml"),
    "utf8"
  );
  config = yaml.safeLoad(yamlContent);
}

async function loadData() {
  let dataPath = path.join(currentDirectory, "website");

  let entries = ["data.yml"]; // by default parse `data.yml`

  try {
    let stats = await fs.statAsync(path.join(dataPath, "data"));

    if (stats.isDirectory()) {
      dataPath = path.join(dataPath, "data");
      entries = fs.readdirAsync(dataPath);
    }
  } catch (error) {
    // do nothing
  }

  let files = entries.filter(f => fs.statSync(path.join(dataPath, f)).isFile());

  const content = files.reduce(
    (acc, _) =>
      [acc, fs.readFileSync(path.join(dataPath, _), "utf8")].join("---\n"),
    ""
  );

  yaml.safeLoadAll(content, doc => {
    __data = merge(__data, doc);
  });
}

function preprocess(prefix) {
  switch (prefix) {
    case "pages":
      return files => {
        for (let file of files) {
          let m = matter.read(__current(prefix, file));
          let { data, content } = m;

          __pages[file] = { data, content };

          const tags = data.tags || [];
          for (let tag of tags) {
            let t = slugify(tag);
            (__tags[t] = __tags[t] || []).push({
              path: pathname(file),
              title: data.title
            });
          }
        }

        return files;
      };
    case "images":
      return files =>
        files.filter(f =>
          [".jpg", ".png", ".jpeg", ".svg"].includes(path.extname(f))
        );
    case "stylesheets":
      return files => files.filter(f => f[0] !== "_");
    case "javascripts":
      return files => files;
  }
}

function transform(prefix) {
  return () => {
    let startTime = new Date();
    println(`${startTime.toISOString().grey} - in ${prefix.blue} compiling:`);

    return scan(path.join("website", prefix))
      .then(preprocess(prefix))
      .map(compile(prefix))
      .then(() => {
        let endTime = new Date();
        println(
          `${endTime.toISOString().grey} - ${"done".green} (${endTime -
            startTime}ms)`
        );
      })
      .catch(_ => console.error(_.message));
  };
}

async function checkDirectoryStructure() {
  const paths = [
    "website/images",
    "website/javascripts",
    "website/layouts",
    "website/pages",
    "website/partials",
    "website/stylesheets"
  ].map(el => path.join(cwd, el));

  const result = await Promise.resolve(paths).map(fs.pathExists).all();

  if (!result.every(_ => _)) {
    const tree = spawn("tree", ["-d", "-I", "node_modules"], { cwd: "." });
    throw new WrongDirectoryError(`It seems you are not in 'kulfon' compatible directory. Here's the proper structure:

. (your project root)
└── website
  ├── images
  ├── javascripts
  ├── layouts
  ├── pages
  ├── partials
  └── stylesheets

but your current directory at '${cwd}' looks like this:

${tree.stdout}
    `);
  }
}

class WrongDirectoryError extends Error {
  constructor(message) {
    super(message);
  }
}

async function compileAll({ dir, env }) {
  process.env.KULFON_ENV = env;

  try {
    await fs.ensureDirAsync("public/images");
    await checkDirectoryStructure();
    await loadConfig();
    await loadData();

    await transform("stylesheets")();
    await transform("images")();
    await transform("javascripts")();
    await transform("pages")();
  } catch (error) {
    console.error("Error: ".red + error.message);
    process.exit();
  }
}

module.exports = {
  compile,
  transform,
  compileAll,
  loadData,
  handler: compileAll,
  builder: _ =>
    _.option("environment", {
      alias: ["e", "env"],
      default: "production"
    }).default("dir", ".")
};
