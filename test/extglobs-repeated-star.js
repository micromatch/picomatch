'use strict';

const assert = require('assert');
const { isMatch, makeRe } = require('..');

/**
 * GHSA-fc5q-39xc-vjpf: a repeated extglob whose single branch contains `*`
 * (`+(*)`, `+(*a)`, `*(*a)`, `+(a*b)`) compiled to a nested quantifier such as
 * `(?:[^/]*?a)+`, which backtracks exponentially on a near-miss: about 3.5
 * seconds for 28 characters, doubling with each one more.
 *
 * Repeating such a branch adds nothing (any run of matches is itself one
 * match), so it is compiled once: `+(X)` as `(X)` and `*(X)` as `(X)?`.
 */

const elapsed = fn => {
  const start = process.hrtime.bigint();
  fn();
  return Number(process.hrtime.bigint() - start) / 1e6;
};

describe('repeated extglobs with a single star branch (GHSA-fc5q-39xc-vjpf)', () => {
  it('should compile the branch once, without a nested quantifier', () => {
    assert.strictEqual(makeRe('+(*)').source, '^(?:(?=.)(?:[^/]*?))$');
    assert.strictEqual(makeRe('+(*a)').source, '^(?:(?=.)(?:[^/]*?a))$');
    assert.strictEqual(makeRe('*(*a)').source, '^(?:(?=.)(?:[^/]*?a)?)$');
    assert.strictEqual(makeRe('+(a*b)').source, '^(?:(?=.)(?:a[^/]*?b))$');
  });

  it('should not backtrack exponentially on a near-miss', () => {
    const cases = [
      ['+(*)', 'a'.repeat(64) + '/'],
      ['+(*a)', 'a'.repeat(64) + 'b'],
      ['*(*a)', 'a'.repeat(64) + 'b'],
      ['+(a*)', 'a'.repeat(64) + '/'],
      ['+(*a*)', 'a'.repeat(64) + '/'],
      ['+(a*b)', 'ab'.repeat(32) + 'c'],
      ['x+(*a)y', 'x' + 'a'.repeat(64) + 'by']
    ];

    for (const [pattern, input] of cases) {
      const ms = elapsed(() => isMatch(input, pattern));
      assert(ms < 100, `${pattern} took ${ms.toFixed(1)}ms on a ${input.length}-character near-miss`);
    }
  });

  it('should match exactly what the repeated form matched', () => {
    assert(isMatch('a', '+(*a)'));
    assert(isMatch('aaa', '+(*a)'));
    assert(isMatch('xya', '+(*a)'));
    assert(!isMatch('ab', '+(*a)'));
    assert(!isMatch('a/a', '+(*a)'));

    assert(isMatch('', '*(*a)', { dot: true }) === isMatch('', '*(*a)'));
    assert(isMatch('ba', '*(*a)'));
    assert(!isMatch('b', '*(*a)'));

    assert(isMatch('ab', '+(a*b)'));
    assert(isMatch('abab', '+(a*b)'));
    assert(isMatch('axxb', '+(a*b)'));
    assert(!isMatch('ba', '+(a*b)'));
    assert(!isMatch('ab/ab', '+(a*b)'));

    assert(isMatch('abc', '+(*)c'));
    assert(isMatch('xaay', 'x+(*a)y'));
    assert(!isMatch('xay/y', 'x+(*a)y'));
  });

  it('should leave branches that do not absorb their repetition alone', () => {
    // `**` can match `/`, a `/` splits the repeats into segments, and a branch
    // without `*` is a bounded length: all keep their quantifier.
    assert.match(makeRe('+(**)', { maxExtglobRecursion: false }).source, /\)\+/);
    assert.match(makeRe('+(*/)').source, /\)\+/);
    assert.match(makeRe('+(ab)').source, /\)\+/);
    assert.match(makeRe('+(a?)').source, /\)\+/);
    assert(isMatch('a/b/', '+(*/)'));
  });
});
