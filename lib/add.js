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

const currentDirectory = process.cwd();

function add({ name }) {
  const registry = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '..', 'registry.yml'), 'utf8'));
  const config = yaml.safeLoad(fs.readFileSync(path.join(currentDirectory, 'config.yml'), 'utf8'));
  console.log(name);
  console.log(registry[name]);
  console.log(config);
}

module.exports = {
  handler: add,
  builder: {}
};
