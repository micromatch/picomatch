'use strict';

// Glushkov's position automaton retains each regex character occurrence. The
// square automaton detects two distinct accepting paths for the same input.
// Nullable multiplicities and parallel edges must be retained: collapsing them
// would incorrectly classify nested repetitions such as (a+)+ as safe.
const MAX_POSITIONS = 128;
const MAX_OPERATIONS = 500000;
const MAX_SOURCE = 8192;
const EMPTY = () => ({ kind: 'empty' });
const seq = nodes => ({ kind: 'sequence', nodes });
const choice = nodes => nodes.length === 1 ? nodes[0] : ({ kind: 'choice', nodes });
const cap = value => Math.min(2, value);
const symbol = code => code >= 65 && code <= 90 ? code + 32 : code;
// Unicode ignore-case also equates K/k with Kelvin sign and S/s with long s.
// OTHER deliberately overapproximates those classes for any later flags.
const folded = codes => {
  const result = new Set(codes.map(symbol));
  if (result.has(107) || result.has(115)) result.add(128);
  return result;
};
const ALL = new Set(Array.from({ length: 129 }, (_, i) => symbol(i)));
const tick = budget => { if (++budget.operations > MAX_OPERATIONS) throw new Error('proof_limit'); };

const bounded = node => {
  if (node.kind === 'repeat') return node.max !== Infinity && bounded(node.node);
  if (node.nodes) return node.nodes.every(bounded);
  return true;
};

const parse = (source, budget) => {
  let index = 0;
  let depth = 0;
  const fail = () => { throw new Error('unproven_regex'); };
  const escaped = () => {
    const char = source[index++];
    if (char === undefined) return fail();
    if (/^[^a-zA-Z0-9]$/.test(char)) return char.charCodeAt(0);
    if (char === 'x' || char === 'u') {
      const count = char === 'x' ? 2 : 4;
      const value = source.slice(index, index + count);
      if (!new RegExp(`^[0-9a-fA-F]{${count}}$`).test(value)) return fail();
      index += count;
      return parseInt(value, 16);
    }
    if (char === 'n') return 10;
    if (char === 'r') return 13;
    if (char === 't') return 9;
    return fail(); // Backreferences, unicode properties and unknown escapes.
  };
  const atom = codes => ({ kind: 'atom', codes });
  const character = code => {
    if (code > 127) return fail();
    return atom(folded([code]));
  };
  const characterClass = () => {
    const negative = source[index] === '^';
    if (negative) index++;
    const raw = new Set();
    while (index < source.length && source[index] !== ']') {
      let start = source.charCodeAt(index++);
      if (start === 92) start = escaped();
      if (start > 127 || start === 91) return fail();
      if (source[index] === '-' && source[index + 1] !== ']') {
        index++;
        let end = source.charCodeAt(index++);
        if (end === 92) end = escaped();
        if (!(end <= 127 && end >= start)) return fail();
        for (let value = start; value <= end; value++) raw.add(value);
      } else raw.add(start);
    }
    if (source[index++] !== ']' || raw.size === 0) return fail();
    // Fold only after taking the complement, so [^A] still includes a.
    const codes = negative ? Array.from({ length: 128 }, (_, i) => i).filter(i => !raw.has(i)).concat(128) : [...raw];
    return atom(folded(codes));
  };
  const expression = () => {
    if (++depth > 32) return fail();
    const branches = [];
    let nodes = [];
    while (index < source.length && source[index] !== ')') {
      tick(budget);
      if (source[index] === '|') { index++; branches.push(seq(nodes)); nodes = []; continue; }
      const char = source[index++];
      let node;
      if (char === '(') {
        let assertion = false;
        if (source.startsWith('?:', index)) index += 2;
        else if (source.startsWith('?=', index) || source.startsWith('?!', index)) { index += 2; assertion = true; } else if (source[index] === '?') return fail();
        node = expression();
        if (source[index++] !== ')') return fail();
        if (assertion) {
          // A linear but unbounded assertion re-evaluated on every repeated
          // character could still introduce quadratic work. Keep assertions
          // bounded as well as unambiguous.
          if (!bounded(node) || !unambiguous(node, budget)) return fail();
          node = EMPTY(); // An overapproximation of the assertion's language.
        }
      } else if (char === '[') node = characterClass();
      else if (char === '\\') node = character(escaped());
      else if (char === '.') node = atom(ALL);
      else if (char === '^' || char === '$') node = EMPTY();
      else if (/[?*+{}]/.test(char)) return fail();
      else node = character(char.charCodeAt(0));

      const quantifier = source[index];
      if (quantifier === '*' || quantifier === '+' || quantifier === '?') {
        index++;
        node = { kind: 'repeat', node, min: quantifier === '+' ? 1 : 0, max: quantifier === '?' ? 1 : Infinity };
        if (source[index] === '?') index++;
      } else if (quantifier === '{') {
        const match = /^\{(\d+)(?:,(\d*))?\}/.exec(source.slice(index));
        if (!match) return fail();
        const min = Number(match[1]);
        const max = match[2] === undefined ? min : match[2] === '' ? Infinity : Number(match[2]);
        if (min > max || min > 16 || (max !== Infinity && max > 16)) return fail();
        index += match[0].length;
        node = { kind: 'repeat', node, min, max };
        if (source[index] === '?') index++;
      }
      nodes.push(node);
    }
    branches.push(seq(nodes));
    depth--;
    return choice(branches);
  };
  const result = expression();
  if (index !== source.length) return fail();
  return result;
};

const intersects = (left, right, budget) => {
  for (const code of left) { tick(budget); if (right.has(code)) return true; }
  return false;
};

const unambiguous = (ast, budget) => {
  const positions = [];
  const follow = [];
  const epsilon = () => ({ nullable: 1, first: new Map(), last: new Map() });
  const merge = (target, source, multiplier = 1) => {
    if (multiplier === 0) return target;
    for (const [position, count] of source) target.set(position, cap((target.get(position) || 0) + count * multiplier));
    return target;
  };
  const connect = (last, first) => {
    for (const [from, a] of last) {
      for (const [to, b] of first) {
        tick(budget);
        const edges = follow[from];
        edges.set(to, cap((edges.get(to) || 0) + a * b));
      }
    }
  };
  const concatenate = (left, right) => {
    connect(left.last, right.first);
    return {
      nullable: cap(left.nullable * right.nullable),
      first: merge(new Map(left.first), right.first, left.nullable),
      last: merge(new Map(right.last), left.last, right.nullable)
    };
  };
  const compile = node => {
    tick(budget);
    if (node.kind === 'empty') return epsilon();
    if (node.kind === 'atom') {
      if (positions.length >= MAX_POSITIONS) throw new Error('position_limit');
      const id = positions.length;
      positions.push(node.codes); follow.push(new Map());
      return { nullable: 0, first: new Map([[id, 1]]), last: new Map([[id, 1]]) };
    }
    if (node.kind === 'sequence') return node.nodes.reduce((result, child) => concatenate(result, compile(child)), epsilon());
    if (node.kind === 'choice') {
      const result = { nullable: 0, first: new Map(), last: new Map() };
      for (const child of node.nodes) {
        const value = compile(child);
        result.nullable = cap(result.nullable + value.nullable);
        merge(result.first, value.first); merge(result.last, value.last);
      }
      return result;
    }
    if (node.max === Infinity) {
      const value = compile(node.node);
      if (value.nullable) throw new Error('nullable_unbounded_repeat');
      connect(value.last, value.first);
      value.nullable = node.min === 0 ? 1 : 0;
      // This parser emits only * and +, or bounded-count prefixes. Unknown
      // unbounded {n,} forms are deliberately outside the proof grammar.
      if (node.min > 1) throw new Error('unbounded_count_prefix');
      return value;
    }
    let result = epsilon();
    for (let count = 0; count < node.max; count++) {
      const value = compile(node.node);
      if (count >= node.min) value.nullable = cap(value.nullable + 1);
      result = concatenate(result, value);
    }
    return result;
  };
  const root = compile(ast);
  if (root.nullable > 1) return false;
  const queue = [];
  const seen = new Set();
  const push = (a, b, diverged) => {
    const key = `${a}:${b}:${diverged}`;
    if (!seen.has(key)) { seen.add(key); queue.push([a, b, diverged]); }
  };
  for (const [a, countA] of root.first) {
    for (const [b, countB] of root.first) {
      if (intersects(positions[a], positions[b], budget)) push(a, b, a !== b || countA > 1 || countB > 1);
    }
  }
  while (queue.length) {
    tick(budget);
    const [a, b, diverged] = queue.pop();
    const endA = root.last.get(a) || 0;
    const endB = root.last.get(b) || 0;
    if (endA && endB && (diverged || endA > 1 || endB > 1)) return false;
    for (const [nextA, countA] of follow[a]) {
      for (const [nextB, countB] of follow[b]) {
        if (intersects(positions[nextA], positions[nextB], budget)) push(nextA, nextB, diverged || nextA !== nextB || countA > 1 || countB > 1);
      }
    }
  }
  return true;
};

module.exports = (source, repeated = true) => {
  if (source.length > MAX_SOURCE) return false;
  const budget = { operations: 0 };
  try {
    const body = parse(source, budget);
    return unambiguous(repeated ? { kind: 'repeat', node: body, min: 1, max: Infinity } : body, budget);
  } catch (error) {
    return false;
  }
};
