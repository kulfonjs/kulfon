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
const fs = Promise.promisifyAll(require('fs-extra'));
const yaml = require('js-yaml');
const { join } = require('path');
const Rsync = require('rsync');

const cwd = process.cwd();

async function deploy() {
  const config = yaml.safeLoad(fs.readFileSync(join(cwd, 'config.yml'), 'utf8'));
  const { server, path } = config.deploy;

  if (!server || !path) { 
    console.log('Error: `server` or `path` not defined');
    process.exit();
  }

  console.log(`Deploying on ${server} to ${path} ...`)

  const sync = new Rsync()
    .flags('azP')
    .source(join(cwd, 'public/'))
    .destination(`${server}:${path}`);

  console.log(sync.command());

  sync.execute((error, code) => {
    console.log('done', code);
  })
}

module.exports = {
  handler: deploy,
  builder: _ => _
};
