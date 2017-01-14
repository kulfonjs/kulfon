
let unique = _ => [...new Set(_)];

let concat = (a, b) => a.concat(b);

let isObject = _ => (_ && typeof _ === 'object' && !Array.isArray(_) && _ !== null);

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

module.exports = {
  unique,
  concat,
  merge,
}
