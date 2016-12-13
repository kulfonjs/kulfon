const http = require('http');
const chokidar = require('chokidar');
const { compile, transformViews, compileAll } = require('./compiler');
const express = require('express');
const path = require('path');
const colors = require('colors');

function recompile(file) {
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

  const app = express();
  app.use(express.static('public'));

  const server = http.createServer(app);
  server.on('error', (err) => {
    console.log('Error: '.red + err.message);
    process.exit(1);
  });
  const listener = server.listen(process.env.KULFON_PORT, () => {
    console.log(`Server running at http://localhost:${listener.address().port}`);
  });
}

module.exports = { serve };
