# [Kulfon](https://kulfon.net) (pre-alpha)

[![npm](https://img.shields.io/npm/v/kulfon.svg)](https://www.npmjs.com/package/kulfon)
[![npm](https://img.shields.io/npm/dm/kulfon.svg)](https://www.npmjs.com/package/kulfon)

**Kulfon** is a « one command », static site generator written entirely in JavaScript. It's fast, modern and simple.

_This software is still under **active development** and not feature complete or ready for consumption by anyone other than software developers._

[![Kulfon: a 100% JavaScript static site generator](https://raw.githubusercontent.com/zaiste/kulfon/master/kulfon-static-site-logo.jpg)](https://kulfon.net)

[Website](https://kulfon.net) |
[Documentation](https://kulfon.net/docs/install/) |
[Installation Guide](https://kulfon.net/docs/install/) |
[Contribution Guide](CONTRIBUTING.md) |
[Twitter](http://twitter.com/kulfonjs)

> \- Kulfon, Kulfon, co z Ciebie wyrośnie ?! martwię się już od tygodnia!
>
> \- Przestań!

While you're hesitating, listen to this wonderful [Kulfon song][5]!

## Demo

Kulfon does live reloading by default in development mode.

[![Kulfon: Hot Reloading](https://raw.githubusercontent.com/zaiste/kulfon/master/kulfon-intro.gif)](https://kulfon.net)

## Why Kulfon?

There is a ton of static site generators out there. Here are few points to
convince you to try **Kulfon**

* one-command tool, similar to [Hugo][3], but written in [JavaScript][6], so it's easier to integrate additional JavaScript libraries or stylesheets
* solid foundation with carefully selected tools to produce **smaller** websites **faster** as [The Average Webpage Is Now the Size of the Original Doom][8]
 * [Rollup][7] for bundling javascripts
 * [Sass][2] for stylesheets
 * [Nunjucks][1] for views (a simple, designer friendly HTML-based syntax)
* written in ES6/ES2015
* [Markdown][15] support
* unified approach to external dependencies management with either [unpkg][13] or [Yarn][4]
* [HTTP/2][14] ready

**Table of Contents**  

- [Why Kulfon?](#why-kulfon)
- [Installation](#installation)
- [Getting started](#getting-started)
- [Compiling the project](#compiling-the-project)
- [Deploying](#deploying)
- [Data files](#data-files)
- [Front matter](#front-matter)
- [Meta headers](#meta-headers)
- [NPM Search](#npm-search)
- [Themes](#themes)
- [Blog support](#blog-support)
- [Asset Dependency Management](#asset-dependency-management)
  - [Using `unpkg` for managing asset dependencies](#using-unpkg-for-managing-asset-dependencies)
  - [Using Yarn for managing asset dependencies](#using-yarn-for-managing-asset-dependencies)
  - [Use cases](#use-cases)
    - [Adding tachyons](#adding-tachyons)
    - [Adding bourbon](#adding-bourbon)
    - [Adding bootstrap](#adding-bootstrap)
- [Roadmap](#roadmap)
- [Websites that use Kulfon](#websites-that-use-kulfon)
- [Bug reports](#bug-reports)


## Installation

    yarn global add kulfon

or

    npm install -g kulfon

## Getting started

Once **Kulfon** is installed, you will have access to the `kulfon` command.
First, let's create a new project:

    kulfon init <my-project-name>

It creates the following directory structure (`<my-project-name>` is optional,
if not provided, the current directory is used):

```
├── config.yml
├── public
└── website
    ├── data.yml
    ├── images
    │   └── logo.svg
    ├── javascripts
    │   └── main.js
    ├── layouts
    │   └── base.html
    ├── pages
    │   ├── about.md
    │   └── index.html
    ├── partials
    │   └── meta.html
    └── stylesheets
        └── styles.scss
```

Now enter the directory

```
cd <my-project-name>
```

and run `kulfon`'s server

```
kulfon serve
```

It creates `public` directory with compiled content (this directory should be
ignored). Go to `http://localhost:3000` to check your website.

For more commands, just type

```
kulfon
```

## Compiling the project

You can quickly compile your website using `kulfon compile`. This will generate
`public` directory which should be copied to your remote server to be handled by
a web server such as Apache or Nginx.

## Deploying

Kulfon can deploy your website to a remote location using [rsync][20]. You need to specify the server as IP or alias from `.ssh/config`, the the path in your `config.yml`.

```
deploy:
  server: nu02
  path: /srv/www/17.polyconf.com
```

Once configured, you can issue `kulfon deploy` to upload your website to the specified location.

## Data files

You can specify custom data that can be accessed in your views using data files.
Those are YML files which can be either stored in `website/data` directory or
using a single `data.yml` placed directly in `website`. By default `website/data.yml`
is used; if set, `data` directory has higher priority.

## Front matter

Each `html` file can have a front matter with additional meta information which will be merged into `data` object available in the `pages` e.g.

```
---
title: This is my title
---
{% extends "layouts/base.html" %}
{% block content %}
<h2>My Page: {{ data.title }}
{% endblock %}
```

## Meta headers

Kulfon comes with preconfigured `meta` headers, including [Facebook's Open Graph][9]
and [Twitter Cards][10]. The values are set through `data` files using `meta.*` branch,
e.g. `meta.description` to set `content` for `<meta name='description' />`.
Check `website/partials/meta.html` for all available values.

## NPM Search

Kulfon can search NPM registry using NPMS API, e.g.

    kulfon search jquery

By default it fetches the first `25` results that match the specified query. If there is more than `25` results, you can paginate that list using `--page` (or `-p`) parameter with default `1` for the first page i.e. the first 25 results and `2` for the next `25` results, etc.

## Blog support

Kulfon supports simple blog management. Let's start by creating a `blog` directory inside `pages`. Each post would be just a `html` or `markdown` file inside that directory. Additionally, you can prefix your files with a date to include it in the generated URL e.g. `2016-12_here_goes_my_blog_post_title.md` would be generated as `/blog/2016/12/here_goes_my_blog_post_title`.

## Asset Dependency Management

Kulfon allows to easily add external asset dependencies such as stylesheets or javascripts. It uses NPM registry for that. There are two ways of adding assets to your website from NPM, i.e. via [unpkg][13] CDN service or by installing them locally with [Yarn][4] (or [npm][11]).

### Using `unpkg` for managing asset dependencies

[unpkg][13] approach is the most easy and convenient one, but it requires being online while developing your website. In a nutshell it adds either stylsheets or javascripts as separate `<link ...>` or `<script ...>` entries for each specified dependency and then it integrates it with your main JavaScript or CSS file. This method is also HTTP/2 friendly.

### Using Yarn for managing asset dependencies

For simple HTML/CSS/JS website using [Yarn][4] (or just [npm][11]) may be an overkill, but it allows a more fine-grained control over what is produced in the final CSS/JS bundle. When you use [Sass][2] libriaries this is also the only way to go.

### Use cases

Here are few use cases to help you develop a proper intuition when working with Kulfon.

#### Adding tachyons

[tachyons][17] is one of my favorite CSS libraries. It is small and powerful. Let's see how we can start using it in our project.

First, let's check NPM registry by using `search` command

```
kulfon search tachyons
```

```
tachyons - https://www.npmjs.com/package/tachyons : https://github.com/tachyons-css/tachyons
tachyons-cli - https://www.npmjs.com/package/tachyons-cli : https://github.com/tachyons-css/tachyons-cli
react-native-style-tachyons - https://www.npmjs.com/package/react-native-style-tachyons : https://github.com/tachyons-css/react-native-style-tachyons
ember-cli-tachyons-shim - https://www.npmjs.com/package/ember-cli-tachyons-shim : https://github.com/wizvishak/ember-cli-tachyons-shim
tachyons-sass - https://www.npmjs.com/package/tachyons-sass : https://github.com/tachyons-css/tachyons-sass
tachyons-modules - https://www.npmjs.com/package/tachyons-modules : https://github.com/tachyons-css/tachyons-modules
tachyons-validate-classnames - https://www.npmjs.com/package/tachyons-validate-classnames : https://github.com/yoshuawuyts/tachyons-validate-class
ds-css-cli - https://www.npmjs.com/package/ds-css-cli : https://github.com/digitalsurgeons/ds-css-cli
```

There are several possibilities, but we will include the whole library at once.

    kulfon add tachyons

Restart the Kulfon server, open your website and *View Page Source*. There will be a new `<link ...>` entry added to the `<head>` just above your main stylesheet file.

```
<link rel="stylesheet" href="https://unpkg.com/tachyons@4.6.1/css/tachyons.min.css"/>
<link href="/styles.css" rel="stylesheet">
```

#### Adding bourbon

[Bourbon][18] is a lightweight Sass library that helps you write more effective stylesheets.

Let's add `bourbon` as a dependency which will be included during Sass compilation.

    kulfon add bourbon

Now you can include it at the top of `stylesheets/styles.scss`

    @import 'bourbon';

#### Adding bootstrap

[Bootstrap][19] is the most popular HTML, CSS, and JS framework for developing responsive, mobile first projects on the web.

There are two ways of integrating `bootstrap` using Kulfon. You can either include it as whole through `unpkg` CDN, or you can integrate it during Sass compilation; the latter solution allows you to easily customize the library e.g. by including only the modules you need.

In the first case you have to just add `bootstrap` package

    kulfon add bootstrap

To use a Sass version you need to use `bootstrap-sass` NPM package.

    kulfon add bootstrap-sass

and then you need to include `bootstrap` at the top of `stylesheets/styles.scss`

    @import 'bootstrap'

## Roadmap

Kulfon keeps track of the upcoming fixes and features on GitHub Projects: [Kulfon Roadmap](https://github.com/zaiste/kulfon/projects/1)

## Themes

Kulfon comes with several themes out-of-the-box. You can check the list of available theme at https://kulfon.net/themes/ or via `kulfon list themes`.

By default when initialising a new website, Kulfon uses [default][16] theme. You can specify another theme to use with `--theme` option (or `-t` for short)

    kulfon init new-website --theme bare

It is very easy to create your own theme: you just need to create a website structure which will be used as the template at the initialisation stage. Feel free to contribute that theme to this repository.

### `bare`

This is the most basic theme that provides a minimal directory structure that can be transformed by Kulfon. There is no styling nor additional scripts.

![Kulfon Theme: Bare](https://raw.githubusercontent.com/zaiste/kulfon/master/themes/theme-bare.png)]

### `default`

Default theme comes with a preconfigured CSS framework called Bulma. It provides basic views and components such as navigation, landing and footer.

![Kulfon Theme: Default](https://raw.githubusercontent.com/zaiste/kulfon/master/themes/theme-default.png)]

### `3columns`

This is a more elaborated page structure with 3 columns.


### `tachyons`

![Kulfon Theme: Tachyons](https://raw.githubusercontent.com/zaiste/kulfon/master/themes/theme-tachyons.png)]

## Websites that use Kulfon

If your website is using Kulfon, feel free to make a PR to add it to this list; please add the new entries at the top.

* https://nukomeet.com
* https://zaiste.net
* https://kulfon.net

## Bug reports

We use *Github Issues* for managing bug reports and feature requests. If you run
into problems, please search the *issues* or submit a new one here:
https://github.com/zaiste/kulfon/issues

Detailed bug reports are always great; it's event better if you are able to
include test cases.

[1]: https://mozilla.github.io/nunjucks/
[2]: http://sass-lang.com/
[3]: https://gohugo.io/
[4]: https://yarnpkg.com/
[5]: https://www.youtube.com/watch?v=YnsfCcxMydU
[6]: https://en.wikipedia.org/wiki/JavaScript
[7]: http://rollupjs.org/
[8]: https://www.wired.com/2016/04/average-webpage-now-size-original-doom/
[9]: https://developers.facebook.com/docs/sharing/webmasters#markup
[10]: https://dev.twitter.com/cards/overview
[11]: https://www.npmjs.com/
[12]: https://api-docs.npms.io/
[13]: https://unpkg.com/#/
[14]: https://en.wikipedia.org/wiki/HTTP/2
[15]: https://en.wikipedia.org/wiki/Markdown
[16]: https://kulfon.net/themes/default/
[17]: http://tachyons.io/
[18]: http://bourbon.io/
[19]: http://getbootstrap.com/
