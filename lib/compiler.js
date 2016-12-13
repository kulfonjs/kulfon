const Promise = require('bluebird');
const sass = Promise.promisifyAll(require('node-sass'));

const nunjucks = require('nunjucks');
const markdown = require('nunjucks-markdown');
const marked = require('marked');
const fs = Promise.promisifyAll(require("fs-extra"));
const path = require('path');
const yaml = require('js-yaml');
const rollup = require('rollup').rollup;

const currentDirectory = process.cwd();

let cache;

function __public(filename, inside = '') {
  return path.join(currentDirectory, 'public', inside, filename);
}

function compile(files) {
  const config = yaml.safeLoad(fs.readFileSync(path.join(currentDirectory, 'website/config.yml'), 'utf8'));

  for (let f of files) {
    process.stdout.write(`${new Date().toISOString().grey} - Compiling ${f.yellow}... `);

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
        output = nunjucks.render(path.join('pages', path.parse(f).base), { config });
        filename = path.parse(f).name;

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
          includePaths: config.sass.paths || [],
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
        rollup({
          entry: path.join(currentDirectory, 'website/javascripts', 'main.js'),
          cache: cache
        }).then(bundle => {
          cache = bundle;

          return bundle.write({
            format: 'iife',
            dest: __public('bundle.js', 'assets')
          });
        }).catch(err => console.log(err.message));
        break;
    }

    console.log('done'.green);
  }
}

function transformViews() {
  return fs.readdirAsync('website/pages')
    .then(files => files.filter(f => fs.statSync(path.join('website/pages', f)).isFile()))
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
  fs.ensureDirAsync('public/images')
    .then(() => {
      return Promise.all([
        transformViews(),
        transformStylesheets(),
        transformImages(),
        transformJavascripts()
      ])
    })
}

module.exports = { compile, transformViews, compileAll };
