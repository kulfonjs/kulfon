import chokidar from 'chokidar';
import { compile, compileViews, compileAll } from './compiler';
import express from 'express';
import path from 'path';
import colors from 'colors';

function recompile(file) {
  console.log(`${file.yellow} has been changed`);

  let fileSegments = file.split(path.sep);

  if (fileSegments.includes('layouts')) {
    compileViews();
  } else {
    compile([path.basename(file)]);
  }
}

function serve() {
  compileAll();

  // Initialize watcher.
  var watcher = chokidar.watch('.', {
    ignored: /[\/\\]\./,
    persistent: true,
    cwd: 'website'
  });

  watcher
    .on('change', path => recompile(path))

  var app = express();
  app.use(express.static('public'));
  app.listen(3000);
}

export { serve };
