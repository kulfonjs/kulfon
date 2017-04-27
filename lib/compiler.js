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

const Promise = require('bluebird');
const sass = Promise.promisifyAll(require('node-sass'));

const nunjucks = require('nunjucks');
const markdown = require('nunjucks-markdown');
const hljs = require('highlight.js');
const md = require('markdown-it')({
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (_) {}
    }
    return ''; // use external default escaping
  }
});
const fs = Promise.promisifyAll(require('fs-extra'));
const path = require('path');
const yaml = require('js-yaml');
const rollup = require('rollup').rollup;
const uglify = require('rollup-plugin-uglify');
const minify = require('uglify-js').minify;
const sha1 = require('sha1');
const matter = require('gray-matter');
const Sugar = require('sugar-date');
const livereload = require('rollup-plugin-livereload');

const { unique, concat, merge } = require('./util');

const currentDirectory = process.cwd();
Sugar.Date.extend();

let cache;
let config;

let __data = {};
let __pages = {};

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

function __public(filename, inside = '') {
  return path.join(currentDirectory, 'public', inside, filename);
}

function __current(prefix, f = '') {
  return path.join(currentDirectory, 'website', prefix, f);
}

function perform(prefix, file, fn, allowedExtensions) {
  let ext = path.extname(file);

  if (allowedExtensions.includes(ext)) {
    let startTime = new Date();
    process.stdout.write(
      `${startTime.toISOString().grey} - in ${prefix.blue} compiling ${file.yellow} `
    );

    fn(file)

    let endTime = new Date();
    console.log(`${'done'.green} in ${endTime - startTime}ms`);
  }
}

function filterBy(entities) {
  return prefix => {
    return Object.entries(entities)
      .filter(([p, meta]) =>
        (prefix ? p.split(path.sep).includes(prefix) : true)
      )
      .map(([path, meta]) =>
        Object.assign({}, meta.data, { path: pathname(path) })
      )
      .sort((a, b) => b.created_at - a.created_at);
  }
}

function compile(prefix) {
  const ENV = process.env.KULFON_ENV;
  const { stylesheets, javascripts, includePaths } = config;

  let javascriptBundleFingerprint;
  let output;
  let filename;

  switch (prefix) {
    case 'images':
      return file => {
        perform(prefix, file, async () => {
          fs.copyAsync(__current(prefix, file), __public(file));
        }, ['.jpg', '.png', '.jpeg', '.svg'])
      }
    case 'javascripts':
      return file => {
        perform(prefix, file, async () => {
          const dependencies = (javascripts || [])
            .map(name => name.split('/')[3].split('@')[0])
            .reduce((acc, name) => Object.assign(acc, { [name]: name }), {});

          let options = {
            entry: path.join(currentDirectory, 'website/javascripts', 'main.js'),
            cache: cache,
            external: Object.keys(dependencies),
            plugins: [livereload({ watch: 'public', verbose: false })]
          }

          if (ENV === 'production') {
            Object.assign(options, { plugins: [uglify({}, minify)] });
          }

          try {
            let bundle = await rollup(options);
            cache = bundle;

            if (ENV === 'production') {
              // XXX Ugly, only for `main.js`
              javascriptBundleFingerprint = sha1(bundle.modules[0].code);
            }

            options = {
              format: 'iife',
              dest: __public(
                ENV === 'production'
                  ? `bundle.${javascriptBundleFingerprint}.js`
                  : 'bundle.js'
              )
            };
            return bundle.write(options);
          } catch (error) {
            console.log(error.message);
          }
        }, ['.js'])
      }
    case 'stylesheets':
      return file => {
        perform(prefix, file, async () => {
          let filePath = __current(prefix, file);

          try {
            let result = await sass.renderAsync({
              file: filePath,
              includePaths: includePaths || [],
              outputStyle: 'compressed',
              sourceMap: true,
              outFile: __public('styles.css')
            })

            output = result.css;
            filename = `${path.basename(file, path.extname(file))}.css`;

            fs.writeFileSync(__public(filename), output);
          } catch (error) {
            console.log(error.formatted);
          }
        }, ['.scss', '.sass'])
      }
    case 'pages':
      return file => {
        perform(prefix, file, async () => {
          const env = nunjucks.configure('website', { autoescape: true });

          env.addFilter('date', (date, format) => {
            return Date.create(date).format(format || '{yyyy}-{MM}-{dd}');
          });

          markdown.register(env, md.render.bind(md));

          let m = matter.read(__current(prefix, file));

          // remove `pages` segment from the path
          __pages[file] = { data: m.data, content: m.content };

          const content = md.render(m.content)
          let data = merge(__data, { page: __pages[file].data });

          if (path.extname(file) === '.md') {
            output = nunjucks.render('layouts/post.html', {
              content,
              data,
              javascripts,
              stylesheets,
              javascriptBundleFingerprint,
              pages: filterBy(__pages)
            });

          } else {
            output = nunjucks.renderString(__pages[file].content, {
              data,
              javascripts,
              stylesheets,
              javascriptBundleFingerprint,
              pages: filterBy(__pages)
            });
          }

          filename = pathname(file);

          if (filename === 'index/') {
            fs.outputFileSync(__public('index.html'), output);
          } else {
            fs.outputFileSync(__public('index.html', filename), output);
          }
        }, ['.md', '.html'])
      }
  }
}

function pathname(file) {
  const { name, dir } = path.parse(file);

  // detect if date in the `name`
  // XXX ugly
  const segments = name.split('_');
  let d = Date.parse(segments[0]);

  if (d) {
    d = new Date(d);

    const year = String(d.getFullYear());
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = String(d.getDate());
    const rest = segments.slice(1).join('_');

    return path.join(dir, year, month, rest, '/');
  } else {
    return path.join(dir, name, '/');
  }
}

function loadConfig() {
  config = yaml.safeLoad(
    fs.readFileSync(path.join(currentDirectory, 'config.yml'), 'utf8')
  );
}

async function loadData() {
  let dataPath = path.join(currentDirectory, 'website');

  let entries = ['data.yml']; // by default parse `data.yml`

  try {
    let stats = await fs.statAsync(path.join(dataPath, 'data'));

    if (stats.isDirectory()) {
      dataPath = path.join(dataPath, 'data');
      entries = fs.readdirAsync(dataPath);
    }
  } catch (error) {
    // do nothing
  }

  let files = entries.filter(f => fs.statSync(path.join(dataPath, f)).isFile());

  const content = files.reduce(
    (acc, _) =>
      [acc, fs.readFileSync(path.join(dataPath, _), 'utf8')].join('---\n'),
    ''
  );

  yaml.safeLoadAll(content, doc => {
    __data = merge(__data, doc);
  });
}

function preprocess(prefix) {
  return files => {
    for (let file of files) {
      let m = matter.read(__current(prefix, file));
      let { data, content } = m;

      __pages[file] = { data, content };
    }

    return files;
  }
}

function transformViews() {
  const prefix = 'pages';

  return scan(path.join('website', prefix))
    .then(preprocess(prefix))
    .map(compile(prefix))
    .catch(_ => console.error(_.message));
}

function transformStylesheets() {
  const prefix = 'stylesheets';

  return scan(path.join('website', prefix))
    .filter(f => f[0] !== '_')
    .map(compile(prefix))
    .catch(_ => console.error(_.message));
}

function transformJavascripts() {
  const prefix = 'javascripts';

  return scan(path.join('website', prefix))
    .map(compile(prefix))
    .catch(_ => console.error(_.message));
}

function transformImages() {
  const prefix = 'images';

  return scan(path.join('website', prefix))
    .filter(f => ['.jpg', '.png', '.jpeg', '.svg'].includes(path.extname(f)))
    .map(compile(prefix))
    .catch(_ => console.error(_.message));
}

function compileAll({ dir, env }) {
  return Promise.resolve(['website'])
    .then(() => fs.ensureDirAsync('public/images'))
    .then(loadConfig)
    .then(loadData)
    .then(transformStylesheets)
    .then(transformImages)
    .then(transformJavascripts)
    .then(transformViews)
    .catch(error => {
      console.log(
        'Error: '.red + 'it seems you are not in `kulfon` compatible directory'
      );
      console.error(error.message);
      process.exit();
    });
}

module.exports = {
  compile,
  transformViews,
  compileAll,
  handler: compileAll,
  builder: _ =>
    _.option('environment', { alias: ['e', 'env'], default: 'dev' }).default(
      'dir',
      '.'
    )
};
