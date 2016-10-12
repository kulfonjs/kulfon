import nunjucks from 'nunjucks';
import fs from 'mz/fs';
import path from 'path';
import sass from 'node-sass';

var currentDirectory = process.cwd();

function compile(files) {
  for (var f of files) {
    process.stdout.write(`Compiling ${f.yellow}...`);

    var output;
    var filename;

    switch (path.extname(f)) {
      case ".html":
        nunjucks.configure('website/views', { autoescape: true });
        output = nunjucks.render(path.parse(f).base, { username: 'James' });
        filename = f;
        break;
      case ".sass":
        let filePath = path.join(currentDirectory, 'website/stylesheets', f);
        var result = sass.renderSync({
          file: filePath,
          includePaths: ['node_modules/jeet/scss', 'node_modules'],
          outputStyle: 'compressed',
          sourceMap: true,
          outFile: path.join(currentDirectory, 'public', 'styles.css')
        });

        output = result.css;
        filename = `${path.basename(f, '.sass')}.css`
        break;
      case ".js":
        break;
    }
    fs.writeFileSync(path.join(currentDirectory, 'public', filename), output)

    console.log('done'.green);
  }
}

function compileViews() {
  fs.readdir('website/views')
    .then(files => files.filter(f => fs.statSync(path.join('website/views', f)).isFile()))
    .then(files => compile(files))
    .catch(err => console.error(err));
}

function compileAll() {
  fs.access('public/', fs.F_OK, (err) => {
    if (err) { fs.mkdirSync('public/') }
    
    compileViews();

    fs.readdir('website/stylesheets')
      .then(files => files.filter(f => fs.statSync(path.join('website/stylesheets', f)).isFile()))
      .then(files => compile(files))
      .catch(err => console.error(err));
  })
}

export { compile, compileViews, compileAll };
