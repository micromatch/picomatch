'use strict';

const assert = require('assert');
const { isMatch, makeRe } = require('..');

describe('options.maxExtglobRecursion', () => {
  it('should literalize risky repeated extglobs by default', () => {
    assert.strictEqual(
      makeRe('+(a|aa)').source,
      '^(?:\\+\\(a\\|aa\\))$'
    );
    assert.strictEqual(
      makeRe('+(*|?)').source,
      '^(?:\\+\\(\\*\\|\\?\\))$'
    );
    assert.strictEqual(
      makeRe('+(+(a))').source,
      '^(?:\\+\\(\\+\\(a\\)\\))$'
    );
    assert.strictEqual(
      makeRe('*(+(a))').source,
      '^(?:\\*\\(\\+\\(a\\)\\))$'
    );

    assert(!isMatch('a'.repeat(20) + 'b', '+(a|aa)'));
    assert(!isMatch('a'.repeat(12) + '!', '+(+(a))'));
  });

  it('should preserve non-risky extglobs by default', () => {
    assert(isMatch('abcabc', '+(abc)'));
    assert(isMatch('foobar', '*(foo|bar)'));
    assert(isMatch('a', '(a|@(b|c)|d)'));
    assert(isMatch('fffooo', '*(*(f)*(o))'));
    assert(isMatch('abc', '+(*)c'));
  });

  it('should allow limited nested repeated extglobs when configured', () => {
    assert.strictEqual(
      makeRe('+(+(a))', { maxExtglobRecursion: 1 }).source,
      '^(?:(?=.)(?:(?:a)+)+)$'
    );
    assert.strictEqual(
      makeRe('*(+(a))', { maxExtglobRecursion: 1 }).source,
      '^(?:(?=.)(?:(?:a)+)*)$'
    );

    assert(isMatch('aaa', '+(+(a))', { maxExtglobRecursion: 1 }));
    assert(isMatch('aaa', '*(+(a))', { maxExtglobRecursion: 1 }));
  });

  it('should still block ambiguous repeated alternation when recursion is allowed', () => {
    assert.strictEqual(
      makeRe('+(a|aa)', { maxExtglobRecursion: 1 }).source,
      '^(?:\\+\\(a\\|aa\\))$'
    );
    assert.strictEqual(
      makeRe('+(*|?)', { maxExtglobRecursion: 1 }).source,
      '^(?:\\+\\(\\*\\|\\?\\))$'
    );
  });

  it('should rewrite risky repeated extglobs embedded in larger patterns', () => {
    assert.strictEqual(
      makeRe('foo/+(a|aa)/bar').source,
      '^(?:foo\\/\\+\\(a\\|aa\\)\\/bar)$'
    );
    assert.strictEqual(
      makeRe('x+(a|aa)y').source,
      '^(?:x\\+\\(a\\|aa\\)y)$'
    );

    assert(isMatch('foo/+(a|aa)/bar', 'foo/+(a|aa)/bar'));
    assert(!isMatch('foo/aa/bar', 'foo/+(a|aa)/bar'));
    assert(isMatch('x+(a|aa)y', 'x+(a|aa)y'));
    assert(!isMatch('xaay', 'x+(a|aa)y'));
  });

  it('should rewrite star-only repeated extglobs embedded in larger patterns', () => {
    assert.strictEqual(
      makeRe('pre*(*(f)*(o))post').source,
      '^(?:pre[fo]*post)$'
    );

    assert(isMatch('prefoopost', 'pre*(*(f)*(o))post'));
  });

  it('should rewrite star-only repeated extglobs', () => {
    assert.strictEqual(
      makeRe('*(*(f))').source,
      '^(?:(?=.)f*)$'
    );

    assert(isMatch('fff', '*(*(f))'));
  });

  it('should rewrite multi-branch star-only repeated extglobs without dropping branches', () => {
    // Regression: the risky-extglob rewrite previously emitted only the first
    // branch, so `+(*(a)|*(b))` collapsed to `a*` and silently stopped matching
    // any string containing `b`. The safe rewrite must preserve every branch.
    assert.strictEqual(
      makeRe('+(*(a)|*(b))').source,
      '^(?:(?=.)[ab]*)$'
    );
    assert.strictEqual(
      makeRe('*(*(a)|c)').source,
      '^(?:(?=.)[ac]*)$'
    );

    for (const str of ['a', 'b', 'ab', 'ba', 'aabb']) {
      assert(isMatch(str, '+(*(a)|*(b))'), `expected to match ${str}`);
    }
    assert(!isMatch('c', '+(*(a)|*(b))'));

    for (const str of ['c', 'a', 'aca', 'cac']) {
      assert(isMatch(str, '*(*(a)|c)'), `expected to match ${str}`);
    }
    assert(!isMatch('d', '*(*(a)|c)'));
  });

  it('should preserve capture behavior for rewritten repeated extglobs', () => {
    const embedded = makeRe('foo/+(a|aa)/bar', { capture: true });
    assert.strictEqual(embedded.source, '^(?:foo\\/\\+\\(a\\|aa\\)\\/bar)$');
    assert.deepStrictEqual(
      Array.from(embedded.exec('foo/+(a|aa)/bar')),
      ['foo/+(a|aa)/bar']
    );

    const simplified = makeRe('*(*(f)*(o))', { capture: true });
    assert.strictEqual(simplified.source, '^(?:(?=.)([fo]*))$');
    assert.deepStrictEqual(
      Array.from(simplified.exec('fffooo')),
      ['fffooo', 'fffooo']
    );
  });

  it('should only rewrite the risky repeated extglob when adjacent extglobs are present', () => {
    assert.strictEqual(
      makeRe('+(a|aa)@(x)').source,
      '^(?:\\+\\(a\\|aa\\)(x))$'
    );

    assert(isMatch('+(a|aa)x', '+(a|aa)@(x)'));
    assert(!isMatch('aaax', '+(a|aa)@(x)'));
  });
  it('should match a single-branch repeated extglob with a wildcard star in one pass', () => {
    assert.strictEqual(makeRe('+(*a)').source, '^(?:(?=.)(?:[^/]*?a))$');
    assert.strictEqual(makeRe('*(*a)').source, '^(?:(?=.)(?:[^/]*?a)?)$');
    assert.strictEqual(makeRe('+(*)').source, '^(?:(?=.)(?:[^/]*?))$');
    assert.strictEqual(makeRe('+(a*b)').source, '^(?:(?=.)(?:a[^/]*?b))$');
    assert.strictEqual(makeRe('+(*.js)').source, '^(?:(?=.)(?:[^/]*?\\.js))$');
    assert.strictEqual(makeRe('x/+(*a)/y').source, '^(?:x\\/(?:[^/]*?a)\\/y)$');
    assert.strictEqual(
      makeRe('+(*a)', { capture: true }).source,
      '^(?:(?=.)((?:([^/]*?)a)))$'
    );

    assert(!isMatch('a'.repeat(28) + 'b', '+(*a)'));
    assert(!isMatch('a'.repeat(28) + 'b', '*(*a)'));
    assert(!isMatch('ab'.repeat(28) + 'c', '+(a*b)'));
    assert(!isMatch('a'.repeat(28) + '/', '+(*)'));
  });

  it('should match the same strings as the repeated form did', () => {
    assert(isMatch('a', '+(*a)'));
    assert(isMatch('ba', '+(*a)'));
    assert(isMatch('abba', '+(*a)'));
    assert(!isMatch('ab', '+(*a)'));
    assert(!isMatch('b/a', '+(*a)'));

    assert(isMatch('a', '*(*a)'));
    assert(isMatch('aba', '*(*a)'));
    assert(!isMatch('ab', '*(*a)'));
    assert(isMatch('x', 'x*(*a)'));
    assert(isMatch('xba', 'x*(*a)'));
    assert(!isMatch('xab', 'x*(*a)'));

    assert(isMatch('ab', '+(a*b)'));
    assert(isMatch('abab', '+(a*b)'));
    assert(isMatch('axbayb', '+(a*b)'));
    assert(!isMatch('aba', '+(a*b)'));

    assert(isMatch('a.js', '+(*.js)'));
    assert(isMatch('a.js.js', '+(*.js)'));
    assert(!isMatch('a.jsx', '+(*.js)'));

    assert(isMatch('x/a/y', 'x/+(*a)/y'));
    assert(isMatch('x/baba/y', 'x/+(*a)/y'));
    assert(!isMatch('x/ab/y', 'x/+(*a)/y'));
  });

  it('should literalize a single-branch repeated extglob that mixes a wildcard star with other syntax', () => {
    assert.strictEqual(makeRe('+(*[ab])').source, '^(?:\\+\\(\\*\\[ab\\]\\))$');
    assert.strictEqual(makeRe('+(*/*)').source, '^(?:\\+\\(\\*\\/\\*\\))$');
    assert.strictEqual(makeRe('+(*(a)*)').source, '^(?:\\+\\(\\*\\(a\\)\\*\\))$');

    assert(!isMatch('a'.repeat(28) + 'c', '+(*[ab])'));
    assert(!isMatch('a/'.repeat(14) + 'a!', '+(*/*)'));
  });

  it('should leave a nested star extglob to the star sequence rewrite', () => {
    assert.strictEqual(makeRe('+(*(a))').source, '^(?:(?=.)a*)$');
    assert(isMatch('fffooo', '*(*(f)*(o))'));
  });

  it('should keep the repetition of a wildcard star when maxExtglobRecursion is false', () => {
    assert.strictEqual(
      makeRe('+(*a)', { maxExtglobRecursion: false }).source,
      '^(?:(?=.)(?:[^/]*?a)+)$'
    );
  });

  it('should disable the safeguard when maxExtglobRecursion is false', () => {
    assert(
      /\(\?:a\|aa\)\+/.test(
        makeRe('+(a|aa)', { maxExtglobRecursion: false }).source
      )
    );
    assert(
      /\(\?:\(\?:a\)\+\)\+/.test(
        makeRe('+(+(a))', { maxExtglobRecursion: false }).source
      )
    );
  });
});
