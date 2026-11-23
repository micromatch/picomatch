'use strict';

// A set of UTF-16 code units as sorted, disjoint, non-adjacent inclusive ranges [lo, hi].
// JS regexes without the u flag match code units, so this is the whole alphabet.

const MAX = 0xffff;

function normalize(ranges) {
  const sorted = ranges.filter(r => r[0] <= r[1]).map(r => [r[0], r[1]]).sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
    else out.push(r);
  }
  return out;
}

const of = (...ranges) => normalize(ranges);
const single = c => [[c, c]];
const EMPTY = [];
const ALL = [[0, MAX]];

const union = (a, b) => normalize(a.concat(b));

function complement(a) {
  const out = [];
  let next = 0;
  for (const [lo, hi] of a) {
    if (lo > next) out.push([next, lo - 1]);
    next = hi + 1;
  }
  if (next <= MAX) out.push([next, MAX]);
  return out;
}

const intersect = (a, b) => complement(union(complement(a), complement(b)));

function has(set, c) {
  let lo = 0;
  let hi = set.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (c < set[mid][0]) hi = mid - 1;
    else if (c > set[mid][1]) lo = mid + 1;
    else return true;
  }
  return false;
}

const isEmpty = set => set.length === 0;
const key = set => set.map(r => r[0] + '-' + r[1]).join(',');

// Splits the alphabet into atoms: maximal sets of code units that every given set either
// contains whole or misses whole. A regex built from those sets cannot tell two code units
// of one atom apart, so one representative per atom is enough to compute a transition.
function partition(sets) {
  const cuts = new Set([0, MAX + 1]);
  for (const s of sets) for (const [lo, hi] of s) { cuts.add(lo); cuts.add(hi + 1); }
  const points = [...cuts].sort((a, b) => a - b);
  const bySignature = new Map();
  for (let i = 0; i + 1 < points.length; i++) {
    const lo = points[i];
    const hi = points[i + 1] - 1;
    const signature = sets.map(s => (has(s, lo) ? '1' : '0')).join('');
    if (!bySignature.has(signature)) bySignature.set(signature, []);
    bySignature.get(signature).push([lo, hi]);
  }
  return [...bySignature.values()].map(ranges => {
    const set = normalize(ranges);
    return { set, rep: set[0][0] };
  });
}

// Case folding for a regex with the i flag and without u (ECMA-262, Canonicalize): a code unit
// folds onto its upper case when that is a single code unit, except that a unit at or above
// 128 never folds onto one below it. Two units match each other when they fold onto the same
// unit. Built once, as the classes of more than one unit.
let caseClasses = null;
function foldClasses() {
  if (caseClasses) return caseClasses;
  const byFold = new Map();
  for (let c = 0; c <= MAX; c++) {
    const upper = String.fromCharCode(c).toUpperCase();
    let fold = c;
    if (upper.length === 1) {
      const u = upper.charCodeAt(0);
      if (!(c >= 128 && u < 128)) fold = u;
    }
    if (!byFold.has(fold)) byFold.set(fold, []);
    byFold.get(fold).push(c);
  }
  caseClasses = [...byFold.values()].filter(units => units.length > 1);
  return caseClasses;
}

// Every unit that belongs to a class, sorted, with the class it belongs to, so a set's ranges
// find the classes they touch by bisection instead of by asking every class.
let foldIndex = null;
function foldUnits() {
  if (foldIndex) return foldIndex;
  const pairs = [];
  foldClasses().forEach((units, k) => { for (const c of units) pairs.push([c, k]); });
  pairs.sort((p, q) => p[0] - q[0]);
  foldIndex = { units: Int32Array.from(pairs, p => p[0]), classOf: Int32Array.from(pairs, p => p[1]) };
  return foldIndex;
}

const closed = new Map();
// The units a set matches under the i flag: the set plus every unit of a class it touches.
function caseClose(set) {
  const name = key(set);
  const known = closed.get(name);
  if (known) return known;
  const { units, classOf } = foldUnits();
  const classes = foldClasses();
  const touched = new Set();
  for (const [lo, hi] of set) {
    let a = 0;
    let b = units.length;
    while (a < b) { const mid = (a + b) >> 1; if (units[mid] < lo) a = mid + 1; else b = mid; }
    for (let i = a; i < units.length && units[i] <= hi; i++) touched.add(classOf[i]);
  }
  const added = [];
  for (const k of touched) for (const c of classes[k]) added.push([c, c]);
  const result = normalize(set.concat(added));
  closed.set(name, result);
  return result;
}

module.exports = { MAX, EMPTY, ALL, of, single, union, complement, intersect, has, isEmpty, key, normalize, partition, caseClose, foldClasses };
