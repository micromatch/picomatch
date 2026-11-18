'use strict';

const assert = require('assert');
const { isMatch, makeRe } = require('..');

/**
 * GHSA-fc5q-39xc-vjpf: a single-branch repeated extglob whose body is a star, or a
 * literal with a star on one or both ends, used to compile to a nested quantifier
 * such as `(?:[^/]*?a)+` and backtrack exponentially on short non-matching input.
 */

describe('repeated extglobs with a star-literal body', () => {
  it('should compile to a single repetition instead of a nested quantifier', () => {
    assert.strictEqual(makeRe('+(*a)').source, '^(?:(?=.)[^/]*?a)$');
    assert.strictEqual(makeRe('+(a*)').source, '^(?:(?=.)a[^/]*?)$');
    assert.strictEqual(makeRe('+(*ab*)').source, '^(?:(?=.)[^/]*?ab[^/]*?)$');
    assert.strictEqual(makeRe('+(*)').source, '^(?:(?=.)[^/]*?)$');
    assert.strictEqual(makeRe('*(*)').source, '^(?:(?=.)[^/]*?)$');
    assert.strictEqual(makeRe('*(*a)').source, '^(?:(?=.)(?:[^/]*?a)?)$');
  });

  it('should not backtrack exponentially on non-matching input', () => {
    const many = 'a'.repeat(64);
    assert(!isMatch(`${many}b`, '+(*a)'));
    assert(!isMatch(`${many}b`, '*(*a)'));
    assert(!isMatch(`${many}/`, '+(*)'));
    assert(!isMatch(`${many}/`, '+(a*)'));
    assert(!isMatch(`${'ab'.repeat(32)}/x`, '*(*ab*)'));
  });

  it('should match what one or more repetitions of the body match', () => {
    assert(isMatch('a', '+(*a)'));
    assert(isMatch('xa', '+(*a)'));
    assert(isMatch('xaya', '+(*a)'));
    assert(!isMatch('ax', '+(*a)'));
    assert(!isMatch('xa/ya', '+(*a)'));

    assert(isMatch('a', '+(a*)'));
    assert(isMatch('axay', '+(a*)'));
    assert(!isMatch('xa', '+(a*)'));

    assert(isMatch('ab', '+(*ab*)'));
    assert(isMatch('xabyabz', '+(*ab*)'));
    assert(!isMatch('xaby/z', '+(*ab*)'));
    assert(!isMatch('ba', '+(*ab*)'));

    assert(isMatch('anything', '+(*)'));
    assert(!isMatch('a/b', '+(*)'));
  });

  it('should keep a star extglob optional', () => {
    assert(isMatch('a', 'a*(b*)'));
    assert(isMatch('ab', 'a*(b*)'));
    assert(isMatch('abxb', 'a*(b*)'));
    assert(!isMatch('ax', 'a*(b*)'));
    assert(isMatch('x.js', '*(*x).js'));
    assert(isMatch('.js', '*(*x).js', { dot: true }));
  });

  it('should leave bodies with a path separator to the repeated form', () => {
    assert.strictEqual(makeRe('+(*a/b)').source, '^(?:(?=.)(?:[^/]*?a\\/b)+)$');
    assert(isMatch('xa/bya/b', '+(*a/b)'));
  });

  it('should use the inner star of the active options', () => {
    assert.strictEqual(makeRe('+(*a)', { bash: true }).source, '^(?:(?=.).*?a)$');
    assert.strictEqual(makeRe('+(*a)', { windows: true }).source, '^(?:(?=.)[^\\\\/]*?a)$');
    assert(isMatch('.a', '+(*a)', { bash: true }));
    assert(!isMatch(`${'a'.repeat(64)}b`, '+(*a)', { bash: true }));
  });

  it('should leave a literal ending in a dot before the star to the repeated form', () => {
    assert(makeRe('+(a.*)').source.includes(')+)$'));
    assert(isMatch('a.b', '+(a.*)'));
    assert(!isMatch('a.', '+(a.*)'));
  });

  it('should preserve capture groups', () => {
    const match = makeRe('+(*a)', { capture: true }).exec('xya');
    assert(match);
    assert.strictEqual(match[0], 'xya');
  });
});
