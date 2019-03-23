const { compileAll } = require('../core');

module.exports = {
  handler: compileAll,
  builder: _ =>
    _.option('environment', {
      alias: ['e', 'env'],
      default: 'production'
    }).default('dir', '.')
};
