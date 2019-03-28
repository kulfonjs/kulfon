const nunjucks = require('nunjucks');

class LinkExt {
  constructor() {
    this.tags = ['link'];
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);

    parser.advanceAfterBlockEnd(tok.value);

    return new nodes.CallExtension(this, 'run', args);
  }

  run(context, ...args) {
    const [path, name, rest] = args;
    const currentPath = `/${context.ctx.page.path}`;

    if (path === currentPath) rest.class = `active ${rest.class}`;

    const attrs = Object.keys(rest)
      .filter(_ => !_.startsWith('__'))
      .map(key => `${key}="${rest[key]}"`)
      .join(' ');

    return new nunjucks.runtime.SafeString(
      `<a href="${path}" ${attrs}>${name}</a>`
    );
  }
}

module.exports = LinkExt;
