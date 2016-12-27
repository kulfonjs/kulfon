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
const marked = require('marked');
const fs = Promise.promisifyAll(require("fs-extra"));
const path = require('path');
const yaml = require('js-yaml');
const rollup = require('rollup').rollup;
const uglify = require('rollup-plugin-uglify');
const minify = require('uglify-js').minify;
const sha1 = require('sha1');


const currentDirectory = process.cwd();
const dataPath = path.join(currentDirectory, 'website', 'data');

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
}

function mergeDeep(target, source) {
  if (isObject(target) && isObject(source)) {
    for (let key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return target;
}

function scan(directory) {
  let results = [];
  return fs.readdirAsync(directory)
    .map(file => {
      return fs.statAsync(path.join(directory, file)).then(stat => {
        if (stat.isFile()) {
          return results.push(file);
        }

        return scan(path.join(directory, file))
          .then(items => {
            results = results.concat(items.map(x => path.join(file, x)));
          });
      });
    })
    .then(() => results);
}

let cache;


function __public(filename, inside = '') {
  return path.join(currentDirectory, 'public', inside, filename);
}

function compile(files) {
  const ENV = process.env.KULFON_ENV;

  const config = yaml.safeLoad(fs.readFileSync(path.join(currentDirectory, 'config.yml'), 'utf8'));
  const stylesheetConfig = config.stylesheet;
  const javascriptConfig = config.javascript;

  Promise.resolve().then(() => {
    return fs.statAsync(dataPath)
      .then(stats => stats.isDirectory())
      .catch(err => false);         // not directory, so parse `data.yml`
  }).then(isDirectory => {
    return isDirectory ?
      { content: fs.readdirAsync(dataPath), path: dataPath} :
      { content: ['data.yml'], path: path.join(currentDirectory, 'website') };
  }).then(directory => {
    return {
      files: directory.content.filter(f => fs.statSync(path.join(directory.path, f)).isFile()),
      path: directory.path
    }
  }).then(yml => {
    const content = yml.files
      .reduce((acc, x) =>
        [acc, fs.readFileSync(path.join(yml.path, x), 'utf8')].join('---\n'),
        '');

    let data = {};
    yaml.safeLoadAll(content, (doc) => {
      data = mergeDeep(data, doc);
    });

    // XXX ugly, execution order!
    let javascriptBundleFingerprint;

    for (let f of files) {
      let startTime = new Date();
      process.stdout.write(`${startTime.toISOString().grey} - Compiling ${f.yellow}... `);

      let output;
      let filename;

      switch (path.extname(f)) {
        // TODO optimize images
        case '.jpg':
        case '.png':
        case '.jpeg':
        case '.svg':
          // TODO fix this mess
          fs.copyAsync(path.join(currentDirectory, 'website/images', f), __public(f, 'assets'))
          break;
        case ".html":
        case ".md":
          const env = nunjucks.configure('website', { autoescape: true });
          markdown.register(env, marked);
          output = nunjucks.render(path.join('pages', f), {
            data,
            dependencies: javascriptConfig.dependencies,
            javascriptBundleFingerprint,
          });
          const { name, dir } = path.parse(f);
          filename = path.join(dir, name);

          if (filename === 'index') {
            fs.outputFileSync(__public('index.html'), output)
          } else {
            fs.outputFileSync(__public('index.html', filename), output)
          }
          break;
        case ".sass":
        case ".scss":
          let filePath = path.join(currentDirectory, 'website/stylesheets', f);

          sass.renderAsync({
            file: filePath,
            includePaths: stylesheetConfig.dependencies || [],
            outputStyle: 'compressed',
            sourceMap: true,
            outFile: __public('styles.css')
          }).then((result) => {
            output = result.css;
            filename = `${path.basename(f, path.extname(f))}.css`

            fs.writeFileSync(__public(filename), output)
          }).catch((err) => console.log(err.formatted));

          break;
        case '.js':
          const dependencies = (javascriptConfig.dependencies || [])
            .map(name => name.split('/')[3].split('@')[0])
            .reduce((acc, name) => Object.assign(acc, { [name]: name }), {});

          const options = {
            entry: path.join(currentDirectory, 'website/javascripts', 'main.js'),
            cache: cache,
            external: Object.keys(dependencies),
          }

          if (ENV === 'production') {
            Object.assign(options, { plugins: [ uglify({}, minify) ] })
          }

          rollup(options).then(bundle => {
            cache = bundle;

            if (ENV === 'production') {
              // XXX Ugly, only for `main.js`
              javascriptBundleFingerprint = sha1(bundle.modules[0].code);
            }

            const options = {
              format: 'iife',
              dest: __public(ENV === 'production' ? `bundle.${javascriptBundleFingerprint}.js` : 'bundle.js', 'assets'),
            }

            return bundle.write(options);
          }).catch(err => console.log(err.message));
          break;
      }

      let endTime = new Date();
      console.log(`${'done'.green} in ${endTime - startTime}ms`);
    }
  }).catch(err => {
    console.log(err.message)
    process.exit();
  });
}

function transformViews() {
  return scan('website/pages')
    .then(files => compile(files))
    .catch(err => console.error(err));
}

function transformStylesheets() {
  return fs.readdirAsync('website/stylesheets')
    .then(files => files.filter(f => fs.statSync(path.join('website/stylesheets', f)).isFile()))
    .then(files => files.filter(f => f[0] !== '_'))
    .then(files => compile(files))
    .catch(err => console.error(err));
}

function transformJavascripts() {
  return fs.readdirAsync('website/javascripts')
    .then(files => files.filter(f => fs.statSync(path.join('website/javascripts', f)).isFile()))
    .then(files => compile(files))
    .catch(err => console.error(err));
}


function transformImages() {
  // TODO make it async
  const files = fs.walkSync('website/images');
  return Promise.resolve(files)
    .then(files => files.filter(f => ['.jpg', '.png', '.jpeg', '.svg'].includes(path.extname(f))))
    .then(files => files.map(f => f.split('website/images/')[1]))
    .then(files => compile(files))
    .catch(err => console.error(err));
}

function compileAll() {
  return Promise.each([
    'website'
  ], x => fs.statSync(x)).then(() => {
    fs.ensureDirAsync('public/images').then(() => {
      return Promise.all([
        transformStylesheets(),
        transformImages(),
        transformJavascripts(),
        transformViews(),
      ])
    })
  }).catch(err => {
    console.log('Error: '.red + "it seems you are not in `kulfon` compatible directory");
    process.exit();
  })
}

module.exports = { compile, transformViews, compileAll };
