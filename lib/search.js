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
