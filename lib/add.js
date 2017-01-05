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
const fs = Promise.promisifyAll(require("fs-extra"));
const path = require('path');
const yaml = require('js-yaml');
const merge = require('deepmerge');

const currentDirectory = process.cwd();
const registryPath = path.join(__dirname, '..', 'registry.yml');
const websiteConfigPath = path.join(currentDirectory, 'config.yml');

function add({ asset }) {
  const [ name, version ] = asset.split('@');

  const registry = yaml.safeLoad(fs.readFileSync(registryPath, 'utf8'));
  const config = yaml.safeLoad(fs.readFileSync(websiteConfigPath, 'utf8'));

  let stylesheets = [];
  let javascripts = [];
  let includePaths = [];
  for (let item of registry[name]) {
    switch(path.extname(item)) {
      case '.css':
        stylesheets.push(`https://unpkg.com/${path.join(asset, item)}`);
        break;
      case '.js':
        javascripts.push(`https://unpkg.com/${path.join(asset, item)}`);
        break;
      case '.scss':
      case '.sass':
        // XXX install the package via NPM
        includePaths.push(`node_modules/${name}/${path.dirname(item)}`); // just get the dir
        break;
    }
  }

  const updatedConfig = merge(config, {
    stylesheets,
    javascripts,
    includePaths,
  });

  fs.outputFileAsync(path.join(currentDirectory, 'config.yml'), yaml.safeDump(updatedConfig))
    .then(() => console.log('done'))
    .catch(err => console.log(err.message));
}

module.exports = {
  handler: add,
  builder: {}
};
