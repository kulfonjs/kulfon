#!/usr/bin/env node

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));

const path = require('upath');
const open = require('open');

const argv = require('yargs')
  .env('KULFON')
  .version()
  .usage('Usage: kulfon <command> [options]')
  .command(['init [dir]', 'initialize', 'i'], 'Initialize the directory', require('./lib/init'))
  .example('kulfon init my-project', 'Create `my-project` directory and initialize using `default` theme')
  .example('kulfon init my-project --theme bare', 'Create `my-project` directory and initialize using `bare` theme')
  .command(['server [dir]', 'serve', 's'], 'Serve the directory', require('./lib/server'))
  .example('kulfon server --port 4000', 'Serve the directory at the port 4000')
  .command(['compile', 'build', 'c', 'b'], 'Build source files to static assets', require('./lib/compiler'))
  .example('kulfon compile --environment production', 'Build source files for production (minified)')
  .command(['search [name]', 'find'], 'Find NPM package', require('./lib/search'))
  .command(['add [asset]', 'a'], 'Add asset dependency (CSS or JS) from NPM either via unpkg or directly', require('./lib/add'))
  .command(['docs'], 'Go to the documentation at https://kulfon.net', {}, (_) => open('https://kulfon.net'))
  .demandCommand(1, 'You need at least one command before moving on')
  .help('h')
  .alias('h', 'help')
  .epilogue('for more information, find the documentation at https://kulfon.net')
  .argv;
