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

const picomatch = (pattern, options, returnState = false) => {
  if (Array.isArray(pattern)) {
    let fns = pattern.map(input => picomatch(input, options));
    return str => {
      for (let isMatch of fns) {
        let state = isMatch(str);
        if (state) {
          return state;
        }
      }
      return false;
    };
  }

  if (typeof pattern !== 'string' || pattern === '') {
    throw new TypeError('Expected pattern to be a non-empty string');
  }

  let matcher = () => {
    let opts = options || {};
    let posix = utils.isWindows(options);
    let isIgnored = () => false;
    let regex;

    if (opts.ignore) {
      isIgnored = picomatch(opts.ignore, { ...options, ignore: null, onMatch: null });
    }

    return input => {
      if (!regex) {
        regex = picomatch.makeRe(pattern, options);
        Reflect.defineProperty(regex, 'glob', { value: pattern });
        // console.log([regex]);
      }

      let { matched, output } = picomatch.test(input, regex, options, posix);
      let state = { glob: pattern, regex, posix, input, output };

      if (matched === false) {
        return false;
      }

      if (isIgnored(input)) {
        if (typeof opts.onIgnore === 'function') opts.onIgnore(state);
        return false;
      }

      if (typeof opts.onMatch === 'function') opts.onMatch(state);
      return returnState ? state : true;
    };
  };

  return picomatch.precompile('matcher', pattern, options, matcher);
};

picomatch.test = (input, regex, options, posix) => {
  let matched = input === regex.glob;
  let output = input;

  if (matched === false) {
    if (options && options.matchBase === true) {
      matched = picomatch.matchBase(input, regex, options, posix);
    } else {
      let opts = options || {};
      let format = opts.format || (posix ? toPosixSlashes : str => str);
      output = format(input, { posix });
      matched = regex.test(output);
    }
  }

  return { matched, output };
};

picomatch.matchBase = (input, pattern, options, posix = utils.isWindows(options)) => {
  let regex = pattern instanceof RegExp ? pattern : picomatch.makeRe(pattern, options);

  if (posix) {
    input = path.posix.basename(input);
  } else {
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

picomatch.makeRe = (input, options, returnSource = false) => {
  let makeRe = () => {
    if (!input || typeof input !== 'string') return /$^/;
    let opts = options || {};
    let prefix = opts.contains ? '' : '^';
    let suffix = opts.contains ? '' : '$';
    // let output = opts.fastpaths !== false && parse.fastpaths(input, options);
    let output;
    let state;

    if (output === void 0) {
      state = picomatch.parse(input, options);
      output = state.output;
    } else if (opts.strictSlashes !== true) {
      output += '\\/?';
    }

    if (returnSource === true) {
      return output;
    }

    let source = `${prefix}(?:${output})${suffix}`;
    if (state && state.negated === true) {
      source = `^(?!${source}).*$`;
    }

    return picomatch.toRegex(source, options);
  };

  return picomatch.precompile('makeRe', input, options, makeRe);
};

picomatch.toRegex = (source, options) => {
  try {
    let opts = options || {};
    return new RegExp(source, opts.flags || (opts.nocase ? 'i' : ''));
  } catch (err) {
    if (options && options.debug === true) throw err;
    return /$^/;
  }
};

picomatch.precompile = (method, pattern, options, fn) => {
  let opts = options || {};
  let nocache = opts.nocache === true || !utils.isObject(picomatch.cache);

  if (nocache === true) {
    return fn(pattern, options);
  }

  let prefix = `method="${method}";pattern="${pattern}"`;
  let key = options ? picomatch.createKey(prefix, options) : prefix;

  let result = picomatch.cache[key];
  if (result === void 0) {
    result = picomatch.cache[key] = fn(pattern, options);
  }
  return result;
};

picomatch.createKey = (prefix, options) => {
  if (!options) return prefix;

  let keys = Object.keys(options);
  if (keys.length === 0) return prefix;

  let key = `${prefix};options=`;
  for (let k of keys) key += `${k}:${options[k]};`;
  return key;
};

/**
 * Clear the picomatch cache that is used for precompiled regular expressions.
 * Precompiling can be completely disabled by setting `nocache` to true.
 *
 * ```js
 * picomatch.clearCache();
 * // or
 * picomatch.cache = {};
 * ```
 * @return {Object} Returns the `picomatch.cache`.
 * @api public
 */

picomatch.clearCache = () => (picomatch.cache = {});

/**
 * Delete the picomatch cache to disable caching.
 *
 * ```js
 * picomatch.deleteCache();
 * // or
 * picomatch.cache = null;
 * ```
 * @return {Object} Returns the `picomatch.cache`.
 * @api public
 */

picomatch.deleteCache = () => (picomatch.cache = null);

/**
 * Set or get the picomatch cache.
 * @return {Object} Returns the `picomatch.cache`.
 */

Reflect.defineProperty(picomatch, 'cache', {
  set(value) {
    picomatch._cache = value == null ? null : {};
  },
  get() {
    if (picomatch._cache === void 0) {
      picomatch._cache = {};
    }
    return picomatch._cache;
  }
});

/**
 * Initialize the nocache property
 */

module.exports = picomatch;
