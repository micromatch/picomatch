'use strict';

module.exports = (str, opts = {}, negated) => {
  let prefix = '^(?:(\\./)?';

  if (str.slice(0, 2) === './') {
    str = str.slice(2);
  }

  const ast = { type: 'root', nodes: [] };
  const chars = [...str];
  const extglobs = [];
  const queue = [];
  const stack = [];
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

  const stash = [{ type: 'bos', value: '' }];
  const seen = [];
  const state = {
    prefix,
    suffix: ')$',
    hasGlobstar: false,
    stash,
    stacks,
    queue,
    extglobs,
    seen
  };

  let dot = false;
  let idx = -1;
  let ch;

  const start = dot => {
    return dot ? '' : (opts.dot ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))' : '(?!\\.)');
  };

  const globstar = dot => {
    if (dot || opts.dot === true) {
      return '(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?';
    }
    return '(?:(?!(?:\\/|^)\\.).)*?';
  };

  const eos = () => idx >= chars.length;
  const isInside = type => type ? stacks[type].length > 0 : stacks.length > 0;
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
  const next = () => (ch = dequeue() || advance() || '');
  const last = arr => arr[arr.length - 1];
  const append = val => {
    let prev = last(stash);
    let after = rest();

    if (prev.optional === true && !after.includes('*')) {
      if (prev.value === '' && after.length) {
        prev.value = '?';
      } else if (!after.length) {
        if (prev.value === '(?=.)/?') prev.value = '';
        val += '/?';
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
                let dollar = peek() ? '' : '$';
                append(`)${dollar})[^/]*?)`);
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

        if (prior.value === '') {
          dot = true;
        }

        append('\\' + ch);
        prior.dot = true;
        break;

      case '!':
        if (stash.length === 1 && prev().value === '' && peek() !== '(') {
          state.prefix = '^(?!' + state.prefix;
          state.suffix += ').*$';
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
            isGlobstar = state.hasGlobstar = true;
            dequeue();
          }

          if (isGlobstar) {
            prior.globstar = true;

            if (stash.length > 1) {
              append('?');
            }

            append(globstar(dot));
            dot = false;
            break;
          }

          if (prior.type === 'slash' && !isGlobstar) {
            let after = rest();
            if (prior.optional === true && prior.value === '' && after.length) {
              prior.value = '?';
            }

            if (after[0] !== '.') {
              append(start(dot));
            }
          }

          append('[^/]*?');
          break;
        }

        append('\\' + ch);
        break;

      case ':':
        prev().capture = true;
        break;

      case '/':
        tok = prev();
        stash.push({ type: 'slash', value: '', optional: tok.globstar });
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

  if (!negated && opts.dot !== true && state.stash[0].globstar !== true && state.seen[0][0] !== '.') {
    state.stash[0].value = '(?!\\.)' + state.stash[0].value;
  }

  return state;
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
