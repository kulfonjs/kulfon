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
    'data.yml': DATA,
    '../config.yml': CONFIG,
    '../.gitignore': GITIGNORE
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

  <title>{% block title %}{{ data.title }}{% endblock %}</title>
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
  {% for dependency in dependencies %}
  <script type="text/javascript" src="{{ dependency }}"></script>
  {% endfor %}
  <script type="text/javascript" src="/assets/bundle.js"></script>
</body>
</html>
`
META = `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<meta name="description" content="{{ data.meta.description }}">

<!-- Open Graph -->
<meta property="og:type" content="article"/>
<meta property="og:description" content="{{ data.meta.facebook.description or data.meta.description }}"/>
<meta property="og:title" content="{{ data.meta.facebook.title or data.title }}"/>
<meta property="og:site_name" content="{{ data.meta.facebook.site_name }}"/>
<meta property="og:image" content="{{ data.meta.facebook.image.url }}" />
<meta property="og:image:type" content="{{ data.meta.facebook.image.type }}" />
<meta property="og:image:width" content="{{ data.meta.facebook.image.width }}" />
<meta property="og:image:height" content="{{ data.meta.facebook.image.height }}" />
<meta property="og:url" content="{{ data.meta.facebook.url }}">
<meta property="og:locale" content="{{ data.meta.facebook.locale or 'en_US' }}">

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary">
<meta name="twitter:site" content="{{ data.meta.twitter.site }}">
<meta name="twitter:title" content="{{ data.meta.twitter.title or data.title }}">
<meta name="twitter:creator" content="{{ data.meta.twitter.creator }}">
<meta name="twitter:description" content="{{ data.meta.twitter.description or data.meta.description }}">
<meta name="twitter:image:src" content="{{ data.meta.twitter.image.url }}">
<meta name="twitter:domain" content="{{ data.meta.twitter.domain }}">
`

INDEX = `
{% extends "layouts/base.html" %}
{% block content %}
<h1>
  Hello there!
  <br/>
  <small>{{ data.dummy }}</small>
</h1>
<div class="aligner">
  <strong>Article</strong>
</div>
{% endblock %}
`

ABOUT = `
{% extends "layouts/base.html" %}
{% block content %}

{% markdown %}
# About

This is a **short** _about me_ page.

## Early life

## Relationships

## Awards
{% endmarkdown %}
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

DATA=`
title: Your great website powered by Kulfon
dummy: Edit this text in 'data.yml'

meta:
  description: Dummy meta description
  facebook:
    site_name: Made by Kulfon
    image:
      url: https://raw.githubusercontent.com/zaiste/kulfon/master/kulfon-static-site-logo.jpg
      width: 512
      height: 512
      type: img/jpg
  twitter:
    site: Made by Kulfon
    creator: Kulfon
    image:
      url: https://raw.githubusercontent.com/zaiste/kulfon/master/kulfon-static-site-logo.jpg
    domain: kulfon.net
`

CONFIG=`
stylesheet:
  dependencies:

javascript:
  dependencies:
`

MAINJS = `
console.log("Hello, I'm Kulfon");
`

GITIGNORE = `
.DS_Store

public/
node_modules/
.sass-cache/
`

module.exports = { init };
