'use strict';

// Reads JavaScript regex source (no flags) into a tree. Covers the syntax picomatch emits:
// groups, alternation, classes, escapes, quantifiers (lazy ones read as greedy, which does not
// change what test() accepts), lookaheads and the ^ and $ assertions. Anything else is refused
// by name rather than read approximately.

const cs = require('./charset');

class UnsupportedRegex extends Error {}

const DIGIT = cs.of([48, 57]);
const WORD = cs.of([48, 57], [65, 90], [95, 95], [97, 122]);
const SPACE = cs.of([9, 13], [32, 32], [0xa0, 0xa0], [0x1680, 0x1680], [0x2000, 0x200a],
  [0x2028, 0x2029], [0x202f, 0x202f], [0x205f, 0x205f], [0x3000, 0x3000], [0xfeff, 0xfeff]);
const DOT = cs.complement(cs.of([10, 10], [13, 13], [0x2028, 0x2029]));

const node = {
  empty: () => ({ type: 'chars', set: cs.EMPTY }),
  eps: () => ({ type: 'eps' }),
  chars: set => ({ type: 'chars', set }),
  seq: items => (items.length === 1 ? items[0] : items.length === 0 ? { type: 'eps' } : { type: 'seq', items }),
  alt: items => (items.length === 1 ? items[0] : { type: 'alt', items })
};

function read(source, { ignoreCase = false } = {}) {
  let i = 0;
  const peek = () => source[i];
  const fail = what => { throw new UnsupportedRegex(`${what} at offset ${i} of /${source}/`); };
  // With the i flag a set matches every code unit that folds onto one of its members, so each
  // set is closed under folding as it is read and the tree needs no flag. A negated class is
  // closed before it is complemented, which is the order the engine tests a negated class in.
  const close = ignoreCase ? cs.caseClose : set => set;

  function hex(len) {
    const digits = source.slice(i, i + len);
    if (digits.length !== len || !/^[0-9a-fA-F]+$/.test(digits)) return null;
    i += len;
    return parseInt(digits, 16);
  }

  // Returns { set } for a class escape or { code } for a single code unit. i is past the backslash.
  function escape(inClass) {
    const c = source[i++];
    if (c === undefined) fail('trailing backslash');
    switch (c) {
      case 'd': return { set: DIGIT };
      case 'D': return { set: cs.complement(DIGIT) };
      case 'w': return { set: WORD };
      case 'W': return { set: cs.complement(WORD) };
      case 's': return { set: SPACE };
      case 'S': return { set: cs.complement(SPACE) };
      case 'n': return { code: 10 };
      case 'r': return { code: 13 };
      case 't': return { code: 9 };
      case 'v': return { code: 11 };
      case 'f': return { code: 12 };
      case 'b': if (inClass) return { code: 8 }; return fail('word boundary \\b');
      case 'B': if (inClass) return { code: 66 }; return fail('word boundary \\B');
      case 'x': { const v = hex(2); return { code: v === null ? 120 : v }; }
      case 'u': { const v = hex(4); return { code: v === null ? 117 : v }; }
      case 'c': {
        const l = source[i];
        if (l && /[a-zA-Z]/.test(l)) { i++; return { code: l.charCodeAt(0) % 32 }; }
        return { code: 92 }; // Annex B: \c without a letter is a literal backslash, c read next
      }
      case 'k': return fail('named backreference');
      case '0': if (/[0-9]/.test(source[i] || '')) return fail('octal escape'); return { code: 0 };
      default:
        if (/[1-9]/.test(c)) { if (inClass) return fail('octal escape in class'); return fail('backreference'); }
        return { code: c.charCodeAt(0) };
    }
  }

  function charClass() {
    // i is past '['
    let negate = false;
    if (peek() === '^') { negate = true; i++; }
    let set = cs.EMPTY;
    const member = () => {
      if (i >= source.length) fail('unterminated class');
      if (source[i] === '\\') { i++; return escape(true); }
      return { code: source.charCodeAt(i++) };
    };
    while (peek() !== ']') {
      const a = member();
      if (peek() === '-' && source[i + 1] !== ']' && i + 1 < source.length) {
        i++;
        const b = member();
        if (a.set || b.set) {
          set = cs.union(set, a.set || cs.single(a.code));
          set = cs.union(set, cs.single(45));
          set = cs.union(set, b.set || cs.single(b.code));
        } else {
          if (a.code > b.code) fail('class range out of order');
          set = cs.union(set, cs.of([a.code, b.code]));
        }
      } else {
        set = cs.union(set, a.set || cs.single(a.code));
      }
    }
    i++; // ']'
    return node.chars(negate ? cs.complement(close(set)) : close(set));
  }

  // Each set keeps the source text it was read from, so a test can ask V8 what that text
  // matches and compare it with the set, code unit by code unit.
  function atom() {
    const begin = i;
    const n = atomAt();
    if (n.type === 'chars') n.src = source.slice(begin, i);
    return n;
  }

  function atomAt() {
    const c = source[i];
    switch (c) {
      case '(': {
        i++;
        let kind = 'group';
        if (source.startsWith('?:', i)) { i += 2; } else if (source.startsWith('?=', i)) { i += 2; kind = 'pos'; } else if (source.startsWith('?!', i)) { i += 2; kind = 'neg'; } else if (source.startsWith('?<=', i) || source.startsWith('?<!', i)) fail('lookbehind');
        else if (source.startsWith('?<', i)) { const end = source.indexOf('>', i); if (end < 0) fail('named group'); i = end + 1; } else if (source[i] === '?') fail('group modifier');
        const inner = alternation();
        if (source[i] !== ')') fail('unterminated group');
        i++;
        if (kind === 'group') return inner;
        return { type: 'look', negative: kind === 'neg', node: inner, quantifiable: false };
      }
      case '[': i++; return charClass();
      case '.': i++; return node.chars(close(DOT));
      case '^': i++; return { type: 'start' };
      case '$': i++; return { type: 'end' };
      case '\\': { i++; const e = escape(false); return node.chars(close(e.set || cs.single(e.code))); }
      case '*': case '+': case '?': return fail('nothing to repeat');
      case ')': return fail('unmatched )');
      default: i++; return node.chars(close(cs.single(c.charCodeAt(0))));
    }
  }

  function quantifier() {
    const c = source[i];
    let min, max;
    if (c === '*') { min = 0; max = Infinity; i++; } else if (c === '+') { min = 1; max = Infinity; i++; } else if (c === '?') { min = 0; max = 1; i++; } else if (c === '{') {
      const m = /^\{(\d+)(,(\d*))?\}/.exec(source.slice(i));
      if (!m) return null; // Annex B: a brace that is not a quantifier is a literal
      min = Number(m[1]);
      max = m[2] === undefined ? min : m[3] === '' ? Infinity : Number(m[3]);
      if (max < min) fail('quantifier range out of order');
      i += m[0].length;
    } else return null;
    if (source[i] === '?') i++; // lazy: same accepted strings
    return { min, max };
  }

  function sequence() {
    const items = [];
    while (i < source.length && source[i] !== '|' && source[i] !== ')') {
      let a = atom();
      let q;
      while ((q = quantifier())) {
        if (a.type === 'start' || a.type === 'end') fail('quantified assertion');
        if (a.type === 'look') {
          // Annex B allows a quantified lookahead; a repeat of a zero-width test is the test once,
          // or nothing when the minimum is zero.
          a = q.min === 0 ? node.eps() : a;
          continue;
        }
        a = { type: 'repeat', min: q.min, max: q.max, node: a };
      }
      items.push(a);
    }
    return node.seq(items);
  }

  function alternation() {
    const branches = [sequence()];
    while (source[i] === '|') { i++; branches.push(sequence()); }
    return node.alt(branches);
  }

  const tree = alternation();
  if (i !== source.length) fail('unexpected )');
  return tree;
}

// RegExp.prototype.test looks for a match anywhere, so the strings it accepts are those with a
// substring matching the tree. An unanchored side gets any text in front of it or after it; a
// side that starts with ^ or ends with $ already says where the match lies.
function readForTest(source, options) {
  return forTest(read(source, options));
}

// The same widening for a tree already read, which is left as it was.
function forTest(tree) {
  const items = tree.type === 'seq' ? tree.items : [tree];
  const any = () => ({ type: 'repeat', min: 0, max: Infinity, node: node.chars(cs.ALL) });
  const out = [...items];
  if (items[0].type !== 'start') out.unshift(any());
  if (items[items.length - 1].type !== 'end') out.push(any());
  return node.seq(out);
}

module.exports = { read, readForTest, forTest, UnsupportedRegex, DOT, DIGIT, WORD, SPACE };
