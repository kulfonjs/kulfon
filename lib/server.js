const chokidar = require('chokidar');
const { compile, transformViews, compileAll } = require('./compiler');
const express = require('express');
const path = require('path');
const colors = require('colors');

function recompile(file) {
  console.log(`${file.yellow} has been changed`);

  let fileSegments = file.split(path.sep);

  if (fileSegments.includes('layouts')) {
    transformViews();
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

module.exports = { serve };
