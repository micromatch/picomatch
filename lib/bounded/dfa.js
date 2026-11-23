'use strict';

// Regex tree -> minimal DFA by Brzozowski derivatives.
//
// A term always stands for the whole rest of the input, so a lookahead met at the head of a
// term knows its scope: (?=Y)R is (Y followed by anything) AND R, and (?!Y)R is
// NOT(Y followed by anything) AND R. Sequences are taken apart with a continuation k, which is
// what keeps that scope intact inside groups and repeats. ^ holds only at offset 0 and $ only
// at the end. Terms are hash-consed, alternations and intersections are kept sorted and free
// of duplicates, and intersections are distributed over alternations. With that, the
// derivatives of every pattern tested repeat after finitely many steps; no proof that they
// always do is written, and the state limit still stops one that does not.

const cs = require('./charset');

class TooLarge extends Error {}

const table = new Map();
let nextId = 0;
function make(key, fields) {
  let t = table.get(key);
  if (!t) { t = { id: nextId++, ...fields }; table.set(key, t); }
  return t;
}

const EMPTY = make('0', { k: 'empty' });
const EPS = make('e', { k: 'eps' });
const START = make('^', { k: 'start' });
const END = make('$', { k: 'end' });
const chars = set => (cs.isEmpty(set) ? EMPTY : make('c' + cs.key(set), { k: 'chars', set }));
const ANY = make('*' + chars(cs.ALL).id, { k: 'star', a: chars(cs.ALL) });

function seq(a, b) {
  if (a === EMPTY || b === EMPTY) return EMPTY;
  if (a === EPS) return b;
  if (b === EPS) return a;
  if (a.k === 'seq') return seq(a.a, seq(a.b, b));
  return make('s' + a.id + ',' + b.id, { k: 'seq', a, b });
}

function alt(list) {
  const flat = [];
  for (const t of list) {
    if (t === EMPTY) continue;
    if (t.k === 'alt') flat.push(...t.items); else flat.push(t);
  }
  const items = [...new Map(flat.map(t => [t.id, t])).values()].sort((x, y) => x.id - y.id);
  if (items.length === 0) return EMPTY;
  if (items.length === 1) return items[0];
  return make('a' + items.map(t => t.id).join(','), { k: 'alt', items });
}

// An intersection is distributed over an alternation, (A | B) & C = (A & C) | (B & C), so it
// never sits inside one. Without this, each pass through a repeat that holds a negative
// lookahead wrapped the previous term in one more intersection, the terms grew without end, and
// *(!(*a*)*b) was still growing past 64,000 states. Distributed, the intersections are flat
// lists that the sorting and deduplication below can recognize as equal.
function and(list) {
  const flat = [];
  for (const t of list) {
    if (t === EMPTY) return EMPTY;
    if (t === ANY) continue; // the identity of intersection over whole remainders
    if (t.k === 'and') flat.push(...t.items); else flat.push(t);
  }
  const split = flat.find(t => t.k === 'alt');
  if (split) {
    const others = flat.filter(t => t !== split);
    return alt(split.items.map(branch => and([branch, ...others])));
  }
  const items = [...new Map(flat.map(t => [t.id, t])).values()].sort((x, y) => x.id - y.id);
  if (items.length === 0) return ANY;
  if (items.length === 1) return items[0];
  return make('i' + items.map(t => t.id).join(','), { k: 'and', items });
}

function not(a) {
  if (a.k === 'not') return a.a;
  if (a === EMPTY) return ANY;
  if (a === ANY) return EMPTY;
  return make('n' + a.id, { k: 'not', a });
}

function star(a) {
  if (a === EMPTY || a === EPS) return EPS;
  if (a.k === 'star') return a;
  return make('*' + a.id, { k: 'star', a });
}

const look = (negative, y) => make('l' + (negative ? '!' : '=') + y.id, { k: 'look', negative, y: seq(y, ANY) });
// Marks the end of one iteration of a star: reaching it without having consumed a code unit
// is an empty iteration, which JS refuses and which adds no string anyway.
const guard = a => make('g' + a.id, { k: 'guard', a });

function fromTree(n) {
  switch (n.type) {
    case 'eps': return EPS;
    case 'chars': return chars(n.set);
    case 'seq': return n.items.map(fromTree).reduceRight((acc, t) => seq(t, acc), EPS);
    case 'alt': return alt(n.items.map(fromTree));
    case 'start': return START;
    case 'end': return END;
    case 'look': return look(n.negative, fromTree(n.node));
    case 'repeat': {
      const body = fromTree(n.node);
      let tail;
      if (n.max === Infinity) tail = star(body);
      else {
        tail = EPS;
        for (let r = 0; r < n.max - n.min; r++) tail = alt([EPS, seq(body, tail)]);
      }
      let out = tail;
      for (let r = 0; r < n.min; r++) out = seq(body, out);
      return out;
    }
    default: throw new Error('unknown tree node ' + n.type);
  }
}

const unguardMemo = new Map();
// Consuming a code unit ends the emptiness of every iteration still open, the enclosing
// stars' included, so every guard on the continuation is dropped.
function unguard(k) {
  if (k.k === 'guard') return unguard(k.a);
  if (k.k !== 'seq') return k;
  let r = unguardMemo.get(k.id);
  if (!r) { r = seq(k.a, unguard(k.b)); unguardMemo.set(k.id, r); }
  return r;
}

// The derivative and nullability of every term of one tree, over that tree's atoms.
function derivatives(tree) {
  const root = fromTree(tree);

  const sets = [];
  const seen = new Set();
  (function collect(t) {
    if (seen.has(t.id)) return;
    seen.add(t.id);
    if (t.k === 'chars') sets.push(t.set);
    for (const c of [t.a, t.b, t.y, ...(t.items || [])]) if (c) collect(c);
  })(root);
  const atoms = cs.partition(sets);

  const dMemo = new Map();
  // Derivative of (t followed by k), the whole rest of the input, by atom number x.
  function D(t, k, x, st) {
    const key = t.id + ',' + k.id + ',' + x + ',' + st;
    let r = dMemo.get(key);
    if (r !== undefined) return r;
    const c = atoms[x].rep;
    switch (t.k) {
      case 'empty': r = EMPTY; break;
      case 'eps': r = k === EPS ? EMPTY : D(k, EPS, x, st); break;
      case 'chars': r = cs.has(t.set, c) ? unguard(k) : EMPTY; break;
      case 'seq': r = D(t.a, seq(t.b, k), x, st); break;
      case 'alt': r = alt(t.items.map(i => D(i, k, x, st))); break;
      case 'star': r = alt([D(t.a, guard(seq(t, k)), x, st), k === EPS ? EMPTY : D(k, EPS, x, st)]); break;
      case 'guard': r = EMPTY; break;
      case 'end': r = EMPTY; break;
      case 'start': r = st ? (k === EPS ? EMPTY : D(k, EPS, x, st)) : EMPTY; break;
      case 'look': {
        const y = D(t.y, EPS, x, st);
        const rest = k === EPS ? EMPTY : D(k, EPS, x, st);
        r = and([t.negative ? not(y) : y, rest]);
        break;
      }
      case 'and': if (k !== EPS) throw new Error('intersection inside a sequence'); r = and(t.items.map(i => D(i, EPS, x, st))); break;
      case 'not': if (k !== EPS) throw new Error('complement inside a sequence'); r = not(D(t.a, EPS, x, st)); break;
      default: throw new Error('unknown term ' + t.k);
    }
    dMemo.set(key, r);
    return r;
  }

  const nMemo = new Map();
  // Whether (t followed by k) accepts the end of input here.
  function N(t, k, st) {
    const key = t.id + ',' + k.id + ',' + st;
    let r = nMemo.get(key);
    if (r !== undefined) return r;
    const rest = () => k === EPS || N(k, EPS, st);
    switch (t.k) {
      case 'empty': case 'chars': case 'guard': r = false; break;
      case 'eps': case 'end': case 'star': r = rest(); break;
      case 'seq': r = N(t.a, seq(t.b, k), st); break;
      case 'alt': r = t.items.some(i => N(i, k, st)); break;
      case 'start': r = st && rest(); break;
      case 'look': r = N(t.y, EPS, st) !== t.negative && rest(); break;
      case 'and': r = t.items.every(i => N(i, EPS, st)); break;
      case 'not': r = !N(t.a, EPS, st); break;
      default: throw new Error('unknown term ' + t.k);
    }
    nMemo.set(key, r);
    return r;
  }

  return { root, atoms, D, N };
}

// The whole DFA, explored up front, trimmed and minimized: what emit() writes out as a regex.
function build(tree, { maxStates = 4000 } = {}) {
  const { root, atoms, D, N } = derivatives(tree);

  // Explore. State 0 is the start, where ^ holds; every other state is past offset 0.
  const terms = [root];
  const startFlags = [true];
  const index = new Map([['1:' + root.id, 0]]);
  const trans = [];
  const accept = [];
  for (let s = 0; s < terms.length; s++) {
    const st = startFlags[s];
    accept[s] = N(terms[s], EPS, st);
    trans[s] = new Array(atoms.length).fill(-1);
    for (let x = 0; x < atoms.length; x++) {
      const r = D(terms[s], EPS, x, st);
      if (r === EMPTY) continue;
      const key = '0:' + r.id;
      let target = index.get(key);
      if (target === undefined) {
        target = terms.length;
        if (target >= maxStates) throw new TooLarge(`more than ${maxStates} states`);
        index.set(key, target);
        terms.push(r);
        startFlags.push(false);
      }
      trans[s][x] = target;
    }
  }

  return minimize(trim({ atoms, start: 0, accept, trans }));
}

// Drops states that cannot reach an accepting state.
function trim(dfa) {
  const n = dfa.accept.length;
  const back = Array.from({ length: n }, () => []);
  dfa.trans.forEach((row, s) => row.forEach(t => { if (t >= 0) back[t].push(s); }));
  const live = new Array(n).fill(false);
  const queue = [];
  dfa.accept.forEach((a, s) => { if (a) { live[s] = true; queue.push(s); } });
  while (queue.length) for (const p of back[queue.pop()]) if (!live[p]) { live[p] = true; queue.push(p); }
  const trans = dfa.trans.map(row => row.map(t => (t >= 0 && live[t] ? t : -1)));
  return { ...dfa, trans, live };
}

// Moore partition refinement over the live states; -1 is the dead state.
function minimize(dfa) {
  const n = dfa.accept.length;
  const states = [...Array(n).keys()].filter(s => dfa.live[s]);
  if (!dfa.live[dfa.start]) return { atoms: dfa.atoms, start: -1, accept: [], trans: [] };
  let block = new Map(states.map(s => [s, dfa.accept[s] ? 1 : 0]));
  for (;;) {
    const sig = new Map();
    const next = new Map();
    for (const s of states) {
      const key = block.get(s) + '|' + dfa.trans[s].map(t => (t < 0 ? -1 : block.get(t))).join(',');
      if (!sig.has(key)) sig.set(key, sig.size);
      next.set(s, sig.get(key));
    }
    const stable = new Set(next.values()).size === new Set(block.values()).size;
    block = next;
    if (stable) break;
  }
  // Renumber blocks so the start is 0, in order of first reach.
  const order = new Map();
  const queue = [dfa.start];
  order.set(block.get(dfa.start), 0);
  const rep = [dfa.start];
  while (queue.length) {
    const s = queue.shift();
    for (const t of dfa.trans[s]) {
      if (t < 0) continue;
      const b = block.get(t);
      if (!order.has(b)) { order.set(b, rep.length); rep.push(t); queue.push(t); }
    }
  }
  const accept = rep.map(s => dfa.accept[s]);
  const trans = rep.map(s => dfa.trans[s].map(t => (t < 0 ? -1 : order.get(block.get(t)))));
  return { atoms: dfa.atoms, start: 0, accept, trans };
}

// The same DFA, built only as far as inputs take it: a state is made the first time a string
// reaches it, and kept. A string of n code units visits at most n + 1 states, so one test costs
// at most n derivatives the first time and n table lookups after, whatever the size of the
// whole DFA. State 0 is the start, where ^ holds.
function machine(tree, { maxStates = 4000 } = {}) {
  const { root, atoms, D, N } = derivatives(tree);

  // Code unit to atom: the atoms' ranges sorted by their first unit, searched by bisection.
  const ranges = [];
  atoms.forEach((a, x) => { for (const [lo] of a.set) ranges.push([lo, x]); });
  ranges.sort((p, q) => p[0] - q[0]);
  const lows = Int32Array.from(ranges, r => r[0]);
  const owners = Int32Array.from(ranges, r => r[1]);
  function atomOf(c) {
    let lo = 0;
    let hi = lows.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lows[mid] <= c) lo = mid; else hi = mid - 1;
    }
    return owners[lo];
  }
  // Paths are nearly all ASCII, so those units get their atom by one read and only the rest
  // are bisected.
  const asciiAtom = Int32Array.from({ length: 128 }, (_, c) => atomOf(c));

  const terms = [root];
  const index = new Map([['1:' + root.id, 0]]);
  const trans = [];
  const accept = [];
  // A state whose term is ANY accepts every remainder, so a string that reaches it matches.
  const full = [];
  function open(s) {
    const st = s === 0;
    accept[s] = N(terms[s], EPS, st);
    full[s] = terms[s] === ANY;
    trans[s] = new Int32Array(atoms.length).fill(-2); // -2: not computed yet, -1: dead
  }
  open(0);
  function next(s, x) {
    let t = trans[s][x];
    if (t !== -2) return t;
    const r = D(terms[s], EPS, x, s === 0);
    if (r === EMPTY) t = -1;
    else {
      const key = '0:' + r.id;
      t = index.get(key);
      if (t === undefined) {
        t = terms.length;
        if (t >= maxStates) throw new TooLarge(`more than ${maxStates} states`);
        index.set(key, t);
        terms.push(r);
        open(t);
      }
    }
    trans[s][x] = t;
    return t;
  }

  // A step taken before is read straight from the state's row; next() is only called for a step
  // not computed yet, so a warm test is two array reads per code unit.
  function test(str) {
    let s = 0;
    let row = trans[0];
    for (let i = 0; i < str.length; i++) {
      if (full[s]) return true;
      const c = str.charCodeAt(i);
      const x = c < 128 ? asciiAtom[c] : atomOf(c);
      let t = row[x];
      if (t === -2) t = next(s, x);
      if (t < 0) return false;
      s = t;
      row = trans[s];
    }
    return accept[s];
  }

  return { test, states: () => terms.length, atoms };
}

module.exports = { build, machine, TooLarge };
