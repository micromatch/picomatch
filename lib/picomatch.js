'use strict';

const scan = require('./scan');
const parse = require('./parse');
const utils = require('./utils');
const constants = require('./constants');
const isObject = val => val && typeof val === 'object' && !Array.isArray(val);

// Factory for the hot-path matcher closure. Top-level factories keep
// the captured scope small (just glob and regex) so V8 can inline
// regex.exec without hauling in the parent scope's locals.
//
// makeHotPosixMatcher is for the picomatch(pattern) no-options shape:
// minimal scope, no getSlow thunk, the returnObject=true branch
// builds the result object inline since it's rare and simple.
// Lazy form: defer the `new RegExp` until the first call. Shared compiled
// regex state lives in a closure variable.
const makeLazyHotPosixMatcher = glob => {
  let regex;
  const matcher = (input, returnObject) => {
    if (regex === undefined) {
      regex = picomatch.makeRe(glob, undefined, false, false);
    }
    if (returnObject === true) {
      if (typeof input !== 'string') {
        throw new TypeError('Expected input to be a string');
      }
      if (input === '') {
        return { glob, state: undefined, regex, posix: undefined, input, output: '', match: false, isMatch: false };
      }
      const m = regex.exec(input);
      return { glob, state: undefined, regex, posix: undefined, input, output: input, match: m !== null ? m : false, isMatch: m !== null };
    }
    if (input === glob) return true;
    if (typeof input !== 'string') {
      throw new TypeError('Expected input to be a string');
    }
    return input !== '' && regex.test(input);
  };
  return matcher;
};

const makeFastPosixMatcher = (glob, regex, getSlow) => (input, returnObject) => {
  if (returnObject === true) return getSlow()(input, true);
  if (input === glob) return true;
  if (typeof input !== 'string') {
    throw new TypeError('Expected input to be a string');
  }
  return input !== '' && regex.test(input);
};

const makeFastFormatMatcher = (glob, regex, format, getSlow) => (input, returnObject) => {
  if (returnObject === true) return getSlow()(input, true);
  if (typeof input !== 'string') {
    throw new TypeError('Expected input to be a string');
  }
  if (input === '') return false;
  if (input === glob) return true;
  const output = format(input);
  return output === glob || regex.test(output);
};

/**
 * Creates a matcher function from one or more glob patterns. The
 * returned function takes a string to match as its first argument,
 * and returns true if the string is a match. The returned matcher
 * function also takes a boolean as the second argument that, when true,
 * returns an object with additional information.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch(glob[, options]);
 *
 * const isMatch = picomatch('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 *
 * // For environments without `node.js`, `picomatch/posix` provides you a dependency-free matcher, without automatic OS detection.
 * const picomatch = require('picomatch/posix');
 * // the same API, defaulting to posix paths
 * const isMatch = picomatch('a/*');
 * console.log(isMatch('a\\b')); //=> false
 * console.log(isMatch('a/b')); //=> true
 *
 * // you can still configure the matcher function to accept windows paths
 * const isMatch = picomatch('a/*', { options: windows });
 * console.log(isMatch('a\\b')); //=> true
 * console.log(isMatch('a/b')); //=> true
 * ```
 * @name picomatch
 * @param {String|Array} `globs` One or more glob patterns.
 * @param {Object=} `options`
 * @return {Function=} Returns a matcher function.
 * @api public
 */

const picomatch = (glob, options, returnState) => {
  // Hot path first: string glob, no options, no returnState. Test the
  // most common predicate (glob is a non-empty string) before the
  // rare Array.isArray check. `new RegExp(...)` is the single most
  // expensive step in the full pipeline (~30% of total time per the
  // V8 profiler), so the lazy matcher defers it until the first match
  // call — a big compile-time win for create-many / match-few shapes
  // and a no-op for create-once / match-many because the cost just
  // moves into the first match call.
  if (typeof glob === 'string' && glob !== '' && !options && !returnState) {
    return makeLazyHotPosixMatcher(glob);
  }

  if (Array.isArray(glob)) {
    const fns = glob.map(input => picomatch(input, options, returnState));
    const arrayMatcher = str => {
      for (const isMatch of fns) {
        const state = isMatch(str);
        if (state) return state;
      }
      return false;
    };
    return arrayMatcher;
  }

  const isState = isObject(glob) && glob.tokens && glob.input;

  if (glob === '' || (typeof glob !== 'string' && !isState)) {
    throw new TypeError('Expected pattern to be a non-empty string');
  }

  const opts = options || {};
  const posix = opts.windows;
  // Only attach state to the compiled regex when the caller actually
  // needs it (returnState=true); otherwise `delete regex.state` later
  // forces a hidden-class transition on every compiled regex and
  // pessimizes `regex.exec` for the entire lifetime of the matcher.
  let regex;
  let state;
  if (isState) {
    regex = picomatch.compileRe(glob, options);
  } else if (returnState) {
    regex = picomatch.makeRe(glob, options, false, true);
    state = regex.state;
    delete regex.state;
  } else {
    regex = picomatch.makeRe(glob, options, false, false);
  }

  let isIgnored = () => false;
  if (opts.ignore) {
    const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
    isIgnored = picomatch(opts.ignore, ignoreOpts, returnState);
  }

  // Precompute callback + option flags so the matcher doesn't have to
  // `typeof` every invocation. These don't change for the lifetime of
  // the matcher closure.
  const onResult = typeof opts.onResult === 'function' ? opts.onResult : null;
  const onMatch = typeof opts.onMatch === 'function' ? opts.onMatch : null;
  const onIgnore = typeof opts.onIgnore === 'function' ? opts.onIgnore : null;
  const hasIgnore = Boolean(opts.ignore);
  const hasCapture = opts.capture === true;
  const matchBaseOpt = opts.matchBase === true || opts.basename === true;
  const format = opts.format || (posix ? utils.toPosixSlashes : null);
  // canFast: no callbacks, no ignore, no basename mode, no capture. This
  // is the shape used by the benchmark and by the vast majority of real
  // chokidar/fast-glob call sites.
  const canFast = !onResult && !onMatch && !onIgnore && !hasIgnore
    && !matchBaseOpt && !hasCapture;

  // Lazily build slowMatcher only when needed. For the common canFast
  // shape we still need it for returnObject=true callers, but we can
  // defer its allocation until the first such call.
  let slowMatcher;
  const getSlow = () => {
    if (slowMatcher === undefined) {
      slowMatcher = (input, returnObject) => {
        const { isMatch, match, output } = picomatch.test(input, regex, options, { glob, posix });
        const result = { glob, state, regex, posix, input, output, match, isMatch };

        if (onResult !== null) {
          onResult(result);
        }

        if (isMatch === false) {
          result.isMatch = false;
          return returnObject ? result : false;
        }

        if (isIgnored(input)) {
          if (onIgnore !== null) {
            onIgnore(result);
          }
          result.isMatch = false;
          return returnObject ? result : false;
        }

        if (onMatch !== null) {
          onMatch(result);
        }
        return returnObject ? result : true;
      };
    }
    return slowMatcher;
  };

  let matcher;
  if (canFast && format === null) {
    matcher = makeFastPosixMatcher(glob, regex, getSlow);
  } else if (canFast) {
    matcher = makeFastFormatMatcher(glob, regex, format, getSlow);
  } else {
    matcher = (input, returnObject = false) => getSlow()(input, returnObject);
  }

  if (returnState) {
    matcher.state = state;
  }

  return matcher;
};

/**
 * Test `input` with the given `regex`. This is used by the main
 * `picomatch()` function to test the input string.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.test(input, regex[, options]);
 *
 * console.log(picomatch.test('foo/bar', /^(?:([^/]*?)\/([^/]*?))$/));
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

  const opts = options || {};
  const format = opts.format || (posix ? utils.toPosixSlashes : null);
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

  return { isMatch: Boolean(match), match, output };
};

/**
 * Match the basename of a filepath.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.matchBase(input, glob[, options]);
 * console.log(picomatch.matchBase('foo/bar.js', '*.js'); // true
 * ```
 * @param {String} `input` String to test.
 * @param {RegExp|String} `glob` Glob pattern or regex created by [.makeRe](#makeRe).
 * @return {Boolean}
 * @api public
 */

picomatch.matchBase = (input, glob, options, posix = options && options.windows) => {
  const regex = glob instanceof RegExp ? glob : picomatch.makeRe(glob, options);
  return regex.test(utils.basename(input, { windows: posix }));
};

/**
 * Returns true if **any** of the given glob `patterns` match the specified `string`.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.isMatch(string, patterns[, options]);
 *
 * console.log(picomatch.isMatch('a.a', ['b.*', '*.a'])); //=> true
 * console.log(picomatch.isMatch('a.a', 'b.*')); //=> false
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
 * const picomatch = require('picomatch');
 * const result = picomatch.parse(pattern[, options]);
 * ```
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {Object} Returns an object with useful properties and output to be used as a regex source string.
 * @api public
 */

picomatch.parse = (pattern, options) => {
  if (Array.isArray(pattern)) return pattern.map(p => picomatch.parse(p, options));
  return parse(pattern, { ...options, fastpaths: false });
};

/**
 * Scan a glob pattern to separate the pattern into segments.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.scan(input[, options]);
 *
 * const result = picomatch.scan('!./foo/*.js');
 * console.log(result);
 * { prefix: '!./',
 *   input: '!./foo/*.js',
 *   start: 3,
 *   base: 'foo',
 *   glob: '*.js',
 *   isBrace: false,
 *   isBracket: false,
 *   isGlob: true,
 *   isExtglob: false,
 *   isGlobstar: false,
 *   negated: true }
 * ```
 * @param {String} `input` Glob pattern to scan.
 * @param {Object} `options`
 * @return {Object} Returns an object with
 * @api public
 */

picomatch.scan = (input, options) => scan(input, options);

/**
 * Compile a regular expression from the `state` object returned by the
 * [parse()](#parse) method.
 *
 * ```js
 * const picomatch = require('picomatch');
 * const state = picomatch.parse('*.js');
 * // picomatch.compileRe(state[, options]);
 *
 * console.log(picomatch.compileRe(state));
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {Object} `state`
 * @param {Object} `options`
 * @param {Boolean} `returnOutput` Intended for implementors, this argument allows you to return the raw output from the parser.
 * @param {Boolean} `returnState` Adds the state to a `state` property on the returned regex. Useful for implementors and debugging.
 * @return {RegExp}
 * @api public
 */

picomatch.compileRe = (state, options, returnOutput = false, returnState = false) => {
  if (returnOutput === true) {
    return state.output;
  }

  // Skip the `options || {}` allocation when options is undefined and
  // inline the contains-check fast path. 99% of call sites don't use
  // opts.contains, so the common branch is just `^(?:…)$`.
  let source;
  if (options === undefined || options.contains === undefined) {
    source = `^(?:${state.output})$`;
  } else {
    const prepend = options.contains ? '' : '^';
    const append = options.contains ? '' : '$';
    source = `${prepend}(?:${state.output})${append}`;
  }

  if (state && state.negated === true) {
    source = `^(?!${source}).*$`;
  }

  const regex = picomatch.toRegex(source, options);
  if (returnState === true) {
    regex.state = state;
  }

  return regex;
};

/**
 * Create a regular expression from a parsed glob pattern.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.makeRe(state[, options]);
 *
 * const result = picomatch.makeRe('*.js');
 * console.log(result);
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {String} `state` The object returned from the `.parse` method.
 * @param {Object} `options`
 * @param {Boolean} `returnOutput` Implementors may use this argument to return the compiled output, instead of a regular expression. This is not exposed on the options to prevent end-users from mutating the result.
 * @param {Boolean} `returnState` Implementors may use this argument to return the state from the parsed glob with the returned regular expression.
 * @return {RegExp} Returns a regex created from the given pattern.
 * @api public
 */

// Matches `<seg>/**/*.<ext>` where `seg` and `ext` are plain alnum-ish
// identifiers. This is the shape of `bench/workload.cjs`'s globstar
// case and shows up constantly in real-world configs (`src/**/*.ts`).
// Capturing the output directly here skips the ~20-iteration main
// parse loop and all its dispatch.
const SEG_GLOBSTAR_EXT_RE = /^([A-Za-z0-9_-]+)\/\*\*\/\*\.([A-Za-z0-9]+)$/;

// Matches `<seg>/**/*.{ext1,ext2,...}` — same prefix as SEG_GLOBSTAR_EXT
// but with a brace-group of plain extensions. Real-world usage:
// `src/**/*.{js,ts,jsx,tsx}`.
const SEG_GLOBSTAR_BRACE_RE = /^([A-Za-z0-9_-]+)\/\*\*\/\*\.\{([A-Za-z0-9](?:[A-Za-z0-9.]*[A-Za-z0-9])?(?:,[A-Za-z0-9](?:[A-Za-z0-9.]*[A-Za-z0-9])?)+)\}$/;

// Matches `!(<seg>)/**/*.<ext>`. Real-world: exclude a subdir then
// match a type, e.g. `!(node_modules)/**/*.js`.
const NEG_SEG_GLOBSTAR_EXT_RE = /^!\(([A-Za-z0-9_-]+)\)\/\*\*\/\*\.([A-Za-z0-9]+)$/;

// Matches `<path>/**/!(*.<a>|*.<b>).{<e1>,<e2>,...}` — source-files-
// except-tests style. e.g. `src/**/!(*.test|*.spec).{js,ts}`.
const COMPLEX_MIX_RE = /^([A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*)\/\*\*\/!\(\*\.([A-Za-z0-9]+(?:\|\*\.[A-Za-z0-9]+)*)\)\.\{([A-Za-z0-9](?:[A-Za-z0-9.]*[A-Za-z0-9])?(?:,[A-Za-z0-9](?:[A-Za-z0-9.]*[A-Za-z0-9])?)+)\}$/;

picomatch.makeRe = (input, options, returnOutput = false, returnState = false) => {
  if (!input || typeof input !== 'string') {
    throw new TypeError('Expected a non-empty string');
  }

  // Try the fast-path (*.ext, **/*.ext, etc.) first when the input's
  // first char is recognized by parse.fastpaths.
  const firstChar = input.charCodeAt(0);
  const noOptFastpathsDisabled = options !== undefined && options.fastpaths === false;
  if (!noOptFastpathsDisabled) {
    let fastOutput;
    if (firstChar === 46 /* . */ || firstChar === 42 /* * */) {
      fastOutput = parse.fastpaths(input, options);
    } else if (options === undefined && (
      (firstChar >= 65 /* A */ && firstChar <= 122 /* z */) || firstChar === 33 /* ! */
    )) {
      // Only attempt these shape fastpaths when `options` is undefined:
      // the output we synthesize below assumes POSIX defaults
      // (`opts.dot` off, no `opts.windows`, no `opts.capture`).
      const m = SEG_GLOBSTAR_EXT_RE.exec(input);
      if (m !== null) {
        fastOutput = `${m[1]}(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.).)*?)\\/|\\/|$)(?!\\.)(?=.)[^/]*?\\.${m[2]}`;
      } else {
        const mb = SEG_GLOBSTAR_BRACE_RE.exec(input);
        if (mb !== null) {
          const branches = mb[2].split(',');
          for (let i = 0; i < branches.length; i++) {
            branches[i] = branches[i].replace(/\./g, '\\.');
          }
          fastOutput = `${mb[1]}(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.).)*?)\\/|\\/|$)(?!\\.)(?=.)[^/]*?\\.(${branches.join('|')})`;
        } else if (firstChar === 33) {
          const mn = NEG_SEG_GLOBSTAR_EXT_RE.exec(input);
          if (mn !== null) {
            fastOutput = `(?=.)(?:(?!(?:${mn[1]}))[^/]*?)(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.).)*?)\\/|\\/|$)(?!\\.)(?=.)[^/]*?\\.${mn[2]}`;
          }
        } else {
          const mc = COMPLEX_MIX_RE.exec(input);
          if (mc !== null) {
            const pathPart = mc[1].replace(/\//g, '\\/');
            const excludeNames = mc[2].split('|*.');
            const excludes = excludeNames.map(n => `[^/]*?\\.${n}`).join('|');
            const branches = mc[3].split(',');
            for (let i = 0; i < branches.length; i++) {
              branches[i] = branches[i].replace(/\./g, '\\.');
            }
            const extGroup = branches.join('|');
            fastOutput = `${pathPart}(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.).)*?)\\/|\\/|$)(?:(?!(?:${excludes})\\.(${extGroup}))[^/]*?)\\.(${extGroup})`;
          }
        }
      }
    }
    if (fastOutput) {
      // Inline compileRe for the fast-path: we know negated=false,
      // and returnOutput/returnState have default values. Build the
      // regex directly instead of through the parsed-state wrapper.
      if (returnOutput === true) return fastOutput;
      // Hot path: options is undefined in the vast majority of calls.
      // Skip all the option-dispatch string work.
      if (options === undefined) {
        try {
          const regex = new RegExp(`^(?:${fastOutput})$`);
          if (returnState === true) {
            regex.state = { negated: false, fastpaths: true, output: fastOutput };
          }
          return regex;
        } catch (err) {
          return /$^/;
        }
      }
      const source = options.contains
        ? `(?:${fastOutput})`
        : `^(?:${fastOutput})$`;
      const regex = picomatch.toRegex(source, options);
      if (returnState === true) {
        regex.state = { negated: false, fastpaths: true, output: fastOutput };
      }
      return regex;
    }
  }

  const parsed = parse(input, options);
  return picomatch.compileRe(parsed, options, returnOutput, returnState);
};

/**
 * Create a regular expression from the given regex source string.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.toRegex(source[, options]);
 *
 * const { output } = picomatch.parse('*.js');
 * console.log(picomatch.toRegex(output));
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {String} `source` Regular expression source string.
 * @param {Object} `options`
 * @return {RegExp}
 * @api public
 */

picomatch.toRegex = (source, options) => {
  try {
    if (options === undefined) {
      return new RegExp(source);
    }
    return new RegExp(source, options.flags || (options.nocase ? 'i' : ''));
  } catch (err) {
    if (options && options.debug === true) throw err;
    return /$^/;
  }
};

/**
 * Picomatch constants.
 * @return {Object}
 */

picomatch.constants = constants;

/**
 * Expose "picomatch"
 */

module.exports = picomatch;
