'use strict';

const path = require('path');
const cache = {};

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

const scan = (input, options = {}) => {
  let terminated = false;
  let isWin = isWindows(options);
  let state = { input, base: '', pattern: '', parts: void 0, isGlob: false };
  let string = input;
  let slash = false;
  let stack = [];
  let stash = [''];
  let start = 0;
  let end = input.length - 1;
  let i = -1;

  let append = value => {
    if (value === '/') {
      stash.push('');
    } else if (value) {
      stash[stash.length - 1] += value;
    }
  };

  let terminate = value => {
    if (terminated) {
      append(value);
      return;
    }

    let temp = stash.slice();
    terminated = true;
    state.isGlob = true;
    state.pattern = stash.pop() + value + (eos() ? '' : string.slice(i + 1));

    while (stash.length && stash[stash.length - 1].slice(-1) === '.') {
      state.pattern = stash.pop() + '/' + state.pattern;
    }

    state.base = stash.join('/');
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

  let eos = () => i >= end;
  let peek = (n = 1) => string[i + n];
  let advance = () => string[++i];

  for (; i < string.length - 1;) {
    let value = advance();
    let char;

    switch (value) {
      case '\\':
        char = advance();
        if (isWin && char === value) {
          if (i === start) slash = true;
          append('/');
          break;
        }
        append((char === value ? value : '') + char);
        break;
      case '/':
        if (i === start) slash = true;
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
        break;
      case '.':
        char = peek();
        if (i === start) {
          if (char === '/') {
            state.prefix = './';
            start += 2;
            advance();
            break;
          }
          if (char === void 0) {
            state.base = string;
            return state;
          }
        }
        append(value);
        break;
      case '?':
      case '+':
        terminate(value);
        break;
      case '*':
        while (!eos() && peek() === '*') value += advance();
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

  if (!state.pattern) state.base = stash.join('/');
  if (state.base === '' && slash === true) {
    state.parts[state.parts.length - 1] += '/';
    state.base = '/';
  }

  if (state.parts === void 0) {
    state.parts = stash;
  }

  return state;
};

function precompile(input, options, fn) {
  if (options && options.nocache === true) {
    return fn(input, options);
  }
  let key = createKey(input, options);
  return cache[key] || (cache[key] = fn(input, options));
}

function createKey(input, options) {
  let key = `method="scan";pattern="${input}"`;
  if (!options) return key;
  let val = '';
  for (let k of Object.keys(options)) val += `${k}:${options[k]};`;
  if (val) key += `;options=${val}`;
  return key;
}

function isWindows(options = {}) {
  if (options.unixify === false) return false;
  if (options.unixify === true || process.platform === 'windows' || path.sep === '\\') {
    return true;
  }
  return false;
}

module.exports = (input, options) => precompile(input, options, scan);
