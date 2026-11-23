'use strict';

// The position automaton of a regex tree, with a count on every step: how many different parses
// lead from one character position to the next. With M_x the matrix of those counts on a code
// unit x, the number of parses of a string is a product of them, which is what both users of this
// module read. The checker asks whether any count exceeds one; the backtracking classifier in
// backtracking.js asks how fast the counts can grow.
//
// Positions are numbered from 1 in the order the tree is read; 0 is the start. A repeat is
// unrolled as the engine reads it: min copies, then a star or (max - min) optionals, so the
// copies are distinct positions and every way of reaching a step is counted.

// assertion(node) answers for ^, $ and lookaheads: it returns the walk result to use, or throws.
// charge(units), when given, is told the size of each batch of steps before it is made and may
// throw to stop the build: a repeat of many branches has a step from every branch to every other.
function positionAutomaton(tree, { assertion, charge = null }) {
  const sets = []; // charset per position, sets[p - 1] for position p
  const steps = new Map(); // "p,q" -> count
  let emptyBodies = 0; // repeat bodies that can match the empty string
  // A count of zero is no parse at all, so it adds no entry.
  const addCounts = (target, from, factor) => {
    if (factor === 0) return;
    for (const [p, c] of from) target.set(p, (target.get(p) || 0) + c * factor);
  };
  const link = (lasts, firsts) => {
    if (charge) charge(lasts.size * firsts.size);
    for (const [p, a] of lasts) {
      for (const [q, b] of firsts) {
        if (a * b === 0) continue;
        const key = p + ',' + q;
        steps.set(key, (steps.get(key) || 0) + a * b);
      }
    }
  };

  // Returns { nul: number of empty parses, first: Map pos->count, last: Map pos->count }.
  function walk(n) {
    switch (n.type) {
      case 'eps': return { nul: 1, first: new Map(), last: new Map() };
      case 'chars': {
        sets.push(n.set);
        const p = sets.length;
        return { nul: 0, first: new Map([[p, 1]]), last: new Map([[p, 1]]) };
      }
      case 'alt': {
        const r = { nul: 0, first: new Map(), last: new Map() };
        for (const item of n.items) {
          const w = walk(item);
          r.nul += w.nul;
          addCounts(r.first, w.first, 1);
          addCounts(r.last, w.last, 1);
        }
        return r;
      }
      case 'seq': {
        let r = { nul: 1, first: new Map(), last: new Map() };
        for (const item of n.items) {
          const w = walk(item);
          link(r.last, w.first);
          const first = new Map(r.first);
          addCounts(first, w.first, r.nul);
          const last = new Map(w.last);
          addCounts(last, r.last, w.nul);
          r = { nul: r.nul * w.nul, first, last };
        }
        return r;
      }
      case 'repeat': {
        // a{2,500} is unrolled into 500 copies of a, each walked.
        if (charge) charge(n.max === Infinity ? n.min : n.max);
        const copies = [];
        for (let i = 0; i < n.min; i++) copies.push(n.node);
        let tail;
        if (n.max === Infinity) tail = { type: 'star', node: n.node };
        else {
          tail = { type: 'eps' };
          for (let i = 0; i < n.max - n.min; i++) tail = { type: 'alt', items: [{ type: 'eps' }, { type: 'seq', items: [n.node, tail] }] };
        }
        return walk({ type: 'seq', items: [...copies, tail] });
      }
      case 'star': {
        const w = walk(n.node);
        if (w.nul > 0) emptyBodies++;
        link(w.last, w.first);
        return { nul: 1, first: w.first, last: w.last };
      }
      case 'start': case 'end': case 'look': return assertion(n);
      default: throw new Error('unknown tree node ' + n.type);
    }
  }

  const w = walk(tree);
  return { sets, steps, first: w.first, last: w.last, nul: w.nul, emptyBodies };
}

module.exports = { positionAutomaton };
