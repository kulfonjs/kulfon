// Copyright 2019 Zaiste & contributors. All rights reserved.
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

const path = require('path');
const fs = require('fs-extra');

const { slugify, println } = require('../util');

const cwd = process.cwd();

const handler = ({ title }) => {
  const filename = slugify(title);

  fs.writeFile(
    path.join(cwd, 'website', 'pages', `${filename}.md`),
    `# ${title}`
  );

  println(`Created \`website/pages/${filename}.md\``);
};

module.exports = {
  command: 'page <title>',
  handler,
  builder: {}
};
