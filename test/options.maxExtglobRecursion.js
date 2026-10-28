'use strict';

const assert = require('assert');
const { isMatch, makeRe } = require('..');
const picomatch = require('..');
const { spawnSync } = require('child_process');

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

  it('should remove redundant repetition from single-branch wildcard extglobs', () => {
    for (const pattern of ['+(*)', '*(*)', '+(*a)', '*(*a)', '+(a*)', '*(a*)', '+(a*b)', '+(*[ab])', '+(@(*a))']) {
      assert(!/\)[+*]/.test(makeRe(pattern).source), pattern);
    }

    assert.strictEqual(makeRe('+(*a)').source, '^(?:(?=.)(?:[^/]*?a))$');
    assert.strictEqual(makeRe('*(*a)').source, '^(?:(?=.)(?:[^/]*?a)?)$');
    assert(isMatch('abc', '+(*)c'));
    assert(isMatch('axbayb', '+(a*b)'));
    assert(isMatch('foo.js', '*(*.js)'));
    assert(!isMatch('axbay', '+(a*b)'));
  });

  it('should preserve matching semantics when collapsing single-branch wildcard extglobs', () => {
    const patterns = ['+(*)', '*(*)', '+(*a)', '*(*a)', '+(a*)', '*(a*)', '+(a*b)', '+(*[ab])', '+(@(*a))', '+(**)', '+(**a)', 'x+(*a)b'];
    const inputs = [''];
    let level = [''];

    for (let length = 1; length <= 4; length++) {
      level = level.reduce((strings, prefix) => strings.concat(['a', 'b', '.', '/', '*'].map(ch => prefix + ch)), []);
      inputs.push(...level);
    }

    for (const options of [{}, { dot: true }, { windows: true }, { bash: true }, { capture: true }]) {
      for (const pattern of patterns) {
        const actual = picomatch(pattern, options);
        const original = picomatch(pattern, { ...options, maxExtglobRecursion: false });
        for (const input of inputs) {
          assert.strictEqual(actual(input), original(input), JSON.stringify({ pattern, input, options }));
        }
      }
    }
  });

  it('should preserve escaped, quoted, and bracketed stars as literals', () => {
    for (const pattern of ['+(a\\*b)', '+("*a")', '+([*]a)']) {
      assert.strictEqual(makeRe(pattern).source, makeRe(pattern, { maxExtglobRecursion: false }).source);
    }
    assert(isMatch('*a*a', '+("*a")'));
    assert(isMatch('a*ba*b', '+(a\\*b)'));
  });

  it('should literalize single-branch wildcards that cannot be safely collapsed', () => {
    for (const pattern of ['+(?(*a))', '+(*a/b)', '+(*{a,b})']) {
      assert(isMatch(pattern, pattern));
      assert(!/\)[+*]/.test(makeRe(pattern).source), pattern);
    }
  });

  it('should finish CVE-2026-112366 attack cases within a bounded subprocess', function() {
    this.timeout(10000);
    const cases = [
      ['+(*a)', 'a'.repeat(80) + '!'],
      ['*(*a)', 'a'.repeat(80) + '!'],
      ['+(a*)', 'a'.repeat(80) + '/'],
      ['*(a*)', 'a'.repeat(80) + '/'],
      ['+(*)', 'a'.repeat(80) + '/'],
      ['*(*)', 'a'.repeat(80) + '/'],
      ['+(*)b', 'a'.repeat(80) + '!'],
      ['*(*)b', 'a'.repeat(80) + '!'],
      ['+(*a)c', 'a'.repeat(80) + '!'],
      ['+(a*b)', 'ab'.repeat(40) + '!'],
      ['+(**)', 'a'.repeat(80) + '/.'],
      ['+(**a)', 'a'.repeat(80) + '!'],
      ['+(@(*a))', 'a'.repeat(80) + '!'],
      ['+(?(*a))', 'a'.repeat(80) + '!']
    ];
    const script = `
      const assert = require('assert');
      const pm = require(${JSON.stringify(require.resolve('..'))});
      for (const options of [{}, { windows: true }, { capture: true }]) {
        for (const [pattern, input] of ${JSON.stringify(cases)}) {
          assert.strictEqual(pm.isMatch(input, pattern, options), false, pattern);
        }
      }
    `;
    const result = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', timeout: 5000, windowsHide: true });
    assert.ifError(result.error);
    assert.strictEqual(result.status, 0, result.stderr);
  });

  it('should allow the existing explicit safeguard opt-out', () => {
    assert(/\)[+*]/.test(makeRe('+(*a)', { maxExtglobRecursion: false }).source));
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
