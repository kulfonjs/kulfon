# [Kulfon](https://kulfon.net)

[![npm](https://img.shields.io/npm/v/kulfon.svg)](https://www.npmjs.com/package/kulfon)
[![npm](https://img.shields.io/npm/dm/kulfon.svg)](https://www.npmjs.com/package/kulfon)

**Kulfon** is a « one command », static site generator written entirely in
JavaScript. It's fast, modern and simple.

[![Kulfon: a 100% JavaScript static site generator](https://raw.githubusercontent.com/zaiste/kulfon/master/kulfon-static-site-logo.jpg)](https://kulfon.net)

[Website](https://kulfon.net) |
[Documentation](https://kulfon.net/overview/introduction/) |
[Installation Guide](https://kulfon.net/overview/installing/) |
[Contribution Guide](CONTRIBUTING.md) |
[Twitter](http://twitter.com/kufonapp)

> \- Kulfon, Kulfon, co z Ciebie wyrośnie ?! martwię się już od tygodnia!
>
> \- Przestań!

While you're hesitating, listen to this wonderful [Kulfon song][5]!

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

## Data files

You can specify custom data that can be accessed in your views using data files.
Those are YML files which can be either stored in `website/data` directory or
using a single `data.yml` placed directly in `website`. By default `website/data.yml`
is used; if set, `data` directory has higher priority.

## Meta headers

Kulfon comes with preconfigured `meta` headers, including [Facebook's Open Graph][9]
and [Twitter Cards][10]. The values are set through `data` files using `meta.*` branch,
e.g. `meta.description` to set `content` for `<meta name='description' />`.
Check `website/partials/meta.html` for all available values.

## NPM Search

Kulfon can search NPM registry using NPMS API, e.g.

    kulfon search jquery

## Themes

Kulfon comes with several themes out-of-the-box. You can check the list of available theme at https://kulfon.net/themes/ or via `kulfon list themes`.

By default when initialising a new website, Kulfon uses [default][16] theme. You can specify other theme to use with `--theme` option (or `-t` for short)

    kulfon init new-website --theme bare

It is very easy to create your own theme: you just need to create a website structure which will be used as the template at the initialisation stage. Feel free to contribute that theme to this repository.
  
## Roadmap

Kulfon keeps track of the upcoming fixes and features on GitHub Projects: [Kulfon Roadmap](https://github.com/zaiste/kulfon/projects/1)

- [ ] fingerprinting assets in production
- [ ] support for source maps
- [ ] support for blogging
- [ ] a website with comprehensive documentation

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
