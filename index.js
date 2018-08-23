'use strict';

const path = require('path');
const windows = () => process.platform === 'windows' || path.sep === '\\';
const unixify = str => str.replace(/\\+/g, '/');
const GLOBSTAR_DOT = '(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?';
const GLOBSTAR_NO_DOT = '(?:(?!(?:\\/|^)\\.).)*?';
const QMARK_NO_DOT = '[^/.]';
const QMARK = '[^/]';
const STAR = `${QMARK}*?`;
const NO_DOT = '(?!\\.)';
const ONE_CHAR = '(?=.)';
const DOT_SLASH = '(^|\\./)';
const MAX_LENGTH = 1024 * 64;
const POSIX = {
  alnum: 'a-zA-Z0-9',
  alpha: 'a-zA-Z',
  ascii: '\\x00-\\x7F',
  blank: ' \\t',
  cntrl: '\\x00-\\x1F\\x7F',
  digit: '0-9',
  graph: '\\x21-\\x7E',
  lower: 'a-z',
  print: '\\x20-\\x7E ',
  punct: '\\-!"#$%&\'()\\*+,./:;<=>?@[\\]^_`{|}~',
  space: ' \\t\\r\\n\\v\\f',
  upper: 'A-Z',
  word: 'A-Za-z0-9_',
  xdigit: 'A-Fa-f0-9'
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

const picomatch = (input, options) => {
  if (Array.isArray(input)) {
    let fns = input.map(pattern => picomatch(pattern, options));
    return (...args) => fns.some(fn => fn(...args));
  }

  let matcher = (glob, options = {}) => {
    if (typeof glob !== 'string') {
      throw new TypeError('expected input to be a string');
    }

    if (glob === '') {
      return str => options.bash ? str === glob : false;
    }

    let regex = picomatch.makeRe(glob, options);
    let isWin = isWindows(options);
    let ignore;

    if (options.ignore) {
      ignore = picomatch(options.ignore, { ...options, ignore: null });
    }

    return (str, unixified) => {
      let val = (unixified !== true && isWin) ? unixify(str) : str;
      return (!ignore || ignore(val, true) === false) && regex.test(val);
    };
  };

  return memoize('matcher', input, options, matcher);
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
  return memoize('isMatch', pattern, options, picomatch)(str, unixified);
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
    return new RegExp(state.output, flags);
  };
  return memoize('makeRe', pattern, options, makeRe);
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

picomatch.parse = (input, options = {}) => {
  let max = (options.maxLength) || MAX_LENGTH;

  if (typeof input !== 'string') {
    throw new TypeError('expected input to be a string');
  }

  if (input.length > max) {
    throw new RangeError(`input string must not be longer than ${max} bytes`);
  }

  let ast = { type: 'root', nodes: [], stash: [] };
  let wrap = str => `^(?:${str})$`;
  let negate = str => `^(?!^(?:${str})$).*$`;
  let orig = input;
  let prepend = options.prepend || '';
  let after, args, block, boundary, brace, bracket, charClass, idx, inner, left, next, node, noglobstar, paren, posix, prev, qmark, quoted, relaxSlash, slashes, star, stars, stash, value;

  let state = { ast, input, posix: options.posix === true, dot: options.dot === true, wrap };
  let stack = [ast];
  let extglobs = [];
  let start = 0;
  let i = -1;

  const lookbehind = (n = 1) => stack[stack.length - n];
  const rest = () => input.slice(i + 1);
  const peek = (n = 1) => input[i + n];
  const advance = () => input[++i];
  const eos = () => i === input.length - 1;

  const append = (value, node, text) => {
    if (!block) block = lookbehind();
    block.stash.push(value);
    if (node && block.nodes) {
      block.nodes.push(node);
      Reflect.defineProperty(node, 'parent', { value: block });
    }
  };

  const extglob = value => {
    if (options.noextglob === true) {
      block.stash.push(value);
      return;
    }
    state.isGlob = true;
    paren = options.capture === true ? '(' : '(?:';
    node = { type: 'paren', extglob: true, prefix: value, stash: [], nodes: [] };
    if (node.prefix === '!') node.negated = true;
    node.stash = value === '!' ? [`${paren}(?!(?:`] : [paren];
    Reflect.defineProperty(node, 'parent', { value: block });
    block.length = block.stash.length;
    block.nodes.push(node);
    extglobs.push(node);
    stack.push(node);
    advance();
  };

  if (typeof options.base === 'string') {
    ast.stash.push(options.base);
    if (options.base.slice(-1) !== '/') {
      ast.stash.push('\\/');
    }
  }

  // optionally pre-scan/tokenize the pattern
  if (options.scan === true) {
    let token = picomatch.scan(input, options);
    let base = token.parts;
    let glob = token.glob;

    state.scanned = token;
    state.isGlob = token.isGlob;
    state.negated = token.negated;
    state.prefix = token.prefix;
    if (state.negated) state.wrap = negate;
    let output = state.scanned.path;

    if (state.prefix === './' && !options.prepend) {
      ast.stash.push(DOT_SLASH);
    }

    let parent = base.join('\\/');
    if (base[base.length - 1] === '') parent += '\\/';

    if (parent && glob) {
      if (!parent.endsWith('/')) parent += '\\/';
      ast.stash.push(parent);
      input = glob;

      if (options.dot !== true && input[0] !== '.') {
        ast.stash.push(NO_DOT);
      }
    }

    if (!glob) {
      // return early, and escape any imbalanced sets
      state.output = state.wrap(output.replace(/[[\](){}]/g, '\\$&'));
      return state;
    }
  }

  while (i < input.length - 1) {
    value = advance();
    next = peek();
    block = lookbehind(1);

    if (value === '\\') {
      if (options.preserveBackslashes) {
        append(value);
        continue;
      }

      slashes = value;
      let len = 1;

      if (options.bash === true) {
        append((eos() || !isSpecialChar(next) && !/[bnvrts]/.test(next)) ? '\\\\' : '');
      } else {
        if (options.unixify !== false) {
          while (peek() === '\\' && !isSpecialChar(peek(2))) {
            slashes += advance();
            len++;
          }
        }

        if (len > 2) {
          slashes = (len % 2 === 0 || eos()) ? '\\\\' : ('\\' + advance());
          append(slashes);
        } else if (len === 2) {
          append(slashes);
        } else {
          append((options.unescape && len === 1 ? '' : slashes) + (eos() ? '\\' : advance()));
        }
      }
      state.prev = value;
      continue;
    }

    if (block.type === 'quote' && value !== '"' && value !== "'" && value !== '`') {
      state.prev = value;
      append(isSpecialChar(value) ? `\\${value}` : value);
      continue;
    }

    if (block.type === 'bracket' && value !== ']' && state.posix !== true) {
      state.prev = value;
      append(value);
      continue;
    }

    switch (value) {
      case ':':
        if (state.posix === true && state.prev === '[' && block.type === 'bracket' && lookbehind(2).type === 'bracket') {
          posix = stack.pop();
          posix.stash = [];

          while ((next = peek()) !== ':' && peek(2) !== ']') {
            posix.stash.push(advance());
          }

          advance();
          advance();
          stash = posix.stash.join('');
          inner = POSIX[stash] || stash;
          block = lookbehind();
          block.stash.push(inner);
          block.posix = true;
          break;
        }

        append(value);
        break;
      case '[':
        if (!/\]/.test(rest())) {
          append('\\[');
          break;
        }

        state.isGlob = true;
        node = { type: 'bracket', stash: [value], nodes: [] };
        if (peek() === ']') node.stash.push(`\\${advance()}`);
        stack.push(node);
        break;
      case ']':
        if (block.type !== 'bracket') {
          if (options.strictErrors === true) {
            throw new Error('Missing closing: "]" - use "\\\\[" to match literal brackets');
          }
          append('\\]');
          break;
        }
        bracket = stack.pop();
        block = lookbehind(1);

        if (bracket.stash[1] === '^' && !bracket.stash.includes('/') && next !== void 0) {
          bracket.stash.push('/');
        }

        stash = bracket.stash.slice(1);

        if (bracket.posix === true) {
          block.posix = true;
          append(`[${stash.join('')}]`);
          break;
        }

        if (block.posix === true && block.type !== 'root') {
          stash.unshift('\\[');
          stash = block.stash.concat(stash);
          inner = stash.join('') + ']';
          stack.pop();
          block = lookbehind();
          append(inner);
          break;
        }

        inner = stash.join('');
        left = inner.replace(/\W/g, '\\$&');
        append(`(?:\\[${left}\\]|[${inner}])`);
        break;
      case '(':
        if (!/\)/.test(rest())) {
          if (options.strictErrors === true) {
            throw new Error('Missing closing: ")" - use "\\\\)" to match literal parentheses');
          }
          append('\\(');
          break;
        }

        state.isGlob = true;
        node = { type: 'paren', stash: [value], nodes: [] };
        block.nodes.push(node);
        stack.push(node);
        break;
      case ')':
        if (lookbehind(1).type !== 'paren') {
          if (options.strictErrors === true) {
            throw new Error('Missing opening: "(" - use "\\\\(" to match literal parentheses');
          }
          append('\\)');
          break;
        }

        paren = stack.pop();
        block = lookbehind(1);

        if (paren.negated && !paren.nodes.length && block.negated && block.length === 1 && next === ')') {
          block.converted = true;
          paren.stash[0] = block.stash[0] = '(?:';
          paren.prefix = block.prefix = '@';
        }

        inner = paren.stash.join('');

        if (paren.prefix) {
          state.isGlob = true;
          boundary = eos() || (/^\)/.test(rest()) && block.prefix !== '!') ? '$' : '';
          extglobs.pop();

          if (block.close === false) {
            append(inner);
            break;
          }
        }

        switch (paren.prefix) {
          case '!':
            star = (options.bash || paren.stash.includes('\\/') || block.nodes.length) ? '.*?' : STAR;
            if (inner.endsWith(STAR)) {
              star = STAR;
            }

            append(`${inner})${boundary})${star})`);
            break;
          case '*':
          case '+':
          case '?':
            append(`${inner})${paren.prefix}`);
            break;
          case '@':
          default: {
            append(`${inner})`);
            break;
          }
        }
        break;
      case '{':
        if (block.type === 'bracket') {
          append(value);
          break;
        }

        state.isGlob = true;
        node = { type: 'brace', stash: [value], nodes: [] };
        block.nodes.push(node);
        stack.push(node);
        break;
      case '}':
        if (block.type === 'bracket') {
          append(value);
          break;
        }

        if (block.type !== 'brace') {
          append('\\}');
          break;
        }

        brace = stack.pop();
        block = lookbehind(1);

        if (brace.quantifier === true) {
          append(`{${brace.stash.slice(1).join('')}}`);
          break;
        }

        if (typeof options.expandBrace === 'function') {
          brace.stash.push('}');
          append(options.expandBrace(...brace.stash));
          break;
        }

        if (brace.stash.includes('..')) {
          inner = brace.stash.filter(v => v !== '{');
          idx = inner.indexOf('..');
          args = [inner.slice(0, idx).join(''), inner.slice(idx + 1).join('')];

          if (typeof options.expandRange === 'function') {
            append(options.expandRange(...args));
            break;
          }

          charClass = `[${args.join('-')}]`;
          try {
            /* eslint-disable no-new */
            new RegExp(charClass);
          } catch (ex) {
            charClass = `[${args.map(v => `\\${v}`).join('-')}]`;
          }

          append(charClass);
          break;
        }

        append(`(${brace.stash.slice(1).join('')})`);
        break;
      case '!':
        if (state.posix === true && block.type === 'bracket' && state.prev === '[') {
          append('^');
          break;
        }

        if (next === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }

        if (i === start) {
          start++;
          state.isGlob = true;
          state.negated = true;
          state.wrap = negate;
          break;
        }

        append(value);
        break;
      case '*':
        if (block.type === 'bracket') {
          append(value);
          break;
        }

        if (state.prev === ']' && state.posix === true) {
          append(value);
          break;
        }

        state.isGlob = true;
        if (next === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }

        prev = state.prev;
        stars = value;

        while ((next = peek()) === '*' && peek(2) !== '(') stars += advance();

        if (prev === '!' && i === 2) prev = '';
        noglobstar = options.noglobstar === true
          || (next && next !== '/' && block.type !== 'paren' && block.type !== 'brace')
          || (prev && prev !== '/' && block.type !== 'paren' && block.type !== 'brace')
          || stars.length > 2;

        if (noglobstar) stars = '*';
        if (options.dot !== true) {
          if (!state.dot && ((i === start && !state.negated) || prev === '/')) {
            idx = Math.max(block.stash.lastIndexOf('\\/'), 0);
            after = block.stash.slice(idx);

            if (!after.includes(NO_DOT)) {
              append(NO_DOT);
            }

            if (stars.length === 1 && !after.includes(ONE_CHAR)) {
              append(ONE_CHAR);
            }
          }
        }

        after = void 0;
        if (stars === '**') {
          state.globstar = true;
          append(options.dot || next === '.' ? GLOBSTAR_DOT : GLOBSTAR_NO_DOT);
          block.nodes.push({ type: 'globstar' });
        } else {
          append(options.bash ? '.*?' : STAR);
        }
        break;
      case '?':
        if (block.type === 'bracket') {
          append(value);
          break;
        }

        if (next === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }

        // support lookbehinds
        if (options.lookbehinds !== false && state.prev === '(') {
          let match = /^([!=:]|<[!=])/.exec(input.slice(i + 1));
          if (match) {
            if (match[1] === '<!' || match[1] === '<=') {
              if (parseInt(process.version.slice(1), 10) < 10) {
                throw new Error('Node.js v10 or higher is required for regex lookbehinds');
              }
            }
            state.isGlob = true;
            append(value);
            break;
          }
        }

        state.isGlob = true;
        qmark = value;
        while ((next = peek()) === '?') qmark += advance();

        if ((i === start || state.prev === '/') && options.dot !== true) {
          append(QMARK_NO_DOT);
        } else {
          append(options.bash ? '.' : QMARK);
        }

        if (qmark.length > 1) {
          append(`{${qmark.length}}`);
        }
        break;
      case '@':
        if (next === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }

        append(value);
        break;
      case '+':
        if (block.type === 'bracket') {
          append(value);
          break;
        }

        if (next === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }
        if (block.type !== 'paren' && state.prev !== ']' && state.prev !== '}' && state.prev !== ')') {
          append('\\');
        }
        append('+');
        break;
      case '/':
        append(`\\${value}`);

        relaxSlash = options.strictSlashes !== true && !eos()
          && (input.slice(i - 2, i) === '**' || rest() === '**')
          && next !== '['
          && next !== '('
          && isSpecialChar(state.prev)
          && (next !== '.' || /\*/.test(rest()));

        if (relaxSlash && block.type === 'root') {
          append('?');
        }

        break;
      case '.':
        if (i === start && next === '/') {
          start += 2;
          state.prefix = './';
          advance();
          if (!options.prepend) {
            append(DOT_SLASH);
          }
          break;
        }

        if (block.type === 'bracket') {
          append(value);
          break;
        }

        if (block.type === 'brace') {
          while ((next = peek()) === '.') value += advance();
          append(value);
          break;
        }

        if ((i === start || state.prev === '/' || state.prev === '}' || state.prev === ')')) {
          state.dot = true;
        }

        append('\\.');
        break;
      case ',':
        node = { type: 'comma', value: block.type === 'brace' ? '|' : value };
        append(node.value, node);
        break;
      case '|':
        append(value);
        break;
      case '"':
      case "'":
      case '`':
        if (block.type === 'bracket') {
          append(value);
          break;
        }

        if (block.type === 'quote' && block.stash[0] === value) {
          quoted = stack.pop();

          if (options.keepQuotes !== true) {
            quoted.stash = quoted.stash.slice(1);
          } else {
            quoted.stash.push(value);
          }

          block = lookbehind(1);
          append(quoted.stash.join(''));
        } else {
          block = { type: 'quote', stash: [value], nodes: [] };
          stack.push(block);
        }
        break;
      default: {
        if (block.type === 'bracket') {
          append(value);
          break;
        }

        node = { type: 'text', value: isSpecialChar(value) ? `\\${value}` : value };
        append(node.value);
        break;
      }
    }
    state.prev = value;
  }

  // escape unclosed brackets
  while (stack.length > 1) {
    node = stack.pop();

    let close = { paren: ')', brace: '}', bracket: ']' };
    if (options.strictErrors === true && close.hasOwnProperty(node.type)) {
      let c = close[node.type];
      throw new Error(`Missing closing: "${c}" - use "\\\\${c}" to match literal ${node.type}s`);
    }

    block = lookbehind();
    append(node.stash.join('').replace(/\W/g, '\\$&'), null, false);
  }

  idx = ast.stash.indexOf('\\/');
  if (idx === -1) {
    idx === ast.stash.length;
  }

  if (!ast.stash.slice(0, idx).includes(ONE_CHAR) && isSpecialChar(orig[0])) {
    ast.stash.unshift(ONE_CHAR);
  }

  if (options.strictSlashes !== true && !/\/[*?]?$/.test(orig)) {
    append('\\/?', null, false);
  }

  state.source = prepend + ast.stash.join('');
  state.output = state.wrap(state.source);
  ast = void 0;
  return state;
};

/**
 * Quickly scans a glob pattern and returns an object with a handful of
 * useful properties, like `isGlob`, `path` (the leading non-glob, if it exists),
 * `glob` (the actual pattern), and `negated` (true if the path starts with `!`).
 *
 * ```js
 * const pm = require('picomatch');
 * console.log(pm.scan('foo/bar/*.js'));
 * { isGlob: true, input: 'foo/bar/*.js', path: 'foo/bar', parts: [ 'foo', 'bar' ], glob: '*.js' }
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {Object} Returns an object with tokens and regex source string.
 * @api public
 */

picomatch.scan = (input, options = {}) => {
  let terminated = false;
  let isWin = isWindows(options);
  let state = { isGlob: false, input, parent: '', parts: [''], glob: '' };
  let string = input;
  let slash = false;
  let stack = [];
  let stash = [''];
  let start = 0;
  let i = -1;

  let append = value => (stash[stash.length - 1] += value);
  let peek = (n = 1) => string[i + n];
  let next = () => string[++i];

  let terminate = value => {
    if (terminated) {
      append(value);
      return;
    }
    let temp = stash.slice();
    terminated = true;
    state.isGlob = true;
    state.glob = stash.pop() + string.slice(i);
    while (stash.length && stash[stash.length - 1].slice(-1) === '.') {
      state.glob = stash.pop() + '/' + state.glob;
    }
    state.parent = stash.join('/');
    state.parts = stash;
    stash = temp;

    if (options.segments !== true) {
      i = string.length;
    } else {
      append(value);
    }
  };

  let closeIndex = (value, start) => {
    let pair = { '[': ']', '(': ')', '{': '}' };
    let idx = string.indexOf(pair[value], start);
    if (idx > -1 && string[idx - 1] === '\\') {
      idx = closeIndex(value, idx + 1);
    }
    return idx;
  };

  for (; i < string.length - 1;) {
    let value = next();
    let char;

    switch (value) {
      case '\\':
        char = next();
        if (isWin && char === value) {
          if (i === start) slash = true;
          stash.push('');
          break;
        }
        append((char === value ? value : '') + char);
        break;
      case '/':
        if (i === start) slash = true;
        if (!stack.length) {
          stash.push('');
          break;
        }
        append(value);
        break;
      case '[':
      case '{':
      case '(':
        stack.push({ value });
        if (closeIndex(value, i + 1) > -1) {
          terminate(value);
          break;
        }
        append(value);
        break;
      case ']':
      case '}':
      case ')':
        stack.pop();
        append(value);
        break
      case '.':
        char = peek();
        if (i === start) {
          if (char === '/') {
            state.prefix = './';
            start += 2;
            next();
            break;
          }
          if (char === void 0) {
            state.parent = string;
            return state;
          }
        }
        append(value);
        break;
      case '?':
      case '*':
      case '+':
        if (value === '*' && peek() === '*') {
          let after;
          if ((stack.length && stack[stack.length - 1] !== '[') || (i === 0 || string[i - 1] === '/') && (!(after = peek(2)) || after === '/')) {
            state.globstar = true;
          }
        }
        terminate(value);
        break;
      case '!':
        if (i === start && options.nonegate !== true && peek() !== '(') {
          start++;
          state.negated = true;
          break;
        }
        append(value);
        break;
      case '@':
        if (peek() === '(') {
          terminate(value);
          break;
        }
        append(value);
        break;
      default: {
        append(value);
        break;
      }
    }
  }

  if (options.segments === true) {
    state.segs = stash.slice();
  }

  if (!state.glob) state.parent = stash.join('/');
  if (state.parent === '' && slash === true) {
    state.parts[state.parts.length - 1] += '/';
    state.parent = '/';
  }

  return state;
};

picomatch.base = (...args) => {
  let result = picomatch.scan(args.pop());
  let base = unixify(path.posix.join(...args, result.path));
  return { base, glob: result.glob };
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

function memoize(method, pattern, options, fn) {
  if (options && options.nocache === true) return fn(pattern, options);
  if (!picomatch.cache) picomatch.clearCache();
  let key = createKey(method, pattern, options);
  let res = picomatch.cache[key];
  if (res === void 0) {
    res = picomatch.cache[key] = fn(pattern, options);
  }
  return res;
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

function isSpecialChar(ch) {
  return ch !== '' && typeof ch === 'string' && /^["`'^$*+-.?[\]{}()|]$/.test(ch);
}

module.exports = picomatch;
