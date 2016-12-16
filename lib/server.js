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

  const port = process.env.KULFON_PORT || 3000;
  const server = http.createServer(app);
  server.on('error', (err) => {
    console.log('Error: '.red + err.message);
    process.exit(1);
  });
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = { serve };
