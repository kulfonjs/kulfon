const nunjucks = require('nunjucks');

const isEmpty = (l1, l2) => {
  const s1 = new Set(l1.filter(_ => _ !== ''));
  const s2 = new Set(l2.filter(_ => _ !== ''));
  const r = new Set([...s1].filter(_ => s2.has(_)));

  return r.size === 0;
};

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
    const [path, name, rest = { class: '', __exact: true }] = args;
    const currentPath = `/${context.ctx.page.path}`;

    const isExact = rest.__exact;

    if (isExact && path === currentPath) rest.class = `active ${rest.class}`;
    if (!isExact && !isEmpty(path.split('/'), currentPath.split('/')))
      rest.class = `active ${rest.class}`;

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
