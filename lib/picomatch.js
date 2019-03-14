'use strict';

const path = require('path');
const parse = require('./parse');
const utils = require('./utils');
const toPosixSlashes = str => str.replace(/\\/g, '/');

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
    let fns = pattern.map(input => picomatch(input, options));
    return str => fns.some(fn => fn(str));
  }

  if (typeof pattern !== 'string' || pattern === '') {
    throw new TypeError('Expected pattern to be a non-empty string');
  }

  let opts = options || {};
  let posix = utils.isWindows(options);
  let regex = picomatch.makeRe(pattern, options);
  let isIgnored = () => false;

  if (opts.ignore) {
    isIgnored = picomatch(opts.ignore, { ...options, ignore: null, onMatch: null });
  }

  return input => {
    let { isMatch, value } = picomatch.test(input, regex, options, posix);

    if (isMatch && isIgnored(input)) {
      if (typeof opts.onIgnore === 'function') {
        opts.onIgnore({ pattern, regex, input, value });
      }
      return false;
    }

    if (isMatch && typeof opts.onMatch === 'function') {
      opts.onMatch({ pattern, regex, input, value });
    }
    return isMatch;
  };
};

picomatch.test = (input, regex, options, posix) => {
  let format = picomatch.format(options);
  let isMatch = input === regex.pattern;
  let matched = input;

  if (isMatch === false && options && options.matchBase === true) {
    isMatch = picomatch.matchBase(input, regex, options, posix);
  } else if (isMatch === false) {
    matched = format(input, posix);
    isMatch = regex.test(matched);
  }

  return { isMatch, value: matched };
}

picomatch.matchBase = (input, pattern, options = {}, toPosix) => {
  let regex = pattern instanceof RegExp ? pattern : picomatch.makeRe(pattern, options);
  let posix = toPosix === void 0 ? utils.isWindows(options) : toPosix;

  if (posix) {
    input = path.posix.basename(input);
  } else{
    input = path.basename(input);
  }

  return regex.test(input);
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
 * @param {String|Array} str The string to test.
 * @param {String|Array} patterns One or more glob patterns to use for matching.
 * @param {Object} [options] See available [options](#options).
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

picomatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);

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

picomatch.parse = (input, options) => {
  return picomatch.precompile('parse', input, options, parse);
};

picomatch.format = options => {
  if (options && typeof options.format === 'function') {
    return options.format;
  }
  return (string, posix) => {
    return posix ? toPosixSlashes(string) : string;
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

picomatch.makeRe = (input, options) => {
  if (!input || typeof input !== 'string') return /$^/;

  let makeRe = () => {
    let opts = options || { dot: false };
    let prefix = opts.contains ? '' : '^';
    let suffix = opts.contains ? '' : '$';
    let output = parse.fastpaths(input, options);
    let state;

    if (!output) {
      state = picomatch.parse(input, opts);
      output = state.output;
    } else if (opts.strictSlashes !== true) {
      output += '\\/?';
    }

    let source = `${prefix}(?:${output})${suffix}`;
    if (state && state.negated === true) {
      source = `^(?!${source}).*$`;
    }

    let regex = picomatch.toRegex(source, options);
    regex.pattern = input;
    return regex;
  };

  return picomatch.precompile('makeRe', input, options, makeRe);
};

picomatch.toRegex = (source, options = {}) => {
  try {
    return new RegExp(source, options.flags || (options.nocase ? 'i' : ''));
  } catch (err) {
    if (options.debug === true) throw err;
    return /$^/;
  }
};

picomatch.precompile = (method, pattern, options, fn) => {
  let nocache = picomatch.nocache === true || options && options.nocache === true;
  if (nocache) {
    return fn(pattern, options);
  }

  if (!picomatch.cache) {
    picomatch.cache = {};
  }

  let memoKey = picomatch.createKey(method, pattern, options);
  let result = picomatch.cache[memoKey];

  if (result === void 0) {
    result = picomatch.cache[memoKey] = fn(pattern, options);
  }

  return result;
};

picomatch.createKey = (method, pattern, options) => {
  let memoKey = `method="${method}";pattern="${pattern}"`;
  if (!options) return memoKey;

  let optionString = '';
  for (let key of Object.keys(options)) {
    optionString += `${key}:${options[key]};`;
  }

  if (optionString) {
    memoKey += `;options=${optionString}`;
  }
  return memoKey;
};

/**
 * Clear the picomatch cache that is used for precompiled regular expressions.
 * Precompiling can be completely disabled by setting `nocache` to true.
 *
 * ```js
 * picomatch.clearCache();
 * ```
 * @return {Object} Returns the `picomatch.cache`.
 * @api public
 */

picomatch.clearCache = () => (picomatch.cache = {});

/**
 * Initialize the nocache property
 */

picomatch.nocache = process.env.PICOMATCH_NO_CACHE === 'true';
module.exports = picomatch;
