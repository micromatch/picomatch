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

const buildCharClassStar = chars => {
  const source = chars.length === 1
    ? utils.escapeRegex(chars[0])
    : `[${chars.map(ch => utils.escapeRegex(ch)).join('')}]`;

  return `${source}*`;
};

const getStarExtglobSequenceChars = pattern => {
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

  return chars;
};

/**
 * Finds the unbounded quantifiers in a repeated extglob branch. Inside
 * `+(...)` or `*(...)` each one nests an unbounded quantifier inside another,
 * which backtracks catastrophically:
 * - a `*` wildcard at any depth (`+(*a)`, `+(@(*))`, `+(!(*a))`);
 * - a negation `!(` at any depth, whose output always ends in a star.
 * A `*(` or `+(` group is checked separately (see starRunOverlaps).
 * `leading` and `trailing` describe top-level `*` wildcards only. Stars inside
 * brackets or quotes are literal.
 */

const scanBranchStars = branch => {
  let bracket = 0;
  let paren = 0;
  let quote = 0;
  let escaped = false;
  let star = false;
  let leading = false;
  let trailing = false;

  for (let i = 0; i < branch.length; i++) {
    const ch = branch[i];
    trailing = false;

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

    if (ch === ')' && paren > 0) {
      paren--;
      continue;
    }

    const opens = branch[i + 1] === '(';

    if (opens && ch === '!') {
      star = true;
      continue;
    }

    if (ch !== '*' || opens) {
      continue;
    }

    star = true;

    if (paren === 0) {
      trailing = true;
      leading = leading || i === 0;
    }
  }

  return { star, leading, trailing };
};

/**
 * True when a branch holds only plain characters, `?`, `*` and brackets
 * without `/`, so that every match of it is a run of characters other than `/`.
 */

const isSegmentSequence = branch => /^(?:\\[^/|]|\[[^\]/\\]+\]|[^\\/[\]{}()"|])+$/.test(branch);

/**
 * Decides whether a repeated extglob with starred branches can be rewritten
 * without nesting quantifiers. When every starred branch ends with `*`, a copy
 * after the first starred copy is absorbed by that trailing `*`, so the repeat
 * only needs the star-free branches: `+(a*|b)` matches `(b)*(a*|b)` and
 * `*(a*|b)` matches `(b)*(a*)?`. Leading stars mirror that. With no star-free
 * branch, one starred branch absorbs every other copy wherever its `*` is.
 */

const absorbRepeat = scans => {
  if (!scans.every(scan => scan.segment)) {
    return;
  }

  const starred = scans.filter(scan => scan.star);
  const allStarred = starred.length === scans.length;

  if (starred.every(scan => scan.trailing)) {
    return { starred: scans.map(scan => scan.star), leading: false };
  }

  if (starred.every(scan => scan.leading)) {
    return { starred: scans.map(scan => scan.star), leading: true };
  }

  if (allStarred && starred.length === 1) {
    return { starred: [true], leading: false };
  }
};

/**
 * Builds the regex source for an absorbed repeat from the regex source of each
 * branch, in branch order.
 */

/**
 * The index of the `)` that closes the `<op>(` group at the start of a branch,
 * for an `op` in `ops`, or undefined when the branch does not start with one.
 */

const groupEnd = (branch, ops) => {
  if (!ops.includes(branch[0]) || branch[1] !== '(') {
    return;
  }

  let depth = 0;
  let bracket = false;
  let escaped = false;

  for (let i = 1; i < branch.length; i++) {
    const ch = branch[i];

    if (escaped) {
      escaped = false;
    } else if (ch === '\\') {
      escaped = true;
    } else if (bracket) {
      bracket = ch !== ']';
    } else if (ch === '[') {
      bracket = true;
    } else if (ch === '(') {
      depth++;
    } else if (ch === ')' && --depth === 0) {
      return i;
    }
  }
};

/**
 * The body of a branch that is exactly one `<op>(...)` group, such as `a|b`
 * for `@(a|b)`. Undefined when the group closes before the end of the
 * branch, as in `@(a)b@(c)`.
 */

const wrappedBody = (branch, ops) => {
  const end = groupEnd(branch, ops);
  return end === branch.length - 1 ? branch.slice(2, -1) : undefined;
};

/**
 * The branches of a repeated extglob with every `@(...)` group that makes up
 * a whole branch replaced by its own branches: `+(@(a|+(b))|c)` repeats
 * `a`, `+(b)` and `c`. A nested repeat or an ambiguous alternation hidden
 * inside `@(...)` backtracks just like a bare one.
 */

const flattenBranches = branches => branches.flatMap(branch => {
  const body = wrappedBody(branch, '@');
  return body === undefined ? [branch] : flattenBranches(splitTopLevel(body).map(part => part.trim()));
});

const ANY_CHAR = 'any';

/**
 * The characters a bracket expression's body matches, or any character when
 * it is negated or spans more than 256 characters. Undefined for a reversed
 * range, which picomatch does not compile to a character class.
 */

const bracketChars = (inner, fold) => {
  if (/^[!^]/.test(inner)) {
    return ANY_CHAR;
  }

  const set = new Set();

  for (let j = 0; j < inner.length; j++) {
    if (inner[j + 1] === '-' && j + 2 < inner.length) {
      const from = inner.charCodeAt(j);
      const to = inner.charCodeAt(j + 2);
      if (to < from) return;
      if (to - from > 256) return ANY_CHAR;
      for (let code = from; code <= to; code++) set.add(fold(String.fromCharCode(code)));
      j += 2;
    } else {
      set.add(fold(inner[j]));
    }
  }

  return set;
};

/**
 * What the bracket expression starting at `start` can match, and the index of
 * its `]`. picomatch compiles a body without regex characters, such as
 * `[ab]`, to the literal text `[ab]` or the class, so both are options.
 * A POSIX class such as `[[:alpha:]]` matches some one character. A `[`
 * without a `]` in the branch is literal. Undefined when the bracket is not
 * modelled: an escape, a `/`, a `]` first, a nested `[`, an unknown POSIX
 * name, an astral character under the `u` flag, or `nobracket`.
 */

const bracketOptions = (branch, start, model) => {
  if (model.nobracket) {
    return;
  }

  let inner = '';
  let posix = false;

  for (let j = start + 1; j < branch.length; j++) {
    const ch = branch[j];

    if (ch === ']' && inner !== '') {
      const chars = posix ? ANY_CHAR : bracketChars(inner, model.fold);
      if (chars === undefined || chars.size === 0) return;
      if (utils.hasRegexChars(inner) || model.literalBrackets === false) return { end: j, options: [[chars]] };
      if (posix) return;
      const literal = [...`[${inner}]`].map(c => new Set([model.fold(c)]));
      return { end: j, options: [[chars], literal] };
    }

    if (ch === '[' && branch[j + 1] === ':' && model.posix) {
      const close = branch.indexOf(':]', j + 2);
      if (close < 0 || !POSIX_REGEX_SOURCE[branch.slice(j + 2, close)]) return;
      inner += POSIX_REGEX_SOURCE[branch.slice(j + 2, close)];
      posix = true;
      j = close + 1;
      continue;
    }

    if (/[[\]\\/]/.test(ch) || (model.unicode && /[\ud800-\udfff]/.test(ch))) {
      return;
    }

    inner += ch;
  }

  return { end: start, options: [[new Set(['['])]] };
};

const overlaps = (a, b) => a === ANY_CHAR || b === ANY_CHAR || [...a].some(ch => b.has(ch));

/**
 * The rest of each `long` that some `short` can match the start of.
 */

const danglingSuffixes = (shorts, longs) => shorts.flatMap(short => longs
  .filter(long => long !== short && short.length <= long.length && short.every((set, i) => overlaps(set, long[i])))
  .map(long => long.slice(short.length)));

/**
 * True when some text splits into copies of the branches in two ways, as
 * with `[ab]|b` or `a|b|ab` (the Sardinas-Patterson test, over sets of
 * characters, so it can only overstate). A failing match of the repeat then
 * tries every split and backtracks catastrophically.
 */

const isAmbiguous = codes => {
  const key = sets => sets.map(set => (set === ANY_CHAR ? '?' : [...set].sort().join(''))).join('|');
  const seen = new Set();
  let current = danglingSuffixes(codes, codes);

  for (let i = 0; i < codes.length; i++) {
    for (let j = i + 1; j < codes.length; j++) {
      if (key(codes[i]) === key(codes[j])) return true;
    }
  }

  while (current.length > 0) {
    if (current.some(sets => sets.length === 0)) return true;
    const fresh = current.filter(sets => !seen.has(key(sets)) && seen.add(key(sets)));
    current = [...danglingSuffixes(codes, fresh), ...danglingSuffixes(fresh, codes)];
  }

  return false;
};

/** Most texts modelled per branch; a branch with more is not modelled. */
const MAX_CODES = 64;

/**
 * The texts a branch can match, as character sets per position, case-folded
 * under `nocase`. A nested `@(x)` or bare `(x)` group contributes each
 * alternative, `?(x)` also nothing, `+(x)` one or two copies and `*(x)` none,
 * one or two: `a*(b)` gives `a`, `ab` and `abb`. When `model.nested` is
 * false, because maxExtglobRecursion allows nested repeats, `+(x)` and `*(x)`
 * count once. Only characters picomatch is known to compile to themselves
 * are modelled.
 * Undefined when the branch is not modelled: a `*` wildcard or a negation
 * (which scanBranch covers), a brace, a quote, a bare `+` or `@` (`a+` is a
 * regex quantifier inside an extglob), an escaped letter or digit (`\d`
 * reaches the regex as a class), a bracket bracketOptions does not model, an
 * astral character under the `u` flag, any other syntax, or more than
 * MAX_CODES texts. The caller treats an unmodelled branch as risky, so
 * nothing the model misses is let through.
 */

const branchCodes = (branch, model) => {
  let codes = [[]];

  for (let i = 0; i < branch.length; i++) {
    const ch = branch[i];
    const bare = ch === '(' ? 1 : 0;
    const end = bare ? groupEnd(`@${branch.slice(i)}`, '@') : groupEnd(branch.slice(i), '*?+@');
    let options;

    if (end !== undefined) {
      const parts = splitTopLevel(branch.slice(i + 2 - bare, i + end - bare)).map(part => branchCodes(part.trim(), model));
      if (parts.some(part => part === undefined)) return;
      const alts = parts.flat();
      const twice = model.nested ? alts.flatMap(first => alts.map(second => [...first, ...second])) : [];
      options = {
        '(': alts,
        '@': alts,
        '?': [[], ...alts],
        '+': [...alts, ...twice],
        '*': [[], ...alts, ...twice]
      }[ch];
      i += end - bare;
    } else if (ch === '\\') {
      // `\*` is a literal `*`, but `\d`, `\w` or `\x61` reach the regex as escapes.
      if (model.unescape || !/^[^a-zA-Z0-9\\]$/.test(branch[i + 1] || '')) return;
      options = [[new Set([model.fold(branch[++i])])]];
    } else if (ch === '?') {
      options = [[ANY_CHAR]];
    } else if (ch === '/') {
      options = [[new Set(['/', '\\'])]];
    } else if (ch === '[') {
      const bracket = bracketOptions(branch, i, model);
      if (!bracket) return;
      options = bracket.options;
      i = bracket.end;
    } else if (/[a-zA-Z0-9_.,:;=~#%&'<>$^ -]/.test(ch) || (ch > '\x7f' && !(model.unicode && /[\ud800-\udfff]/.test(ch)))) {
      options = [[new Set([model.fold(ch)])]];
    } else {
      return;
    }

    if (options.length === 0 || codes.length * options.length > MAX_CODES) return;

    if (options.length === 1) {
      for (const code of codes) code.push(...options[0]);
    } else {
      codes = codes.flatMap(code => options.map(option => [...code, ...option]));
    }
  }

  return codes;
};

/**
 * Reads the run of `*(...)` and `+(...)` groups that starts a branch, when
 * every alternative in it is one character or itself such a run, as in
 * `*(a)`, `+(*(a)|b)`. Returns the characters a copy can start with and the
 * rest of the branch, or undefined when the branch does not start that way.
 */

const leadingRun = branch => {
  const chars = [];
  let index = 0;
  let match = parseRepeatedExtglob(branch, false);

  while (match) {
    for (const part of splitTopLevel(match.body)) {
      const simple = normalizeSimpleBranch(part);
      const nested = simple && simple.length === 1 ? undefined : leadingRun(part);

      if (simple && simple.length === 1) {
        chars.push(simple);
      } else if (nested && nested.rest === '') {
        chars.push(...nested.chars);
      } else {
        return;
      }
    }

    index += match.end + 1;
    match = parseRepeatedExtglob(branch.slice(index), false);
  }

  return chars.length ? { chars, rest: branch.slice(index) } : undefined;
};

/**
 * True when a branch starts with such a run and continues with one of its
 * characters, as in `+(*(a)a)`, or (when `wrapped`, as in `+(@(*(a)))`) ends
 * there. A copy's boundary is then ambiguous and the repeat backtracks
 * catastrophically. A run followed by any other character (`+(*(a)b)`), or a
 * group of several characters (`*(*(of*(o)x)o)`), keeps copies apart. A bare
 * `+(+(a))` is left to the maxExtglobRecursion check.
 */

const starRunOverlaps = (branch, wrapped) => {
  const run = leadingRun(branch);

  if (!run) {
    return false;
  }

  const rest = run.rest.replace(/^\\/, '');
  return rest === '' ? wrapped : run.chars.includes(rest[0]);
};

/**
 * Scans one branch. `@(x)` and `?(x)` around one alternative are unwrapped,
 * since a quantifier in `x` is nested in the repeat all the same; `@(x)`
 * matches exactly what `x` matches, so it may still be absorbed. A lone
 * negation `!(x)` behaves like a branch ending in `*`: its lookahead depends
 * only on where the copy starts, and its star absorbs every later copy.
 */

const scanBranch = branch => {
  let core = branch;
  let exact = true;
  let body = wrappedBody(core, '@?');

  while (body !== undefined && splitTopLevel(body).length === 1) {
    exact = exact && core[0] === '@';
    core = body;
    body = wrappedBody(core, '@?');
  }

  const inner = wrappedBody(core, '!');
  if (inner !== undefined && splitTopLevel(inner).length === 1 && isSegmentSequence(inner)) {
    return { star: true, leading: false, trailing: true, segment: exact };
  }

  const scan = scanBranchStars(core);
  return {
    ...scan,
    star: scan.star || starRunOverlaps(core, core !== branch),
    segment: exact && isSegmentSequence(core)
  };
};

const buildAbsorbedRepeat = (type, outputs, absorb) => {
  const starred = outputs.filter((_, i) => absorb.starred[i]).join('|');
  const rest = outputs.filter((_, i) => !absorb.starred[i]).join('|');

  if (!rest) {
    return type === 'plus' ? `(?:${starred})` : `(?:${starred})?`;
  }

  const one = type === 'plus' ? `(?:${starred}|${rest})` : `(?:${starred})?`;
  return absorb.leading ? `${one}(?:${rest})*` : `(?:${rest})*${one}`;
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

  const written = splitTopLevel(body).map(branch => branch.trim());

  if (written.length > 1) {
    if (
      written.some(branch => branch === '') ||
      written.some(branch => /^[*?]+$/.test(branch)) ||
      hasRepeatedCharPrefixOverlap(written)
    ) {
      return { risky: true };
    }
  }

  const branches = flattenBranches(written);

  // A repeated extglob is "risky" (prone to catastrophic backtracking) when a
  // branch is itself a `*(...)` sequence, since that nests an unbounded quantifier
  // inside the outer `+(...)`/`*(...)`. When *every* branch reduces to single
  // characters we can emit one flat, ReDoS-safe character class that preserves the
  // meaning of ALL branches (e.g. `+(*(a)|*(b))` -> `[ab]*`), rather than dropping
  // every branch but the first.
  const safeChars = [];
  let sawStarSequence = false;
  let combinable = true;

  for (const branch of branches) {
    const chars = getStarExtglobSequenceChars(branch);
    if (chars) {
      sawStarSequence = true;
      safeChars.push(...chars);
      continue;
    }

    const literal = normalizeSimpleBranch(branch);
    if (literal && literal.length === 1) {
      safeChars.push(literal);
      continue;
    }

    combinable = false;

    if (repeatedExtglobRecursion(branch) > max) {
      return { risky: true };
    }
  }

  if (sawStarSequence) {
    return combinable
      ? { risky: true, safeOutput: buildCharClassStar([...new Set(safeChars)]) }
      : { risky: true };
  }

  // A top-level `*` in any branch, even a lone branch as in `+(*)` or `+(*a)`,
  // nests an unbounded quantifier inside the repeat.
  // Branches that can split the same text into copies in two ways make every
  // copy ambiguous.
  // A branch the model cannot read, and that no star check covers, is risky:
  // the check fails closed rather than trusting what it did not model.
  // Case folds through upper case, which joins at least every pair of
  // characters the `i` flag does (`σ` and `ς`, `ſ` and `s`).
  const flags = typeof options.flags === 'string' ? options.flags : '';
  const fold = options.nocase || flags.includes('i') ? ch => ch.toUpperCase().toLowerCase() : ch => ch;
  const model = {
    fold,
    nested: max === 0,
    unicode: /[uv]/.test(flags),
    posix: options.posix !== false,
    literalBrackets: options.literalBrackets,
    nobracket: options.nobracket === true,
    unescape: options.unescape === true
  };
  const scans = branches.map(scanBranch);
  const modelled = branches.map(branch => branchCodes(branch, model));
  if (modelled.some((own, i) => own === undefined && !scans[i].star)) {
    return { risky: true };
  }

  // Two texts of one branch that are the same, as with `(a|a)`, are two ways
  // to match it, so they are kept.
  const codes = modelled.flatMap(own => (own || []).filter(sets => sets.length > 0));
  if (codes.length > 1 && isAmbiguous(codes)) {
    return { risky: true };
  }

  if (scans.some(scan => scan.star)) {
    const absorb = absorbRepeat(scans);
    return absorb ? { risky: true, absorb } : { risky: true };
  }

  return { risky: false };
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

  // create constants based on platform, for windows or posix
  const PLATFORM_CHARS = constants.globChars(opts.windows);
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
    return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL})[\\s\\S])*?)`;
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
      prev.output = (prev.output || prev.value) + tok.value;
      prev.value += tok.value;
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

    if (analysis.absorb) {
      const open = tokens[token.tokensIndex];
      const prefix = token.output.length + open.output.length + tokens[token.tokensIndex + 1].output.length;
      const outputs = splitTopLevel(state.output.slice(prefix));

      analysis.safeOutput = outputs.length === analysis.absorb.starred.length
        ? buildAbsorbedRepeat(token.type, outputs, analysis.absorb)
        : undefined;
    }

    if ((token.type === 'plus' || token.type === 'star') && analysis.risky) {
      const safeOutput = analysis.safeOutput
        ? (token.output ? '' : ONE_CHAR) + (opts.capture ? `(${analysis.safeOutput})` : analysis.safeOutput)
        : undefined;
      const open = tokens[token.tokensIndex];

      open.type = 'text';
      open.value = literal;
      open.output = safeOutput || utils.escapeRegex(literal);

      for (let i = token.tokensIndex + 1; i < tokens.length; i++) {
        tokens[i].value = '';
        tokens[i].output = '';
        delete tokens[i].suffix;
      }

      state.output = token.output + open.output;
      state.backtrack = true;

      push({ type: 'paren', extglob: true, value, output: '' });
      decrement('parens');
      return;
    }

    let output = token.close + (opts.capture ? ')' : '');
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

    push({ type: 'paren', extglob: true, value, output });
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

      if (value === '!' && prev.value === '[' && opts.literalBrackets !== true) {
        const isLoneNegation = peek() === ']' && !remaining().slice(1).includes(']');
        if (!isLoneNegation) {
          // POSIX bracket negation: [!abc] is equivalent to [^abc]
          value = '^';
        }
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

      if (prev && prev.type === 'paren') {
        const next = peek();
        let output = value;

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

      // A globstar followed only by balanced closing parens is at the logical end of patterns like
      // `test(/utils/**)` and `test?(/utils/**)`. Treat it as EOS so the trailing `/**` can match its
      // parent path, except in negated extglobs where that would change the exclusion semantics.
      const isEnd = eos() || (
        state.parens > 0
        && rest === ')'.repeat(state.parens)
        && !extglobs.some(extglob => extglob.type === 'negate')
      );

      if (prior.type === 'bos' && eos()) {
        prev.type = 'globstar';
        prev.value += value;
        prev.output = globstar(opts);
        state.output = prev.output;
        state.globstar = true;
        consume(value);
        continue;
      }

      if (prior.type === 'slash' && prior.prev.type !== 'bos' && !afterStar && isEnd) {
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

    if (prev && (prev.type === 'bracket' || prev.type === 'paren') && opts.regex === true) {
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
  } = constants.globChars(opts.windows);

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
    return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL})[\\s\\S])*?)`;
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

        // A bare `**` here is adjacent to a literal extension in the same path
        // segment (e.g. `**.js`), so it must act as a single star rather than a
        // globstar. Bail out of the fast path and let the full parser handle it.
        if (match[1] === '**') return;

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
