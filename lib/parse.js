'use strict';

const constants = require('./constants');
const utils = require('./utils');

/**
 * Constants
 */

const {
  MAX_LENGTH,
  POSIX_REGEX_SOURCE,
  REGEX_NON_SPECIAL_CHARS,
  REGEX_SPECIAL_CHARS_BACKREF,
  REPLACEMENTS
} = constants;

/**
 * Helpers
 */

const expandRange = (args, options) => {
  if (typeof options.expandRange === 'function') {
    return options.expandRange(...args, options);
  }

  args.sort();
  const value = `[${args.join('-')}]`;

  try {
    /* eslint-disable-next-line no-new */
    new RegExp(value);
  } catch (ex) {
    return args.map(v => utils.escapeRegex(v)).join('..');
  }

  return value;
};

/**
 * Create the message for a syntax error
 */

const syntaxError = (type, char) => {
  return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
};

const splitTopLevel = input => {
  const parts = [];
  let bracket = 0;
  let paren = 0;
  let quote = 0;
  let value = '';
  let escaped = false;

  for (const ch of input) {
    if (escaped === true) {
      value += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      value += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      quote = quote === 1 ? 0 : 1;
      value += ch;
      continue;
    }

    if (quote === 0) {
      if (ch === '[') {
        bracket++;
      } else if (ch === ']' && bracket > 0) {
        bracket--;
      } else if (bracket === 0) {
        if (ch === '(') {
          paren++;
        } else if (ch === ')' && paren > 0) {
          paren--;
        } else if (ch === '|' && paren === 0) {
          parts.push(value);
          value = '';
          continue;
        }
      }
    }

    value += ch;
  }

  parts.push(value);
  return parts;
};

const isPlainBranch = branch => {
  let escaped = false;

  for (const ch of branch) {
    if (escaped === true) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (/[?*+@!()[\]{}]/.test(ch)) {
      return false;
    }
  }

  return true;
};

const normalizeSimpleBranch = branch => {
  let value = branch.trim();
  let changed = true;

  while (changed === true) {
    changed = false;

    if (/^@\([^\\()[\]{}|]+\)$/.test(value)) {
      value = value.slice(2, -1);
      changed = true;
    }
  }

  if (!isPlainBranch(value)) {
    return;
  }

  return value.replace(/\\(.)/g, '$1');
};

const hasRepeatedCharPrefixOverlap = branches => {
  const values = branches.map(normalizeSimpleBranch).filter(Boolean);

  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      const a = values[i];
      const b = values[j];
      const char = a[0];

      if (!char || a !== char.repeat(a.length) || b !== char.repeat(b.length)) {
        continue;
      }

      if (a === b || a.startsWith(b) || b.startsWith(a)) {
        return true;
      }
    }
  }

  return false;
};

const parseRepeatedExtglob = (pattern, requireEnd = true) => {
  if ((pattern[0] !== '+' && pattern[0] !== '*') || pattern[1] !== '(') {
    return;
  }

  let bracket = 0;
  let paren = 0;
  let quote = 0;
  let escaped = false;

  for (let i = 1; i < pattern.length; i++) {
    const ch = pattern[i];

    if (escaped === true) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      quote = quote === 1 ? 0 : 1;
      continue;
    }

    if (quote === 1) {
      continue;
    }

    if (ch === '[') {
      bracket++;
      continue;
    }

    if (ch === ']' && bracket > 0) {
      bracket--;
      continue;
    }

    if (bracket > 0) {
      continue;
    }

    if (ch === '(') {
      paren++;
      continue;
    }

    if (ch === ')') {
      paren--;

      if (paren === 0) {
        if (requireEnd === true && i !== pattern.length - 1) {
          return;
        }

        return {
          type: pattern[0],
          body: pattern.slice(2, i),
          end: i
        };
      }
    }
  }
};

const getStarExtglobSequenceOutput = pattern => {
  let index = 0;
  const chars = [];

  while (index < pattern.length) {
    const match = parseRepeatedExtglob(pattern.slice(index), false);

    if (!match || match.type !== '*') {
      return;
    }

    const branches = splitTopLevel(match.body).map(branch => branch.trim());
    if (branches.length !== 1) {
      return;
    }

    const branch = normalizeSimpleBranch(branches[0]);
    if (!branch || branch.length !== 1) {
      return;
    }

    chars.push(branch);
    index += match.end + 1;
  }

  if (chars.length < 1) {
    return;
  }

  const source = chars.length === 1
    ? utils.escapeRegex(chars[0])
    : `[${chars.map(ch => utils.escapeRegex(ch)).join('')}]`;

  return `${source}*`;
};

const repeatedExtglobRecursion = pattern => {
  let depth = 0;
  let value = pattern.trim();
  let match = parseRepeatedExtglob(value);

  while (match) {
    depth++;
    value = match.body.trim();
    match = parseRepeatedExtglob(value);
  }

  return depth;
};

const analyzeRepeatedExtglob = (body, options) => {
  if (options.maxExtglobRecursion === false) {
    return { risky: false };
  }

  const max =
    typeof options.maxExtglobRecursion === 'number'
      ? options.maxExtglobRecursion
      : constants.DEFAULT_MAX_EXTGLOB_RECURSION;

  const branches = splitTopLevel(body).map(branch => branch.trim());

  if (branches.length > 1) {
    if (
      branches.some(branch => branch === '') ||
      branches.some(branch => /^[*?]+$/.test(branch)) ||
      hasRepeatedCharPrefixOverlap(branches)
    ) {
      return { risky: true };
    }
  }

  for (const branch of branches) {
    const safeOutput = getStarExtglobSequenceOutput(branch);
    if (safeOutput) {
      return { risky: true, safeOutput };
    }

    if (repeatedExtglobRecursion(branch) > max) {
      return { risky: true };
    }
  }

  return { risky: false };
};

/**
 * Characters a wildcard may have to absorb but that some star outputs cannot
 * match: path separators, and the line terminators that `.` does not match.
 */

const ABSORB_CHECK_CHARS = ['/', '\\', '\n', '\r', '\u2028', '\u2029'];

const LITERAL_SOURCE = /^(?:[^\\^$.*+?()[\]{}|]|\\[^a-zA-Z0-9])+/;
const CLASS_SOURCE = /^\[(?:[^\\\]]|\\.)+\]/;
const BRACKET_SOURCE = /^\((?:\?:)?((?:[^\\^$.*+?()[\]{}|]|\\[^a-zA-Z0-9])+)\|(\[(?:[^\\\]]|\\.)+\])\)/;

// What a token emits. Some paths append to the output without updating the
// token (quoted text; text merged into earlier text in 2.x), so those keep the
// true source in `src`, valid while the token's own output is `srcBase`.
// `undefined` means the source is no longer known.
const tokenSource = token => {
  const output = token.output != null ? token.output : token.value;
  if (token.src === undefined) return output;
  return token.srcBase === output ? token.src : undefined;
};

const appendSource = (token, text) => {
  const base = tokenSource(token);
  return () => {
    const output = token.output != null ? token.output : token.value;
    if (base === undefined) {
      token.src = null;
      token.srcBase = null;
    } else if (base + text !== output) {
      token.src = base + text;
      token.srcBase = output;
    } else {
      delete token.src;
      delete token.srcBase;
    }
  };
};
const literalChars = source => source.replace(/\\(.)/g, '$1');

/**
 * True when an extglob body contains a wildcard: `*`, `**`, a `!(...)` (which
 * ends in a star), or a repeated extglob that was flattened into one.
 * Repeating such a body nests the wildcard's unbounded quantifier inside the
 * repeat.
 */

const hasRepeatedWildcard = bodyTokens => {
  const stack = [];

  for (const token of bodyTokens) {
    if (token.type === 'paren') {
      if (token.value === '(') {
        stack.push(token.prev && token.prev.type === 'negate' ? 'negate' : 'group');
      } else if (token.value === ')') {
        stack.pop();
      }
      continue;
    }

    if (stack.includes('negate')) continue;
    if (token.wildcard === true || token.type === 'negate') return true;
    if ((token.type === 'star' || token.type === 'globstar') && tokenSource(token) !== '') {
      return true;
    }
  }

  return false;
};

/**
 * True when an extglob body is exactly one `!(...)`, which compiles to a
 * zero-width test followed by a star.
 */

const isRepeatedNegation = (bodyTokens, stars, capture) => {
  const first = bodyTokens[0];
  const open = bodyTokens[1];
  const close = bodyTokens[bodyTokens.length - 1];

  if (!first || first.type !== 'negate' || !open || open.type !== 'paren' || open.value !== '(') {
    return false;
  }

  let depth = 0;
  for (let i = 1; i < bodyTokens.length; i++) {
    const token = bodyTokens[i];
    if (token.type !== 'paren') continue;
    if (token.value === '(') depth++;
    if (token.value === ')') depth--;
    if (depth === 0 && i !== bodyTokens.length - 1) return false;
  }

  const output = tokenSource(close);
  return depth === 0 && close.extglob === true && stars.some(s => [`))${s})`, `)$))${s}`].some(form => {
    return output === form || (capture === true && output === `${form})`);
  }));
};

/**
 * True when the token at `index` closes a group (`(...)`, `@(...)`, an extglob
 * or a brace) whose body holds a wildcard, so a regex quantifier after it
 * would nest the wildcard in a repeat. Results are kept on the closing token,
 * and walks skip groups already measured, so a pattern costs linear time.
 */

const groupHasWildcard = (tokens, index) => {
  const close = tokens[index];

  if (!close || (close.type !== 'paren' && close.type !== 'brace')) return false;
  if (close.wild !== undefined) return close.wild;
  if (close.value !== ')' && close.value !== '}') return false;

  let depth = 1;
  let wild = false;
  let i = index - 1;

  for (; i >= 0 && depth > 0; i--) {
    const token = tokens[i];

    // A closing token that already found no opening cannot get one now.
    if (token.unmatched === true) break;

    if (token.groupOpen !== undefined && token.groupOpen < i && tokens[token.groupOpen] !== undefined) {
      wild = wild || token.wild === true;
      i = token.groupOpen;
      continue;
    }

    if (token.type === 'paren' || token.type === 'brace') {
      if (token.value === ')' || token.value === '}') depth++;
      if (token.value === '(' || token.value === '{') depth--;
      continue;
    }

    if (token.wildcard === true || token.type === 'negate') wild = true;
    if ((token.type === 'star' || token.type === 'globstar') && tokenSource(token) !== '') wild = true;
  }

  // A group whose opening was popped (brace ranges) is not ours to judge; the
  // final check in `parse` still applies.
  if (depth !== 0) {
    close.unmatched = true;
    return false;
  }

  close.groupOpen = i + 1;
  close.wild = wild;
  return wild;
};

/**
 * Read a group of alternatives without stars, like `(js|ts)` from a brace or
 * `@(js|ts)`, optionally followed by `?`, as one fixed piece. The absorption
 * argument in `flattenRepeatedWildcard` only needs a piece to match no
 * character a star cannot, not a fixed width.
 */

const readFixedGroup = (source, flags) => {
  const open = /^\((?:\?:)?/.exec(source);
  if (!open || source[open[0].length] === '?') return;

  const alternatives = [''];
  let inClass = false;
  let i = open[0].length;

  for (; i < source.length; i++) {
    const ch = source[i];

    if (ch === '\\') {
      alternatives[alternatives.length - 1] += ch + (source[i + 1] || '');
      i++;
      continue;
    }

    if (inClass === true) {
      if (ch === ']') inClass = false;
    } else if (ch === '[') {
      inClass = true;
    } else if (ch === '(') {
      return;
    } else if (ch === ')') {
      break;
    } else if (ch === '|') {
      alternatives.push('');
      continue;
    }

    alternatives[alternatives.length - 1] += ch;
  }

  if (source[i] !== ')') return;

  const tests = [];

  for (const alternative of alternatives) {
    if (alternative === '') continue;
    const branches = readBodyPieces(alternative, [], flags);
    if (!branches || branches.length !== 1 || branches[0].some(p => p.star)) return;
    tests.push(...branches[0].map(p => p.matches));
  }

  const quantifier = source[i + 1] === '?' ? '?' : '';
  const body = source.slice(open[0].length, i);

  return {
    star: false,
    source: source.slice(0, i + 1) + quantifier,
    plain: `(?:${body})${quantifier}`,
    matches: ch => tests.some(test => test(ch))
  };
};

/**
 * Read the regex source of a repeated extglob body as branches of pieces: a
 * wildcard star (with the characters it cannot match), or fixed text or a
 * one-character class (with a test for whether it can match a character).
 * Returns `undefined` for any other syntax.
 */

const readBodyPieces = (source, stars, flags) => {
  const branches = [[]];
  const pieces = () => branches[branches.length - 1];
  let i = 0;

  while (i < source.length) {
    const star = stars.find(s => source.startsWith(s, i));

    if (star) {
      const re = new RegExp(`^(?:${star})$`, flags);
      pieces().push({ star: true, source: star, excludes: ABSORB_CHECK_CHARS.filter(ch => !re.test(ch)) });
      i += star.length;
      continue;
    }

    const rest = source.slice(i);
    const group = readFixedGroup(rest, flags);

    if (group) {
      pieces().push(group);
      i += group.source.length;
      continue;
    }

    const bracket = BRACKET_SOURCE.exec(rest);

    if (bracket) {
      const chars = literalChars(bracket[1]);
      const re = new RegExp(`^${bracket[2]}$`, flags);
      const plain = `(?:${bracket[1]}|${bracket[2]})`;
      pieces().push({ star: false, source: bracket[0], plain, matches: ch => chars.includes(ch) || re.test(ch) });
      i += bracket[0].length;
      continue;
    }

    const cls = CLASS_SOURCE.exec(rest);

    if (cls) {
      const re = new RegExp(`^${cls[0]}$`, flags);
      pieces().push({ star: false, source: cls[0], matches: ch => re.test(ch) });
      i += cls[0].length;
      continue;
    }

    const literal = LITERAL_SOURCE.exec(rest);

    if (literal) {
      const chars = literalChars(literal[0]);
      pieces().push({ star: false, source: literal[0], matches: ch => chars.includes(ch) });
      i += literal[0].length;
      continue;
    }

    if (source[i] === '|') {
      branches.push([]);
      i++;
      continue;
    }

    return;
  }

  return branches;
};

/**
 * Rewrite a repeated extglob body that contains wildcards so that no
 * wildcard sits inside the repeat (CVE-2026-112366). Returns the regex source
 * for the whole repeat, or `undefined` when no exact rewrite is known.
 *
 * The body must be branches of stars, fixed text, `?` and brackets, and every
 * character any branch can match must also be matched by every star, so a
 * star can absorb whole repeats. Let `F` be the branches without a star and
 * `T` the branches with one. For one match `u` of the body followed by
 * another, `v`:
 *
 * - with a single branch, the last star of `u` absorbs the rest of `u` and all
 *   of `v` up to `v`'s text after its last star, so `uv` is one match and
 *   `+(T)` matches exactly what `@(T)` matches;
 * - when every `T` ends with a star, a `T` match absorbs every repeat after it,
 *   so a repeat is some `F` matches then one match of any branch:
 *   `(?:F)*(?:F|T)`;
 * - when every `T` starts with a star, a `T` match absorbs every repeat before
 *   it: `(?:F|T)(?:F)*`.
 *
 * `*(...)` also matches the empty string, so its rewrite is made optional.
 */

const flattenRepeatedWildcard = (bodySource, type, stars, flags) => {
  let branches;

  try {
    branches = readBodyPieces(bodySource, stars, flags);
  } catch (err) {
    return;
  }

  if (!branches || branches.some(branch => branch.length === 0)) return;

  const pieces = branches.flat();
  const excludes = [...new Set(pieces.filter(p => p.star).flatMap(p => p.excludes))];
  if (pieces.some(p => !p.star && excludes.some(ch => p.matches(ch)))) return;

  // The fixed branches are written twice; the second copy captures nothing, so
  // `capture: true` keeps the same groups in the same order.
  const join = (list, key) => list.map(branch => branch.map(p => p[key] || p.source).join('')).join('|');
  const fixed = branches.filter(branch => !branch.some(p => p.star));
  const starred = branches.filter(branch => branch.some(p => p.star));
  const all = `(?:${join(branches, 'source')})`;
  const rest = fixed.length ? `(?:${join(fixed, 'plain')})*` : '';
  let output;

  if (starred.length === 0) {
    return;
  } else if (branches.length === 1) {
    output = all;
  } else if (starred.every(branch => branch[branch.length - 1].star)) {
    output = rest + all;
  } else if (starred.every(branch => branch[0].star)) {
    output = all + rest;
  } else {
    return;
  }

  return type === 'star' ? `(?:${output})?` : output;
};

/**
 * True when a regex source repeats, with `*`, `+` or `{n,}`, a group that
 * holds a repeated wildcard: a negated class, `.`, `\\S`, `\\W` or `\\D` under
 * an unbounded quantifier, or a repeated group of them. That nesting backtracks
 * exponentially. Lookarounds are skipped: they are atomic in JavaScript.
 * Linear in the length of the source.
 */

const hasNestedWildcardRepeat = source => {
  const frame = look => ({ wild: false, wildRepeat: false, look });
  const stack = [frame(false)];
  let i = 0;

  // Reads the quantifier at `i`, if any; returns [repeats, length].
  const quantifier = () => {
    const ch = source[i];
    let len = 0;
    let unbounded = false;

    if (ch === '*' || ch === '+') {
      unbounded = true;
      len = 1;
    } else if (ch === '?') {
      len = 1;
    } else if (ch === '{') {
      let j = i + 1;
      while (source[j] >= '0' && source[j] <= '9') j++;

      // A bounded count above 2 nests just as badly in practice: `{1,30}`
      // backtracks like a 30-deep nesting.
      if (j > i + 1 && source[j] === '}') {
        len = j + 1 - i;
        unbounded = Number(source.slice(i + 1, j)) > 2;
      } else if (j > i + 1 && source[j] === ',') {
        let k = j + 1;
        while (source[k] >= '0' && source[k] <= '9') k++;
        if (source[k] === '}') {
          len = k + 1 - i;
          unbounded = k === j + 1 || Number(source.slice(j + 1, k)) > 2;
        }
      }
    }

    if (len > 0 && source[i + len] === '?') len++;
    return [unbounded, len];
  };

  while (i < source.length) {
    const ch = source[i];
    let atomWild = false;
    let group;

    if (ch === '(') {
      stack.push(frame(/^\(\?<?[=!]/.test(source.slice(i, i + 4))));
      i++;
      continue;
    }

    if (ch === '\\') {
      atomWild = /[SWD]/.test(source[i + 1] || '');
      i += 2;
    } else if (ch === '[') {
      atomWild = source[i + 1] === '^';
      i++;
      if (source[i] === '^') i++;
      if (source[i] === ']') i++;
      while (i < source.length && source[i] !== ']') {
        if (source[i] === '\\') {
          if (/[SWD]/.test(source[i + 1] || '')) atomWild = true;
          i++;
        }
        i++;
      }
      i++;
    } else if (ch === ')') {
      if (stack.length > 1) group = stack.pop();
      i++;
    } else {
      atomWild = ch === '.';
      i++;
    }

    const [repeated, len] = quantifier();
    i += len;

    const parent = stack[stack.length - 1];

    if (group) {
      if (group.look) continue;
      if (repeated && group.wildRepeat) return true;
      if (group.wild) parent.wild = true;
      if (group.wildRepeat || (repeated && group.wild)) parent.wildRepeat = true;
    } else if (atomWild) {
      parent.wild = true;
      if (repeated) parent.wildRepeat = true;
    }
  }

  return false;
};

/**
 * Parse the given input string.
 * @param {String} input
 * @param {Object} options
 * @return {Object}
 */

const parse = (input, options) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected a string');
  }

  input = REPLACEMENTS[input] || input;

  const opts = { ...options };
  const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;

  let len = input.length;
  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  const bos = { type: 'bos', value: '', output: opts.prepend || '' };
  const tokens = [bos];

  const capture = opts.capture ? '' : '?:';
  const win32 = utils.isWindows(options);

  // create constants based on platform, for windows or posix
  const PLATFORM_CHARS = constants.globChars(win32);
  const EXTGLOB_CHARS = constants.extglobChars(PLATFORM_CHARS);

  const {
    DOT_LITERAL,
    PLUS_LITERAL,
    SLASH_LITERAL,
    ONE_CHAR,
    DOTS_SLASH,
    NO_DOT,
    NO_DOT_SLASH,
    NO_DOTS_SLASH,
    QMARK,
    QMARK_NO_DOT,
    STAR,
    START_ANCHOR
  } = PLATFORM_CHARS;

  const globstar = opts => {
    return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
  };

  const nodot = opts.dot ? '' : NO_DOT;
  const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
  let star = opts.bash === true ? globstar(opts) : STAR;

  if (opts.capture) {
    star = `(${star})`;
  }

  // minimatch options support
  if (typeof opts.noext === 'boolean') {
    opts.noextglob = opts.noext;
  }

  const state = {
    input,
    index: -1,
    start: 0,
    dot: opts.dot === true,
    consumed: '',
    output: '',
    prefix: '',
    backtrack: false,
    negated: false,
    brackets: 0,
    braces: 0,
    parens: 0,
    quotes: 0,
    globstar: false,
    tokens
  };

  input = utils.removePrefix(input, state);
  len = input.length;

  const extglobs = [];
  const braces = [];
  const stack = [];
  let prev = bos;
  let value;

  /**
   * Tokenizing helpers
   */

  const eos = () => state.index === len - 1;
  const peek = state.peek = (n = 1) => input[state.index + n];
  const advance = state.advance = () => input[++state.index] || '';
  const remaining = () => input.slice(state.index + 1);
  const consume = (value = '', num = 0) => {
    state.consumed += value;
    state.index += num;
  };

  const append = token => {
    state.output += token.output != null ? token.output : token.value;
    consume(token.value);
  };

  const negate = () => {
    let count = 1;

    while (peek() === '!' && (peek(2) !== '(' || peek(3) === '?')) {
      advance();
      state.start++;
      count++;
    }

    if (count % 2 === 0) {
      return false;
    }

    state.negated = true;
    state.start++;
    return true;
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
      const isBrace = state.braces > 0 && (tok.type === 'comma' || tok.type === 'brace');
      const isExtglob = tok.extglob === true || (extglobs.length && (tok.type === 'pipe' || tok.type === 'paren'));

      if (tok.type !== 'slash' && tok.type !== 'paren' && !isBrace && !isExtglob) {
        state.output = state.output.slice(0, -prev.output.length);
        prev.type = 'star';
        prev.value = '*';
        prev.output = star;
        state.output += prev.output;
      }
    }

    if (extglobs.length && tok.type !== 'paren') {
      extglobs[extglobs.length - 1].inner += tok.value;
    }

    if (tok.value || tok.output) append(tok);
    if (prev && prev.type === 'text' && tok.type === 'text') {
      const track = appendSource(prev, tok.output != null ? tok.output : tok.value);
      prev.value += tok.value;
      prev.output = (prev.output || '') + tok.value;
      track();
      return;
    }

    tok.prev = prev;
    tokens.push(tok);
    prev = tok;
  };

  const extglobOpen = (type, value) => {
    const token = { ...EXTGLOB_CHARS[value], conditions: 1, inner: '' };

    token.prev = prev;
    token.parens = state.parens;
    token.output = state.output;
    token.startIndex = state.index;
    token.tokensIndex = tokens.length;
    const output = (opts.capture ? '(' : '') + token.open;

    increment('parens');
    push({ type, value, output: state.output ? '' : ONE_CHAR });
    push({ type: 'paren', extglob: true, value: advance(), output });
    extglobs.push(token);
  };

  const extglobClose = token => {
    const literal = input.slice(token.startIndex, state.index + 1);
    const body = input.slice(token.startIndex + 2, state.index);
    const analysis = analyzeRepeatedExtglob(body, opts);
    const repeated = token.type === 'plus' || token.type === 'star';
    let output = token.close + (opts.capture ? ')' : '');
    let flattenedClose = false;
    let flattened;

    // A wildcard inside a repeat nests one unbounded quantifier in another,
    // which backtracks exponentially on input that almost matches
    // (CVE-2026-112366). Rewrite the repeat exactly when we can, and treat it
    // as risky otherwise.
    // A brace range can pop the tokens this extglob opened with; then there is
    // nothing left to analyse here (the final check in `parse` still applies).
    const opener = tokens[token.tokensIndex];
    const intact = opener !== undefined && opener.type === token.type &&
      tokens[token.tokensIndex + 1] !== undefined && tokens[token.tokensIndex + 1].type === 'paren';

    if (repeated && intact && !analysis.risky && opts.maxExtglobRecursion !== false) {
      const bodyTokens = tokens.slice(token.tokensIndex + 2);

      if (isRepeatedNegation(bodyTokens, [star, STAR, globstar(opts)], opts.capture === true)) {
        // `+(!(x))` is a zero-width test followed by a star, so the first
        // repeat's star absorbs every later repeat: one repeat is enough.
        opener.wildcard = true;
        output = (token.type === 'star' ? ')?' : ')') + (opts.capture ? ')' : '');
        flattenedClose = true;
        state.rewritten = true;
      } else if (hasRepeatedWildcard(bodyTokens)) {
        const flags = (opts.flags || (opts.nocase ? 'i' : '')).replace(/[gy]/g, '');
        // The tokens hold what will be emitted; `state.output` can still be
        // stale here (POSIX classes are only applied by the final rebuild).
        // Quoted text right after the `(` is kept on the paren token.
        const paren = tokens[token.tokensIndex + 1];
        const parenSource = tokenSource(paren);
        const head = parenSource === undefined ? undefined : parenSource.slice((paren.output != null ? paren.output : paren.value).length);
        const sources = [head, ...bodyTokens.map(t => {
          const src = tokenSource(t);
          return src === undefined ? undefined : src + (t.suffix || '');
        })];
        flattened = sources.includes(undefined)
          ? undefined
          : flattenRepeatedWildcard(sources.join(''), token.type, [star, '.*?'], flags);
        if (!flattened) analysis.risky = true;
        state.rewritten = true;
      }
    }

    // What `state.output` held before this extglob. `token.output` is a
    // snapshot from before the extglob's own tokens were pushed, which can be
    // stale (pushing `+(` demotes a preceding `**` to `*`); derive it from the
    // current output when the tokens account for its tail.
    let prefix = token.output;
    if (intact && (flattened || (repeated && analysis.risky))) {
      const sources = tokens.slice(token.tokensIndex).map(t => tokenSource(t));
      const tail = sources.includes(undefined) ? undefined : sources.join('');
      if (tail !== undefined && state.output.endsWith(tail)) {
        prefix = state.output.slice(0, state.output.length - tail.length);
      }
    }

    if (flattened) {
      // The whole rewrite goes on the closing paren, which keeps a non-empty
      // output: rebuilds that fall back from an empty output to the token's
      // value (literal braces) would otherwise emit the old `+` and `)`.
      const close = (token.output ? '' : ONE_CHAR) + (opts.capture ? `(${flattened})` : flattened);

      for (let i = token.tokensIndex; i < tokens.length; i++) {
        tokens[i].value = '';
        tokens[i].output = '';
        delete tokens[i].suffix;
        delete tokens[i].src;
        delete tokens[i].srcBase;
      }

      opener.wildcard = true;
      state.output = prefix;

      push({ type: 'paren', extglob: true, value, output: close, groupOpen: token.tokensIndex, wild: true, flattened: true });
      decrement('parens');
      return;
    }

    if (repeated && analysis.risky) {
      const safeOutput = analysis.safeOutput
        ? (token.output ? '' : ONE_CHAR) + (opts.capture ? `(${analysis.safeOutput})` : analysis.safeOutput)
        : undefined;
      const open = tokens[token.tokensIndex];

      open.type = 'text';
      open.value = literal;
      open.output = safeOutput || utils.escapeRegex(literal);
      delete open.src;
      delete open.srcBase;

      for (let i = token.tokensIndex + 1; i < tokens.length; i++) {
        tokens[i].value = '';
        tokens[i].output = '';
        delete tokens[i].suffix;
        delete tokens[i].src;
        delete tokens[i].srcBase;
      }

      state.output = prefix + open.output;
      state.backtrack = true;

      push({ type: 'paren', extglob: true, value, output: '', groupOpen: intact ? token.tokensIndex : undefined, wild: false });
      decrement('parens');
      return;
    }

    let rest;

    if (token.type === 'negate') {
      let extglobStar = star;

      if (token.inner && token.inner.length > 1 && token.inner.includes('/')) {
        extglobStar = globstar(opts);
      }

      if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
        output = token.close = `)$))${extglobStar}`;
      }

      if (token.inner.includes('*') && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
        // Any non-magical string (`.ts`) or even nested expression (`.{ts,tsx}`) can follow after the closing parenthesis.
        // In this case, we need to parse the string and use it in the output of the original pattern.
        // Suitable patterns: `/!(*.d).ts`, `/!(*.d).{ts,tsx}`, `**/!(*-dbg).@(js)`.
        //
        // Disabling the `fastpaths` option due to a problem with parsing strings as `.ts` in the pattern like `**/!(*.d).ts`.
        const expression = parse(rest, { ...options, fastpaths: false }).output;

        output = token.close = `)${expression})${extglobStar})`;
      }

      if (token.prev.type === 'bos') {
        state.negatedExtglob = true;
      }
    }

    if (intact) {
      const wild = token.type === 'negate' || opener.wildcard === true ||
        hasRepeatedWildcard(tokens.slice(token.tokensIndex + 2));
      push({ type: 'paren', extglob: true, value, output, groupOpen: token.tokensIndex, wild, flattened: flattenedClose });
    } else {
      push({ type: 'paren', extglob: true, value, output });
    }
    decrement('parens');
  };

  /**
   * Fast paths
   */

  if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
    let backslashes = false;

    let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index) => {
      if (first === '\\') {
        backslashes = true;
        return m;
      }

      if (first === '?') {
        if (esc) {
          return esc + first + (rest ? QMARK.repeat(rest.length) : '');
        }
        if (index === 0) {
          return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : '');
        }
        return QMARK.repeat(chars.length);
      }

      if (first === '.') {
        return DOT_LITERAL.repeat(chars.length);
      }

      if (first === '*') {
        if (esc) {
          return esc + first + (rest ? star : '');
        }
        return star;
      }
      return esc ? m : `\\${m}`;
    });

    if (backslashes === true) {
      if (opts.unescape === true) {
        output = output.replace(/\\/g, '');
      } else {
        output = output.replace(/\\+/g, m => {
          return m.length % 2 === 0 ? '\\\\' : (m ? '\\' : '');
        });
      }
    }

    if (output === input && opts.contains === true) {
      state.output = input;
      return state;
    }

    state.output = utils.wrapOutput(output, state, options);
    return state;
  }

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
      const next = peek();

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
      const match = /^\\+/.exec(remaining());
      let slashes = 0;

      if (match && match[0].length > 2) {
        slashes = match[0].length;
        state.index += slashes;
        if (slashes % 2 !== 0) {
          value += '\\';
        }
      }

      if (opts.unescape === true) {
        value = advance();
      } else {
        value += advance();
      }

      if (state.brackets === 0) {
        push({ type: 'text', value });
        continue;
      }
    }

    /**
     * If we're inside a regex character class, continue
     * until we reach the closing bracket.
     */

    if (state.brackets > 0 && (value !== ']' || prev.value === '[' || prev.value === '[^')) {
      if (opts.posix !== false && value === ':') {
        const inner = prev.value.slice(1);
        if (inner.includes('[')) {
          prev.posix = true;

          if (inner.includes(':')) {
            const idx = prev.value.lastIndexOf('[');
            const pre = prev.value.slice(0, idx);
            const rest = prev.value.slice(idx + 2);
            const posix = POSIX_REGEX_SOURCE[rest];
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

      if ((value === '[' && peek() !== ':') || (value === '-' && peek() === ']')) {
        value = `\\${value}`;
      }

      if (value === ']' && (prev.value === '[' || prev.value === '[^')) {
        value = `\\${value}`;
      }

      if (opts.posix === true && value === '!' && prev.value === '[') {
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
      const track = appendSource(prev, value);
      prev.value += value;
      append({ value });
      track();
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
      increment('parens');
      push({ type: 'paren', value });
      continue;
    }

    if (value === ')') {
      if (state.parens === 0 && opts.strictBrackets === true) {
        throw new SyntaxError(syntaxError('opening', '('));
      }

      const extglob = extglobs[extglobs.length - 1];
      if (extglob && state.parens === extglob.parens + 1) {
        extglobClose(extglobs.pop());
        continue;
      }

      push({ type: 'paren', value, output: state.parens ? ')' : '\\)' });
      decrement('parens');
      continue;
    }

    /**
     * Square brackets
     */

    if (value === '[') {
      if (opts.nobracket === true || !remaining().includes(']')) {
        if (opts.nobracket !== true && opts.strictBrackets === true) {
          throw new SyntaxError(syntaxError('closing', ']'));
        }

        value = `\\${value}`;
      } else {
        increment('brackets');
      }

      push({ type: 'bracket', value });
      continue;
    }

    if (value === ']') {
      if (opts.nobracket === true || (prev && prev.type === 'bracket' && prev.value.length === 1)) {
        push({ type: 'text', value, output: `\\${value}` });
        continue;
      }

      if (state.brackets === 0) {
        if (opts.strictBrackets === true) {
          throw new SyntaxError(syntaxError('opening', '['));
        }

        push({ type: 'text', value, output: `\\${value}` });
        continue;
      }

      decrement('brackets');

      const prevValue = prev.value.slice(1);
      if (prev.posix !== true && prevValue[0] === '^' && !prevValue.includes('/')) {
        value = `/${value}`;
      }

      prev.value += value;
      append({ value });

      // when literal brackets are explicitly disabled
      // assume we should match with a regex character class
      if (opts.literalBrackets === false || utils.hasRegexChars(prevValue)) {
        continue;
      }

      const escaped = utils.escapeRegex(prev.value);
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
      increment('braces');

      const open = {
        type: 'brace',
        value,
        output: '(',
        outputIndex: state.output.length,
        tokensIndex: state.tokens.length
      };

      braces.push(open);
      push(open);
      continue;
    }

    if (value === '}') {
      const brace = braces[braces.length - 1];

      if (opts.nobrace === true || !brace) {
        push({ type: 'text', value, output: value });
        continue;
      }

      let output = ')';

      if (brace.dots === true) {
        const arr = tokens.slice();
        const range = [];

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

      if (brace.comma !== true && brace.dots !== true) {
        const out = state.output.slice(0, brace.outputIndex);
        const toks = state.tokens.slice(brace.tokensIndex);
        brace.value = brace.output = '\\{';
        value = output = '\\}';
        state.output = out;
        for (const t of toks) {
          state.output += (t.output || t.value);
        }
      }

      push({ type: 'brace', value, output });
      decrement('braces');
      braces.pop();
      continue;
    }

    /**
     * Pipes
     */

    if (value === '|') {
      if (extglobs.length > 0) {
        extglobs[extglobs.length - 1].conditions++;
      }
      push({ type: 'text', value });
      continue;
    }

    /**
     * Commas
     */

    if (value === ',') {
      let output = value;

      const brace = braces[braces.length - 1];
      if (brace && stack[stack.length - 1] === 'braces') {
        brace.comma = true;
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
      if (prev.type === 'dot' && state.index === state.start + 1) {
        state.start = state.index + 1;
        state.consumed = '';
        state.output = '';
        tokens.pop();
        prev = bos; // reset "prev" to the first token
        continue;
      }

      push({ type: 'slash', value, output: SLASH_LITERAL });
      continue;
    }

    /**
     * Dots
     */

    if (value === '.') {
      if (state.braces > 0 && prev.type === 'dot') {
        if (prev.value === '.') prev.output = DOT_LITERAL;
        const brace = braces[braces.length - 1];
        prev.type = 'dots';
        prev.output += value;
        prev.value += value;
        brace.dots = true;
        continue;
      }

      if ((state.braces + state.parens) === 0 && prev.type !== 'bos' && prev.type !== 'slash') {
        push({ type: 'text', value, output: DOT_LITERAL });
        continue;
      }

      push({ type: 'dot', value, output: DOT_LITERAL });
      continue;
    }

    /**
     * Question marks
     */

    if (value === '?') {
      const isGroup = prev && prev.value === '(';
      if (!isGroup && opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        extglobOpen('qmark', value);
        continue;
      }

      if (prev && prev.type === 'paren' && prev.flattened === true && opts.capture !== true && prev.src === undefined) {
        // This `?` made the removed `+` or `*` lazy, which changes no match.
        // (With `capture` it follows the capture group and makes it optional;
        // after quoted text it belongs to that text. Both keep it.)
        push({ type: 'text', value: '', output: '' });
        continue;
      }

      if (prev && prev.type === 'paren') {
        const next = peek();
        let output = value;

        if (next === '<' && !utils.supportsLookbehinds()) {
          throw new Error('Node.js v10 or higher is required for regex lookbehinds');
        }

        if ((prev.value === '(' && !/[!=<:]/.test(next)) || (next === '<' && !/<([!=]|\w+>)/.test(remaining()))) {
          output = `\\${value}`;
        }

        push({ type: 'text', value, output });
        continue;
      }

      if (opts.dot !== true && (prev.type === 'slash' || prev.type === 'bos')) {
        push({ type: 'qmark', value, output: QMARK_NO_DOT });
        continue;
      }

      push({ type: 'qmark', value, output: QMARK });
      continue;
    }

    /**
     * Exclamation
     */

    if (value === '!') {
      if (opts.noextglob !== true && peek() === '(') {
        if (peek(2) !== '?' || !/[!=<:]/.test(peek(3))) {
          extglobOpen('negate', value);
          continue;
        }
      }

      if (opts.nonegate !== true && state.index === 0) {
        negate();
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

      if ((prev && prev.value === '(') || opts.regex === false) {
        push({ type: 'plus', value, output: PLUS_LITERAL });
        continue;
      }

      if ((prev && (prev.type === 'bracket' || prev.type === 'paren' || prev.type === 'brace')) || state.parens > 0) {
        // A regex `+` after a group that holds a wildcard nests the wildcard
        // in a repeat, the same ReDoS as `+(*)` (CVE-2026-112366). Bash reads
        // that `+` literally; so do we.
        if (opts.maxExtglobRecursion !== false && groupHasWildcard(tokens, tokens.length - 1)) {
          state.rewritten = true;
          push({ type: 'plus', value, output: PLUS_LITERAL });
          continue;
        }

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
        push({ type: 'at', extglob: true, value, output: '' });
        continue;
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Plain text
     */

    if (value !== '*') {
      if (value === '$' || value === '^') {
        value = `\\${value}`;
      }

      const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
      if (match) {
        value += match[0];
        state.index += match[0].length;
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
      prev.output = star;
      state.backtrack = true;
      state.globstar = true;
      consume(value);
      continue;
    }

    let rest = remaining();
    if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
      extglobOpen('star', value);
      continue;
    }

    if (prev.type === 'star') {
      if (opts.noglobstar === true) {
        consume(value);
        continue;
      }

      const prior = prev.prev;
      const before = prior.prev;
      const isStart = prior.type === 'slash' || prior.type === 'bos';
      const afterStar = before && (before.type === 'star' || before.type === 'globstar');

      if (opts.bash === true && (!isStart || (rest[0] && rest[0] !== '/'))) {
        push({ type: 'star', value, output: '' });
        continue;
      }

      const isBrace = state.braces > 0 && (prior.type === 'comma' || prior.type === 'brace');
      const isExtglob = extglobs.length && (prior.type === 'pipe' || prior.type === 'paren');
      if (!isStart && prior.type !== 'paren' && !isBrace && !isExtglob) {
        push({ type: 'star', value, output: '' });
        continue;
      }

      // strip consecutive `/**/`
      while (rest.slice(0, 3) === '/**') {
        const after = input[state.index + 4];
        if (after && after !== '/') {
          break;
        }
        rest = rest.slice(3);
        consume('/**', 3);
      }

      if (prior.type === 'bos' && eos()) {
        prev.type = 'globstar';
        prev.value += value;
        prev.output = globstar(opts);
        state.output = prev.output;
        state.globstar = true;
        consume(value);
        continue;
      }

      if (prior.type === 'slash' && prior.prev.type !== 'bos' && !afterStar && eos()) {
        state.output = state.output.slice(0, -(prior.output + prev.output).length);
        prior.output = `(?:${prior.output}`;

        prev.type = 'globstar';
        prev.output = globstar(opts) + (opts.strictSlashes ? ')' : '|$)');
        prev.value += value;
        state.globstar = true;
        state.output += prior.output + prev.output;
        consume(value);
        continue;
      }

      if (prior.type === 'slash' && prior.prev.type !== 'bos' && rest[0] === '/') {
        const end = rest[1] !== void 0 ? '|$' : '';

        state.output = state.output.slice(0, -(prior.output + prev.output).length);
        prior.output = `(?:${prior.output}`;

        prev.type = 'globstar';
        prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
        prev.value += value;

        state.output += prior.output + prev.output;
        state.globstar = true;

        consume(value + advance());

        push({ type: 'slash', value: '/', output: '' });
        continue;
      }

      if (prior.type === 'bos' && rest[0] === '/') {
        prev.type = 'globstar';
        prev.value += value;
        prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
        state.output = prev.output;
        state.globstar = true;
        consume(value + advance());
        push({ type: 'slash', value: '/', output: '' });
        continue;
      }

      // remove single star from output
      state.output = state.output.slice(0, -prev.output.length);

      // reset previous token to globstar
      prev.type = 'globstar';
      prev.output = globstar(opts);
      prev.value += value;

      // reset output with globstar
      state.output += prev.output;
      state.globstar = true;
      consume(value);
      continue;
    }

    const token = { type: 'star', value, output: star };

    if (opts.bash === true) {
      token.output = '.*?';
      if (prev.type === 'bos' || prev.type === 'slash') {
        token.output = nodot + token.output;
      }
      push(token);
      continue;
    }

    if (prev && (prev.type === 'bracket' || prev.type === 'paren') && opts.regex === true &&
      !(opts.maxExtglobRecursion !== false && groupHasWildcard(tokens, tokens.length - 1))) {
      token.output = value;
      push(token);
      continue;
    }

    if (state.index === state.start || prev.type === 'slash' || prev.type === 'dot') {
      if (prev.type === 'dot') {
        state.output += NO_DOT_SLASH;
        prev.output += NO_DOT_SLASH;

      } else if (opts.dot === true) {
        state.output += NO_DOTS_SLASH;
        prev.output += NO_DOTS_SLASH;

      } else {
        state.output += nodot;
        prev.output += nodot;
      }

      if (peek() !== '*') {
        state.output += ONE_CHAR;
        prev.output += ONE_CHAR;
      }
    }

    push(token);
  }

  // The repairs below escape the last unmatched opening, which may sit inside
  // a rewrite; the final check treats that as unsafe.
  const repaired = state.brackets > 0 || state.parens > 0 || state.braces > 0;

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
    push({ type: 'maybe_slash', value: '', output: `${SLASH_LITERAL}?` });
  }

  // rebuild the output if we had to backtrack at any point
  if (state.backtrack === true) {
    state.output = '';

    for (const token of state.tokens) {
      state.output += token.output != null ? token.output : token.value;

      if (token.suffix) {
        state.output += token.suffix;
      }
    }
  }

  // Last line of defence for CVE-2026-112366: however the pattern got there
  // (unbalanced parentheses are repaired after the extglob checks ran), never
  // return a regex that repeats a wildcard inside an unbounded repeat.
  // A rewrite above can also meet a later repair (unbalanced parentheses,
  // literal braces) that leaves an invalid regex; fall back the same way.
  if (opts.maxExtglobRecursion !== false) {
    let unsafe = hasNestedWildcardRepeat(state.output) || (repaired && state.rewritten === true);

    if (!unsafe && state.rewritten === true) {
      try {
        unsafe = !(new RegExp(state.output, (opts.flags || '').replace(/[gy]/g, '')) instanceof RegExp);
      } catch (err) {
        unsafe = true;
      }
    }

    if (unsafe) {
      state.output = (opts.prepend || '') + input.slice(state.start).replace(/[\\^$.*+?()[\]{}|/]/g, '\\$&');
    }
  }

  return state;
};

/**
 * Fast paths for creating regular expressions for common glob patterns.
 * This can significantly speed up processing and has very little downside
 * impact when none of the fast paths match.
 */

parse.fastpaths = (input, options) => {
  const opts = { ...options };
  const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
  const len = input.length;
  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  input = REPLACEMENTS[input] || input;
  const win32 = utils.isWindows(options);

  // create constants based on platform, for windows or posix
  const {
    DOT_LITERAL,
    SLASH_LITERAL,
    ONE_CHAR,
    DOTS_SLASH,
    NO_DOT,
    NO_DOTS,
    NO_DOTS_SLASH,
    STAR,
    START_ANCHOR
  } = constants.globChars(win32);

  const nodot = opts.dot ? NO_DOTS : NO_DOT;
  const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
  const capture = opts.capture ? '' : '?:';
  const state = { negated: false, prefix: '' };
  let star = opts.bash === true ? '.*?' : STAR;

  if (opts.capture) {
    star = `(${star})`;
  }

  const globstar = opts => {
    if (opts.noglobstar === true) return star;
    return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
  };

  const create = str => {
    switch (str) {
      case '*':
        return `${nodot}${ONE_CHAR}${star}`;

      case '.*':
        return `${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '*.*':
        return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '*/*':
        return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;

      case '**':
        return nodot + globstar(opts);

      case '**/*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;

      case '**/*.*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '**/.*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;

      default: {
        const match = /^(.*?)\.(\w+)$/.exec(str);
        if (!match) return;

        const source = create(match[1]);
        if (!source) return;

        return source + DOT_LITERAL + match[2];
      }
    }
  };

  const output = utils.removePrefix(input, state);
  let source = create(output);

  if (source && opts.strictSlashes !== true) {
    source += `${SLASH_LITERAL}?`;
  }

  return source;
};

module.exports = parse;
