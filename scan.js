'use strict';

module.exports = (input, options = {}) => {
  let state = { isGlob: false, input, path: '', glob: '' };
  let pair = { '[': ']', '(': ')', '{': '}' };
  let string = input;
  let slash = false;
  let stash = [''];
  let i = -1;

  let append = value => (stash[stash.length - 1] += value);
  let peek = (n = 1) => string[i + n];
  let next = () => string[++i];

  let terminate = value => {
    state.isGlob = true;
    state.glob = stash.pop() + string.slice(i);
    while (stash.length && stash[stash.length - 1].slice(-1) === '.') {
      state.glob = stash.pop() + '/' + state.glob;
    }
    state.path = stash.join('/');
    i = string.length;
  };

  let closeIndex = (value, start) => {
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
        append(value + next());
        break;
      case '/':
        if (i === 0) slash = true;
        stash.push('');
        break;
      case '[':
      case '{':
      case '(':
        if (closeIndex(value, i) > -1) {
          terminate();
          break;
        }
        append(value);
        break;
      case '.':
        char = peek();
        if (i === 0) {
          if (char === '/') {
            state.prefix = './';
            next();
            break;
          }
          if (char === void 0) {
            state.path = string;
            return state;
          }
        }
        append(value);
        break;
      case '?':
      case '*':
      case '+':
        terminate();
        break;
      case '!':
        if (i === 0 && options.nonegate !== true) {
          state.negated = true;
          break;
        }
        append(value);
        break;
      case '@':
        if (peek() === '(') {
          terminate();
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

  if (!state.glob) state.path = stash.join('/');
  if (state.path === '' && slash === true) {
    state.path = '/';
  }
  return state;
};
