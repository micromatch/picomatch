'use strict';

module.exports = (input, options = {}, negated) => {
  let prefix = '^' + (options.prefix || '');

  if (input.slice(0, 2) === './') {
    input = input.slice(2);
  }

  let segs = input.split('/');
  let state = {
    negated,
    prefix,
    suffix: (options.suffix || '') + '$',
    segs,
    input,
    parts: [],
    patterns: {},
    dot: false,
    globstar: false
  };

  for (let seg of segs) {
    state.parts.push(parse(seg, options, state));
  }

  console.log(state.parts)
    // console.log(state.parts)
  state.pattern = state.parts.join('\\/');
  return state;
};

const parse = (str, options, state) => {
  // const ast = { type: 'root', nodes: [] };
  const chars = [...str];
  const extglobs = state.extglobs = [];
  const queue = state.queue = [];
  const stack = state.stack = [];
  const stash = state.stash = [{ type: 'bos', value: '' }];
  const seen = state.seen = [];

  let lastChar;
  let idx = -1;
  let ch;

  const stacks = {
    all: [],
    angles: [],
    braces: [],
    brackets: [],
    parens: [],
    quotes: [],
    other: [],
    length: 0,
    last() {
      return this.all[this.all.length - 1];
    },
    push(type, value) {
      stack.push({type, value: ''});
      this[type].push(value);
      this.all.push(value);
      this.length++;
      return value;
    },
    pop(type) {
      this.length--;
      this.all.pop();
      stack.pop();
      return this[type].pop();
    }
  };

  const start = dot => {
    return dot ? '' : (options.dot ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))' : '(?!\\.)');
  };

  const globstar = dot => {
    if (dot || options.dot === true) {
      return '(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?';
    }
    return '(?:(?!(?:\\/|^)\\.).)*?';
  };

  const eos = () => idx >= chars.length;
  // const isInside = type => type ? stacks[type].length > 0 : stacks.length > 0;
  const consume = n => {
    if (ch) seen.push(ch);
    return !eos() ? (idx += n) : false;
  };
  const advance = () => consume(1) !== false ? chars[idx] : '';
  const enqueue = val => queue.push(val);
  const dequeue = () => queue.length && queue.shift();
  const lookahead = n => {
    let fetch = n - queue.length;
    while (fetch-- > 0 && enqueue(advance()));
    return queue[--n];
  };
  const lookbehind = n => stash[stash.length - Math.abs(n)];
  const rest = () => chars.slice(idx);
  const prev = () => lookbehind(1);
  const peek = () => lookahead(1) || '';
  const next = () => {
    lastChar = ch;
    return (ch = dequeue() || advance() || '');
  };
  const last = arr => arr[arr.length - 1];
  const append = val => {
    let prev = last(stash);
    let after = rest();

    if (prev.optional === true && !after.includes('*')) {
      if (prev.value === '' && after.length) {
        // prev.value = '?';
      } else if (!after.length) {
        // if (prev.value === '(?=.)/?') prev.value = '';
        // val += '/?';
      }
    }

    if (stack.length) {
      stack[stack.length - 1].value += (val || '');
    }
    stash[stash.length - 1].value += (val || '');
  };

  function parse() {
    if (eos()) return;
    let prior;
    let extglob;
    let tok;
    next();

    switch (ch) {
      case '\\':
        append(ch + next());
        break;
      // case '/':
      //   tok = prev();
      //   stash.push({ type: 'slash', value: '', optional: tok.globstar });
      //   break;
      case '"':
      case "'":
      case '`':
        if (last(stacks.quotes) !== ch) {
          stacks.push('quotes', ch);
        } else {
          stacks.pop('quotes');
        }
        append(ch);
        break;
      case '“':
        stacks.push('quotes', ch);
        append(ch);
        break;
      case '”':
        stacks.pop('quotes');
        append(ch);
        break;
      case '(':
      case '<':
      case '{':
      case '[':
        if (stacks.length) {
          append(ch);
        } else {
          switch (ch) {
            case '(':
              stacks.push('parens', ch);
              switch (last(extglobs)) {
                case '!':
                  ch = '(?:(?!(?:';
                  break;
                case '*':
                case '+':
                case '?':
                case '@': {
                  ch = '(?:';
                  break;
                }
              }
              break;
            case '<':
              stacks.push('angles', ch);
              break;
            case '{':
              stacks.push('braces', ch);
              break;
            case '[': {
              append('(?:');
              stacks.push('brackets', ch);
              break;
            }
          }

          append(ch);
        }
        break;
      case ')':
      case '>':
      case '}':
      case ']':
        if (!stacks.length) {
          throw new Error('missing opening: ' + ch);
        }

        if (/[[({<]/.test(stacks.last())) {
          if (ch === ')') {
            extglob = extglobs.pop();
            prior = prev();

            if (extglob) {
              prior.extglob = true;
            } else {
              prior.capture = true;
            }

            switch (extglob) {
              case '!':
                append(`)${peek() ? '' : '$'})[^/]*?)`);
                break;
              case '*':
              case '+':
              case '?':
                append(ch + extglob);
                break;
              case '@':
              default: {
                append(ch);
                break;
              }
            }
          } else {
            if (ch === ']') {
              let bracket = stack[stack.length - 1];
              let value = '|\\' + bracket.value + '\\]';
              append(ch + value + ')');
            } else {
              append(ch);
            }
          }

          stacks.pop(stackType(ch));
        } else {
          append(ch);
        }
        break;
      case '.':
        prior = prev();

        if (lastChar === '' || lastChar === '/') {
          state.dot = true;
        }

        append('\\' + ch);
        prior.dot = true;
        break;
      case '!':
        if (stash.length === 1 && prev().value === '' && peek() !== '(') {
          state.prefix = '^(?!' + state.prefix;
          state.suffix += ').*$';
          state.negated = true;
          break;
        }
        /* fall through */
      case '@':
      case '?':
      case '*':
      case '+':
        let nextChar = peek();
        if (nextChar === '(') {
          extglobs.push(ch);
          break;
        }

        prior = prev();

        if (ch === '+') {
          append((/(^$|\w$)/.test(prior.value) ? '\\' : '') + ch);
          break;
        }

        if (ch === '*') {
          let isGlobstar = false;

          while (peek() === '*') {
            isGlobstar = state.globstar = true;
            dequeue();
          }

          if (isGlobstar) {
            prior.globstar = true;
            // if (lastChar === '/') append('?');
            append(globstar(state.dot));
            state.dot = false;
            break;
          }

          if (prior.type === 'slash' && !isGlobstar) {
            let after = rest();

            if (prior.optional === true && prior.value === '' && after.length) {
              // prior.value = '?';
            }

            if (lastChar === '/' && after[0] !== '.') {
              append(start(state.dot));
            }
          }

          append('[^/]*?');
          break;
        }

        if (ch === '?') {
          if (lastChar === '(') {
            break;
          }
          if (lastChar === '/' && !state.dot) {
            append('[^./\\\\]');
            break;
          }
          append('[^/]');
          break;
        }

        append(`\\${ch}`);
        break;
      case ':':
        prev().capture = true;
        break;
      case '~':
      case '&':
        append(ch);
        break;

      default: {
        append(ch);
        break;
      }
    }

    parse();
  }

  parse();

  const first = state.stash[0];
  if (!state.negated && !state.dot && first.globstar !== true) {
    first.value = '(?!\\.)' + first.value;
  }

  return state.stash[0].value;
};

function stackType(ch) {
  switch (ch) {
    case '<':
    case '>':
      return 'angles';
    case '{':
    case '}':
      return 'braces';
    case '[':
    case ']':
      return 'brackets';
    case '(':
    case ')':
      return 'parens';
    default: {
      return 'other';
    }
  }
}
