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

const picomatch = (patterns, options) => {
  if (Array.isArray(patterns)) {
    let fns = patterns.map(p => picomatch(p, options));
    return (...args) => fns.some(fn => fn(...args));
  }

  let matcher = (pattern, opts = {}) => {
    if (typeof pattern !== 'string') {
      throw new TypeError('expected pattern to be a string');
    }

    if (pattern === '') {
      return str => opts.bash ? str === pattern : false;
    }

    let isIgnored = () => false;
    let isWin = isWindows(opts);
    let negated = false;

    if (opts.nonegate !== true && pattern[0] === '!' && pattern[1] !== '(') {
      pattern = pattern.slice(1);
      negated = true;
    }

    if (opts.normalize !== false) {
      pattern = normalize(pattern);
    }

    if (opts.ignore) {
      let ignore = picomatch(opts.ignore, { ...opts, ignore: null });
      isIgnored = str => ignore(str, true, true);
    }

    // let test = str => !isIgnored(str) && pattern === str;
    // if (/[+*?[({})\]\\]/.test(pattern)) {
    // }
    let regex = picomatch.makeRe(pattern, opts);
    let test = str => !isIgnored(str) && (pattern === str || regex.test(str));

    let isMatch = (str, isUnixified = false, isNormalized = false) => {
      // return test(str);
      if (typeof opts.onData === 'function') str = opts.onData(str);
      if (str === pattern) return true;
      if (isNormalized !== true && opts.normalize !== false) str = normalize(str);
      if (str === pattern) return true;
      if (opts.matchBase) {
        return test(path.basename(str));
      }
      return test((!isUnixified && isWin) ? unixify(str) : str);
    };

    return negated ? str => !isMatch(str) : isMatch;
  };

  if (options && typeof options.onMatch === 'function') {
    let fn = matcher;
    matcher = (patterns, opts) => {
      let isMatch = fn(patterns, opts);
      return str => isMatch(str) ? opts.onMatch(str) : false;
    };
  }

  return precompile('matcher', patterns, options, matcher);
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

picomatch.isMatch = (str, pattern, options, unixified, normalized) => {
  let isMatch = precompile('isMatch', pattern, options, picomatch);
  return isMatch(str, unixified, normalized);
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

picomatch.makeRe = (input, options) => {
  let makeRe = (pattern, opts = {}) => {
    let flags = opts.flags || (opts.nocase ? 'i' : '');
    let state = picomatch.parse(pattern, opts);
    return toRegex(state.source, flags);
  };
  return precompile('makeRe', input, options, makeRe);
};

/**
 * Parse a glob pattern to create the source string for a regular
 * expression.
 *
 * ```js
 * const pm = require('picomatch');
 * const state = pm.parse(pattern[, options]);
 * ```
 * @param {String} `glob`
 * @param {Object} `options`
 * @return {Object} Returns an object with useful properties and output to be used as regex source string.
 * @api public
 */

picomatch.parse = (input, options = {}) => {
  return precompile('parse', input, options, parse);
};

/**
 * Scan a glob pattern to separate the pattern into segments. Used
 * by the [split](#split) method.
 *
 * ```js
 * const pm = require('picomatch');
 * const state = pm.scan(pattern[, options]);
 * ```
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {Object} Returns an object with
 * @api public
 */

picomatch.scan = (input, options = {}) => {
  return precompile('scan', input, options, scan);
};

/**
 * Split a glob pattern into two parts: the directory part of the glob,
 * and the matching part.
 *
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {Array}
 * @api public
 */

picomatch.split = (pattern, options) => {
  let state = scan(pattern, options);
  let cwd = options && options.cwd ? options.cwd : process.cwd();
  let base = state.base;
  if (base[0] === '/') base = base.slice(1);

  return {
    base: state.base,
    pattern: state.pattern,
    cwd: path.resolve(cwd, state.base)
  };
};

/**
 * Properly join a file path (or paths) to a glob pattern.
 *
 * @param {...[string]} `args` One or more path segments to join. Only the last segment may be a glob pattern.
 * @return {String}
 * @api public
 */

picomatch.join = (...args) => {
  let glob = args.pop();
  let base = unixify(path.posix.join(...args));
  return path.posix.join(base, glob);
};

/**
 * Same as [.join](#join) but returns an absolute path.
 *
 * @param {...[string]} `args` One or more path segments to join. Only the last segment may be a glob pattern.
 * @return {String}
 * @api public
 */

picomatch.resolve = (...args) => {
  let glob = args.pop();
  let base = unixify(path.posix.resolve(...args));
  return path.posix.join(base, glob);
};

/**
 * Clear the picomatch cache that is used for precompiled regular expressions.
 * Precompiling can be completely disabled by setting `nocache` to true.
 *
 * ```js
 * picomatch.clearCache();
 * ```
 * @return {undefined}
 * @api public
 */

picomatch.clearCache = () => {
  picomatch.cache = {};
};

/**
 * Helpers
 */

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
