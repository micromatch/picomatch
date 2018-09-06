'use strict';

const path = require('path');
const windows = () => process.platform === 'windows' || path.sep === '\\';
const normalize = str => str.replace(/^\.[\\/]/, '');
const unixify = str => str.replace(/\\+/g, '/');
const parse = require('./parse');
const scan = require('./scan');

/**
 * Returns a matcher function from the given glob `pattern` and `options`.
 * The returned function takes a string to match as its only argument and returns
 * true if the string is a match.
 *
 * ```js
 * const picomatch = require('picomatch');
 * picomatch(pattern[, options]);
 *
 * const isMatch = picomatch('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 * ```
 * @param {String} `pattern` Glob pattern
 * @param {Object} `options`
 * @return {Function} Returns a matcher function.
 * @api public
 */

const picomatch = (pattern, options) => {
  if (Array.isArray(pattern)) {
    let fns = pattern.map(p => picomatch(p, options));
    return (...args) => fns.some(fn => fn(...args));
  }

  let matcher = (input, options = {}) => {
    if (typeof input !== 'string') {
      throw new TypeError('expected input to be a string');
    }

    if (options.normalize !== false) {
      input = normalize(input);
    }

    if (input === '') {
      return str => options.bash ? str === input : false;
    }

    let regex = picomatch.makeRe(input, options);
    let isWin = isWindows(options);
    let isIgnored = () => false;

    if (options.ignore) {
      let ignore = picomatch(options.ignore, { ...options, ignore: null });
      isIgnored = str => ignore(str, true);
    }

    return (str, isUnixified = false, isNormalized = false) => {
      if (str === input) return true;
      if (isNormalized !== true && options.normalize !== false) str = normalize(str);
      if (str === input) return true;
      if (options.matchBase) {
        let basename = path.basename(str);
        return !isIgnored(basename) && regex.test(basename);
      }
      let val = (isUnixified !== true && isWin) ? unixify(str) : str;
      return !isIgnored(val) && (input === val || regex.test(val));
    };
  };

  return precompile('matcher', pattern, options, matcher);
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
  return precompile('isMatch', pattern, options, picomatch)(str, unixified);
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
  let makeRe = (input, opts = {}) => {
    let flags = opts.flags || (opts.nocase ? 'i' : '');
    let state = picomatch.parse(input, options);
    if (opts.segments === true) {
      let segs = state.segs.map(ele => {
        ele.source = state.wrap(ele.value);
        ele.regex = toRegex(ele.source, flags);
        ele.isMatch = str => ele.regex.test(str);
        return ele;
      });
      return segs;
    }
    return toRegex(state.source, flags);
  };
  return precompile('makeRe', pattern, options, makeRe);
};

/**
 * Parse a glob pattern to create the source string for a regular
 * expression.
 *
 * ```js
 * const pm = require('picomatch');
 * const state = pm(pattern[, options]);
 * ```
 * @param {String} `glob`
 * @param {Object} `options`
 * @return {Object} Returns an object with useful properties and output to be used as regex source string.
 * @api public
 */

picomatch.parse = (input, options) => parse(input, options);
picomatch.scan = (input, options) => scan(input, options);

picomatch.split = (pattern, options) => {
  let { parent, glob } = scan(pattern, options);
  return [ parent, glob ];
};

picomatch.join = (...args) => {
  let glob = args.pop();
  let base = unixify(path.posix.join(...args));
  return path.posix.join(base, glob);
};

picomatch.resolve = (...args) => {
  let glob = args.pop();
  let base = unixify(path.posix.resolve(...args));
  return path.posix.join(base, glob);
};

picomatch.clearCache = () => (picomatch.cache = {});

function precompile(method, pattern, options, fn) {
  if (picomatch.nocache === true || options && options.nocache === true) {
    return fn(pattern, options);
  }
  if (picomatch.cache === void 0) picomatch.cache = {};
  let key = createKey(method, pattern, options);
  let res = picomatch.cache[key];
  if (res === void 0) {
    res = picomatch.cache[key] = fn(pattern, options);
  }
  return res;
}

function createKey(method, pattern, options) {
  let key = `method="${method}";pattern="${pattern}"`;
  if (!options) return key;
  let val = '';
  for (let k of Object.keys(options)) val += `${k}:${options[k]};`;
  if (val) key += `;options=${val}`;
  return key;
}

function toRegex(value, flags) {
  try {
    return new RegExp(value, flags);
  } catch (err) { /* ignore error */ }
  return new RegExp(value.replace(/\W/g, '\\$&'), flags);
}

function isWindows(options = {}) {
  return options.unixify !== false && (options.unixify === true || windows() === true);
}

picomatch.nocache = false;
module.exports = picomatch;
