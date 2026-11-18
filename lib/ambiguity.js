'use strict';

/**
 * Exponential backtracking (ReDoS) check for generated regex sources.
 *
 * A backtracking regex engine takes exponential time on a failing match
 * exactly when the regex is exponentially ambiguous: some state can return
 * to itself in two different ways that read the same text. Each extra
 * repetition of that text then doubles the number of ways to match it, and
 * a failing match tries them all.
 *
 * Weber & Seidl (1991): an NFA has exponential degree of ambiguity iff its
 * product automaton has a strongly connected component that contains a
 * diagonal pair (q, q) and a non-diagonal pair (p, p').
 *
 * `hasExponentialBacktracking(source, flags)` builds the Glushkov (position)
 * automaton of a regex source and runs that test, with two additions so it
 * models a backtracking engine rather than a plain NFA:
 *
 *  - Every edge counts the distinct derivations that take it. In `(a+)+`
 *    the engine can go from one `a` to the next through the inner or the
 *    outer loop, and in `(?:a(?:|)b)+` through either empty branch. Two
 *    derivations of one edge on a cycle are two ways round that cycle.
 *    Empty iterations of an optional repeat are not counted: JavaScript
 *    rejects them.
 *  - Lookaround bodies match nothing on the main path, but the engine still
 *    runs each one, so every body is analysed as a regex of its own.
 *
 * The simplifications err on the side of reporting ambiguity: anchors, word
 * boundaries and lookarounds count as the empty string, a counted repeat
 * like {2,5} as an unbounded loop, \p{...} as any character, and legacy
 * octal escapes as any character up to \377, and a backreference as any
 * text. A repeat of a fixed sequence containing a backreference, like
 * `(\1)+`, splits its input in only one way, so it counts as any text as a
 * whole. A source it cannot parse is treated as unsafe.
 */

const EDA_MAX_SCC_POSITIONS = 400;
const EDA_MAX = 0x10ffff;
const EDA_CAP = 2; // derivation counts only need to distinguish 0, 1 and "2 or more"

const edaAdd = (a, b) => Math.min(EDA_CAP, a + b);
const edaMul = (a, b) => Math.min(EDA_CAP, a * b);

// --- character sets ---------------------------------------------------------
// A set is { neg, ranges }: ranges are sorted, non-overlapping [lo, hi] pairs,
// and neg = true means "every character except these".

const edaNormalize = ranges => {
  const sorted = ranges.filter(r => r[0] <= r[1]).sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1] + 1) {
      last[1] = Math.max(last[1], r[1]);
    } else {
      out.push([r[0], r[1]]);
    }
  }
  return out;
};

const edaIntersectRanges = (a, b) => {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const lo = Math.max(a[i][0], b[j][0]);
    const hi = Math.min(a[i][1], b[j][1]);
    if (lo <= hi) out.push([lo, hi]);
    if (a[i][1] < b[j][1]) i++;
    else j++;
  }
  return out;
};

const edaComplementRanges = a => {
  const out = [];
  let next = 0;
  for (const [lo, hi] of a) {
    if (lo > next) out.push([next, lo - 1]);
    next = hi + 1;
  }
  if (next <= EDA_MAX) out.push([next, EDA_MAX]);
  return out;
};

const edaSubtractRanges = (a, b) => edaIntersectRanges(a, edaComplementRanges(b));

const edaSet = (ranges, neg = false) => ({ neg, ranges: edaNormalize(ranges) });

// The characters a set matches, as plain ranges.
const edaMembers = set => (set.neg ? edaComplementRanges(set.ranges) : set.ranges);

const edaRangesOverlap = (a, b) => {
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i][1] < b[j][0]) i++;
    else if (b[j][1] < a[i][0]) j++;
    else return true;
  }
  return false;
};

const EDA_DIGIT = [[48, 57]];
const EDA_WORD = [[48, 57], [65, 90], [95, 95], [97, 122]];
const EDA_SPACE = [
  [9, 13], [32, 32], [160, 160], [5760, 5760], [8192, 8202], [8232, 8233],
  [8239, 8239], [8287, 8287], [12288, 12288], [65279, 65279]
];
const EDA_LINE_TERMINATORS = [[10, 10], [13, 13], [8232, 8233]];
const EDA_ALL = [[0, EDA_MAX]];

// --- case folding (the `i` flag) ---------------------------------------------
// Two characters match each other under `i` when they have the same canonical
// form. Without `u` that is the spec's Canonicalize (toUpperCase, unless that
// turns a non-ASCII character into an ASCII one). With `u` the spec uses
// Unicode simple case folding; here every character is grouped with its
// toLowerCase / toUpperCase forms, which covers at least the same pairs.

let edaFoldGroups = null;

const edaBuildFoldGroups = () => {
  const legacyKey = new Uint16Array(0x10000);
  const parent = new Int32Array(0x10000);
  for (let c = 0; c < 0x10000; c++) parent[c] = c;
  const find = x => {
    while (parent[x] !== x) x = parent[x] = parent[parent[x]];
    return x;
  };
  const union = (a, b) => {
    if (a < 0x10000 && b < 0x10000) parent[find(a)] = find(b);
  };
  for (let c = 0; c < 0x10000; c++) {
    const ch = String.fromCharCode(c);
    const up = ch.toUpperCase();
    const low = ch.toLowerCase();
    const cu = up.length === 1 ? up.charCodeAt(0) : c;
    legacyKey[c] = c >= 128 && cu < 128 ? c : cu;
    if (up.length === 1) union(c, up.charCodeAt(0));
    if (low.length === 1) union(c, low.charCodeAt(0));
  }
  const group = keyOf => {
    const byKey = new Map();
    for (let c = 0; c < 0x10000; c++) {
      const k = keyOf(c);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(c);
    }
    return { keyOf, byKey };
  };
  return { legacy: group(c => legacyKey[c]), unicode: group(c => find(c)) };
};

const edaFoldRanges = (ranges, unicode) => {
  if (!edaFoldGroups) edaFoldGroups = edaBuildFoldGroups();
  const { keyOf, byKey } = unicode ? edaFoldGroups.unicode : edaFoldGroups.legacy;
  const out = ranges.slice();
  const seen = new Set();
  for (const [lo, hi] of ranges) {
    for (let c = lo; c <= Math.min(hi, 0xffff); c++) {
      const k = keyOf(c);
      if (seen.has(k)) continue;
      seen.add(k);
      for (const m of byKey.get(k)) out.push([m, m]);
    }
    // Characters outside the BMP only occur with `u`; some have case pairs.
    if (hi > 0xffff) out.push([0x10000, EDA_MAX]);
  }
  return edaNormalize(out);
};

const edaFoldCache = new Map();

// How `i` applies depends on how the set was written (spec: CharacterSetMatcher).
// A class written [^...] matches a character when NO member has its canonical
// form: the complement of the folded members. Everything else (a plain class,
// \W, \D, \S, `.`, a class mixing such escapes like [!\Wb]) matches when SOME
// member has its canonical form: the folded members themselves. Treating the
// second kind like the first would shrink it, and hide ambiguity.
const edaFold = (set, unicode) => {
  const key = `${unicode ? 'u' : ''}${set.inverted ? '!' : ''}${set.neg ? '^' : ''}${JSON.stringify(set.ranges)}`;
  if (edaFoldCache.has(key)) return edaFoldCache.get(key);
  let out;
  if (set.inverted) {
    if (unicode) {
      out = set; // folding the members can only shrink [^...]; leaving it is the safe side
    } else {
      const members = edaMembers({ neg: !set.neg, ranges: set.ranges });
      out = { neg: true, ranges: edaFoldRanges(members, false) };
    }
  } else {
    out = { neg: false, ranges: edaFoldRanges(edaMembers(set), unicode) };
  }
  if (edaFoldCache.size > 500) edaFoldCache.clear();
  edaFoldCache.set(key, out);
  return out;
};

// --- parser for the regex subset (any JS regex source) -----------------------

// Returns { root, looks } or null. `looks` holds the body of every lookaround
// (at any depth): they match nothing on the main path, but the engine still
// runs each body, so each one is analysed as a regex of its own.
const edaParse = (source, flags) => {
  const unicode = flags.includes('u') || flags.includes('v');
  if (flags.includes('v') && source.includes('[')) return null; // class set syntax: not modelled
  const dotAll = flags.includes('s');
  let i = 0;
  const EPS = { t: 'eps' };
  // A backreference matches some text (the captured string), so it is
  // modelled as any text. A repeat of a fixed sequence that contains one,
  // like `(\1)+` or `(?:a\1)*`, splits its input in only one way (every
  // iteration has the same length), so the whole repeat is any text too.
  // `fixed` marks a bare backreference: one fixed string. Anything built by
  // a quantifier (`\1?`, `(\1)+`) has a variable length and is not fixed.
  const anyText = fixed => ({ t: 'rep', node: { t: 'char', set: edaSet(EDA_ALL) }, min: 0, max: Infinity, backref: true, fixed });
  const BACKREF = anyText(true);
  const fixedSequence = n => n.fixed === true || n.t === 'char' || n.t === 'eps' || (n.t === 'cat' && n.items.every(fixedSequence));
  const hasBackref = n => Boolean(n.backref) || (n.t === 'cat' && n.items.some(hasBackref));
  const looks = [];
  let failed = false;

  const readChar = () => {
    // one character of the pattern: a code unit, or a code point with `u`
    const c = unicode ? source.codePointAt(i) : source.charCodeAt(i);
    i += c > 0xffff ? 2 : 1;
    return c;
  };

  const hex = n => {
    const h = source.slice(i, i + n);
    if (h.length === n && /^[0-9a-fA-F]+$/.test(h)) {
      i += n;
      return parseInt(h, 16);
    }
    return -1;
  };

  // Legacy octal escapes (`\0`-`\377` without `u`) and, inside a class,
  // `\1`-`\9`: some character from \0 to \377 or a digit. Over-approximated.
  const OCTAL_OR_DIGIT = edaSet([[0, 255], [48, 57]]);

  // at source[i] === '\\'; returns { set } or { cp }
  const escape = inClass => {
    i++;
    if (i >= source.length) return { cp: 92 };
    const c = source[i];
    if (!unicode && ((c === '0' && /[0-9]/.test(source[i + 1] || '')) || (inClass && c >= '1' && c <= '9'))) {
      while (/[0-9]/.test(source[i] || '')) i++;
      return { set: OCTAL_OR_DIGIT };
    }
    switch (c) {
      case 'd': i++; return { set: edaSet(EDA_DIGIT) };
      case 'D': i++; return { set: edaSet(EDA_DIGIT, true) };
      case 'w': i++; return { set: edaSet(EDA_WORD) };
      case 'W': i++; return { set: edaSet(EDA_WORD, true) };
      case 's': i++; return { set: edaSet(EDA_SPACE) };
      case 'S': i++; return { set: edaSet(EDA_SPACE, true) };
      case 'n': i++; return { cp: 10 };
      case 'r': i++; return { cp: 13 };
      case 't': i++; return { cp: 9 };
      case 'f': i++; return { cp: 12 };
      case 'v': i++; return { cp: 11 };
      case '0': i++; return { cp: 0 };
      case 'x': {
        i++;
        const v = hex(2);
        return { cp: v >= 0 ? v : 120 };
      }
      case 'u': {
        i++;
        if (unicode && source[i] === '{') {
          const m = /^\{([0-9a-fA-F]+)\}/.exec(source.slice(i));
          if (m) {
            i += m[0].length;
            return { cp: Math.min(parseInt(m[1], 16), EDA_MAX) };
          }
        }
        const v = hex(4);
        if (v < 0) return { cp: 117 };
        if (unicode && v >= 0xd800 && v <= 0xdbff && source.startsWith('\\u', i)) {
          const save = i;
          i += 2;
          const lo = hex(4);
          if (lo >= 0xdc00 && lo <= 0xdfff) return { cp: 0x10000 + ((v - 0xd800) << 10) + (lo - 0xdc00) };
          i = save;
        }
        return { cp: v };
      }
      case 'c': {
        const l = source[i + 1];
        // inside a class (without `u`) digits and `_` are control letters too
        if (l && (/[a-zA-Z]/.test(l) || (inClass && !unicode && /[0-9_]/.test(l)))) {
          i += 2;
          return { cp: l.charCodeAt(0) % 32 };
        }
        return { cp: 92 }; // `\c` is a literal backslash; `c` is read next
      }
      case 'p':
      case 'P':
        if (unicode) {
          i++;
          if (source[i] === '{') {
            while (i < source.length && source[i] !== '}') i++;
            i++;
          }
          return { set: edaSet(EDA_ALL) };
        }
        i++;
        return { cp: c.charCodeAt(0) };
      default:
        return { cp: readChar() };
    }
  };

  const parseClass = () => {
    // at source[i] === '['
    i++;
    let neg = false;
    if (source[i] === '^') {
      neg = true;
      i++;
    }
    const ranges = [];
    const negated = []; // members like \W, \D, \S: each is "everything except R"
    const member = () => {
      if (source[i] === '\\') {
        // inside a class \b is a backspace
        if (source[i + 1] === 'b') {
          i += 2;
          return { cp: 8 };
        }
        return escape(true);
      }
      return { cp: readChar() };
    };
    // `[]` is an empty class and `[^]` matches anything: a `]` right after
    // `[` (or `[^`) closes the class.
    while (i < source.length && source[i] !== ']') {
      const a = member();
      if (a.set) {
        if (a.set.neg) negated.push(a.set.ranges);
        else ranges.push(...a.set.ranges);
        continue;
      }
      if (source[i] === '-' && i + 1 < source.length && source[i + 1] !== ']') {
        i++;
        const b = member();
        if (b.set) {
          // `a-\d`: the dash is literal
          ranges.push([a.cp, a.cp], [45, 45]);
          if (b.set.neg) negated.push(b.set.ranges);
          else ranges.push(...b.set.ranges);
          continue;
        }
        ranges.push(a.cp <= b.cp ? [a.cp, b.cp] : [b.cp, a.cp]);
      } else {
        ranges.push([a.cp, a.cp]);
      }
    }
    if (i >= source.length) failed = true;
    i++; // ']'
    // The class matches the union of its members. With negated members it is
    // "everything except (what every negated member excludes, minus the
    // positive members)".
    let set;
    const positive = edaNormalize(ranges);
    if (negated.length === 0) {
      set = { neg: false, ranges: positive };
    } else {
      let excluded = edaNormalize(negated[0]);
      for (const r of negated.slice(1)) excluded = edaIntersectRanges(excluded, edaNormalize(r));
      set = { neg: true, ranges: edaSubtractRanges(excluded, positive) };
    }
    if (neg) set = { neg: !set.neg, ranges: set.ranges, inverted: true };
    return { t: 'char', set };
  };

  const parseQuantifier = node => {
    for (;;) {
      const c = source[i];
      let min;
      let max;
      if (c === '*') {
        min = 0;
        max = Infinity;
        i++;
      } else if (c === '+') {
        min = 1;
        max = Infinity;
        i++;
      } else if (c === '?') {
        min = 0;
        max = 1;
        i++;
      } else if (c === '{') {
        const m = /^\{(\d+)(,(\d*))?\}/.exec(source.slice(i));
        if (!m) return node;
        min = Number(m[1]);
        max = m[2] === undefined ? min : m[3] === '' ? Infinity : Number(m[3]);
        i += m[0].length;
      } else {
        return node;
      }
      if (source[i] === '?') i++; // lazy
      node = hasBackref(node) && fixedSequence(node) ? anyText(false) : { t: 'rep', node, min, max };
    }
  };

  const parseAtom = () => {
    const c = source[i];
    if (c === '(') {
      i++;
      let look = false;
      if (source[i] === '?') {
        const n = source[i + 1];
        if (n === ':') {
          i += 2;
        } else if (n === '=' || n === '!') {
          i += 2;
          look = true;
        } else if (n === '<' && (source[i + 2] === '=' || source[i + 2] === '!')) {
          i += 3;
          look = true;
        } else if (n === '<') {
          while (i < source.length && source[i] !== '>') i++;
          i++;
        } else {
          failed = true; // unknown group syntax: do not guess
          return EPS;
        }
      }
      const inner = parseAlt();
      if (source[i] !== ')') failed = true;
      i++; // ')'
      if (look) {
        looks.push(inner);
        return EPS;
      }
      return inner;
    }
    if (c === '[') return parseClass();
    if (c === '.') {
      i++;
      return { t: 'char', set: dotAll ? edaSet(EDA_ALL) : edaSet(EDA_LINE_TERMINATORS, true) };
    }
    if (c === '^' || c === '$') {
      i++;
      return EPS;
    }
    if (c === '\\') {
      const n = source[i + 1];
      if (n === 'b' || n === 'B') {
        i += 2;
        return EPS;
      }
      if (n >= '1' && n <= '9') {
        // backreference (or a legacy octal / identity escape): some text
        i += 2;
        while (source[i] >= '0' && source[i] <= '9') i++;
        return BACKREF;
      }
      if (n === 'k' && source[i + 2] === '<') {
        i += 3;
        while (i < source.length && source[i] !== '>') i++;
        i++;
        return BACKREF;
      }
      const e = escape(false);
      return { t: 'char', set: e.set || edaSet([[e.cp, e.cp]]) };
    }
    const cp = readChar();
    return { t: 'char', set: edaSet([[cp, cp]]) };
  };

  const parseSeq = () => {
    const items = [];
    while (i < source.length && source[i] !== '|' && source[i] !== ')') {
      items.push(parseQuantifier(parseAtom()));
      if (failed) break;
    }
    return { t: 'cat', items };
  };

  function parseAlt() {
    const opts = [parseSeq()];
    while (!failed && source[i] === '|') {
      i++;
      opts.push(parseSeq());
    }
    return opts.length === 1 ? opts[0] : { t: 'alt', opts };
  }

  const root = parseAlt();
  // A stray `)` cannot appear in a valid regex; if it does, stop analysing.
  return !failed && i >= source.length ? { root, looks } : null;
};

// --- Glushkov construction with derivation counts ------------------------------

// For every sub-expression: nul = number of ways it matches the empty string,
// first / last = Map(position -> number of ways it starts / ends there).
// follow[p] = Map(position -> number of derivations of the edge p -> r).
const edaGlushkov = (root, fold, unicode) => {
  const sets = [null]; // position 0 = initial state
  const follow = [new Map()];

  const link = (from, to, n) => {
    if (n === 0) return;
    const m = follow[from];
    m.set(to, edaAdd(m.get(to) || 0, n));
  };
  const scale = (map, n) => {
    const out = new Map();
    if (n === 0) return out;
    for (const [p, c] of map) out.set(p, edaMul(c, n));
    return out;
  };
  const merge = (a, b) => {
    const out = new Map(a);
    for (const [p, c] of b) out.set(p, edaAdd(out.get(p) || 0, c));
    return out;
  };
  const connect = (lastMap, firstMap) => {
    for (const [l, cl] of lastMap) for (const [f, cf] of firstMap) link(l, f, edaMul(cl, cf));
  };

  const build = node => {
    switch (node.t) {
      case 'eps':
        return { nul: 1, first: new Map(), last: new Map() };
      case 'char': {
        const p = sets.length;
        sets.push(fold ? edaFold(node.set, unicode) : node.set);
        follow.push(new Map());
        return { nul: 0, first: new Map([[p, 1]]), last: new Map([[p, 1]]) };
      }
      case 'cat': {
        let acc = { nul: 1, first: new Map(), last: new Map() };
        for (const item of node.items) {
          const r = build(item);
          connect(acc.last, r.first);
          acc = {
            nul: edaMul(acc.nul, r.nul),
            first: merge(acc.first, scale(r.first, acc.nul)),
            last: merge(r.last, scale(acc.last, r.nul))
          };
        }
        return acc;
      }
      case 'alt': {
        let acc = { nul: 0, first: new Map(), last: new Map() };
        for (const opt of node.opts) {
          const r = build(opt);
          acc = { nul: edaAdd(acc.nul, r.nul), first: merge(acc.first, r.first), last: merge(acc.last, r.last) };
        }
        return acc;
      }
      case 'rep': {
        const { min, max } = node;
        if (max === 0) return { nul: 1, first: new Map(), last: new Map() };
        const r = build(node.node);
        // JavaScript rejects an empty iteration once `min` iterations are
        // done, so empty iterations only happen among the first `min`.
        // A repeat allowing 2+ iterations is modelled as a loop; counted
        // repeats like {2,5} get the same cycle (the safe side).
        if (max > 1) connect(r.last, r.first);
        let nul = min === 0 ? 1 : r.nul;
        // mandatory empty iterations before the first real one / after the last
        const firstBoost = min >= 1 && max > 1 && r.nul > 0 ? edaAdd(1, r.nul) : 1;
        const lastBoost = min >= 2 && r.nul > 0 ? edaAdd(1, r.nul) : 1;
        if (min >= 2 && r.nul > 1) nul = EDA_CAP;
        return { nul, first: scale(r.first, firstBoost), last: scale(r.last, lastBoost) };
      }
      default:
        return { nul: 1, first: new Map(), last: new Map() };
    }
  };

  const r = build(root);
  for (const [f, c] of r.first) link(0, f, c);
  return {
    sets,
    follow: follow.map(m => [...m.keys()]),
    multiplicity: follow
  };
};

// Iterative Tarjan SCC over nodes 0..n-1 with an edge function.
const edaScc = (n, edgesOf) => {
  const index = new Int32Array(n).fill(-1);
  const low = new Int32Array(n);
  const onStack = new Uint8Array(n);
  const comp = new Int32Array(n).fill(-1);
  const stack = [];
  let next = 0;
  let count = 0;

  for (let s = 0; s < n; s++) {
    if (index[s] !== -1) continue;
    const work = [[s, 0, edgesOf(s)]];
    index[s] = low[s] = next++;
    stack.push(s);
    onStack[s] = 1;

    while (work.length) {
      const frame = work[work.length - 1];
      const [v, , edges] = frame;
      if (frame[1] < edges.length) {
        const w = edges[frame[1]++];
        if (index[w] === -1) {
          index[w] = low[w] = next++;
          stack.push(w);
          onStack[w] = 1;
          work.push([w, 0, edgesOf(w)]);
        } else if (onStack[w]) {
          low[v] = Math.min(low[v], index[w]);
        }
      } else {
        work.pop();
        if (work.length) {
          const parent = work[work.length - 1][0];
          low[parent] = Math.min(low[parent], low[v]);
        }
        if (low[v] === index[v]) {
          let w;
          do {
            w = stack.pop();
            onStack[w] = 0;
            comp[w] = count;
          } while (w !== v);
          count++;
        }
      }
    }
  }

  return { comp, count };
};

// Does this parsed regex (one tree) have exponential degree of ambiguity?
const edaAnalyze = (root, fold, unicode) => {
  const { sets, follow, multiplicity } = edaGlushkov(root, fold, unicode);
  const n = sets.length;

  // States reachable from the initial state.
  const reach = new Uint8Array(n);
  const queue = [0];
  reach[0] = 1;
  while (queue.length) {
    const v = queue.pop();
    for (const w of follow[v]) {
      if (!reach[w]) {
        reach[w] = 1;
        queue.push(w);
      }
    }
  }

  // Cycles of the product automaton project onto cycles of the NFA, so only
  // pairs inside one non-trivial NFA SCC can matter.
  const nfa = edaScc(n, v => (reach[v] ? follow[v] : []));
  const members = new Map();
  for (let v = 1; v < n; v++) {
    if (!reach[v]) continue;
    const c = nfa.comp[v];
    if (!members.has(c)) members.set(c, []);
    members.get(c).push(v);
  }

  for (const list of members.values()) {
    const k = list.length;
    if (k === 1 && !follow[list[0]].includes(list[0])) continue; // trivial
    if (k > EDA_MAX_SCC_POSITIONS) return true; // too large to analyse: unsafe

    const local = new Map(list.map((v, idx) => [v, idx]));
    const succ = list.map(v => follow[v].filter(w => local.has(w)).map(w => local.get(w)));
    const chars = list.map(v => edaMembers(sets[v]));
    const compat = (a, b) => a === b || edaRangesOverlap(chars[a], chars[b]);

    // product node id = a * k + b
    const edgesOf = id => {
      const a = Math.floor(id / k);
      const b = id % k;
      const out = [];
      for (const x of succ[a]) {
        for (const y of succ[b]) {
          if (compat(x, y)) out.push(x * k + y);
        }
      }
      return out;
    };

    const prod = edaScc(k * k, edgesOf);
    const offDiag = new Set();
    for (let a = 0; a < k; a++) {
      for (let b = 0; b < k; b++) {
        if (a !== b) offDiag.add(prod.comp[a * k + b]);
      }
    }

    // A diagonal pair and a non-diagonal pair in the same product SCC means
    // two distinct equal-label cycles through one state (the SCC then has at
    // least two nodes, so it is a real cycle).
    for (let a = 0; a < k; a++) {
      if (offDiag.has(prod.comp[a * k + a])) return true;
    }

    // An edge p -> r with two or more derivations, where (p, p) and (r, r)
    // lie in one product SCC, gives two distinct equal-label cycles (one per
    // derivation). Covers `(a+)+`, `(?:[^/]*?)+`, `(?:a(?:|)b)+`.
    for (let a = 0; a < k; a++) {
      for (const [to, count] of multiplicity[list[a]]) {
        if (count < 2 || !local.has(to)) continue;
        const x = local.get(to);
        if (prod.comp[a * k + a] === prod.comp[x * k + x]) return true;
      }
    }
  }

  return false;
};

// Results are cached: tools compile the same few globs over and over.
const EDA_CACHE_LIMIT = 1000;
const edaCache = new Map();

const hasExponentialBacktracking = (source, flags = '') => {
  // Fast exit: cycles through more than one position come only from a
  // quantified group, and a quantifier on a single character, class or
  // backreference gives a one-state self-loop with a single derivation,
  // which has exactly one way back to itself. Without a quantifier on a
  // group there is no EDA.
  // (This also covers lookaround bodies, which are part of the source.)
  if (!/\)[*+{]/.test(source)) return false;

  const key = `${flags}\u0000${source}`;
  if (edaCache.has(key)) return edaCache.get(key);

  let result;
  const parsed = edaParse(source, flags);
  if (parsed === null) {
    result = true; // unparseable: treat as unsafe
  } else {
    const fold = flags.includes('i');
    const unicode = flags.includes('u') || flags.includes('v');
    result = edaAnalyze(parsed.root, fold, unicode) || parsed.looks.some(look => edaAnalyze(look, fold, unicode));
  }

  if (edaCache.size >= EDA_CACHE_LIMIT) edaCache.delete(edaCache.keys().next().value);
  edaCache.set(key, result);
  return result;
};

module.exports = { hasExponentialBacktracking };
