'use strict';

const path = require('path');
const assert = require('assert');
const windows = () => process.platform === 'windows' || path.sep === '\\';
const unixify = str => str.replace(/\\+/g, '/');
const parse = require('./parse');

/**
 * Returns an array of strings that match one or more glob patterns.
 *
 * ```js
 * const pm = require('picomatch');
 * pm(list, patterns[, options]);
 *
 * console.log(pm(['a.js', 'a.txt'], ['*.js']));
 * //=> [ 'a.js' ]
 * ```
 * @param {String|Array<string>} list List of strings to match.
 * @param {String|Array<string>} patterns Glob patterns to use for matching.
 * @param {Object} [options]
 * @return {Array} Returns an array of matches
 * @api public
 */

const picomatch = (list, patterns, options) => {
  if (typeof list === 'string') {
    list = [list];
  }

  if (typeof patterns === 'string') {
    return picomatch.match(list, patterns, options);
  }

  if (list.length === 0 || patterns.length === 0) {
    return [];
  }

  if (patterns.length === 1) {
    return picomatch.match(list, patterns[0], options);
  }

  let opts = options || {};
  let omit = [];
  let keep = [];
  let unix = new Set();

  for (let pattern of patterns) {
    if (!pattern || typeof pattern !== 'string') continue;
    let negated = pattern[0] === '!' && opts.nonegate !== true;
    if (negated) {
      pattern = pattern.slice(1);
    }

    let matches = picomatch.match(list, pattern, options);
    if (matches.unix) matches.unix.forEach(v => unix.add(v));

    if (negated) {
      omit.push(...matches);
    } else {
      keep.push(...matches);
    }
  }

  if (omit.length) {
    if (!keep.length) keep = [...unix];
    keep = keep.filter(s => !omit.includes(s));
  }

  // if no options were passed, uniquify results and return
  if (options === void 0 || options.nounique !== true) {
    return [...new Set(keep)];
  }

  return keep;
};

/**
 * Similar to the main function, but `pattern` must be a string.
 *
 * ```js
 * const pm = require('picomatch');
 * pm.match(list, pattern[, options]);
 *
 * console.log(pm.match(['a.a', 'a.aa', 'a.b', 'a.c'], '*.a'));
 * //=> ['a.a', 'a.aa']
 * ```
 * @param {Array} `list` Array of strings to match
 * @param {String} `pattern` Glob pattern to use for matching.
 * @param {Object} `options`
 * @return {Array} Returns an array of matches
 * @api public
 */

picomatch.match = (list = [], pattern, options) => {
  if (!pattern) return [];

  let isMatch = memoize('match', pattern, options, picomatch.matcher);
  let isWin = isWindows(options);
  let opts = options || {};
  let matches = opts.nounique === true ? [] : new Set();
  let unix = [];

  for (let item of list) {
    if (!item) continue;
    let ele = isWin ? unixify(item) : item;
    let res = opts.unixify !== false ? ele : item;
    unix.push(res);

    if (isMatch(ele, true)) {
      if (opts.normalize && res.length > 2 && res.startsWith('./') || res.startsWith('.\\')) {
        res = res.slice(2);
      }

      if (opts.nounique === true) {
        matches.push(res);
      } else {
        matches.add(res);
      }
    }
  }

  if (options && matches.length === 0) {
    if (options.failglob === true) {
      throw new Error(`no matches found for "${pattern}"`);
    }
    if (options.nonull === true || options.nullglob === true) {
      return [pattern];
    }
  }

  // if no options were passed, or nounique is not true,
  // then we have a Set that needs to be converted to an array
  if (options === void 0 || options.nounique !== true) {
    matches = [...matches];
  }

  Reflect.defineProperty(matches, 'unix', { value: unix });
  return matches;
};

/**
 * Returns true if **any** of the given glob `patterns` match the specified `string`.
 *
 * ```js
 * const pm = require('picomatch');
 * pm.isMatch(string, patterns[, options]);
 *
 * console.log(pm.isMatch('a.a', ['b.*', '*.a'])); //=> true
 * console.log(pm.isMatch('a.a', 'b.*')); //=> false
 * ```
 * @param  {String|Array} str The string to test.
 * @param {String|Array} patterns One or more glob patterns to use for matching.
 * @param {Object} [options] See available [options](#options).
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

picomatch.isMatch = (str, pattern, options, unixified) => {
  assert.equal(typeof str, 'string', 'expected a string');
  return pattern && memoize('isMatch', pattern, options, picomatch.matcher)(str, unixified);
};

/**
 * Returns a matcher function from the given glob `pattern` and `options`.
 * The returned function takes a string to match as its only argument and returns
 * true if the string is a match.
 *
 * ```js
 * const pm = require('picomatch');
 * pm.matcher(pattern[, options]);
 *
 * const isMatch = pm.matcher('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 * ```
 * @param {String} `pattern` Glob pattern
 * @param {Object} `options`
 * @return {Function} Returns a matcher function.
 * @api public
 */

picomatch.matcher = (input, options) => {
  if (!input) return str => typeof str === 'string';

  if (Array.isArray(input)) {
    if (input.length > 1) {
      const fns = input.map(pat => picomatch.matcher(pat, options));
      return (str, unixified) => fns.some(fn => fn(str, unixified));
    }
    input = input[0];
  }

  let ignored = options && options.ignore
    ? picomatch.matcher(options.ignore, { ...options, ignore: null })
    : void 0;

  let regex = memoize('matcher', input, options, picomatch.makeRe);
  let isWin = isWindows(options);

  return (str, unixified) => {
    let ele = unixified === void 0 && isWin ? unixify(str) : str;
    // if (regex.prefix === './' && ele.startsWith('./')) {
    //   ele = ele.slice(2);
    // }
    return (ignored === void 0 || ignored(ele, true) === false) && regex.test(ele);
  };
};

/**
 * Create a regular expression from the given glob `pattern`.
 *
 * ```js
 * const pm = require('picomatch');
 * pm.makeRe(pattern[, options]);
 *
 * console.log(pm.makeRe('*.js'));
 * //=> /^(?:(\.[\\\/])?(?!\.)(?=.)[^\/]*?\.js)$/
 * ```
 * @param {String} `pattern` A glob pattern to convert to regex.
 * @param {Object} `options`
 * @return {RegExp} Returns a regex created from the given pattern.
 * @api public
 */

picomatch.makeRe = (pattern, options) => {
  const makeRe = (input, opts = {}) => {
    let flags = opts.nocase ? 'i' : '';
    let state = picomatch.parse(input, options);
    let regex = new RegExp(state.output, flags);
    if (state.prefix) {
      Reflect.defineProperty(regex, 'prefix', { value: state.prefix });
    }
    return regex;
  };
  return memoize('makeRe', pattern, options, makeRe);
};

/**
 * Parse the given `str` to create the source string for a regular
 * expression.
 *
 * ```js
 * const pm = require('picomatch');
 * const res = pm.parse(pattern[, options]);
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {Object} Returns an object with tokens and regex source string.
 * @api public
 */

picomatch.parse = (pattern, options) => {
  return memoize('parse', pattern, options, parse);
};

picomatch.clearCache = () => (picomatch.cache = {});

// function memoize(method, pattern, options, fn) {
//   if (options && options.nocache === true) {
//     return fn(pattern, options);
//   }

//   if (!picomatch.cache) picomatch.cache = {};
//   let key = createKey(method, pattern, options);
//   let res = picomatch.cache[key];
//   if (res === void 0) {
//     res = picomatch.cache[key] = fn(pattern, options);
//   }
//   return res;
// }
function memoize(method, pattern, options, fn) {
  if (options && options.nocache === true) {
    return fn(pattern, options);
  }

  let key = createKey(method, pattern, options);
  if (!picomatch.cache) picomatch.cache = {};
  return picomatch.cache[key] || (picomatch.cache[key] = fn(pattern, options));
}


function createKey(method, pattern, options) {
  let id = `method="${method}";pattern="${pattern}"`;
  if (!options) return id;
  let opts = '';
  for (let k of Object.keys(options)) opts += `${k}:${String(options[k])};`;
  if (opts) id += ';options=' + opts;
  return id;
}

function isWindows(options = {}) {
  return options.unixify !== false && (options.unixify === true || windows() === true);
}

module.exports = picomatch;
