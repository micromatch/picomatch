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

const picomatch = (glob, options, returnState = false) => {
  if (Array.isArray(glob)) {
    let fns = glob.map(input => picomatch(input, options));
    return str => {
      for (let isMatch of fns) {
        let state = isMatch(str);
        if (state) return state;
      }
      return false;
    };
  }

  if (typeof glob !== 'string' || glob === '') {
    throw new TypeError('Expected pattern to be a non-empty string');
  }

  let opts = options || {};
  let posix = utils.isWindows(options);
  let isIgnored = () => false;
  let regex;

  if (opts.ignore) {
    isIgnored = picomatch(opts.ignore, { ...options, ignore: null, onMatch: null });
  }

  return input => {
    if (!regex) {
      regex = picomatch.makeRe(glob, options);
    }

    let { matched, output } = picomatch.test(input, regex, options, { glob, posix });
    let state = { glob, regex, posix, input, output };

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

picomatch.test = (input, regex, options, { glob, posix } = {}) => {
  let matched = input === glob;
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

picomatch.parse = (input, options) => parse(input, options);

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
  if (!input || typeof input !== 'string') return /$^/;
  let opts = options || {};
  let prefix = opts.contains ? '' : '^';
  let suffix = opts.contains ? '' : '$';
  let output = opts.fastpaths !== false && parse.fastpaths(input, options);
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

picomatch.toRegex = (source, options) => {
  try {
    let opts = options || {};
    return new RegExp(source, opts.flags || (opts.nocase ? 'i' : ''));
  } catch (err) {
    if (options && options.debug === true) throw err;
    return /$^/;
  }
};

/**
 * Initialize the nocache property
 */

module.exports = picomatch;
