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
const { basename, join } = require('path');
const fs = Promise.promisifyAll(require('fs-extra'));

const { println } = require('./util');

const cwd = process.cwd();

async function handler() {
  // TODO verify if inside `kulfon` directory
  const path = join(cwd, 'public');
  console.log(`Removing ${path}`);

  await fs.remove(path);
}

module.exports = {
  handler,
  builder: {}
};
