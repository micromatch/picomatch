'use strict';

const path = require('path');
const windows = () => process.platform === 'windows' || path.sep === '\\';

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

module.exports = (input, options = {}) => {
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
        break;
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

function isWindows(options = {}) {
  return options.unixify !== false && (options.unixify === true || windows() === true);
}
