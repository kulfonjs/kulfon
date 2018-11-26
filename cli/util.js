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
const fs = Promise.promisifyAll(require('fs-extra'));

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

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\./g, '')
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
    buffer = `<li class="toc-item"><a href="#${slugify(
      heading.content
    )}" class="toc-link">`;
    buffer += heading.content;
    buffer += '</a>';
    i++;
  }
  buffer += buffer === '' ? '' : '</li>';
  headings.push(buffer);
  return [i, headings.join('')];
}

module.exports = {
  unique,
  concat,
  merge,
  flatten,
  isEmpty,
  isObject,
  slugify,
  exists,
  print,
  println,
  buildTableOfContents
};
