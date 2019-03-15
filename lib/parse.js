'use strict';

const utils = require('./utils');
const MAX_LENGTH = 1024 * 64;

/**
 * Constants
 */

const START_ANCHOR = '(?:^|\\/)';
const END_ANCHOR = '(?:\\/|$)';
const DOT_LITERAL = '\\.';
const DOTS_SLASH = '\\.{1,2}' + END_ANCHOR;
const NO_DOT = '(?!\\.)';
const NO_DOT_SLASH = `(?!\\.{0,2}${END_ANCHOR})`;
const NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
const ONE_CHAR = '(?=.)';
const PLUS_LITERAL = '\\+';
const QMARK = '[^/]';
const QMARK_LITERAL = '\\?';
const QMARK_NO_DOT = '[^/.]';
const QMARK_WINDOWS = '[^\\\\/]';
const QMARK_WINDOWS_NO_DOT = '[^\\\\/.]';
const SLASH_LITERAL = '\\/';
const SLASH_LITERAL_WINDOWS = '[\\\\/]';
const STAR = `${QMARK}*?`;
const STAR_WINDOWS = `${QMARK_WINDOWS}*?`;
const STAR_NO_DOT = `${QMARK_NO_DOT}*?`;
const STAR_WINDOWS_NO_DOT = `${QMARK_WINDOWS_NO_DOT}*?`;

/**
 * Extglobs
 */

const EXTGLOB_CHARS = {
  '!': { type: 'negate', open: '((?!(', close: '))[^/]*?)' },
  '?': { type: 'qmark', open: '(?:', close: ')?' },
  '+': { type: 'plus', open: '(?:', close: ')+' },
  '*': { type: 'star', open: '(?:', close: ')*' },
  '@': { type: 'at', open: '(?:', close: ')' }
};

/**
 * POSIX Bracket Regex
 */

const POSIX_REGEX = {
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

const REPLACEMENTS = {
  '***': '*',
  '**/**': '**',
  '**/**/**': '**'
};

/**
 * Helpers
 */

const globstar = dot => {
  return `(?:(?!${START_ANCHOR}${dot ? DOTS_SLASH : DOT_LITERAL}).)*?`;
};

const syntaxError = (place, char) => {
  return `Missing ${place}: "${char}" - use "\\\\${char}" to match literal characters`;
};

const expandRange = (args, options) => {
  if (typeof options.expandRange === 'function') {
    return options.expandRange(...args, options);
  }

  args.sort();
  let value = `[${args.join('-')}]`;

  try {
    /* eslint-disable no-new */
    new RegExp(value);
  } catch (ex) {
    return args.map(v => v.replace(/\\?(\W)/g, '\\$1')).join('..');
  }

  return value;
};

/**
 * Fast paths for creating regular expressions for common glob patterns.
 * This can significantly speed up processing and has very little downside
 * impact when none of the fast paths match.
 */

const fastpaths = (input, options) => {
  let opts = options || { dot: false };
  let max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
  let len = input.length;
  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  input = REPLACEMENTS[input] || input;
  let win32 = utils.isWindows(options);
  let star = win32 ? STAR_WINDOWS : STAR;
  let slashDot = opts.dot ? (opts.dots ? NO_DOTS : NO_DOT_SLASH) : NO_DOT;
  let nodot = opts.dot ? NO_DOTS : NO_DOT;

  switch (input) {
    case '*':
      return `${nodot}${ONE_CHAR}${star}`;

    case '.*':
      return `\\.${ONE_CHAR}${star}`;

    case '*.*':
      return `${nodot}${star}\\.${ONE_CHAR}${star}`;

    case '*/*':
      return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;

    case '**':
      return nodot + globstar(opts.dot);

    case '**/*.*':
      return `(?:${nodot}${globstar(opts.dot)}\\/)?${nodot}${star}\\.${ONE_CHAR}${star}`;

    case '**/.*':
      return `(?:${nodot}${globstar(opts.dot)}\\/)?\\.${ONE_CHAR}${star}`;

    default: {
      let match = /^(.*?)(?:\.(\w+))$/.exec(input);
      if (!match) return;

      let source = fastpaths(match[1], options);
      if (!source) return;

      return source + DOT_LITERAL + match[2];
    }
  }
};

const parse = (input, options) => {
  input = REPLACEMENTS[input] || input;

  let opts = options || { dot: false };
  let max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
  let len = input.length;
  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  let bos = { type: 'bos', value: '', output: opts.prepend || '' };
  let tokens = [bos];

  let win32 = utils.isWindows(options);
  let capture = opts.capture ? '' : '?:';
  let nodot = opts.dot ? (opts.dots ? NO_DOTS : NO_DOT_SLASH) : NO_DOT;

  let state = {
    index: -1,
    input: Buffer.from(input),
    consumed: '',
    output: '',
    backtrack: false,
    brackets: 0,
    braces: 0,
    parens: 0,
    quotes: 0,
    tokens
  };

  let extglobs = [];
  let stack = [];
  let block = state;
  let prev = bos;
  let start = 0;
  let value;

  /**
   * Tokenizing helpers
   */

  const eos = () => state.index === len - 1;
  const peek = (n = 1) => input[state.index + n];
  const advance = () => input[++state.index];
  const append = token => {
    state.output += token.output != null ? token.output : token.value;
    state.consumed += token.value || '';
  };

  const increment = type => {
    state[type]++;
    stack.push(type);
  };

  const decrement = type => {
    state[type]--;
    stack.pop();
  };

  /**
   * Push tokens onto the tokens array. This helper speeds up
   * tokenizing by 1) helping us avoid backtracking as much as possible,
   * and 2) helping us avoid creating extra tokens when consecutive
   * characters are plain text. This improves performance and simplifies
   * lookbehinds.
   */

  const push = tok => {
    if (prev.type === 'globstar') {
      let isBrace = state.braces > 0 && (tok.type === 'comma' || tok.type === 'brace');
      let isExtglob = extglobs.length && (tok.type === 'pipe' || tok.type === 'paren');
      if (tok.type !== 'slash' && tok.type !== 'paren' && !isBrace && !isExtglob) {
        state.backtrack = true;
        tokens[tokens.length - 1] = {
          type: 'star',
          value: '*',
          output: win32 ? STAR_WINDOWS : STAR
        };
      }
    }

    if (state.parens && extglobs.length && tok.type !== 'paren' && !EXTGLOB_CHARS[tok.value]) {
      let extglob = extglobs[extglobs.length - 1];
      extglob.inner += tok.value;
    }

    if (tok.value || tok.output) append(tok);
    if (prev && prev.type === 'text' && tok.type === 'text') {
      prev.value += tok.value;
      return;
    }

    Reflect.defineProperty(tok, 'prev', { value: prev });
    tokens.push(tok);
    prev = tok;
  };

  const extglobOpen = (type, value) => {
    let token = { ...EXTGLOB_CHARS[value], inner: '' };
    token.parens = state.parens;
    token.output = state.output;
    let output = token.open;

    push({ type, value, output: state.output ? '' : ONE_CHAR });
    push({ type: 'paren', extglob: true, value: advance(), output });
    increment('parens');
    extglobs.push(token);
  };

  const extglobClose = token => {
    let output = token.close;

    if (token.type === 'negate') {
      let star = STAR;

      if (token.inner && token.inner.includes('/')) {
        star = globstar(opts.dot);
      }

      if (star !== STAR || eos() || /^\)+$/.test(input.slice(state.index + 1))) {
        output = token.close = ')$))' + star;
      }
    }

    push({ type: 'paren', extglob: true, value, output });
    decrement('parens');
  };

  /**
   * Tokenize input until we reach end-of-string
   */

  while (!eos()) {
    value = advance();

    if (value === '\u0000') {
      continue;
    }

    /**
     * Escaped characters
     */

    if (value === '\\') {
      let next = peek();
      if (next === '/' && opts.bash !== true) {
        continue;
      }

      if (next === '.' || next === ';') {
        continue;
      }

      if (!next) {
        value += '\\';
        push({ type: 'text', value });
        continue;
      }

      // collapse slashes to reduce potential for exploits
      let match = /^\\+/.exec(input.slice(state.index + 1));
      let slashes = 0;
      if (match && match[0].length > 2) {
        slashes = match[0].length;
        state.index += slashes;
        if (slashes % 2 !== 0) {
          value += '\\';
        }
      }

      if (opts.unescape === true) {
        value = advance() || '';
      } else if (win32 && !utils.isRegexChar(peek())) {
        value += '\\';
      } else {
        value += advance() || '';
      }

      if (!state.brackets) {
        push({ type: 'text', value });
        continue;
      }
    }

    /**
     * If we're inside a regex character class, continue
     * until we reach the closing bracket.
     */

    if (state.brackets > 0 && value !== ']') {
      if (opts.posix !== false && value === ':') {
        let inner = prev.value.slice(1);
        if (inner.includes('[')) {
          prev.posix = true;

          if (inner.includes(':')) {
            let idx = prev.value.lastIndexOf('[');
            let pre = prev.value.slice(0, idx);
            let rest = prev.value.slice(idx + 2);
            let posix = POSIX_REGEX[rest];
            if (posix) {
              prev.value = pre + posix;
              state.backtrack = true;
              advance();

              if (!bos.output && tokens.indexOf(prev) === 1) {
                bos.output = ONE_CHAR;
              }
              continue;
            }
          }
        }
      }

      if (value === '[' && peek() !== ':') {
        value = '\\' + value;
      }

      if (value === '!' && prev.value === '[') {
        value = '^';
      }

      prev.value += value;
      append({ value });
      continue;
    }

    /**
     * If we're inside a quoted string, continue
     * until we reach the closing double quote.
     */

    if (state.quotes === 1 && value !== '"') {
      value = utils.escapeRegex(value);
      prev.value += value;
      append({ value });
      continue;
    }

    /**
     * Double quotes
     */

    if (value === '"') {
      state.quotes = state.quotes === 1 ? 0 : 1;
      if (opts.keepQuotes === true) {
        push({ type: 'text', value });
      }
      continue;
    }

    /**
     * Parentheses
     */

    if (value === '(') {
      push({ type: 'paren', value });
      increment('parens');
      continue;
    }

    if (value === ')') {
      if (state.parens === 0 && opts.strictBrackets === true) {
        throw new SyntaxError(syntaxError('opening', '('));
      }

      let extglob = extglobs[extglobs.length - 1];
      if (extglob && state.parens === extglob.parens + 1) {
        extglobClose(extglobs.pop());
        continue;
      }

      push({ type: 'paren', value, output: state.parens ? ')' : '\\)' });
      decrement('parens');
      continue;
    }

    /**
     * Brackets
     */

    if (value === '[') {
      if (opts.nobrackets === true || !input.slice(state.index + 1).includes(']')) {
        if (opts.nobrackets !== true && opts.strictBrackets === true) {
          throw new SyntaxError(syntaxError('closing', ']'));
        }

        value = '\\' + value;
      } else {
        increment('brackets');
      }

      push({ type: 'bracket', value });
      continue;
    }

    if (value === ']') {
      if (opts.nobrackets === true || (prev && prev.type === 'bracket' && prev.value.length === 1)) {
        push({ type: 'text', value: '\\' + value });
        continue;
      }

      if (state.brackets === 0) {
        if (opts.strictBrackets === true) {
          throw new SyntaxError(syntaxError('opening', '['));
        }

        push({ type: 'text', value: '\\' + value });
        continue;
      }

      decrement('brackets');

      let prevValue = prev.value.slice(1);
      if (prev.posix !== true && prevValue[0] === '^' && !prevValue.includes('/')) {
        value = '/' + value;
      }

      prev.value += value;
      append({ value });

      // when literal brackets are explicitly disabled
      // assume we should match with a regex character class
      if (opts.literalBrackets === false || utils.hasRegexChars(prevValue)) {
        continue;
      }

      let escaped = utils.escapeRegex(prev.value);
      state.output = state.output.slice(0, -prev.value.length);

      // when literal brackets are explicitly enabled
      // assume we should escape the brackets to match literal characters
      if (opts.literalBrackets === true) {
        state.output += escaped;
        prev.value = escaped;
        continue;
      }

      // when the user specifies nothing, try to match both
      prev.value = `(${capture}${escaped}|${prev.value})`;
      state.output += prev.value;
      continue;
    }

    /**
     * Braces
     */

    if (value === '{' && opts.nobrace !== true) {
      push({ type: 'brace', value, output: '(', tokens: [] });
      increment('braces');
      continue;
    }

    if (value === '}' && opts.nobrace !== true) {
      if (state.braces === 0 && options.strictBrackets === true) {
        throw new SyntaxError(syntaxError('opening', '{'));
      }

      let output = state.braces ? ')' : '\\}';
      if (block.dots === true) {
        let arr = tokens.slice();
        let range = [];

        for (let i = arr.length - 1; i >= 0; i--) {
          tokens.pop();
          if (arr[i].type === 'brace') {
            break;
          }
          if (arr[i].type !== 'dots') {
            range.unshift(arr[i].value);
          }
        }

        output = expandRange(range, opts);
        state.backtrack = true;
      }

      push({ type: 'brace', value, output });
      decrement('braces');
      continue;
    }

    /**
     * Commas
     */

    if (value === ',') {
      let output = value;

      if (state.braces > 0 && stack[stack.length - 1] === 'braces') {
        output = '|';
      }

      push({ type: 'comma', value, output });
      continue;
    }

    /**
     * Slashes
     */

    if (value === '/') {
      // if the beginning of the glob is "./", advance the start
      // to the current index, and don't add the "./" characters
      // to the state. This greatly simplifies lookbehinds when
      // checking for BOS characters like "!" and "." (not "./")
      if (prev.type === 'dot' && state.index === 1) {
        start = state.index + 1;
        state.consumed = '';
        state.output = '';
        tokens.pop();
        prev = bos; // reset "prev" to the first token
        continue;
      }

      let output = win32 ? SLASH_LITERAL_WINDOWS : SLASH_LITERAL;
      if (prev.type === 'globstar' && prev.prior && !input.slice(state.index + 1).startsWith('/*')) {

        prev.prior.output = '(?:' + prev.prior.output;
        let dotPath = input.slice(state.index + 1).startsWith('..') ? '' : NO_DOTS;

        if (prev.prior.type === 'bos') {
          output += `${dotPath}|${START_ANCHOR})`;
        } else {
          output = `|${dotPath})` + output;
        }
      }

      push({ type: 'slash', value, output });
      continue;
    }

    /**
     * Dots
     */

    if (value === '.') {
      if (state.braces > 0 && peek() === '.') {
        value += advance();
        block.dots = true;
        push({ type: 'dots', value, output: value });
        continue;
      }

      push({ type: 'dot', value, output: DOT_LITERAL });
      continue;
    }

    /**
     * Question marks
     */

    if (value === '?') {
      if (prev && prev.type === 'paren') {
        if (peek() === '<' && parseInt(process.version.slice(1), 10) < 10) {
          throw new Error('Node.js v10 or higher is required for regex lookbehinds');
        }

        push({ type: 'text', value });
        continue;
      }

      if (opts.qmarkLiteral === true) {
        push({ type: 'qmark', value, output: QMARK_LITERAL });
        continue;
      }

      if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        extglobOpen('qmark', value);
        continue;
      }

      if (opts.dot !== true && (prev.type === 'slash' || prev.type === 'bos')) {
        push({ type: 'qmark', value, output: win32 ? QMARK_WINDOWS_NO_DOT : QMARK_NO_DOT });
        continue;
      }

      if (opts.bash === true) {
        push({ type: 'qmark', value, output: '.' });
        continue;
      }

      push({ type: 'qmark', value, output: win32 ? QMARK_WINDOWS : QMARK });
      continue;
    }

    /**
     * Exclamation
     */

    if (value === '!') {
      if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        extglobOpen('negate', value);
        continue;
      }

      if (opts.nonegate !== true && state.index === 0) {
        state.negated = true;
        start++;
        continue;
      }
    }

    /**
     * Plus
     */

    if (value === '+') {
      if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        extglobOpen('plus', value);
        continue;
      }

      if (prev && (prev.type === 'bracket' || prev.type === 'paren' || prev.type === 'brace')) {
        push({ type: 'plus', value });
        continue;
      }

      // use regex behavior inside parens
      if (state.parens && opts.regex !== false) {
        push({ type: 'plus', value });
        continue;
      }

      push({ type: 'plus', value: PLUS_LITERAL });
      continue;
    }

    /**
     * Plain text
     */

    if (value === '@') {
      if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        push({ type: 'at', value, output: '' });
        continue;
      }
    }

    /**
     * Plain text
     */

    if (value !== '*') {
      if (value === '$' || value === '^') {
        value = '\\' + value;
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Stars
     */

    if (prev && (prev.type === 'globstar' || prev.star === true)) {
      prev.type = 'star';
      prev.star = true;
      prev.value += value;
      prev.output = win32 ? STAR_WINDOWS : STAR;
      state.backtrack = true;
      state.consumed += value;
      continue;
    }

    if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
      extglobOpen('star', value);
      continue;
    }

    if (prev.type === 'star') {
      if (opts.noglobstar === true) {
        continue;
      }

      if (opts.bash === true) {
        let isStart = prev.prev && (prev.prev.type === 'slash' || prev.prev.type === 'bos');
        if (!isStart || (!eos() && peek() !== '/')) {
          continue;
        }
      }

      let prior = false;
      for (let n = tokens.length - 2; n >= 0; n--) {
        let tok = tokens[n];

        if (tok.type === 'onechar') {
          tok.output = '';
          continue;
        }

        if (tok.type === 'nodot') {
          continue;
        }

        prior = tok;
        break;
      }

      let isStart = prior.type === 'slash' || prior.type === 'bos';
      let isBrace = state.braces > 0 && (prior.type === 'comma' || prior.type === 'brace');
      let isExtglob = extglobs.length && (prior.type === 'pipe' || prior.type === 'paren');
      if (prior && !isStart && prior.type !== 'paren' && !isBrace && !isExtglob) {
        state.consumed += value;
        continue;
      }

      if (prior && isStart) {
        prev.prior = prior;
      }

      prev.type = 'globstar';
      prev.output = globstar(opts.dot);
      prev.value += value;

      let idx = tokens.indexOf(prev);
      let sibling = tokens[idx - 1];

      if (sibling && sibling.type === 'nodot' && opts.dot !== false) {
        // console.log(prev)
        // sibling.output = '';
      }

      while (input.slice(state.index + 1, state.index + 4) === '/**') {
        let after = input[state.index + 4];
        if (after && after !== '/') {
          break;
        }
        state.index += 3;
      }

      if (prior && prior.type === 'slash' && opts.strictSlashes !== true && eos()) {
        let priorIdx = tokens.indexOf(prior);
        let before = tokens[priorIdx - 1];

        // if the prior type was a slash, and the slash is not the first thing
        // in the string, then follow the slash with "?"
        if (!before || (before.type !== 'star' && before.type !== 'globstar' && before.type !== 'bos')) {
          prior.output += '?';
        }
      }

      state.backtrack = true;
      state.consumed += value;
      continue;
    }

    let token = { type: 'star', value, output: win32 ? STAR_WINDOWS : STAR };

    if (opts.bash === true) {
      token.output = '.*?';
      push(token);
      continue;
    }

    if (prev && (prev.type === 'bracket' || prev.type === 'paren') && opts.regex === true) {
      token.output = value;
      push(token);
      continue;
    }

    if (state.index === start || prev.type === 'slash' || prev.type === 'dot') {
      let nodots = opts.dots !== true ? NO_DOT_SLASH : NO_DOTS;

      if (prev.type === 'dot') {
        // force output to NO_DOT_SLASH when opts.dots is not true
        push({ type: 'nodot', value: '', output: nodots });
      } else {
        push({ type: 'nodot', value: '', output: nodot });
      }

      if (eos()) {
        push({ type: 'onechar', value: '', output: ONE_CHAR });
      }
    }

    push(token);
  }

  while (state.brackets > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', ']'));
    state.output = utils.escapeLast(state.output, '[');
    decrement('brackets');
  }

  while (state.parens > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', ')'));
    state.output = utils.escapeLast(state.output, '(');
    decrement('parens');
  }

  while (state.braces > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', '}'));
    state.output = utils.escapeLast(state.output, '{');
    decrement('braces');
  }

  if (opts.strictSlashes !== true && (prev.type === 'star' || prev.type === 'bracket')) {
    push({ type: 'maybe_slash', value: '', output: '\\/?' });
  }

  // rebuild the output if we had to backtrack at any point
  if (state.backtrack === true) {
    state.output = '';

    for (let token of state.tokens) {
      state.output += token.output != null ? token.output : token.value;
    }
  }

  if (state.braces > 0 || state.brackets > 0 || state.parens > 0 || state.quotes > 0) {
    state.output = utils.escapeRegex(state.output);
  }

  return state;
};

parse.fastpaths = fastpaths;
module.exports = parse;
