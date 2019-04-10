'use strict';

const path = require('path');
const scan = require('./scan');
const parse = require('./parse');
const utils = require('./utils');

/**
 * Returns a matcher function from the given glob `pattern` and `options`.
 * The returned function takes a string to match as its only argument and returns
 * true if the string is a match.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch(pattern[, options]);
 *
 * const isMatch = picomatch('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 * ```
 * @name picomatch
 * @param {String} `pattern` Glob pattern
 * @param {Object=} `options`
 * @return {Function=} Returns a matcher function.
 * @api public
 */

const picomatch = (glob, options, returnState = false) => {
  if (Array.isArray(glob)) {
    let fns = glob.map(input => picomatch(input, options, returnState));
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
  let regex = picomatch.makeRe(glob, options, false, true);
  let state = regex.state;
  delete regex.state;

  let isIgnored = () => false;
  if (opts.ignore) {
    let ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
    isIgnored = picomatch(opts.ignore, ignoreOpts, returnState);
  }

  const matcher = (input, returnObject = false) => {
    let { isMatch, match, output } = picomatch.test(input, regex, options, { glob, posix });
    let result = { glob, state, regex, posix, input, output, match, isMatch };

    if (typeof opts.onResult === 'function') {
      opts.onResult(result);
    }

    if (isMatch === false) {
      result.isMatch = false;
      return returnObject ? result : false;
    }

    if (isIgnored(input)) {
      if (typeof opts.onIgnore === 'function') {
        opts.onIgnore(result);
      }
      result.isMatch = false;
      return returnObject ? result : false;
    }

    if (typeof opts.onMatch === 'function') {
      opts.onMatch(result);
    }
    return returnObject ? result : true;
  };

  if (returnState) {
    matcher.state = state;
  }

  return matcher;
};

/**
 * Test `input` with the given `regex`. This is used by the main
 * `picomatch()` function to
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.test(input, regex[, options]);
 *
 * console.log(pm.test('foo/bar', /^(?:([^/]*?)\/([^/]*?))$/));
 * // { isMatch: true, match: [ 'foo/', 'foo', 'bar' ], output: 'foo/bar' }
 * ```
 * @param {String} `input` String to test.
 * @param {RegExp} `regex`
 * @return {Object} Returns an object with matching info.
 * @api public
 */

picomatch.test = (input, regex, options, { glob, posix } = {}) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected input to be a string');
  }

  if (input === '') {
    return { isMatch: false, output: '' };
  }

  let opts = options || {};
  let format = opts.format || (posix ? utils.toPosixSlashes : null);
  let match = input === glob;
  let output = (match && format) ? format(input) : input;

  if (match === false) {
    output = format ? format(input) : input;
    match = output === glob;
  }

  if (match === false || opts.capture === true) {
    if (opts.matchBase === true || opts.basename === true) {
      match = picomatch.matchBase(input, regex, options, posix);
    } else {
      match = regex.exec(output);
    }
  }

  return { isMatch: !!match, match, output };
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
 * Scan a glob pattern to separate the pattern into segments.
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

picomatch.scan = (input, options) => scan(input, options);

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

picomatch.makeRe = (input, options, returnOutput = false, returnState = false) => {
  if (!input || typeof input !== 'string') {
    throw new TypeError('Expected a non-empty string');
  }

  let opts = options || {};
  let prefix = opts.contains ? '' : '^';
  let suffix = opts.contains ? '' : '$';
  let state = { negated: false, fastpaths: true };
  let output;

  if (input.startsWith('./')) input = input.slice(2);

  if (opts.fastpaths !== false && (input[0] === '.' || input[0] === '*')) {
    output = parse.fastpaths(input, options);
  }

  if (output === void 0) {
    state = picomatch.parse(input, options);
    output = state.output;
  }

  if (returnOutput === true) {
    return output;
  }

  let source = `${prefix}(?:${output})${suffix}`;
  if (state && state.negated === true) {
    source = `^(?!${source}).*$`;
  }

  let regex = picomatch.toRegex(source, options);
  if (returnState === true) {
    regex.state = state;
  }

  return regex;
};

/**
 * Create a regular expression from the given source string.
 * @param {String} source
 * @param {Object} options
 * @return {RegExp}
 */

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
 * Expose "picomatch"
 */

module.exports = picomatch;
