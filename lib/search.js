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
// limitations under the License

const rp = require('request-promise');
const chalk = require('chalk');

function search({ name }) {
  const options = {
    uri: 'https://api.npms.io/v2/search',
    qs: {
      q: name
    },
    headers: {
      'User-Agent': 'Kulfon'
    },
    json: true
  };

  rp(options)
    .then(resp => {
      console.log(resp.results
        .map(_ => `${_.package.name} - ${chalk.dim(_.package.links.npm)} : ${chalk.dim(_.package.links.repository)}`).join('\n'));
    })
    .catch(err => console.log(err));
}

module.exports = {
  handler: search,
  builder: {}
};
