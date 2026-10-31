'use strict';

const assert = require('assert');
const { execFileSync } = require('child_process');
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

  it('should collapse single-branch star repetition (CVE-2026-112366)', () => {
    for (const pattern of ['+(*)', '+(*a)', '*(*a)', '+(a*)', '+(a*b)', '*(*.js)']) {
      assert(!/\)[+*]/.test(makeRe(pattern).source), pattern);
    }

    // Keep a regression from hanging the whole suite: the old expressions
    // backtrack exponentially against this non-matching input.
    execFileSync(process.execPath, ['-e', `
      const assert = require('assert');
      const { isMatch } = require(${JSON.stringify(require.resolve('..'))});
      for (const pattern of ['+(*a)', '*(*a)', '+(*a)c', 'x+(*a)']) {
        for (const options of [{}, { capture: true }]) {
          assert(!isMatch('a'.repeat(50) + 'b', pattern, options));
        }
      }
    `], { timeout: 2000 });
  });

  it('should preserve simple repeated-star matching', () => {
    const patterns = ['+(*)', '+(*a)', '*(*a)', '+(a*)', '+(a*b)', '*(*.js)', 'x+(*a)y', '+(*)c'];
    const inputs = ['', 'a', 'aa', 'ab', 'a.a', '.a', 'a/b', 'abc', 'axbayb', 'foo.js', 'foo.ts', 'xaay'];

    for (const options of [{}, { dot: true }, { windows: true }, { bash: true }]) {
      for (const pattern of patterns) {
        for (const input of inputs) {
          assert.deepStrictEqual(
            makeRe(pattern, options).exec(input),
            makeRe(pattern, { ...options, maxExtglobRecursion: false }).exec(input),
            JSON.stringify({ pattern, input, options })
          );
        }
      }
    }
  });

  it('should use the existing literal fallback when repetition captures cannot be preserved', () => {
    const pattern = '+(*a)';
    const regex = makeRe(pattern, { capture: true });
    assert.deepStrictEqual(Array.from(regex.exec(pattern)), [pattern]);
    assert(!regex.test('aaa'));
    assert(/\)\+/.test(makeRe(pattern, { capture: true, maxExtglobRecursion: false }).source));
  });

  it('should leave quoted stars, escaped literals, paths and other syntax unchanged', () => {
    for (const pattern of ['+("*a")', '+(\\*a)', '+(*a/b)', '+(*[ab])', '+(a?*)']) {
      assert.strictEqual(makeRe(pattern).source, makeRe(pattern, { maxExtglobRecursion: false }).source, pattern);
    }
    assert(isMatch('*a*a', '+("*a")'));
    assert(isMatch('*a*a', '+(\\*a)'));
  });

  it('should disable the safeguard when maxExtglobRecursion is false', () => {
    assert(/\)\+/.test(makeRe('+(*a)', { maxExtglobRecursion: false }).source));
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
