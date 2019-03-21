<p align="center">
  <img width="250" src="/kulfon-static-site-generator-logo.png">
</p>

<h1 align="center">
  <a href="https://kulfon.org">Kulfon</a>
</h1>

<p align="center">
  <b>Static Site Generator for The Rest of Us</b>
</p>

<br>

<p align="center">
  <a href="https://www.npmjs.com/package/kulfon"><img src="https://img.shields.io/npm/v/kulfon.svg?style=for-the-badge" alt="Kulfon Package on NPM"></a>
  <a href="https://www.npmjs.com/package/kulfon"><img src="https://img.shields.io/npm/dm/kulfon.svg?style=for-the-badge" alt="Kulfon Package on NPM"></a>
</p>

**Kulfon** /kuːl fəʊn/ is a *one command*, JavaScript static site generator
inspired by Hugo. It combines data sources with templates to tranform them into
HTML pages at once. It supports [Nunjucks](https://mozilla.github.io/nunjucks/),
[Markdown](https://en.wikipedia.org/wiki/Markdown) and [Org
Mode](https://orgmode.org/) out-of-the-box. 

_This software is still under **active development** and not feature complete or ready for consumption by anyone other than software developers._

> \- Kulfon, Kulfon, co z Ciebie wyrośnie ?! martwię się już od tygodnia!
>
> \- Przestań!

While you're hesitating, listen to this wonderful [Kulfon song][5]!

## Demo

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
* [Org Mode](https://orgmode.org/) support
* [Markdown][15] support
* unified approach to external dependencies management with either [unpkg][13] or [Yarn][4]
* [HTTP/2][14] ready

## Installation

    npm install -g kulfon

## Getting started

Once **Kulfon** is installed, you will have access to the `kulfon` command.
First, let's create a new project:

    kulfon new <my-project-name>

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

Visit [Getting Started](https://kulfon.org/docs/install/) for more.

## Roadmap

Kulfon keeps track of the upcoming fixes and features on GitHub Projects: [Kulfon Roadmap](https://github.com/kulfonjs/kulfon/projects/1)

## Websites that use Kulfon

If your website is using Kulfon, feel free to make a PR to add it to this list; please add the new entries at the top.

* https://nukomeet.com
* https://zaiste.net
* https://kulfon.org

## Bug reports

We use *Github Issues* for managing bug reports and feature requests. If you run
into problems, please search the *issues* or submit a new one here:
https://github.com/kulfonjs/kulfon/issues

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
