'use strict';

const path = require('path');
const windows = () => process.platform === 'windows' || path.sep === '\\';
const MAX_LENGTH = 65536;
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
  xdigit: 'A-Fa-f0-9',
  ansi: '[\\u001b\\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]' // custom
};

module.exports = (input, options = {}) => {
  if (typeof input !== 'string') {
    throw new TypeError('expected input to be a string');
  }

  let max = options.maxLength || MAX_LENGTH;
  if (input.length > max) {
    throw new RangeError(`input string must not be longer than ${max} bytes`);
  }

  let isWindows = options.unixify !== false && (options.unixify === true || windows() === true);
  let slash = isWindows ? '[\\\\/]' : '\\/';
  let GLOBSTAR_DOT = `(?:(?!(?:${slash}|^)(?:\\.{1,2})($|${slash})).)*?`;
  let GLOBSTAR_NO_DOT = `(?:(?!(?:${slash}|^)\\.).)*?`;
  let QMARK_NO_DOT = '[^\\\\/.]';
  let QMARK = '[^\\\\/]';
  let STAR = `${QMARK}*?`;
  let NO_DOT = '(?!\\.)';
  let ONE_DOT = `(?!\\.{1,2}(?:${slash}|$))`;
  let ONE_CHAR = '(?=.)';
  let DOT_SLASH = '(?:^|\\./)';

  let prefix = options.contains ? '' : '^';
  let suffix = options.contains ? '' : '$';
  let wrap = str => prefix + `(?:${str})` + suffix;
  let negate = str => prefix + `(?!^(?:${str})$).*` + suffix;

  let ast = { type: 'root', nodes: [], stash: [] };
  let orig = input;
  let prepend = options.prepend || '';
  let len = input.length;

  let state = {
    ast,
    segs: [{ value: '', depth: 1 }],
    input,
    consumed: '',
    posix: options.posix === true,
    dot: options.dot === true,
    wrap
  };

  let stack = [ast];
  let extglobs = [];
  let start = 0;
  let i = -1;

  let _isParen,
    after,
    args,
    block,
    boundary,
    brace,
    bracket,
    charClass,
    first,
    idx,
    inner,
    last,
    left,
    next,
    node,
    noglobstar,
    paren,
    posix,
    prev,
    qmark,
    queue,
    quoted,
    slashes,
    star,
    stars,
    stash,
    value;

  const lastItem = (arr, n = 1) => arr[arr.length - n];
  const lookbehind = (n = 1) => lastItem(stack, n);
  const eos = () => i === len - 1;
  const rest = () => !eos() ? input.slice(i + 1) : void 0;
  const peek = (n = 1) => !eos() ? input[i + n] : void 0;
  const advance = () => {
    state.consumed += (input[i] || '');
    return input[++i];
  };

  const isPunct = val => {
    return val === '(' || val === ')' || val === '{' || val === '}' || val === '|' || val === ',' || val === '/';
  };

  const isParen = () => {
    if (block.type === 'paren' || block.type === 'brace') {
      return isPunct(prev) && isPunct(next);
    }
    return false;
  };

  const append = (value, node, addsegment = true) => {
    block.stash.push(value);

    if (options.segments && stack[stack.length - 1].type === 'root' && addsegment !== false) {
      if (node && node.type === 'slash') {
        state.segs.push({ value: '', depth: 1 });
      } else {
        let last = state.segs[state.segs.length - 1];
        if (!(value === '?' && last.value === '')) {
          last.value += value;
        }
      }
    }

    if (node && block.nodes) {
      block.nodes.push(node);
    }
  };

  const extglob = value => {
    if (options.noextglob === true) {
      block.stash.push(value);
      return;
    }

    if (value === '!' && state.globstar === true) {
      append(NO_DOT);
      append(ONE_CHAR);
    }

    state.isGlob = true;
    paren = options.capture === true ? '(' : '(?:';
    node = { type: 'paren', extglob: true, prefix: value, stash: [], nodes: [] };
    if (node.prefix === '!' && options.nonegate !== true) node.negated = true;
    node.stash = value === '!' && options.nonegate !== true ? [`${paren}(?!(?:`] : [paren];
    Reflect.defineProperty(node, 'parent', { value: block });
    block.length = block.stash.length;
    block.nodes.push(node);
    extglobs.push(node);
    stack.push(node);
    advance();
  };

  // if (typeof options.base === 'string') {
  //   ast.stash.push(options.base);
  //   if (options.base.slice(-1) !== '/' || (isWindows && options.base.slice(-2) === '\\\\')) {
  //     ast.stash.push(slash);
  //   }
  // }

  while (i < input.length - 1) {
    value = advance();
    block = lookbehind();

    if (value === '\\') {
      if (options.preserveBackslashes) {
        append(value);
        continue;
      }

      slashes = value;
      let len = 1;

      if (options.bash === true) {
        next = peek();
        append((eos() || !isSpecialChar(next) && !/[bnvrts]/.test(next)) ? '\\\\' : '');
      } else {
        if (options.unixify !== false) {
          while ((next = peek()) === '\\' && !isSpecialChar(peek(2))) {
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
          append((options.unescapeRegex && len === 1 ? '' : slashes) + (eos() ? '\\' : advance()));
        }
      }
      prev = value;
      continue;
    }

    if (block.type === 'quote' && value !== '"' && value !== "'" && value !== '`') {
      prev = value;
      append(isSpecialChar(value) ? `\\${value}` : value);
      continue;
    }

    if (block.type === 'bracket' && value !== ']' && state.posix !== true) {
      prev = value;
      append(value);
      continue;
    }

    switch (value) {
      case ':':
        if (state.posix === true && prev === '[' && block.type === 'bracket' && lookbehind(2).type === 'bracket') {
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

        first = block.stash[1];
        if (first === '!' && state.posix === true) {
          first = block.stash[1] = '^';
        }

        if (block.stash.length === 1 || (block.stash.length === 2 && first === '^')) {
          append('\\]');
          break;
        }

        bracket = stack.pop();
        block = lookbehind(1);
        next = peek();

        if (first === '^' && !bracket.stash.includes('/') && next !== void 0) {
          bracket.stash.push(isWindows ? '\\\\/' : '/');
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
        next = peek();

        if (paren.negated && !paren.nodes.length && block.negated && block.length === 1 && next === ')') {
          block.converted = true;
          paren.stash[0] = block.stash[0] = '(?:';
          paren.prefix = block.prefix = '@';
        }

        inner = paren.stash.join('');

        if (paren.prefix) {
          state.isGlob = true;
          boundary = eos() || (/^\)/.test(rest()) && block.prefix !== '!' && options.nonegate !== true) ? '$' : '';
          extglobs.pop();

          if (block.close === false) {
            append(inner);
            break;
          }
        }

        switch (paren.prefix) {
          case '!':
            star = (options.bash || paren.stash.includes(slash) || block.nodes.length) ? '.*?' : STAR;
            if (inner.endsWith(STAR) && !paren.stash.includes(slash)) {
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
        if (block.type === 'bracket' || options.nobrace === true) {
          append(value);
          break;
        }

        state.isGlob = state.brace = true;
        node = { type: 'brace', stash: [value], nodes: [] };
        block.nodes.push(node);
        stack.push(node);
        break;
      case '}':
        if (block.type === 'bracket' || options.nobrace === true) {
          append(value);
          break;
        }

        if (block.type !== 'brace') {
          append('\\}');
          break;
        }

        brace = stack.pop();
        block = lookbehind(1);

        if (options.noquantifiers !== true && brace.quantifier === true) {
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
        if (block.type === 'bracket' && state.posix === true && prev === '[') {
          append('^');
          break;
        }

        if (options.noextglob !== true && peek() === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }

        if (i === start && options.nonegate !== true) {
          start++;
          state.isGlob = true;
          state.negated = true;
          state.wrap = negate;
          state.segs[state.segs.length - 1].negated = true;
          break;
        }

        append(value);
        break;
      case '*':
        if (block.type === 'bracket' && state.posix === true) {
          append(value);
          break;
        }

        if (prev === ']' && state.posix === true || options.bash === false) {
          append(value);
          break;
        }

        state.isGlob = true;
        next = peek();

        if (options.noextglob !== true && next === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }

        stars = value;
        while ((next = peek()) === '*' && peek(2) !== '(') stars += advance();

        if (prev === '!' && i === 2) prev = '';
        noglobstar = options.noglobstar === true
          || stars.length > 2
          || (!(_isParen = isParen()) && next && next !== '/')
          || (!_isParen && prev && prev !== '/');

        if (noglobstar) stars = '*';
        if (stars === '**' && block.type === 'root' && (next === '/' || !next)) {
          if (prev === '/') {
            block.stash.pop();
            append(`(?:|${slash}`);
            queue = ')';
          } else {
            append('(?:');
            if (next === '/') {
              if (!options.dot && /^[*?]/.test(input[i + 2])) {
                append('(?!\\.)');
                queue = `|${slash}(?!\\.)|(?!\\.))`;
              } else {
                queue = `${slash}|)`;
              }
            } else {
              append(`|${slash}|`);
              queue = ')';
            }
            advance();
          }
        }

        if (options.dot !== true) {
          if (!state.dot && (i === start || prev === '/')) {
            idx = Math.max(block.stash.lastIndexOf(slash), 0);
            after = block.stash.slice(idx);

            if (!after.includes(NO_DOT)) {
              append(NO_DOT);
            }

            if (stars.length === 1 && !after.includes(ONE_CHAR)) {
              append(ONE_CHAR);
            }
          }
        } else if ((!prev || prev === '/') && prev !== '.') {
          append(ONE_DOT);
          if (stars.length === 1) {
            append(ONE_CHAR);
          }
        }

        after = void 0;
        last = state.segs[state.segs.length - 1];

        if (stars === '**') {
          // globstars
          state.globstar = true;
          append(options.dot || next === '.' || state.negated ? GLOBSTAR_DOT : GLOBSTAR_NO_DOT, { type: 'globstar' });
          last.globstar = true;
          last.depth = Infinity;
          if (queue) append(queue);
        } else {
          // single stars
          append(options.bash ? '.*?' : STAR, { type: 'star' });
          last.depth = options.bash ? Infinity : 1;
          last.star = true;
        }

        break;
      case '?':
        if (block.type === 'bracket' && state.posix === true) {
          append(value);
          break;
        }

        if (options.noextglob !== true && peek() === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }

        // support lookbehinds
        if (options.lookbehinds !== false && prev === '(') {
          let match = /^([!=:]|<[!=])/.exec(rest());
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

        if ((i === start || prev === '/') && options.dot !== true) {
          append(QMARK_NO_DOT);
        } else {
          append(options.bash ? '.' : QMARK);
        }

        if (qmark.length > 1) {
          append(`{${qmark.length}}`);
        }
        break;
      case '@':
        if (block.type === 'bracket' && state.posix === true) {
          append(value);
          break;
        }

        if (options.noextglob !== true && peek() === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }

        append(value);
        break;
      case '+':
        if (block.type === 'bracket' && state.posix === true) {
          append(value);
          break;
        }

        if (options.noextglob !== true && peek() === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }
        if (block.type !== 'paren' && prev !== ']' && prev !== '}' && prev !== ')') {
          append('\\');
        }
        append('+');
        break;
      case '/':
        append(slash, { type: 'slash' });
        break;
      case '.':
        if (i === start && peek() === '/') {
          start += 2;
          state.prefix = './';
          advance();
          if (!options.prepend) {
            append(DOT_SLASH);
          }
          break;
        }

        if (block.type === 'bracket' && state.posix === true) {
          append(value);
          break;
        }

        if (block.type === 'brace') {
          while ((next = peek()) === '.') value += advance();
          append(value);
          break;
        }

        if ((i === start || prev === '/' || prev === '}' || prev === ')')) {
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
        if (block.type === 'bracket' && state.posix === true) {
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
    prev = value;
  }

  state.consumed += input[i] || '';

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

  idx = ast.stash.indexOf(slash);
  if (idx === -1) idx = ast.stash.length;

  if (!ast.stash.slice(0, idx).includes(ONE_CHAR) && isSpecialChar(orig[0])) {
    ast.stash.unshift(ONE_CHAR);
  }

  if (options.strictSlashes !== true && !/\/\]?[*?]?$/.test(orig)) {
    append(slash + '?', null, false);
  }

  state.output = prepend + ast.stash.join('');
  state.source = state.wrap(state.output);
  ast = void 0;
  return state;
};

function isSpecialChar(ch) {
  return ch !== '' && typeof ch === 'string' && /^["`'^$*+-.?[\]{}()|]$/.test(ch);
}
