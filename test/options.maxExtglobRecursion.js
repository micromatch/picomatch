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
    // +(*)c is now literalized (glob star inside repeated extglob → ReDoS risk)
    assert(!isMatch('abc', '+(*)c'));
    assert(isMatch('+(*)c', '+(*)c'));
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
  it('should literalize extglobs containing a glob star (CVE-2026-112366)', () => {
    // Single-branch patterns with glob star
    assert.strictEqual(
      makeRe('+(*)').source,
      '^(?:\\+\\(\\*\\))$'
    );
    assert.strictEqual(
      makeRe('+(*a)').source,
      '^(?:\\+\\(\\*a\\))$'
    );
    assert.strictEqual(
      makeRe('+(a*)').source,
      '^(?:\\+\\(a\\*\\))$'
    );
    assert.strictEqual(
      makeRe('+(a*a)').source,
      '^(?:\\+\\(a\\*a\\))$'
    );

    // Glob star in branch with trailing text
    assert.strictEqual(
      makeRe('+(*)a').source,
      '^(?:\\+\\(\\*\\)a)$'
    );

    // Star-type extglob with glob star
    assert.strictEqual(
      makeRe('*(*)').source,
      '^(?:\\*\\(\\*\\))$'
    );
    assert.strictEqual(
      makeRe('*(*a)').source,
      '^(?:\\*\\(\\*a\\))$'
    );

    // Multi-branch with glob star
    assert.strictEqual(
      makeRe('*(a*|b)').source,
      '^(?:\\*\\(a\\*\\|b\\))$'
    );

    // Literalized patterns match themselves literally
    assert(isMatch('+(*)a', '+(*)a'));
    assert(!isMatch('fooa', '+(*)a'));
    assert(isMatch('+(*a)', '+(*a)'));
    assert(!isMatch('fooafooa', '+(*a)'));

    // These must complete in constant time (no exponential backtracking)
    const start = Date.now();
    isMatch('a'.repeat(100) + '!', '+(*a)');
    isMatch('a'.repeat(100) + '!', '+(*)a');
    isMatch('a'.repeat(100) + '/', '+(a*)');
    assert(Date.now() - start < 100, 'literalized patterns should be fast');
  });

  it('should literalize multi-branch extglobs with repetition overlap', () => {
    // Multi-char prefix overlap: one branch repeats another
    assert.strictEqual(
      makeRe('+(ab|abab)').source,
      '^(?:\\+\\(ab\\|abab\\))$'
    );
    assert.strictEqual(
      makeRe('+(abc|abcabc)').source,
      '^(?:\\+\\(abc\\|abcabc\\))$'
    );

    // Matches literal text only
    assert(isMatch('+(ab|abab)', '+(ab|abab)'));
    assert(!isMatch('ababab', '+(ab|abab)'));

    // Non-repeating prefix overlap is preserved (not vulnerable)
    assert.notStrictEqual(
      makeRe('+(js|jsx)').source,
      '^(?:\\+\\(js\\|jsx\\))$'
    );
    assert(isMatch('jsjsx', '+(js|jsx)'));

    assert.notStrictEqual(
      makeRe('+(foo|foobar)').source,
      '^(?:\\+\\(foo\\|foobar\\))$'
    );
    assert(isMatch('foofoobar', '+(foo|foobar)'));
  });

  it('should not flag extglob quantifier * as a glob star', () => {
    // *(f) — the * is an extglob quantifier, not a glob wildcard
    assert(isMatch('fff', '*(f)'));
    assert(isMatch('ffo', '*(f*(o))'));
    assert(isMatch('fffooo', '*(*(f)*(o))'));
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
