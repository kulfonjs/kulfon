#!/usr/bin/env node

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));

const path = require('upath');
const open = require('open');
const chalk = require('chalk');
const rp = require('request-promise');

const pkg = require('./package.json');
const initializer = require('./lib/initializer');
const server = require('./lib/server');
const compiler = require('./lib/compiler');

const args = require('minimist')(process.argv.slice(2));
const command = args._[0];

if (args.v || args.version) version();
if (!command) usage();

if (args._[1]) var sourceDir = path.resolve(process.cwd(), args._[1]);
if (args._[2]) var targetDir = path.resolve(process.cwd(), args._[2]);

process.env.KULFON_PORT = args.port || args.p || 3000;
process.env.KULFON_BASEDIR = args.basedir || args.b || '/';
process.env.KULFON_ENV = args.environment || args.e || 'development';

switch(command) {
  case 'init':
    initializer.init(args._[1] || '.');
    break
  case 'serve':
    server.serve();
    break
  case 'search':
    if (args._[1]) {
      search(args._[1]);
    }
    break
  case 'compile':
  case 'build':
    compiler.compileAll()
    break
  case 'help':
    open('https://kulfon.net')
    break
  default:
    console.log(`Unrecognized command: ${command}\n`)
    usage()
}

function usage() {
  console.log(chalk.dim(`kulfon ${pkg.version} - Fast and simple static site generator written in JavaScript`))
  console.log(
`
  kulfon init <my-project-name>
  kulfon serve                              Serve the current directory
  kulfon serve <source>                     Serve a specific directory
  kulfon serve --port 3456                  Use a custom port. Default is 3000
  kulfon compile                            Build source files to static assets
  kulfon compile --environment production   Build source files to static assets
  kulfon help                               Open kulfon.net in your browser
`)

  process.exit()
}

function version() {
  console.log(`kulfon ${pkg.version}`);
  process.exit()
}

function search(name) {
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
