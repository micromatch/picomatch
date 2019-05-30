'use strict';

const isPathSeparator = code => {
  return code === '/'
      || code === '\\';
};

const isBoundary = (code, allowComma = false) => {
  return (code === ',' && allowComma === true) || code === '/' || code === void 0;
};

const isExtglobChar = code => {
  return code === '*' || code === '@' || code === '!' || code === '+' || code === '?';
};

const split = module.exports = (input, options = {}) => {
  let opts = options || {};
  let loc = { start: 0 };
  let ast = { type: 'root', height: 1, loc, stash: [], nodes: [] };
  let prev;
  let value;

  let stack = [ast];
  let block = ast;

  let blocks = {
    braces: 0,
    brackets: 0,
    parens: 0,
    angles: 0,
    quotes: 0
  };

  let state = {
    input,
    length: input.length - 1,
    index: -1,
    lastIndex: 0,
    start: 0,
    removed: '',
    prefix: '',
    base: '',
    glob: '',
    angle: false,
    backslashes: false,
    brace: false,
    brace_range: false,
    brace_set: false,
    bracket: false,
    dirsOnly: false,
    extglob: false,
    globstar: false,
    isGlob: false,
    negated: false,
    quoted: false,
    wildcard: false,
    segments: [block],
    ast
  };

  let eos = () => state.index >= state.length;
  let peek = () => !eos() ? input[state.index + 1] : void 0;
  let advance = () => {
    prev = value;
    return input[++state.index];
  };

  const push = token => {
    if (token.type === 'text' && prev && prev.type === 'text') {
      prev.output = (prev.output || '') + (token.output || '');
      prev.value += token.value;
      return;
    }
    block.nodes.push(token);
    prev = token;
  };

  while (state.index < state.length) {
    value = advance();

    if (value === '\\') {
      let count = 1;

      while (peek() === '\\') {
        value += advance();
        count++;
      }

      if (opts.unescaped === true) {
        continue;
      }

      if (count % 2 === 0) {
        push({ type: 'text', value, output: '\\\\' });
      } else {
        push({ type: 'text', value, output: '\\' + (advance() || '') });
      }
      continue;
    }

    // console.log(state)
  }

  return state;
};

// split('a\\\\\\\\\\\\*/b');
