'use strict';

console.time('total');
process.on('exit', () => console.timeEnd('total'));

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
  xdigit: 'A-Fa-f0-9'
};

const nonWordRegex = /\W/g;
const lookbehindRegex = /^([!=:]|<[!=])/;
const specialCharRegex = /^["`'^$*+-.?[\]{}()|]$/;
const spaceRegex = /[bnvrts]/;
const endRegex = /\/\]?[*?]?$/;

const isSpecialChar = ch => {
  return ch !== '' && typeof ch === 'string' && specialCharRegex.test(ch);
};

module.exports = (input, options) => {
  if (typeof input !== 'string') {
    throw new TypeError('expected input to be a string');
  }

  let opts = options || {};
  let max = opts.maxLength ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
  let len = input.length;
  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  let orig = input;
  let isWindows = opts.unixify === true || windows() === true;

  const NO_DOT = '(?!\\.)';
  const ONE_CHAR = '(?=.)';
  const QMARK = isWindows ? '[^\\\\/]' : '[^/]';
  const QMARK_NO_DOT = isWindows ? '[^\\\\/.]' : '[^/.]';
  const SLASH_LITERAL = '\\/';
  const SLASH_LITERAL_WINDOWS = '[\\\\/]';

  // const SLASH = isWindows ? SLASH_LITERAL_WINDOWS : SLASH_LITERAL;
  const STAR = opts.capture ? `(${QMARK}*?)` : `${QMARK}*?`;
  const GLOBSTAR_DOT = '(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?';
  const GLOBSTAR_NO_DOT = '(?:(?!(?:\\/|^)\\.).)*?';

  let prefix = opts.contains ? '' : '^';
  let suffix = opts.contains ? '' : '$';
  let wrap = str => `${prefix}(?:${str})${suffix}`;
  let negate = str => `${prefix}(?!^${str}$).*${suffix}`;

  let ast = { type: 'root', nodes: [], stash: [] };
  let prepend = opts.prepend || '';

  let state = {
    ast,
    segs: [{ value: '', depth: 1 }],
    input,
    consumed: '',
    posix: opts.posix === true,
    dot: opts.dot === true,
    wrap
  };

  // if (input === '*' && opts.fast !== false) {
  //   state.consumed = '*';
  //   state.isGlob = true;
  //   state.output = (!opts.dot ? NO_DOT : '') + ONE_CHAR + STAR;
  //   state.source = state.wrap(state.output);
  //   return state;
  // }

  // input = input.replace(/(\*\*\/|\/\*\*|\*\*)+/g, '$1');

  let stack = [ast];
  let extglobs = [];
  let start = 0;
  let i = -1;

  let after,
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
    paren,
    posix,
    prev,
    qmark,
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

  const push = node => {
    stack.push(node);
    block = node;
  };

  const append = (value, node) => {
    if (!block) block = lookbehind();

    block.isGlob = block.isGlob || state.isGlob;
    block.stash.push(value);

    if (node && block.nodes) {
      block.nodes.push(node);
    }
  };

  const extglob = value => {
    if (opts.noextglob === true) {
      block.stash.push(value);
      return;
    }

    state.isGlob = true;
    paren = opts.capture === true ? '(' : '(?:';
    node = { type: 'paren', extglob: true, prefix: value, stash: [], nodes: [] };
    if (node.prefix === '!' && opts.nonegate !== true) node.negated = true;
    node.stash = value === '!' && opts.nonegate !== true ? [`${paren}(?!(?:`] : [paren];

    Reflect.defineProperty(node, 'parent', { value: block });
    block.length = block.stash.length;
    block.nodes.push(node);
    extglobs.push(node);
    push(node);
    advance();
  };

  while (i < input.length - 1) {
    value = advance();

    if (value === '\\') {
      if (opts.preserveBackslashes) {
        append(value);
        continue;
      }

      slashes = value;
      let slash = isWindows ? SLASH_LITERAL_WINDOWS : SLASH_LITERAL;
      let len = 1;

      if (opts.bash === true) {
        next = peek();
        append((eos() || (!isSpecialChar(next) && !spaceRegex.test(next))) ? '\\\\' : '');
      } else {
        if (opts.unixify !== false) {
          while (peek() === '\\' && !isSpecialChar(peek(2))) {
            slashes += advance();
            len++;
          }
        } else {
          slashes += advance();
          len++;
        }

        if (len === 2 && isWindows) {
          append(slashes, { type: 'slash-literal-windows' });
        } else if (len > 2) {
          slashes = (len % 2 === 0 || eos()) ? '\\\\' : ('\\' + advance());
          append(slashes);
        } else if (len === 2) {
          append(slashes);
        } else {
          append((opts.unescapeRegex && len === 1 ? '' : slashes) + (eos() ? '\\' : advance()));
        }
      }

      prev = value;
      next = void 0;
      continue;
    }

    block = lookbehind();

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
        if (!(rest() || '').includes(']')) {
          append('\\[');
          break;
        }

        state.isGlob = true;
        node = { type: 'bracket', stash: [value], nodes: [] };
        if (peek() === ']') node.stash.push(`\\${advance()}`);
        push(node);
        break;
      case ']':
        if (block.type !== 'bracket') {
          if (opts.strictBrackets === true) {
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
        if (!(rest() || '').includes(')')) {
          if (opts.strictBrackets === true) {
            throw new Error('Missing closing: ")" - use "\\)" to match literal parens');
          }
          append('\\(');
          break;
        }

        state.isGlob = true;
        node = { type: 'paren', stash: [value], nodes: [] };
        Reflect.defineProperty(node, 'parent', { value: block });
        block.nodes.push(node);
        push(node);
        break;
      case ')':
        if (lookbehind(1).type !== 'paren') {
          if (opts.strictBrackets === true) {
            throw new Error('Missing opening: "(" - use "\\(" to match literal parens');
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
          boundary = eos() || (rest()[0] === ')' && block.prefix !== '!' && opts.nonegate !== true) ? '$' : '';

          if (block.close === false) {
            append(inner);
            break;
          }
        }

        switch (paren.prefix) {
          case '!':
            star = STAR;

            if (block.globstar !== true) {
              if (paren.stash.includes(SLASH_LITERAL) || !paren.nodes.some(node => node.type === 'star')) {
                star = '.*?';
              }
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

        if (opts.nobrace === true) {
          append('\\' + value);
          break;
        }

        state.isGlob = state.brace = true;
        node = { type: 'brace', stash: [value], nodes: [] };
        block.nodes.push(node);
        push(node);
        break;
      case '}':
        if (block.type === 'bracket') {
          append(value);
          break;
        }

        if (opts.nobrace === true || block.type !== 'brace') {
          append('\\}');
          break;
        }

        brace = stack.pop();
        block = lookbehind(1);

        if (opts.noquantifiers !== true && brace.quantifier === true) {
          append(`{${brace.stash.slice(1).join('')}}`);
          break;
        }

        if (typeof opts.expandBrace === 'function') {
          brace.stash.push('}');
          append(opts.expandBrace(...brace.stash));
          break;
        }

        if (brace.stash.includes('..')) {
          inner = brace.stash.filter(v => v !== '{');
          idx = inner.indexOf('..');
          args = [inner.slice(0, idx).join(''), inner.slice(idx + 1).join('')];

          if (typeof opts.expandRange === 'function') {
            append(opts.expandRange(...args));
            break;
          }

          charClass = `[${args.join('-')}]`;

          try {
            /* eslint-disable no-new */
            new RegExp(charClass);
          } catch (ex) {
            charClass = `[${args.map(v => v.replace(/\\?(\W)/g, '\\$1')).join('-')}]`;
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

        if (opts.noextglob !== true && peek() === '(') {
          extglob(value);
          break;
        }

        if (i === start && opts.nonegate !== true) {
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

        if (prev === ']' && state.posix === true || opts.bash === false) {
          append(value);
          break;
        }

        let consumed = state.consumed;
        prev = consumed[i - 1];
        next = peek();
        state.isGlob = true;

        if (opts.noextglob !== true && next === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }

        stars = value;
        while ((next = peek()) === '*' && peek(2) !== '(') stars += advance();

        last = state.segs[state.segs.length - 1];
        if (opts.noglobstar === true) stars = '*';
        if (i - 1 === start && prev === '!') prev = '';
        after = input.slice(i + 1);

        let isValidGlobstar = stars === '**'
          && (!prev || prev === '/' || (consumed.slice(-2) === '\\\\' && isWindows))
          && (eos() || next === '/' || (input.slice(i + 1, i + 3) === '\\\\' && isWindows));

        if (!isValidGlobstar && stars === '**' && (block.type === 'brace' || block.type === 'paren')) {
          if ((prev === ',' || prev === '{') && (next === '}' || next === ',')) {
            isValidGlobstar = true;
          }

          if ((prev === '(' || prev === '/') && (next === ')' || next === '/')) {
            isValidGlobstar = true;
          }
        }

        if (isValidGlobstar) {
          let nextDot = after[0] === '.' && after[1] !== '.';
          value = (opts.dot || nextDot || state.negated) ? GLOBSTAR_DOT : GLOBSTAR_NO_DOT;

          let advanced = false;
          if (peek() === '/') {
            advanced = true;
            advance();
            value += SLASH_LITERAL;

            while (after.startsWith('**/')) {
              i += 3;
              after = input.slice(i + 1);
            }

            if (!advanced) {
              advance();
            }

            let slash = !advanced ? SLASH_LITERAL : '';
            value = `(?:${value}${slash})?`;
          } else if (block.type === 'paren' || (eos() && opts.relaxSlashes === true && prev === '/')) {
            append('?');
          }

          if (prev === '/' && !opts.dot && !after.startsWith('/.')) {
            append(NO_DOT);
          }

          last.depth = Infinity;
          block.globstar = true;
          state.globstar = true;
          last.globstar = true;
          append(value, { type: 'globstar' });
          break;
        }

        if (opts.bash === true) {
          append('.*?');
          break;
        }

        let PREFIX = !/(^|\/)\.$/.test(consumed)
          ? (opts.dot ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))'
            : (/(^|\/)$/.test(consumed) ? NO_DOT : ''))
          : '';

        let dots = PREFIX && PREFIX !== NO_DOT;
        if (next && next !== '/' && dots) {
          PREFIX = '';
        }

        if (prefix && prefix !== '/' && dots) {
          PREFIX = '';
        }

        append(PREFIX);

        if (PREFIX) {
          append(ONE_CHAR);
        }

        append(STAR, { type: 'star' });

        // Remove this in when LTS is dropped
        if (dots && (next === '/' || eos() === true)) {
          if (parseInt(process.version.slice(1), 10) > 10) {
            append('(?<!(?:^|\\/)\\.{1,2})');
          }
        }

        // if (eos() && opts.relaxSlashes === true) {
        //   // append(SLASH_LITERAL + '?');
        // }

        break;
      case '?':
        if (block.type === 'bracket' && state.posix === true) {
          append(value);
          break;
        }

        if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }

        // support lookbehinds
        if (opts.lookbehinds !== false && prev === '(') {
          let match = lookbehindRegex.exec(rest());
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

        if (opts.qmarkLiteral === true) {
          append('\\?');
          break;
        }

        state.isGlob = true;
        qmark = value;
        while ((next = peek()) === '?') qmark += advance();

        prev = state.consumed.slice(-1);
        if ((i === start || prev === '/') && opts.dot !== true) {
          append(QMARK_NO_DOT);
        } else {
          append(opts.bash ? '.' : QMARK);
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

        if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
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

        if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
          extglob(value);
          break;
        }
        if (block.type !== 'paren' && prev !== ']' && prev !== '}' && prev !== ')') {
          append('\\');
        }
        append('+');
        break;
      case '/':
        append(SLASH_LITERAL, { type: 'slash' });
        if (peek() === '!' && peek(2) === '(') {
          append((!opts.dot ? NO_DOT : '') + ONE_CHAR);
        }
        state.dot = false;
        break;
      case '.':
        if (i === start && peek() === '/') {
          start += 2;
          state.prefix = './';
          advance();
          break;
        }

        if (block.type === 'bracket' && state.posix === true) {
          append(value);
          break;
        }

        if (block.type === 'brace') {
          while ((next = peek()) === '.') value += advance();
          if (value.length > 1) {
            append(value);
            break;
          }
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

          if (opts.keepQuotes !== true) {
            quoted.stash = quoted.stash.slice(1);
          } else {
            quoted.stash.push(value);
          }

          block = lookbehind(1);
          append(quoted.stash.join(''));
        } else {
          block = { type: 'quote', stash: [value], nodes: [] };
          push(block);
        }
        break;
      default: {
        if (block.type === 'bracket') {
          append(value);
          break;
        }

        node = { type: 'text', value: isSpecialChar(value) ? `\\${value}` : value };
        append(node.value, node);
        break;
      }
    }
    prev = value;
  }

  // escape unclosed brackets
  while (stack.length > 1) {
    node = stack.pop();

    let close = { paren: ')', brace: '}', bracket: ']' };
    if (opts.strictBrackets === true && close.hasOwnProperty(node.type)) {
      let c = close[node.type];
      throw new Error(`Missing closing: "${c}" - use "\\\\${c}" to match literal ${node.type}s`);
    }

    block = lookbehind();
    append(node.stash.join('').replace(nonWordRegex, '\\$&'));
  }

  idx = ast.stash.indexOf(SLASH_LITERAL);
  if (idx === -1) idx = ast.stash.length;

  if (state.globstar !== true && !ast.stash.slice(0, idx).includes(ONE_CHAR) && isSpecialChar(orig[0])) {
    ast.stash.unshift(ONE_CHAR);
  }

  // last = ast.nodes[ast.nodes.length - 1];

  // if ((last && last.type === 'star') || (opts.relaxSlashes === true && !endRegex.test(orig))) {
  //   // append(SLASH_LITERAL + '?', { type: 'SLASH_LITERAL'});
  // }

  state.output = prepend + ast.stash.join('');
  state.source = state.wrap(state.output);
  // console.log([state.source])
  return state;
};
