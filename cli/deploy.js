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

const fs = require('fs-extra');
const yaml = require('js-yaml');
const { join } = require('path');
const rsyncwrapper = require('rsyncwrapper');

const { println } = require('./util');

const cwd = process.cwd();

const rsync = async (options, showCommand = false) => {
  return await new Promise((resolve, reject) => {
    rsyncwrapper(
      { ...options, recursive: true, ssh: true, args: ['-azP'] },
      (error, stdout, stderr, cmd) => {
        if (showCommand) console.log(cmd);

        if (error) {
          reject(error);
        }

        resolve(stdout);
      }
    );
  });
};

const deploy = async ({ dry, showCommand }) => {
  const config = yaml.safeLoad(
    fs.readFileSync(join(cwd, 'config.yml'), 'utf8')
  );
  const { server, path } = config.deploy;

  if (!server || !path) {
    println('Error: `server` or `path` not defined');
    process.exit();
  }

  println(`Deploying on ${server} to ${path} ...`);

  try {
    const options = {
      src: 'public/',
      dest: `${server}:${path}`,
      exclude: ['node_modules', '.git'],
      dryRun: dry
    };

    await rsync(options, showCommand);
  } catch (error) {
    switch (error.message) {
      case 'rsync exited with code 3':
        console.log(
          "[rsync] Errors selecting input/output files, dirs: Probably these files/dirs don't exist"
        );
        break;
      default:
        console.log('[rsync] Unknown Error');
        break;
    }
  }
};

module.exports = {
  handler: deploy,
  builder: _ =>
    _.option('dry', {
      alias: 'n',
      describe: 'Dry run for deploy with rsync',
      default: false
    })
};
