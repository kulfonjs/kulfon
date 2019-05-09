// Copyright 2019 Zaiste & contributors. All rights reserved.
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
const md = require('markdown-it')({
  html: true
});

md.use(require('markdown-it-anchor'));
md.use(require('markdown-it-table-of-contents'), {
  includeLevel: [1, 2, 3, 4, 5, 6]
});
md.use(require('markdown-it-prism'));
md.use(require('markdown-it-highlight-lines'));
md.use(require('markdown-it-container'), 'label');

const fs = Promise.promisifyAll(require('fs-extra'));
const path = require('path');
const yaml = require('js-yaml');
const rollup = require('rollup').rollup;
const sha1 = require('sha1');
const matter = require('gray-matter');
const Sugar = require('sugar-date');
const svgo = require('svgo');
const { createSitemap } = require('sitemap');
const sharp = require('sharp');
const minifyHTML = require('html-minifier').minify;
const { terser } = require('rollup-plugin-terser');
const unified = require('unified');
const parse = require('orga-unified');
const mutate = require('orga-rehype');
const highlight = require('@mapbox/rehype-prism');
const html = require('rehype-stringify');
const unistMap = require('unist-util-map');
const spawn = require('child_process').spawnSync;
const fg = require('fast-glob');

const {
  unique,
  concat,
  merge,
  flatten,
  isEmpty,
  anchorize,
  exists,
  print,
  println,
  buildTableOfContents,
  unfold
} = require('../cli/util');

const LinkExt = require('./LinkExt');

const CWD = process.cwd();
Sugar.Date.extend();
// const svgOptimizer = new svgo({});

EXTENSIONS = {
  images: ['.jpg', '.png', '.jpeg', '.svg']
};

let env = nunjucks.configure(['website/pages', 'website/components'], {
  autoescape: true,
  noCache: true
});
env.addFilter('date', (date, format) =>
  Date.create(date).format(format || '{yyyy}-{MM}-{dd}')
);

env.addExtension('LinkExt', new LinkExt());

markdown.register(env, md.render.bind(md));

const linkify = () => tree =>
  unistMap(tree, node => {
    const { type, uri: { protocol = '', location = '/' } = '' } = node;

    if (type === 'link' && protocol === 'file') {
      const { dir, name } = path.parse(location);
      node.uri.raw = path.join('/', dir, name);
    }

    return node;
  });

let cache;
let config;
let bundles = { js: '', css: '' };

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

function __public(filename, inside = '') {
  return path.join(CWD, 'public', inside, filename);
}

function __current(prefix, f = '') {
  return path.join(CWD, 'website', prefix, f);
}

function profile(func, prefix, allowedExtensions) {
  return async file => {
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
      .map(([path, meta]) => meta)
      .filter(_ => _.publish === undefined || _.publish === true)
      .sort((a, b) => b.created_at - a.created_at);
  };
}

function compile(prefix) {
  const isProduction = process.env.KULFON_ENV === 'production';
  const { stylesheets, javascripts, includePaths } = config;

  let output;
  let filename;

  let compiler;

  switch (prefix) {
    case 'images':
      compiler = async file => {
        const imageExists = await exists(__public(file, 'images'));
        if (imageExists) return; // poor's man optimizaion

        switch (path.extname(file)) {
          case '.svg':
            // const data = await fs.readFileAsync(
            //   __current("images", file),
            //   "utf8"
            // );
            // const result = await svgOptimizer.optimize(data);
            // fs.writeFileSync(__public(file, "images"), result.data);
            fs.copyAsync(__current('images', file), __public(file, 'images'));
            break;
          case '.gif':
            fs.copyAsync(__current('images', file), __public(file, 'images'));
            break;
          default:
            await sharp(__current('images', file)).toFile(
              __public(file, 'images')
            );
        }
      };
      break;
    case 'javascripts':
      compiler = async file => {
        const dependencies = (javascripts || [])
          .map(name => name.split('/')[3].split('@')[0])
          .reduce((acc, name) => Object.assign(acc, { [name]: name }), {});

        let options = {
          input: path.join(CWD, 'website/javascripts', 'main.js'),
          cache: cache,
          external: Object.keys(dependencies),
          plugins: terser()
        };

        try {
          let bundle = await rollup(options);
          cache = bundle;

          let hash = sha1(bundle.cache.modules[0].code);
          bundles.js = `main.${hash}.js`;

          return bundle.write({
            format: 'iife',
            file: __public(bundles.js)
          });
        } catch (error) {
          println(error.message);
        }
      };
      break;
    case 'stylesheets':
      compiler = async file => {
        let filePath = __current(prefix, file);

        try {
          let result = await sass.renderAsync({
            file: filePath,
            includePaths: includePaths || [],
            outputStyle: 'compressed',
            sourceMap: true,
            sourceMapEmbed: !isProduction
          });

          output = result.css;

          let hash = sha1(output);
          let name = path.basename(file, path.extname(file));

          filename = !isProduction ? `${name}.css` : `${name}.${hash}.css`;

          bundles.css = filename;

          await fs.writeFileAsync(__public(filename), output);
        } catch (error) {
          println(error.formatted);
        }
      };
      break;
    case 'pages':
      compiler = async file => {
        const filename = pathname(file);

        try {
          const { data, content } = matter.read(__current(prefix, file));

          let page = {
            ...data,
            content,
            path: filename
          };

          __pages[file] = page;

          // update tags
          const tags = (data && data.tags) || [];
          for (let tag of tags) {
            let t = anchorize(tag);
            (__tags[t] = __tags[t] || []).push({
              path: pathname(file),
              title: data.title,
              created_at: data.created_at,
              tags: data.tags
            });
          }

          let renderString = __pages[file].content;
          let renderParams = {
            config,
            page,
            website: __data,
            javascripts,
            stylesheets,
            bundles,
            pages: filterBy(__pages)
          };

          const extension = path.extname(file);

          if (['.md', '.org'].includes(extension)) {
            const parentDir = path
              .parse(file)
              .dir.split(path.sep)
              .slice(-1)[0];

            const foo = await fs.pathExists(
              __current(
                'components/layouts',
                path.format({ name: parentDir, ext: '.njk' })
              )
            );

            const itself = path.parse(file).name;
            const itselfExists = await fs.pathExists(
              __current(
                'components/layouts',
                path.format({ name: itself, ext: '.njk' })
              )
            );

            if (parentDir && foo) {
              renderString = `{% extends "layouts/${parentDir}.njk" %}`;
            } else if (itselfExists) {
              renderString = `{% extends "layouts/${itself}.njk" %}`;
            } else {
              renderString = `
                {% extends "layouts/index.njk" %}
                {% block content %}
                  {{ content | safe }}
                {% endblock %}`;
            }

            if (path.extname(file) === '.md') {
              const tokens = md.parse(content, {});
              const toc = buildTableOfContents(0, tokens);
              renderParams.toc = toc ? toc[1] : false;
              renderParams.content = md.render(content);
            } else if (path.extname(file) === '.org') {
              const processor = unified()
                .use(parse)
                .use(linkify)
                .use(mutate)
                .use(highlight)
                .use(html);

              renderParams.content = await processor.process(content);
            }
          }

          output = nunjucks.renderString(renderString, renderParams);

          if (isProduction)
            output = minifyHTML(output, { collapseWhitespace: true });

          await fs.outputFileAsync(__public('index.html', filename), output);

          return page;
        } catch (error) {
          println(error.message);
        }
      };
      break;
    default:
      compiler = async file => file;
      break;
  }

  return compiler;
}

function pathname(file) {
  const { name, dir } = path.parse(file);

  // detect if date in the `name`
  // XXX ugly
  const segments = name.split('_');
  let d = Date.parse(segments[0]);

  const prefix = config.blog ? config.blog.prefix : false;

  if (d) {
    d = new Date(d);

    const year = String(d.getFullYear());
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = String(d.getDate());
    const rest = segments.slice(1).join('_');

    if (prefix === 'blog') {
      return path.join(dir, year, month, rest, '/');
    } else if (prefix === 'none') {
      return path.join(rest, '/');
    } else {
      return path.join(dir, rest, '/');
    }
  } else if (name === 'index') {
    return '';
  } else {
    return path.join(dir, name, '/');
  }
}

async function loadConfig() {
  const yamlContent = await fs.readFileAsync(
    path.join(CWD, 'config.yml'),
    'utf8'
  );
  config = yaml.safeLoad(yamlContent);
}

async function loadData() {
  let dataPath = path.join(CWD, 'website');

  let entries = ['data.yml']; // by default parse `data.yml`

  let data = {};

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
    data = merge(data, doc);
  });

  const unfolded = await unfold(data);

  __data = merge(__data, unfolded);
}

const buildTagsPages = async () => {
  const { stylesheets, javascripts, includePaths } = config;

  const tagsPage = await fs.readFileAsync(
    __current('pages', 'tags.njk'),
    'utf8'
  );

  for (let tag in __tags) {
    let output = nunjucks.renderString(tagsPage, {
      tag,
      posts: __tags[tag],
      pages: filterBy({}),
      config,
      javascripts,
      stylesheets
    });
    await fs.outputFileAsync(__public('index.html', `tags/${tag}`), output);
  }
};

async function transform(prefix) {
  let startTime = new Date();

  const entries = await fg('**', {
    cwd: `website/${prefix}`
  });

  print(`${'●'.red}  ${prefix.padEnd(12).blue} : `);
  for (let file of entries) {
    try {
      switch (prefix) {
        case 'images':
          if (!['.jpg', '.png', '.jpeg', '.svg'].includes(path.extname(file)))
            continue;
      }
      let page = await compile(prefix)(file);
    } catch (error) {
      console.log('ERROR: ', error.message);
    }
  }
  let endTime = new Date();
  const timeAsString = `${endTime - startTime}ms`.underline;
  println(`${timeAsString.padStart(18)} ${'done'.green}`);
}

async function checkDirectoryStructure() {
  const paths = [
    'website/images',
    'website/javascripts',
    'website/components',
    'website/pages',
    'website/stylesheets'
  ].map(el => path.join(CWD, el));

  const result = await Promise.resolve(paths)
    .map(fs.pathExists)
    .all();

  if (!result.every(_ => _)) {
    const tree = spawn('tree', ['-d', '-I', 'node_modules'], { cwd: '.' });
    throw new WrongDirectoryError(`It seems you are not in 'kulfon' compatible directory. Here's the proper structure:

. (your project root)
└── website
  ├── components
  ├── images
  ├── javascripts
  ├── pages
  └── stylesheets

but your current directory at '${CWD}' looks like this:

${tree.stdout}
    `);
  }
}

class WrongDirectoryError extends Error {
  constructor(message) {
    super(message);
  }
}

async function generateSitemap() {
  const sitemap = createSitemap({
    hostname: config.base_url || 'https://localhost',
    urls: Object.values(__pages).map(({ sitemap, path }) => ({
      url: path,
      priority: sitemap ? sitemap.priority : 0.5
    }))
  });

  await fs.outputFileAsync(__public('sitemap.xml'), sitemap.toString());
}

async function recompile(file) {
  let fileSegments = file.split(path.sep);
  const prefix = fileSegments.shift();
  file = path.join(...fileSegments);

  //debug(`file to recompile: ${file}`);

  await loadData();

  if (prefix.match(/pages/)) {
    await compile(prefix)(file);
  } else {
    await transform('pages')();
  }
}

async function compileAll({ dir, env }) {
  process.env.KULFON_ENV = env;

  try {
    await fs.ensureDirAsync('public/images');
    await checkDirectoryStructure();
    await loadConfig();
    await loadData();

    await transform('pages')();

    await buildTagsPages();

    await generateSitemap();
  } catch (error) {
    console.error('Error: '.red + error.message);
    process.exit();
  }
}

module.exports = {
  recompile,
  compileAll
};
