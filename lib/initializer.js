const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs-extra"));
const path = require('path');

const currentDirectory = process.cwd();

function init(dir) {
  function initFile(filename, content) {
    return fs.outputFileAsync(path.join(currentDirectory, dir, 'website', filename), content, { flag: 'wx' })
  }

  process.stdout.write(`Initialising '${dir.yellow}' ... `);

  const paths = {
    'layouts/base.html': BASE,
    'partials/meta.html': META,
    'pages/index.html': INDEX,
    'pages/about.md': ABOUT,
    'stylesheets/styles.scss': STYLES,
    'javascripts/main.js': MAINJS,
    'images/logo.svg': 'LOGO',
    'config.yml': CONFIG
  }

  Promise.all(Object.keys(paths).map((p) => initFile(p, paths[p])))
    .then(() => console.log('done'.green))
    .catch(() => console.log('done'.green));
}

// ---

BASE = `
<!DOCTYPE html>
<html>
<head>
  {% include "partials/meta.html" %}

  <title>{% block title %}{{ config.title }}{% endblock %}</title>
  <link rel="shortcut icon" type="image/x-icon" href="/static/favicon.ico">
  <link href="/styles.css" rel="stylesheet">
  {% block head %}{% endblock %}
</head>
<body>
  <header>
    <div class="aligner">
      <strong>Header</strong>
    </div>
  </header>
  <main>
    <nav>
      <div class="aligner">
        <strong>Nav</strong>
      </div>
    </nav>
    <article>
      {% block content %}{% endblock %}
    </article>
    <aside>
      <div class="aligner">
        <strong>Aside</strong>
      </div>
    </aside>
  </main>
  <footer></footer>
  <script type="text/javascript" src="/assets/bundle.js"></script>
</body>
</html>
`
META = `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
`

INDEX = `
{% extends "layouts/base.html" %}
{% block content %}
<h1>
  Hello there!
  <small>{{ config.dummy }}</small>
</h1>
<div class="aligner">
  <strong>Article</strong>
</div>
{% endblock %}
`

STYLES = `
@import url('https://fonts.googleapis.com/css?family=Lato');

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  height: 100%;
  min-height: 100%;
  font-size: 18px;
  font-family: 'Lato';
}

body {
  margin: 0;
  display: flex;
  flex-direction: column;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
}

header {
  z-index: 0;
  flex: 0 4em;
  display: flex;

  background: #FEFEFE;
  border-bottom: 1px solid #d9d9d9;
}

main {
  flex: 1;
  display: flex;
}

nav {
  background: #FAFAFA;
  flex: 0 0 256px;
  overflow: auto;
  order: 0;
  border-right: 1px solid #d9d9d9;

  ul {
    list-style: none;
    margin: .25em 0;
    padding: 0;

    li a {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: black;

      i {
        margin-right: .5em;
        opacity: 0.5;
      }
    }
  }
}

article {
  flex: 1;
  order: 1;
  overflow: auto;
  padding: 24px;
}

aside {
  background: #FAFAFA;
  flex: 0 0 256px;
  order: 2;
  overflow: auto;
  border-left: 1px solid #d9d9d9;
}

.aligner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  strong {
    display: block;
    text-transform: uppercase;
    color: #999;
  }
}
`

CONFIG=`
title: Your great website powered by Kulfon
dummy: Edit this text in 'config.yml'

sass:
  paths:
`

MAINJS = `
console.log("Hello, I'm Kulfon");
`

module.exports = { init };
