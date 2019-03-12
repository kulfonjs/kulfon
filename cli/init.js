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
const path = require('path');

const { println } = require('./util');

const currentDirectory = process.cwd();

async function init({ dir, theme }) {
  const isRemote = theme.includes('/');

  const themeDir = path.join(path.resolve(__dirname, '..'), 'themes', theme);

  try {
    await fs.accessAsync(themeDir);

    process.stdout.write(
      `Initialising '${dir.yellow}' using '${theme.yellow}' theme... `
    );

    await fs.copyAsync(themeDir, path.join(currentDirectory, dir));

    println('done'.green);
  } catch (error) {
    if (error.code === 'ENOENT') {
      println(
        'Error: '.red +
          `There is no theme named ${
            theme.yellow
          }. Here's the list of themes: https://kulfon.net/themes/`
      );
    } else {
      println('error: '.red + error.message);
    }
  }

  // XXX switch: local, GitHub or other remote location
}

module.exports = {
  handler: init,
  builder: _ =>
    _.default('dir', '.').option('theme', { alias: 't', default: 'default' })
};
