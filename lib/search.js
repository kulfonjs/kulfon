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

const axios = require('axios');
const chalk = require('chalk');

function search({ name, page }) {
  const options = {
    url: 'https://api.npms.io/v2/search',
    params: {
      q: name,
      from: (Math.abs(page) - 1) * 25
    },
    headers: {
      'User-Agent': 'Kulfon'
    }
  };

  axios(options)
    .then(response => {
      response.data.results
        .map(_ => console.log(`${_.package.name} - ${chalk.dim(_.package.links.npm)} : ${chalk.dim(_.package.links.repository)}`));
    })
    .catch(_ => console.log(_.message));
}

module.exports = {
  handler: search,
  builder: _ => _
    .option('page', { alias: 'p', default: 1 })
};
