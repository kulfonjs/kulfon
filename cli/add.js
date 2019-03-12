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
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const merge = require('deepmerge');

const { println } = require('./util');

const exec = Promise.promisify(require('child_process').exec);

const cwd = process.cwd();
const registryPath = path.join(__dirname, '..', 'registry.yml');
const websiteConfigPath = path.join(cwd, 'config.yml');

const { unique, concat } = require('./util');

async function add({ asset }) {
  const [name, version] = asset.split('@');

  const registry = yaml.safeLoad(fs.readFileSync(registryPath, 'utf8'));
  const config = yaml.safeLoad(fs.readFileSync(websiteConfigPath, 'utf8'));

  let stylesheets = [];
  let javascripts = [];
  let includePaths = [];

  const packages = unique(
    config.includePaths
      .map(_ => _.split(path.sep).slice(1, 2))
      .reduce(concat, [])
  );

  let seen = false; // XXX Ugly

  if (!registry[name]) {
    println(
      `${'Error'.red}: ${name.yellow} is not yet supported. \n
      If you know how to integrate that module manually,
      please contribute your solution to https://github.com/zaiste/kulfon/blob/master/registry.yml`
    );
    return;
  }

  for (let item of registry[name]) {
    switch (path.extname(item)) {
      case '.css':
        stylesheets.push(`https://unpkg.com/${path.join(asset, item)}`);
        break;
      case '.js':
        javascripts.push(`https://unpkg.com/${path.join(asset, item)}`);
        break;
      case '.scss':
      case '.sass':
        if (!seen) {
          if (packages.includes(name)) {
            // already installed
            println(`${name.yellow} is already installed`);
            seen = true;
          } else {
            try {
              let { stdout, stderr } = await exec(`yarn add ${name}`);
              println(stdout);
            } catch (error) {
              println(error.message);
            }

            // XXX install the package via NPM
            includePaths.push(`node_modules/${name}/${path.dirname(item)}`); // just get the dir
          }
        }
        break;
      default:
        break;
    }
  }

  const updatedConfig = merge(config, {
    stylesheets,
    javascripts,
    includePaths
  });

  try {
    await fs.outputFileAsync(
      path.join(cwd, 'config.yml'),
      yaml.safeDump(updatedConfig)
    );
    println(`Updating configuration... ${'done'.green}`);
  } catch (error) {
    println(err.message);
  }
}

module.exports = {
  handler: add,
  builder: {}
};
