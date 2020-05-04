// Copyright 2020 Zaiste & contributors. All rights reserved.
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

const crypto = require('crypto');
const path = require('path');
const Boxwood = require('boxwood');

const CWD = process.cwd();

const postcss = require('postcss');
const postcssPresetEnv = require('postcss-preset-env');
const tailwindcss = require('tailwindcss');
const purgecss = require('@fullhuman/postcss-purgecss')({
  content: [
    `${CWD}/website/pages/**/*.html`,
    `${CWD}/website/parts/**/*.html`
  ],

  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
})

const md = require('markdown-it')();

md.use(require('markdown-it-anchor'));
md.use(require('markdown-it-table-of-contents'), {
  includeLevel: [1, 2, 3, 4, 5, 6]
});
md.use(require('./prism'));
md.use(require('markdown-it-highlight-lines'));
md.use(require('markdown-it-container'), 'label');

const fs = require('fs-extra');
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

Sugar.Date.extend();
// const svgOptimizer = new svgo({});

EXTENSIONS = {
  images: ['.jpg', '.png', '.jpeg', '.svg']
};

let env = { nunjucks: 'empty' }

// TODO
// env.addFilter('date', (date, format) =>
//   Date.create(date).format(format || '{yyyy}-{MM}-{dd}')
// );

// TODO
// env.addFilter('logo', names => {
//   NameToLogo = {
//     'Ruby': 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Ruby_logo.png',
//     'TypeScript': 'https://cdn.jsdelivr.net/gh/remojansen/logo.ts@master/ts.svg',
//     'Node.js': 'https://miro.medium.com/max/400/1*tfZa4vsI6UusJYt_fzvGnQ.png',
//     'JavaScript': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Unofficial_JavaScript_logo_2.svg/512px-Unofficial_JavaScript_logo_2.svg.png',
//     'Dart': 'https://pbs.twimg.com/profile_images/993555605078994945/Yr-pWI4G_400x400.jpg',
//     'Flutter': 'https://cdn.worldvectorlogo.com/logos/flutter-logo.svg'
//   };

//   return names
//     .map(name => NameToLogo[name])
//     .filter(element => element)
//     .reduce((stored, current) => stored.concat('&', 'images=', encodeURIComponent(current)), '');
// });

// TODO
// env.addExtension('LinkExt', new LinkExt());

const linkify = ({ filepath: pathOnDisk }) => tree =>
  unistMap(tree, node => {
    const { type, uri: { protocol = '', location = '/' } = '' } = node;

    if (type === 'link' && protocol === 'file') {
      let l = location;

      let finalPath = '';
      if (location.startsWith('~')) {
        l = location.split(path.join(config.directory, 'website/pages')).pop();
        const { dir, name } = path.parse(l);
        finalPath = path.join('/', dir, name, '/');
      } else {
        const splitted = pathOnDisk.split(path.sep);
        splitted.pop(); // cannot chain, mutable function
        splitted.pop(); // cannot chain, mutable function
        const locationDir = splitted.join(path.sep);

        const { dir, name } = path.parse(l);
        finalPath = path.join('/', locationDir, dir, name, '/');
      }

      node.uri.raw = finalPath;
    }

    return node;
  });

let cache;
let config;
let bundles = { js: '', css: '' };

let __data = {};
let __pages = {};
let __tags = {};
let __cache = {};
let __website = {};

function __public(filename, inside = '') {
  return path.join(CWD, 'public', inside, filename);
}

function __current(prefix, f = '') {
  return path.join(CWD, 'website', prefix, f);
}

// function profile(func, prefix, allowedExtensions) {
//   return async file => {
//     const result = await func(file);

//     return result;
//   };
// }

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
        if (imageExists) return file; // poor's man optimizaion

        await fs.ensureDir(path.join(CWD, 'public', 'images', path.dirname(file)));

        switch (path.extname(file)) {
          case '.svg':
            // const data = await fs.readFile(
            //   __current("images", file),
            //   "utf8"
            // );
            // const result = await svgOptimizer.optimize(data);
            // fs.writeFileSync(__public(file, "images"), result.data);
            fs.copy(__current('images', file), __public(file, 'images'));
            break;
          case '.gif':
            fs.copy(__current('images', file), __public(file, 'images'));
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

        const transformers = [
          tailwindcss,
          postcssPresetEnv,
          ...isProduction ? [purgecss] : []
        ];

        try {
          const content = await fs.readFile(path.join(CWD, 'website', 'stylesheets', 'main.css'));
          const { css: output } = await postcss(transformers).process(content, {
            from: 'stylesheets/main.css', to: 'main.css', map: { inline: true }
          });

          let hash = sha1(output);
          let name = path.basename(file, path.extname(file));

          filename = !isProduction ? `${name}.css` : `${name}.${hash}.css`;
          bundles.css = filename;

          await fs.writeFile(__public(filename), output);
        } catch (error) {
          if (error.name === 'CssSyntaxError') {
            console.error(`  ${error.message}\n${error.showSourceCode()}`);
          } else {
            println(error.message);
          }
        }
      };
      break;
    case 'pages':
      compiler = async file => {
        try {
          const page = __pages[file];

          const raw = await fs.readFile(__current(prefix, file));
          __website[`${prefix}/${file}`] = raw.toString();

          const { data, content } = matter(raw.toString());

          const isOrg = path.extname(file) === '.org';
          if (isOrg) {
            const processor = unified().use(parse);
            const ast = await processor.parse(content);
            data.ast = ast;
          }

          let { filepath } = page;

          let renderString = content;
          let renderParams = {
            language: 'en',
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
            const { name, dir } = path.parse(file);

            const dirs = dir.split(path.sep).reverse();

            let parentDir;
            for (const name of dirs) {
              const r = await fs.pathExists(__current('parts/layouts', path.format({ name, ext: '.html' })))
              if (r) {
                parentDir = name;
                break;
              }
            }

            const itselfExists = await fs.pathExists(
              __current(
                'parts/layouts',
                path.format({ name, ext: '.njk' })
              )
            );

            if (parentDir) {
              renderString = `
<import layout from="layouts/${parentDir}.html" />

<layout {bundles} {website} {stylesheets} {page}>
  <div html="{content}" class="markdown"></div>
</layout>`;
            } else if (itselfExists) {
              renderString = `{% extends "layouts/${name}.njk" %}`;
            } else {
              renderString = `
<import layout from="layouts/index.html">

<layout {bundles} {website} {stylesheets} {page}>
  <div html="{content}"></div>
</layout>`;
            }

            if (path.extname(file) === '.md') {
              const tokens = md.parse(content, {});
              const toc = buildTableOfContents(0, tokens);
              renderParams.toc = toc ? toc[1] : false;
              renderParams.content = md.render(content);
            } else if (path.extname(file) === '.org') {
              const processor = await unified()
                .use(parse)
                .use(linkify, { filepath })
                .use(mutate)
                .use(highlight)
                .use(html);

              const { contents } = await processor.process(content);
              renderParams.content = contents;
            }
          }

          // FIXME Display compilation errors & warnings
          const { template, warnings, errors } = await Boxwood.compile(renderString, { cache: false, paths: [path.join(CWD, 'website/pages'), path.join(CWD, 'website/parts')], languages: ['en', 'pl'] })
          try {
            output = template(renderParams, Boxwood.escape);
          } catch (error) {
            console.log(error.message)
          }

          if (isProduction)
            output = minifyHTML(output, { collapseWhitespace: true });

          const filename = pathname(file);
          await fs.outputFile(__public('index.html', filename), output);

          return page;
        } catch (error) {
          println(error.message);
        }
      };
      break;
    case 'root':
      compiler = async file => {
        fs.copy(__current('root', file), __public(file));
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
  const yamlContent = await fs.readFile(
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
    let stats = await fs.stat(path.join(dataPath, 'data'));

    if (stats.isDirectory()) {
      dataPath = path.join(dataPath, 'data');
      entries = fs.readdir(dataPath);
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

  const tagsPage = await fs.readFile(
    __current('pages', 'tags.html'),
    'utf8'
  );

  for (const tag in __tags) {
    const { template } = await Boxwood.compile(tagsPage, { cache: false, paths: ['website/pages', 'website/parts'] })
    const output = template({
      tag,
      posts: __tags[tag],
      pages: filterBy({}),
      config,
      javascripts,
      stylesheets
    }, Boxwood.escape);
    await fs.outputFile(__public('index.html', `tags/${tag}`), output);
  }
};

const profile = prefix => async (fn) => {
  let startTime = new Date();
  print(`${'●'.red}  ${prefix.padEnd(11).blue} : `);

  await fn()

  let endTime = new Date();
  const timeAsString = `${endTime - startTime}ms`.underline;
  println(`${timeAsString.padStart(18)} ${'done'.green}`);
}

const transformCSS = async () => {
  await compile('stylesheets')('main.css');
}

async function transform(prefix, { force = false } = {}) {
  let startTime = new Date();

  const entries = await fg('**/*', {
    cwd: `website/${prefix}`
  });

  print(`${'●'.red}  ${prefix.padEnd(11).blue} : `);

  // preprocessing for `pages` so to make references between them
  if (prefix === 'pages') {
    const __categories = {};

    for (let file of entries) {
      const filepath = pathname(file);
      const breadcrumbs = filepath.split(path.sep).slice(0, -2);
      const raw = await fs.readFile(__current(prefix, file));
      __website[`${prefix}/${file}`] = raw.toString();

      const { data, content } = matter(raw.toString());

      const isOrg = path.extname(file) === '.org';
      const lacksFrontMatter = isEmpty(data);

      if (isOrg) {
        const processor = unified().use(parse);
        const ast = await processor.parse(content);
        data.ast = ast;
      }

      let { title = '', created_at, abstract, categories = [], tags = [] } =
        isOrg && lacksFrontMatter ? data.ast.meta : data;

      let title_raw = title;
      title = title.replace(/\*/g, '');

      if (typeof tags === 'string') tags = [tags];

      // update categories
      for (let category of categories || []) {
        let c = anchorize(category);
        (__categories[c] = __categories[c] || []).push({
          filepath,
          breadcrumbs,
          title,
          created_at,
          tags,
          categories
        });
      }

      // update tags
      for (let tag of tags || []) {
        let t = anchorize(tag);
        (__tags[t] = __tags[t] || []).push({
          filepath,
          breadcrumbs,
          title,
          created_at,
          tags,
          categories
        });
      }

      __pages[file] = {
        ...data,
        content,
        filepath,
        breadcrumbs,
        title,
        title_raw,
        abstract,
        categories,
        tags,
        created_at
      };
    }

    // all categories & tags from all pages to be available globally
    __data.categories = Object.keys(__categories);
    __data.tags = Object.keys(__tags);
  }

  for (let file of entries) {
    try {
      switch (prefix) {
        case 'images':
          if (!['.jpg', '.png', '.jpeg', '.svg', '.gif'].includes(path.extname(file)))
            continue;
      }

      const raw = await fs.readFile(__current(prefix, file));
      let fileKey = `${prefix}/${file}`;
      __website[fileKey] = raw.toString();

      // get rev

      const hash = crypto.createHash('md5').update(raw).digest('hex').slice(0, 10);

      if (__cache[fileKey] !== hash || force == true) {
        await compile(prefix)(file);
        __cache[fileKey] = hash;
      }
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
    'website/parts',
    'website/pages',
    'website/stylesheets'
  ].map(el => path.join(CWD, el));

  const result = await Promise.all(paths.map(fs.pathExists));

  if (!result.every(_ => _)) {
    const tree = spawn('tree', ['-d', '-I', 'node_modules'], { cwd: '.' });
    throw new WrongDirectoryError(`It seems you are not in 'kulfon' compatible directory. Here's the proper structure:

. (your project root)
└── website
  ├── images
  ├── javascripts
  ├── parts
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
    urls: Object.values(__pages).map(({ sitemap, filepath }) => ({
      url: filepath,
      priority: sitemap ? sitemap.priority : 0.5
    }))
  });

  await fs.outputFile(__public('sitemap.xml'), sitemap.toString());
}

async function recompile(file) {
  //debug(`file to recompile: ${file}`);

  await loadData();

  if (file.includes('pages')) {
    await compile('pages')(file.split('pages/')[1]);
  } else {
    await transform('pages', { force: true });
  }
}

async function compileAll({ dir, env }) {
  process.env.KULFON_ENV = env;

  try {
    __cache = await fs.readJSON('public/.cache');
  } catch (error) {
    __cache = {};
  }

  try {
    await fs.ensureDir('public/images');
    await checkDirectoryStructure();
    await loadConfig();
    await loadData();

    // order is important
    await transform('images');
    await profile('stylesheets')(transformCSS)
    await transform('javascripts');
    await transform('pages');
    await transform('root');

    await buildTagsPages();

    await generateSitemap();

    await fs.outputFile(path.join(CWD, 'public/.cache'), JSON.stringify(__cache));
  } catch (error) {
    console.error('Error: '.red + error.message);
    process.exit();
  }
}


module.exports = {
  recompile,
  compileAll
};
