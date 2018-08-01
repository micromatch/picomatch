'use strict';

const GLOBSTAR_DOT = '(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?';
const GLOBSTAR_NO_DOT = '(?:(?!(?:\\/|^)\\.).)*?';
const QMARK_NO_DOT = '[^/.]';
const QMARK = '[^/]';
const STAR = `${QMARK}*?`;
const NO_DOT = '(?!\\.)';
const MAX_LENGTH = 1024 * 64;

module.exports = (input, options = {}) => {
  let max = (options.maxLength) || MAX_LENGTH;

  if (typeof input !== 'string') {
    throw new TypeError('expected input to be a string');
  }

  if (input.length > max) {
    throw new RangeError(`input string must not be longer than ${max} bytes`);
  }

  const ast = { type: 'root', nodes: [], stash: [] };
  let state = { input, ast, dot: options.dot };
  let prefix = options.prefix || '';
  let stack = [ast];
  let extglobs = [];
  let base = '';
  let glob = '';
  let i = -1;

  let wrap = str => `^${str}$`;
  let args, boundary, brace, bracket, charClass, dots, inner, left, match, node, paren, prev, qmark, quoted, star, stars;

  if (input.startsWith('./')) {
    input = input.slice(2);
    state.prefix = './';
  }

  if (input === '**/**' || input === '**/**/**') {
    input = '**';
  }

  if (options.nonegate !== true && input[0] === '!' && (input[1] !== '(' || input[2] === '?')) {
    wrap = str => `^(?!^${str}$).*$`;
    state.negated = true;
    input = input.slice(1);
  }

  const isSpecialChar = ch => /^["`'$()*+-.?\\[\]^{|}]$/.test(ch);
  const last = () => stack[stack.length - 1];
  const peek = (n = 1) => input[i + n];
  const rest = () => input.slice(i + 1);
  const next = () => input[++i];

  const extglob = value => {
    let block = last();
    state.wildcard = true;
    paren = options.capture === true ? '(' : '(?:';
    node = { type: 'paren', extglob: true, prefix: value, stash: [], nodes: [] };
    node.stash = value === '!' ? [`${paren}(?!(?:`] : [paren];
    if (block.type === 'paren') {
      Reflect.defineProperty(node, 'parent', { value: block });
      block.nodes.push(node);
    }
    extglobs.push(node);
    stack.push(node);
    next();
  };

  while (i < input.length - 1) {
    let value = next();
    let block = last();
    let p = peek();

    if (value === '\\') {
      if (options.bash === true) {
        block.stash.push(!isSpecialChar(p) ? '\\\\' : '');
      } else {
        block.stash.push('\\' + next());
      }
      state.prev = value;
      continue;
    }

    if (block.type === 'quote' && value !== '"' && value !== "'" && value !== '`') {
      state.prev = value;
      block.stash.push(isSpecialChar(value) ? `\\${value}` : value);
      continue;
    }

    if (block.type === 'bracket' && value !== ']') {
      state.prev = value;
      block.stash.push(value);
      continue;
    }

    switch (value) {
      case '[':
        state.wildcard = true;
        node = { type: 'bracket', stash: [value], nodes: [] };
        if (peek() === ']') node.stash.push(`\\${next()}`);
        stack.push(node);
        break;
      case ']':
        if (block.type !== 'bracket') {
          block.stash.push('\\]');
          break;
        }

        bracket = stack.pop();
        block = last();
        if (bracket.stash[1] === '^' && !bracket.stash.includes('/') && p !== void 0) {
          bracket.stash.push('/');
        }

        inner = bracket.stash.slice(1).join('');
        left = inner.replace(/\W/g, '\\$&');
        block.stash.push(`(?:\\[${left}\\]|[${inner}])`);
        break;

      case '(':
        if (!/\)/.test(rest())) {
          block.stash.push('\\(');
          break;
        }

        node = { type: 'paren', stash: [value], nodes: [] };
        stack.push(node);

        if (block.type === 'paren') {
          block.nodes.push(node);
        }
        break;
      case ')':
        paren = stack.pop();
        inner = paren.stash.join('');
        block = last();

        if (paren.prefix) {
          state.wildcard = true;
          boundary = /([)}]|^$)/.test(rest()) ? '$' : '';
          extglobs.pop();
        }

        switch (paren.prefix) {
          case '!':
            star = (options.bash || paren.stash.includes('\\/')) ? '.*?' : STAR;
            block.stash.push(`${inner})${boundary})${star})`);
            break;
          case '*':
          case '+':
          case '?':
            block.stash.push(`${inner})${paren.prefix}`);
            break;
          case '@':
          default: {
            block.stash.push(`${inner})`);
            break;
          }
        }
        break;
      case '{':
        state.wildcard = true;
        stack.push({ type: 'brace', stash: [value], nodes: [] });
        break;
      case '}':
        if (block.type !== 'brace') {
          block.stash.push('\\}');
          break;
        }

        brace = stack.pop();
        block = last();

        if (typeof options.braces === 'function') {
          brace.stash.push('}');
          block.stash.push(options.braces(...brace.stash));
          break;
        }

        if (brace.stash.includes('..')) {
          inner = brace.stash.filter(v => v !== '{');
          dots = inner.indexOf('..');
          args = [inner.slice(0, dots).join(''), inner.slice(dots + 1).join('')];

          if (typeof options.toRange === 'function') {
            block.stash.push(options.toRange(...args));
            break;
          }

          charClass = `[${args.join('-')}]`;
          try {
            /* eslint-disable no-new */
            new RegExp(charClass);
          } catch (ex) {
            charClass = `[${args.map(v => `\\${v}`).join('-')}]`;
          }

          block.stash.push(charClass);
          break;
        }

        block.stash.push('(' + brace.stash.slice(1).join('') + ')');
        break;
      case '!':
        if (p === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }

        if (i === 0) {
          state.negated = true;
          break;
        }

        block.stash.push(value);
        break;
      case '*':
        if (p === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }

        prev = state.prev;
        stars = value;

        while ((p = peek()) === '*') stars += next();
        if (stars.length > 2 || options.noextglob === true) stars = '*';
        if (p && p !== '/' && p !== ')' || (prev && prev !== '/')) stars = '*';
        if (options.dot !== true) {
          if (!state.dot && ((i === 0 && !state.negated) || prev === '/')) {
            if (stars.length === 1) {
              block.stash.push('(?=.)');
              block.stash.push('(?!^\\/)');
            }

            block.stash.push(NO_DOT);
          }
        }

        state.wildcard = true;
        if (stars === '**') {
          state.globstar = true;
          block.stash.push(options.dot || p === '.' ? GLOBSTAR_DOT : GLOBSTAR_NO_DOT);
          block.nodes.push({ type: 'globstar' });
        } else {
          block.stash.push(options.bash ? '.*?' : STAR);
        }
        break;
      case '?':
        if (p === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }

        if (state.prev === '(') {
          match = /^([!=:]|<[!=])/.exec(input.slice(i + 1));
          if (match) {
            if (match[1] === '<!' || match[1] === '<=') {
              let v = process.version;
              if (parseInt(v.slice(1), 10) < 10) {
                throw new Error('Node.js v10 or higher is required for regex lookbehinds');
              }
            }
            block.stash.push(value);
            break;
          }
        }

        qmark = value;
        while ((p = peek()) === '?') qmark += next();

        if ((i === 0 || state.prev === '/') && options.dot !== true) {
          block.stash.push(QMARK_NO_DOT);
        } else {
          block.stash.push(options.bash ? '.' : QMARK);
        }

        if (qmark.length > 1) {
          block.stash.push(`{${qmark.length}}`);
        }
        break;
      case '@':
        if (p === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }

        block.stash.push(value);
        break;
      case '+':
        if (p === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }
        if (block.type !== 'paren' && state.prev !== ']' && state.prev !== ')') {
          block.stash.push('\\');
        }
        block.stash.push('+');
        break;
      case '/':
        block.stash.push(`\\${value}`);
        if (i !== input.length - 1 && (input.slice(i - 2, i) === '**' || rest() === '**') && p !== '[' && p !== '(' && isSpecialChar(state.prev)) {
          block.stash.push('?');
        }

        break;
      case '.':
        if (block.type === 'brace') {
          while ((p = peek()) === '.') value += next();
          block.stash.push(value);
          break;
        }

        if ((i === 0 || state.prev === '/' || state.prev === '}' || state.prev === ')')) {
          state.dot = true;
        }
        block.stash.push('\\.');
        break;
      case ',':
        block.stash.push(block.type === 'brace' ? '|' : ',');
        break;
      case '|':
        if (block.type !== 'brace' && block.type !== 'paren') {
          block.stash.push('\\');
        }
        block.stash.push('|');
        break;
      case '"':
      case "'":
      case '`':
        if (block.type === 'quote' && block.stash[0] === value) {
          quoted = stack.pop();
          if (options.keepQuotes !== true) {
            quoted.stash = quoted.stash.slice(1);
          } else {
            quoted.stash.push(value);
          }
          block = last();
          block.stash.push(quoted.stash.join(''));
        } else {
          block = { type: 'quote', stash: [value], nodes: [] };
          stack.push(block);
        }
        break;
      default: {
        block.stash.push(isSpecialChar(value) ? `\\${value}` : value);
        break;
      }
    }
    state.prev = value;
  }

  let output = ast.stash.join('');
  if (!output.startsWith('(?=.)') && isSpecialChar(input[0])) {
    output = '(?=.)' + output;
  }

  if (options.strict !== true && input.slice(-1) !== '/' && !input.endsWith('/*')) {
    output += '\\/?';
  }

  state.output = wrap(prefix + output);
  return state;
};
