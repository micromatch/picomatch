'use strict';

const {
  CHAR_ASTERISK,             /* * */
  CHAR_AT,                   /* @ */
  CHAR_BACKWARD_SLASH,       /* \ */
  CHAR_COMMA,                /* , */
  CHAR_DOT,                  /* . */
  CHAR_DOUBLE_QUOTE,         /* " */
  CHAR_EXCLAMATION_MARK,     /* ! */
  CHAR_FORWARD_SLASH,        /* / */
  CHAR_LEFT_CURLY_BRACE,     /* { */
  CHAR_LEFT_PARENTHESES,     /* ( */
  CHAR_LEFT_SQUARE_BRACKET,  /* [ */
  CHAR_PLUS,                 /* + */
  CHAR_QUESTION_MARK,        /* ? */
  CHAR_RIGHT_CURLY_BRACE,    /* } */
  CHAR_RIGHT_PARENTHESES,    /* ) */
  CHAR_RIGHT_SQUARE_BRACKET, /* ] */
  CHAR_SINGLE_QUOTE          /* ' */
} = require('./constants');

const setLast = (arr, num) => (arr[arr.length - 1] += num);

const isPathSeparator = code => {
  return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
};

const isBoundary = (code, allowComma = false) => {
  return code === CHAR_FORWARD_SLASH
    || code === void 0
    || (allowComma === true && code === CHAR_COMMA);
};

const isExtglobChar = code => {
  return code === CHAR_ASTERISK
    || code === CHAR_AT
    || code === CHAR_EXCLAMATION_MARK
    || code === CHAR_PLUS
    || code === CHAR_QUESTION_MARK;
};

/**
 * Quickly scans a glob pattern and returns an object with a handful of
 * useful properties, like `isGlob`, `path` (the leading non-glob, if it exists),
 * `glob` (the actual pattern), and `negated` (true if the path starts with `!`).
 *
 * ```js
 * const pm = require('picomatch');
 * console.log(pm.scan('foo/bar/*.js'));
 * { isGlob: true, input: 'foo/bar/*.js', base: 'foo/bar', glob: '*.js' }
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {Object} Returns an object with tokens and regex source string.
 * @api public
 */

const scan = module.exports = (input, options) => {
  let opts = options || {};
  let length = input.length - 1;
  let isGlob = false;
  let braceEscaped = false;
  let braces = 0;
  let index = -1;
  let lastIndex = 0;
  let start = 0;
  let prev;
  let code;

  let state = {
    input,
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
    wildcard: false
  };

  let token = { height: 1, loc: { start: 0 } };
  let segments = state.segments = [token];
  let eos = () => index >= length;
  let peek = () => index < length ? input.charCodeAt(index + 1) : void 0;
  let advance = () => {
    prev = code;
    return input.charCodeAt(++index);
  };

  let segment = () => {
    let n = eos() && code !== CHAR_FORWARD_SLASH ? 1 : 0;
    token.loc.end = index + n;
    token.value = input.slice(token.loc.start, index + n);
    token.isGlob = isGlob;

    if (token.value !== '') {
      let slash = state.glob !== '' ? '/' : '';
      if (isGlob) {
        state.glob += slash + token.value;
      } else {
        state.base += slash + token.value;
      }
    }
  };

  while (index < length) {
    code = advance();

    if (code === CHAR_BACKWARD_SLASH) {
      state.backslashes = true;
      code = advance();

      if (code === CHAR_LEFT_CURLY_BRACE) {
        braceEscaped = true;
      }
      continue;
    }

    if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
      let before = prev;
      let stack = [[1]];
      let stackIndex = 0;
      let last;
      braces++;

      while (!eos() && (code = advance())) {
        if (code === CHAR_BACKWARD_SLASH) {
          state.backslashes = true;
          code = advance();
          last = code;
          continue;
        }

        if (code === CHAR_LEFT_CURLY_BRACE) {
          if (opts.segments === true) {
            stack.push([1]);
            stackIndex++;
          }
          last = code;
          braces++;
          continue;
        }

        if (opts.segments === true && code === CHAR_ASTERISK && last === code) {
          if (isBoundary(peek(), true) && isBoundary(input.charCodeAt(index - 2), true)) {
            setLast(stack[stackIndex], Infinity);
            last = code;
            continue;
          }
        }

        if (opts.segments === true && code === CHAR_FORWARD_SLASH) {
          setLast(stack[stackIndex], 1);
          last = code;
          continue;
        }

        if (braceEscaped === false && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
          state.brace_range = true;
          last = code;
          continue;
        }

        if (braceEscaped === false && code === CHAR_COMMA) {
          if (opts.segments === true) {
            stack[stackIndex].push(1);
          }

          state.brace_set = true;
          last = code;
          continue;
        }

        if (code === CHAR_RIGHT_CURLY_BRACE) {
          braces--;

          if (opts.segments === true) {
            // stack[stackIndex] = Math.max(...stack[stackIndex]);
            stackIndex--;
          }

          if (braces === 0) {
            if (opts.segments === true) {
              for (let i = 0; i < stack.length; i++) {
                let ele = stack[i];
                if (ele.includes(Infinity)) {
                  if (!isBoundary(before) || !isBoundary(peek())) {
                    // console.log([ele])
                  }
                }
              }

              // token.height = Math.max(...stack);
            }

            isGlob = state.brace_set || state.brace_range;
            braceEscaped = false;
            state.brace = true;
            break;
          }
        }

        last = code;
      }
    }

    if (code === CHAR_FORWARD_SLASH) {
      if (prev === CHAR_DOT && index === (start + 1)) {
        state.removed = input[start] + input[start + 1];
        token.loc.start += 2;
        start += 2;
        continue;
      }

      if (opts.segments === true) {
        segment();
        token = { height: 1, loc: { start: index + 1 } };
        segments.push(token);
      }

      if (index === length) {
        state.dirsOnly = true;
      }

      lastIndex = index + 1;
      continue;
    }

    if (code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK) {
      state.wildcard = true;
      isGlob = true;

      if (opts.segments === true && prev === CHAR_ASTERISK) {
        if (isBoundary(peek()) && isBoundary(input.charCodeAt(index - 2))) {
          state.globstar = true;
          token.height = Infinity;
        }
      }

      if (opts.segments !== true) {
        break;
      }
    }

    if (code === CHAR_LEFT_SQUARE_BRACKET) {
      while (!eos() && (code = advance())) {
        if (code === CHAR_BACKWARD_SLASH) {
          state.backslashes = true;
          code = advance();
          continue;
        }

        if (code === CHAR_RIGHT_SQUARE_BRACKET) {
          state.bracket = true;
          isGlob = true;
          break;
        }
      }
    }

    if (code === CHAR_SINGLE_QUOTE || code === CHAR_DOUBLE_QUOTE) {
      let open = code;

      while (!eos() && (code = advance())) {
        if (code === CHAR_BACKWARD_SLASH) {
          state.backslashes = true;
          code = advance();
          continue;
        }

        if (code === open) {
          state.quote = true;
          isGlob = true;
          break;
        }
      }
    }

    /**
     * Leading non-extglob "!"
     */

    if (code === CHAR_EXCLAMATION_MARK && index === start) {
      if (peek() !== CHAR_LEFT_PARENTHESES || peek(2) === CHAR_QUESTION_MARK) {
        state.negated = true;
        state.prefix += input[start];
        token.loc.start++;
        start++;
        prev = code;
        continue;
      }
    }

    /**
     * Extglob
     */

    if (code === CHAR_LEFT_PARENTHESES && isExtglobChar(prev)) {
      let stack = [[1]];
      let stackIndex = 0;
      let last;

      while (!eos() && (code = advance())) {
        if (code === CHAR_BACKWARD_SLASH) {
          state.backslashes = true;
          code = advance();
          continue;
        }

        if (code === CHAR_RIGHT_PARENTHESES) {
          state.extglob = true;
          state.wildcard = true;
          isGlob = true;
          break;
        }
      }
    }

    /**
     * Non-extglob parens
     */

    if (code === CHAR_LEFT_PARENTHESES) {
      while (!eos() && (code = advance())) {
        if (code === CHAR_BACKWARD_SLASH) {
          state.backslashes = true;
          code = advance();
          continue;
        }

        if (code === CHAR_RIGHT_PARENTHESES) {
          state.wildcard = true;
          isGlob = true;
          break;
        }
      }
    }

    if (isGlob && opts.segments !== true) {
      break;
    }
  }

  if (opts.segments === true) {
    state.isGlob = isGlob;
    segment();

    if (state.dirsOnly) {
      if (token.value === '') {
        segments.pop();
      } else {
        token.value += '/';
      }
    }
    // console.log(state);
    return state;
  }

  let prefix = '';
  let orig = input;
  let base = input;
  let glob = '';

  if (start > 0) {
    prefix = input.slice(0, start);
    input = input.slice(start);
    lastIndex -= start;
  }

  if (base && isGlob === true && lastIndex > 0) {
    base = input.slice(0, lastIndex);
    glob = input.slice(lastIndex);
  } else if (isGlob === true) {
    base = '';
    glob = input;
  } else {
    base = input;
  }

  if (base && base !== '' && base !== '/' && base !== input) {
    if (isPathSeparator(base.charCodeAt(base.length - 1))) {
      base = base.slice(0, -1);
    }
  }

  if (opts.unescape === true) {
    if (glob) glob = removeBackslashes(glob);

    if (base && state.backslashes === true) {
      base = removeBackslashes(base);
    }
  }

  return { prefix, input: orig, base, glob, negated: state.negated, isGlob };
};

function removeBackslashes(str) {
  return str.replace(/(?:\[.*?(?<!\\)\]|\\(?=.))/g, match => {
    return match === '\\' ? '' : match;
  });
}

// let state = scan('./path/\\{,/,bar/baz,qux}/*.js', { unescape: true });
// let state = scan('./!path/\\{,/,bar/baz,qux}/*.js', { unescape: true });
// console.log(state);
// console.log(scan('foo/bar', { segments: true }));
// console.log(scan('foo/bar/{,/}*.js', { segments: true }));
// let res = scan('!./foo/bar/**/{*,*/{*,*,{a,**,{one,*,*,*}}},*}/.js', { segments: true });
// let res = scan('foo/{a/b/c,/**,c}a', { segments: true });
// console.log(require('./parse')('foo/{a/b/c,/**,c}a'))
// let res = scan('!(foo/bar/baz)/{a/b/a,a/b,c}/**/a/a/*/abcd/**/', { segments: true });
// let res = scan('foo/**/*/*', { segments: true });
// let seg = res.segments[res.segments.length - 1];
// console.log(res.input.slice(seg.loc.start, seg.loc.end));
