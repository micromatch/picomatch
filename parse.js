'use strict';

const GLOBSTAR_DOT = '(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?';
const GLOBSTAR_NO_DOT = '(?:(?!(?:\\/|^)\\.).)*?';
const QMARK_NO_DOT = '[^/.]';
const QMARK = '[^/]';
const STAR = `${QMARK}*?`;
const NO_DOT = '(?!\\.)';
const ONE_CHAR = '(?=.)';
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

module.exports = (input, options = {}) => {
  let max = (options.maxLength) || MAX_LENGTH;

  if (typeof input !== 'string') {
    throw new TypeError('expected input to be a string');
  }

  if (input.length > max) {
    throw new RangeError(`input string must not be longer than ${max} bytes`);
  }

  let ast = { type: 'root', isGlob: false, nodes: [], stash: [] };
  let wrap = str => `^(?:${str})$`;
  let negate = str => `^(?!^(?:${str})$).*$`;
  let orig = input;
  let prepend = options.prepend || '';
  let state = {
    ast,
    input,
    glob: { path: '', pattern: '' },
    posix: options.posix === true,
    dot: options.dot === true,
    wrap
  };

  let stack = [ast];
  let extglobs = [];
  let start = 0;
  let i = -1;

  let after, args, block, boundary, brace, bracket, charClass, idx, inner, left, next, node, noglobstar, paren, posix, prev, qmark, quoted, relaxSlash, star, stars, stash, value;

  // let { base = [], glob } = scan(input);

  // if (typeof options.base === 'string') {
  //   base = options.base.split(/[\\/]+/).concat(base);
  // }

  // if (base.length && glob) {
  //   ast.stash = [base.join('\\/') + '\\/'];
  //   input = glob;

  //   if (options.dot !== true && input[0] !== '.') {
  //     ast.stash.push(NO_DOT);
  //   }
  // }

  // if (!glob) {
  //   state.output = state.negated ? negate(input) : wrap(input);
  //   return state;
  // }

  const lookbehind = (n = 1) => stack[stack.length - n];
  const rest = () => input.slice(i + 1);
  const peek = (n = 1) => input[i + n];
  const advance = () => input[++i];
  const eos = () => i === input.length - 1;


  const append = (value, node, text) => {
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
    node.stash = value === '!' ? [`${paren}(?!(?:`] : [paren];
    Reflect.defineProperty(node, 'parent', { value: block });
    block.nodes.push(node);
    extglobs.push(node);
    stack.push(node);
    advance();
  };

  while (i < input.length - 1) {
    value = advance();
    next = peek();
    block = lookbehind(1);

    if (value === '\\') {
      if (options.bash === true) {
        append(!isSpecialChar(next) ? '\\\\' : '');
      } else {
        append((options.unescape ? '' : '\\') + advance());
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
        inner = paren.stash.join('');
        block = lookbehind(1);

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
            star = (options.bash || paren.stash.includes('\\/') || paren.nodes.length) ? '.*?' : STAR;
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
          || (next && next !== '/' && block.type !== 'paren')
          || (prev && prev !== '/' && block.type !== 'paren')
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

  idx = ast.stash.indexOf('\\/');

  if (idx === -1) {
    idx === ast.stash.length;
  }

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

  if (!ast.stash.slice(0, idx).includes(ONE_CHAR) && isSpecialChar(orig[0])) {
    ast.stash.unshift(ONE_CHAR);
  }

  if (options.strictSlashes !== true && !/\/[*?]?$/.test(orig)) {
    append('\\/?', null, false);
  }

  state.source = prepend + ast.stash.join('');
  state.output = state.wrap(state.source);
  ast = void 0;
  console.log(state.output);
  return state;
};

function isSpecialChar(ch) {
  return typeof ch === 'string' && ch !== '' && /^["`'$()*+-.?[\]^{|}]$/.test(ch);
}
