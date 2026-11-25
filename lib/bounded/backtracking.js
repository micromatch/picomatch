'use strict';

// How much work a backtracking engine can be made to do on a regex, decided from its position
// automaton rather than timed. Each character set of the regex is one position; the regex reads a
// string by stepping from position to position. With M_x the 0/1 matrix of steps on a code unit x,
// u the start row and the identity for the empty string, the number of ways to read a prefix w is
// u M_w1 ... M_wn summed, and a backtracking engine that fails explores every one of them. How
// those counts grow is fixed by the automaton (Weber and Seidl, 1991; for regexes, Weideman et
// al., 2016):
//
// - exponential: a position with two different loops that read the same string, which shows as a
//   strongly connected part of the product automaton holding both a pair (p, p) and a pair (p, q)
//   with p != q
// - polynomial of degree d: a chain of d + 1 looping parts, each pair joined so that one string
//   loops at p, leads from p to q, and loops at q; the triple product finds such a string
// - linear: neither, so every prefix has a bounded number of readings
//
// Lookaheads, ^ and $ are read as matching nothing, which can only add readings, so a class found
// here is an upper bound for a regex that has them; the witness timing says whether it is reached.

const cs = require('./charset');
const { read } = require('./regex-reader');
const { positionAutomaton } = require('./positions');

// A search that would outgrow this many product states is abandoned and reported as not
// decided, never as "no pattern found".
class Undecided extends Error {}
const SEARCH_LIMIT = 200000;

// The searches below compare loops of the regex in pairs, so their work grows with the square
// of the number of loops: a glob of a hundred stars would take a second to classify. Every unit
// of that work is charged against an allowance, and a search that would pass it is abandoned
// the same way. The caller that builds regexes sets the allowance (CLASSIFY_BUDGET); the tools
// that report a class leave it unlimited.
let spent = 0;
let allowed = Infinity;
function charge(units) {
  spent += units;
  if (spent > allowed) throw new Undecided(`more than ${allowed} units of classifying work`);
}

// The checker's position automaton, read with assertions as matching nothing, and indexed for the
// searches below: position p of the automaton is index p - 1 here, and its start is index S, the
// last one. ways(a, b) is the count on a step, the entry of M: (a+)+ has two ways from a to a,
// and an engine that backtracks can take either.
function indexed(tree) {
  const automaton = positionAutomaton(tree, {
    assertion: () => ({ nul: 1, first: new Map(), last: new Map() }),
    charge
  });
  const { sets } = automaton;
  const S = sets.length;
  const follow = Array.from({ length: S + 1 }, () => new Set());
  for (const key of automaton.steps.keys()) {
    const [p, q] = key.split(',').map(Number);
    follow[p - 1].add(q - 1);
  }
  for (const q of automaton.first.keys()) follow[S].add(q - 1);
  const ends = new Set([...automaton.last.keys()].map(p => p - 1));
  const ways = (a, b) => automaton.steps.get((a + 1) + ',' + (b + 1)) || 0;
  return { sets, follow, S, size: S, ends, acceptsEmpty: automaton.nul > 0, ways };
}

// The strongly connected parts over nodes 0..n-1 (Tarjan's method, without recursion, since a
// product automaton can be deep). Every loop of an automaton lies inside one part.
function connectedParts(n, next) {
  const index = new Int32Array(n).fill(-1);
  const low = new Int32Array(n);
  const on = new Uint8Array(n);
  const comp = new Int32Array(n).fill(-1);
  const stack = [];
  let counter = 0;
  let count = 0;
  for (let root = 0; root < n; root++) {
    if (index[root] >= 0) continue;
    const work = [[root, 0]];
    index[root] = low[root] = counter++;
    stack.push(root); on[root] = 1;
    while (work.length) {
      const frame = work[work.length - 1];
      const v = frame[0];
      const succ = next(v);
      if (frame[1] < succ.length) {
        const w = succ[frame[1]++];
        if (index[w] < 0) { index[w] = low[w] = counter++; stack.push(w); on[w] = 1; work.push([w, 0]); } else if (on[w]) low[v] = Math.min(low[v], index[w]);
      } else {
        work.pop();
        if (work.length) { const u = work[work.length - 1][0]; low[u] = Math.min(low[u], low[v]); }
        if (low[v] === index[v]) {
          let w;
          do { w = stack.pop(); on[w] = 0; comp[w] = count; } while (w !== v);
          count++;
        }
      }
    }
  }
  return { comp, count };
}

// Whether two sets share a code unit: the unit of work every search here is made of.
function meets(a, b) {
  charge(1);
  return !cs.isEmpty(cs.intersect(a, b));
}

// One code unit from a set, a readable one where the set has it.
const READABLE = 'abcdefghijklmnopqrstuvwxyz0123456789./-_!';
function pick(set) {
  for (const ch of READABLE) if (cs.has(set, ch.charCodeAt(0))) return ch;
  return String.fromCharCode(set[0][0]);
}

// The class of a regex source; classifyTree takes a tree the reader has already made of it, so a
// caller that read the source for another purpose does not read it twice.
function classify(source, options = {}) {
  return classifyTree(read(source, options));
}

function classifyTree(tree, { budget = Infinity } = {}) {
  spent = 0;
  allowed = budget;
  const cls = classes(tree);
  cls.work = spent;
  return cls;
}

function classes(tree) {
  const A = indexed(tree);
  const n = A.size;
  charge(n);
  const succ = A.follow.map(s => [...s]);
  const { comp } = connectedParts(n + 1, v => succ[v]);
  // A looping part: more than one position, or one that steps to itself.
  const members = new Map();
  for (let p = 0; p < n; p++) { if (!members.has(comp[p])) members.set(comp[p], []); members.get(comp[p]).push(p); }
  const loops = [...members.entries()].filter(([, ps]) => ps.length > 1 || A.follow[ps[0]].has(ps[0])).map(([c, ps]) => ({ c, ps }));

  // Exponential: within one looping part, the product of that part with itself.
  for (const { ps } of loops) {
    const inPart = new Set(ps);
    const idx = new Map();
    const pairs = [];
    const key = (p, q) => p * (n + 1) + q;
    if (ps.length * ps.length > SEARCH_LIMIT) throw new Undecided(`a looping part of ${ps.length} positions`);
    charge(ps.length * ps.length);
    for (const p of ps) for (const q of ps) { idx.set(key(p, q), pairs.length); pairs.push([p, q]); }
    const step = pairs.map(([p, q]) => {
      const out = [];
      for (const p2 of A.follow[p]) {
        if (inPart.has(p2)) {
          for (const q2 of A.follow[q]) {
            if (inPart.has(q2) && meets(A.sets[p2], A.sets[q2])) out.push(idx.get(key(p2, q2)));
          }
        }
      }
      return out;
    });
    const pc = connectedParts(pairs.length, v => step[v]).comp;
    for (const p of ps) {
      const d = idx.get(key(p, p));
      // Two ways from p to p2 on one code unit, with both inside this part, are already two
      // different readings: the two copies of p split there and meet again.
      for (const p2 of A.follow[p]) {
        if (!inPart.has(p2) || A.ways(p, p2) < 2 || pc[idx.get(key(p2, p2))] !== pc[d]) continue;
        const back = p2 === p ? [] : path(step, idx.get(key(p2, p2)), d, pc);
        const word = [pick(A.sets[p2]), ...back.map(i => pick(cs.intersect(A.sets[pairs[i][0]], A.sets[pairs[i][1]])))].join('');
        return { kind: 'exponential', degree: Infinity, positions: n, witness: { prefix: prefixTo(A, p), pump: word } };
      }
      const off = pairs.findIndex(([x, y], i) => x !== y && pc[i] === pc[d]);
      if (off < 0) continue;
      // A cycle (p, p) -> off -> (p, p) inside that part, read off as one string.
      const there = path(step, d, off, pc);
      const back = path(step, off, d, pc);
      const word = [...there, ...back].map(i => pick(cs.intersect(A.sets[pairs[i][0]], A.sets[pairs[i][1]]))).join('');
      return { kind: 'exponential', degree: Infinity, positions: n, witness: { prefix: prefixTo(A, p), pump: word } };
    }
  }

  // Polynomial: between two looping parts, the triple product (p, p, q) -> (p, q, q).
  const reach = reachability(n + 1, succ);
  const ida = [];
  for (const a of loops) {
    for (const b of loops) {
      if (a.c === b.c || !reach(a.ps[0], b.ps[0])) continue;
      const found = tripleFind(A, a.ps, b.ps, succ, reach);
      if (found) ida.push({ from: a.c, to: b.c, ...found });
    }
  }
  if (ida.length === 0) return { kind: 'linear', degree: 0, positions: n, witness: null };
  // Degree: the longest chain of such links between looping parts.
  const memo = new Map();
  const longest = c => {
    if (memo.has(c)) return memo.get(c);
    memo.set(c, { len: 0, chain: [] });
    let best = { len: 0, chain: [] };
    for (const e of ida) {
      if (e.from === c) {
        const rest = longest(e.to);
        if (rest.len + 1 > best.len) best = { len: rest.len + 1, chain: [e, ...rest.chain] };
      }
    }
    memo.set(c, best);
    return best;
  };
  let top = { len: 0, chain: [] };
  for (const { c } of loops) { const r = longest(c); if (r.len > top.len) top = r; }
  // Witness: reach the first looping part, then for each link pump its string and walk to the next.
  const first = top.chain[0];
  const segments = top.chain.map(e => ({ pump: e.word, bridge: e.bridge }));
  return { kind: 'polynomial', degree: top.len, positions: n, witness: { prefix: prefixTo(A, first.p), segments } };
}

// Shortest path from a to b in a graph, staying inside a's strongly connected part.
function path(step, a, b, comp) {
  const prev = new Map([[a, -1]]);
  const queue = [a];
  for (let h = 0; h < queue.length; h++) {
    const v = queue[h];
    for (const w of step[v]) {
      if (comp[w] !== comp[a] || prev.has(w)) continue;
      prev.set(w, v);
      if (w === b) {
        const out = [];
        for (let x = b; x !== a; x = prev.get(x)) out.push(x);
        return out.reverse();
      }
      queue.push(w);
    }
  }
  if (a === b) return [];
  throw new Error('no path inside the part');
}

function reachability(n, succ) {
  const memo = new Map();
  return (a, b) => {
    if (!memo.has(a)) {
      const seen = new Uint8Array(n);
      const queue = [a];
      seen[a] = 1;
      for (let h = 0; h < queue.length; h++) for (const w of succ[queue[h]]) if (!seen[w]) { seen[w] = 1; queue.push(w); }
      charge(queue.length);
      memo.set(a, seen);
    }
    return memo.get(a)[b] === 1;
  };
}

// A string w and positions p in part P, q in part Q with p ->w p, p ->w q and q ->w q: a path in
// the triple product from (p, p, q) to (p, q, q). The first copy stays in P, the third in Q.
function tripleFind(A, P, Q, succ, reach) {
  const inP = new Set(P);
  const inQ = new Set(Q);
  const between = v => inP.has(v) || inQ.has(v) || (reach(P[0], v) && reach(v, Q[0]));
  for (const p of P) {
    for (const q of Q) {
      const startKey = [p, p, q].join(',');
      const goal = [p, q, q].join(',');
      const prev = new Map([[startKey, null]]);
      const queue = [[p, p, q]];
      for (let h = 0; h < queue.length; h++) {
        if (queue.length > SEARCH_LIMIT) throw new Undecided(`more than ${SEARCH_LIMIT} product states`);
        charge(1);
        const [x, y, z] = queue[h];
        for (const x2 of succ[x]) {
          if (!inP.has(x2)) continue;
          for (const y2 of succ[y]) {
            if (!between(y2) || !meets(A.sets[x2], A.sets[y2])) continue;
            const xy = cs.intersect(A.sets[x2], A.sets[y2]);
            for (const z2 of succ[z]) {
              if (!inQ.has(z2) || !meets(xy, A.sets[z2])) continue;
              const k = [x2, y2, z2].join(',');
              if (prev.has(k)) continue;
              prev.set(k, [x, y, z].join(','));
              if (k === goal) {
                const keys = [];
                for (let c = k; c !== startKey; c = prev.get(c)) keys.push(c);
                keys.reverse();
                const word = keys.map(c => { const [a, b, d] = c.split(',').map(Number); return pick(cs.intersect(cs.intersect(A.sets[a], A.sets[b]), A.sets[d])); }).join('');
                return { p, q, word, bridge: '' };
              }
              queue.push([x2, y2, z2]);
            }
          }
        }
      }
    }
  }
  return null;
}

// The shortest string that brings the start state to position p.
function prefixTo(A, p) {
  const prev = new Map([[A.S, -1]]);
  const queue = [A.S];
  for (let h = 0; h < queue.length; h++) {
    const v = queue[h];
    if (v === p) break;
    for (const w of A.follow[v]) if (!prev.has(w)) { prev.set(w, v); queue.push(w); }
  }
  if (!prev.has(p)) return null;
  const out = [];
  for (let x = p; x !== A.S; x = prev.get(x)) out.push(pick(A.sets[x]));
  return out.reverse().join('');
}

// Whether every position can be reached from the start and can reach an end. For an unambiguous
// regex this settles the class without the products: a position with two loops on one string, or
// a loop leading to another loop on the same string, could then be entered from the start and
// left to an end, and some string would have two readings. So unambiguous and trimmed is linear.
function trimmed(source, options = {}) {
  // A report for the tests, on regexes of thousands of positions: no allowance applies.
  spent = 0;
  allowed = Infinity;
  const A = indexed(read(source, options));
  const n = A.size;
  // A position whose set is empty, such as [], can never be read, so no path goes through it.
  const readable = p => p === A.S || !cs.isEmpty(A.sets[p]);
  const forward = new Uint8Array(n + 1);
  const queue = [A.S];
  forward[A.S] = 1;
  for (let h = 0; h < queue.length; h++) for (const w of A.follow[queue[h]]) if (!forward[w] && readable(w)) { forward[w] = 1; queue.push(w); }
  const back = Array.from({ length: n + 1 }, () => []);
  A.follow.forEach((s, a) => { for (const b of s) back[b].push(a); });
  const backward = new Uint8Array(n + 1);
  const q2 = [...A.ends].filter(readable);
  for (const e of q2) backward[e] = 1;
  for (let h = 0; h < q2.length; h++) for (const w of back[q2[h]]) if (!backward[w] && readable(w)) { backward[w] = 1; q2.push(w); }
  const dead = [];
  for (let p = 0; p < n; p++) if (readable(p) && (!forward[p] || !backward[p])) dead.push(p);
  return { trimmed: dead.length === 0, positions: n, dead };
}

// The longest input on which the regex itself may run: a backtracking engine's work on n code
// units grows like n^(degree + 1), and it is allowed up to WORK_BUDGET of that. Past the length
// returned, or always when the class is exponential or was not decided, the caller uses the DFA.
// A linear regex has no limit: on it the engine is already as safe as the DFA, and faster.
const WORK_BUDGET = 1e6;
// The classifying work one regex may cost when it is made. Measured: the regexes of ordinary
// globs take up to about 1,000 units, a unit being under a microsecond; a glob of thirty stars
// takes 46,000 and one of a hundred 1.7 million. A regex over the allowance is not decided, and
// so always gets the DFA.
const CLASSIFY_BUDGET = 4000;
// The limit is kept per source and flags, so compiling the same glob again costs a lookup. tree
// is the reader's tree for that source and those flags, when the caller already has it.
//
// The sources are the keys, so what is kept is capped: at most LIMITS_KEPT limits, the oldest
// dropped first, and none for a source over LIMIT_KEY_MAX characters. A limit not kept is
// worked out again, which costs time and changes no answer.
const LIMITS_KEPT = 1000;
const LIMIT_KEY_MAX = 2000;
const limits = new Map();
function regexLengthLimit(source, flags, tree) {
  const key = flags + '/' + source;
  let limit = limits.get(key);
  if (limit !== undefined) return limit;
  let cls;
  try {
    cls = classifyTree(tree || read(source, { ignoreCase: flags.includes('i') }), { budget: CLASSIFY_BUDGET });
  } catch (err) {
    if (!(err instanceof Undecided)) throw err;
    cls = { kind: 'undecided' };
  }
  if (cls.kind === 'linear') limit = Infinity;
  else if (cls.kind === 'polynomial') limit = Math.floor(WORK_BUDGET ** (1 / (cls.degree + 1)));
  else limit = 0;
  if (source.length > LIMIT_KEY_MAX) return limit;
  // A Map lists its keys oldest first.
  if (limits.size >= LIMITS_KEPT) limits.delete(limits.keys().next().value);
  limits.set(key, limit);
  return limit;
}

// The limit kept for a source and flags seen before, or undefined.
const keptLimit = (source, flags) => limits.get(flags + '/' + source);

// For measurements of a first compile: drops every kept limit.
const forgetLimits = () => limits.clear();
const keptCount = () => limits.size;

module.exports = { classify, classifyTree, trimmed, regexLengthLimit, keptLimit, keptCount, forgetLimits, Undecided, WORK_BUDGET, CLASSIFY_BUDGET, LIMITS_KEPT, LIMIT_KEY_MAX };
