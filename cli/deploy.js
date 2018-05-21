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

const {
  println
} = require('./util');

const cwd = process.cwd();

async function deploy({ dry }) {
  const config = yaml.safeLoad(fs.readFileSync(join(cwd, 'config.yml'), 'utf8'));
  const { server, path } = config.deploy;

  if (!server || !path) {
    println('Error: `server` or `path` not defined');
    process.exit();
  }

  println(`Deploying on ${server} to ${path} ...`)

  let sync = new Rsync()
    .shell('ssh')
    .flags('azP')
    .source(join(cwd, 'public/'))
    .destination(`${server}:${path}`);

  if (dry) {
    println('Dry run...')
    sync.dry()
  }

  println(sync.command());

  sync.execute((error, code) => {
    println('done', code);
  })
}

module.exports = {
  handler: deploy,
  builder: _ => _
    .option('dry', { alias: 'n', describe: 'Dry run for deploy with rsync', default: false })
};
