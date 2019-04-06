// Copyright 2019 Zaiste & contributors. All rights reserved.
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

const fs = require('fs-extra');
const slug = require('slugify');
const axios = require('axios');

const isNotScalar = obj => obj === Object(obj);
const intersection = (a, b) => new Set([...a].filter(_ => b.has(_)));
const isSetEmpty = a => a.size === 0;
const isNumeric = num => !isNaN(num);
const destruct = (keys, obj) =>
  keys.reduce((a, c) => ({ ...a, [c]: obj[c] }), {});

let unique = _ => [...new Set(_)];

let concat = (a, b) => a.concat(b);

let isObject = _ =>
  _ && typeof _ === 'object' && !Array.isArray(_) && _ !== null;

function flatten(arr) {
  return Array.prototype.concat(...arr);
}

function isEmpty(_) {
  for (var x in _) {
    return false;
  }
  return true;
}

function merge(target, source) {
  if (isObject(target) && isObject(source)) {
    for (let key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        merge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return target;
}

function anchorize(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\.`]/g, '')
    .replace(/[\s\W-]+/g, '-');
}

async function exists(pathname) {
  try {
    let stats = await fs.statAsync(pathname);
    return true;
  } catch (error) {
    return false;
  }
}

function print(text) {
  process.stdout.write(text);
}
function println(text) {
  process.stdout.write(text + '\n');
}

function buildTableOfContents(pos, tokens) {
  var headings = [],
    buffer = '',
    currentLevel,
    subHeadings,
    size = tokens.length,
    i = pos;
  while (i < size) {
    var token = tokens[i];
    var heading = tokens[i - 1];
    var level = token.tag && parseInt(token.tag.substr(1, 1));
    if (
      token.type !== 'heading_close' ||
      [1, 2].indexOf(level) == -1 ||
      heading.type !== 'inline'
    ) {
      i++;
      continue;
    }
    if (!currentLevel) {
      currentLevel = level;
    } else {
      if (level > currentLevel) {
        subHeadings = buildTableOfContents(i, tokens);
        buffer += subHeadings[1];
        i = subHeadings[0];
        continue;
      }
      if (level < currentLevel) {
        // Finishing the sub headings
        buffer += '</li>';
        headings.push(buffer);
        return [i, '<ul>' + headings.join('') + '</ul>'];
      }
      if (level == currentLevel) {
        // Finishing the sub headings
        buffer += '</li>';
        headings.push(buffer);
      }
    }
    buffer = `<li class="toc-item"><a href="#${anchorize(
      heading.content
    )}" class="toc-link">`;
    buffer += heading.content.replace(/`/g, '');
    buffer += '</a>';
    i++;
  }
  buffer += buffer === '' ? '' : '</li>';
  headings.push(buffer);
  return [i, headings.join('')];
}

const slugify = title => {
  const options = {
    remove: /[*+~.(){}'"!:@]/g
  };

  const stopwords = [
    'of',
    'and',
    'or',
    'the',
    'a',
    'an',
    'to',
    'in',
    'into',
    'do',
    'have',
    'has'
  ];

  const str = title
    .toLowerCase()
    .split(' ')
    .filter(word => !stopwords.includes(word))
    .join(' ');

  return slug(str, options);
};

const operations = new Set(['__http', '__graphql']);
const unfold = async data => {
  let unfolded = {};

  // TODO allow for more general approach where Objects & Arrays
  // can me mixed together
  if (Array.isArray(data)) {
    return data;
  }
  for (let prop in data) {
    let child = data[prop];
    let childKeys = new Set(Object.keys(child));
    let ops = intersection(operations, childKeys);

    if (isNotScalar(child) && !isSetEmpty(ops)) {
      let [operation, ...rest] = ops;

      let result = {};
      switch (operation) {
        case '__http':
          let requestParams = child['__http']['__request'];
          let responseDataKeys = Object.keys(child['__http']['__response']);

          let response = await axios(requestParams);

          if (response.status === 200) {
            result = destruct(responseDataKeys, response.data);
          }

          break;
        default:
          break;
      }
      Object.assign(unfolded, { [prop]: result });
    } else if (isNotScalar(data[prop])) {
      Object.assign(unfolded, { [prop]: await unfold(data[prop]) });
    } else {
      Object.assign(unfolded, { [prop]: data[prop] });
    }
  }

  return unfolded;
};

module.exports = {
  unique,
  concat,
  merge,
  flatten,
  isEmpty,
  isObject,
  anchorize,
  exists,
  print,
  println,
  buildTableOfContents,
  slugify,
  isNotScalar,
  intersection,
  isSetEmpty,
  isNumeric,
  destruct,
  unfold
};
