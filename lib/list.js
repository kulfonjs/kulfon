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
const path = require('path');
const fs = Promise.promisifyAll(require("fs-extra"));
const yaml = require('js-yaml');

const currentDirectory = process.cwd();
const registryPath = path.join(__dirname, '..', 'registry.yml');
const websiteConfigPath = path.join(currentDirectory, 'config.yml');
const themesDir = path.join(path.resolve(__dirname, '..'), 'themes');

function list({ name }) {
  switch (name) {
    case 'themes':
      console.log(`Available themes to use with ${'init'.yellow} command`);
      fs.readdirAsync(themesDir)
        .map(_ => console.log(`- ${_}`));
      break;
    case 'deps':
    case 'assets':
      break;
    default:
      console.error(`${'Error:'.red} you can only list 'themes' or 'assets'`);
  }
}

module.exports = {
  handler: list,
  builder: {}
};
