const Prism = require('prismjs');
const loadLanguages = require('prismjs/components/');

const loadPrismLang = lang => {
  if (!lang) return undefined;
  let langObject = Prism.languages[lang];
  if (langObject === undefined) {
    loadLanguages([lang]);
    langObject = Prism.languages[lang];
  }
  return langObject;
}

const highlight = (markdownit, text, lang) => {
  let prismLang = loadPrismLang(lang);
  const code = prismLang
    ? Prism.highlight(text, prismLang)
    : markdownit.utils.escapeHtml(text);
  const classAttribute = lang
    ? ` class="${markdownit.options.langPrefix}${lang}"`
    : '';
  return `<pre${classAttribute}><code${classAttribute}>${code}</code></pre>`;
}

module.exports = _ => {
  _.options.highlight = (...args) =>
    highlight(_, ...args);
}
