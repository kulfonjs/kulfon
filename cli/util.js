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
   for (var x in _) { return false; }
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
  return text.toString().toLowerCase().trim()
    .replace(/\./g, '')
    .replace(/[\s\W-]+/g, '-')
}

async function exists(pathname) {
  try {
    let stats = await fs.statAsync(pathname);
    return true
  } catch (error) {
    return false;
  }
}

function print(text) { process.stdout.write(text); }
function println(text) { process.stdout.write(text + '\n'); }

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
};
