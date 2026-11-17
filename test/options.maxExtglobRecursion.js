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

describe('CVE-2026-112366 single-branch star repetition', () => {
  it('collapses the inner star while preserving existing matches', () => {
    const patterns = ['+(*)', '*(*)', '+(*a)', '*(*a)', '+(a*)', '*(a*)',
      '+(a*b)', '*(a*b)', '+(a?*)', 'x+(*a)y', '+(*)c'];
    const inputs = ['', 'a', 'aa', 'ab', 'aba', 'abcabc', 'foo.js',
      '.env', 'a/a', 'xaby', 'xay'];

    for (const pattern of patterns) {
      assert(!/\)[+*]/.test(makeRe(pattern).source), pattern);

      for (const options of [{}, { dot: true }, { windows: true }, { bash: true }]) {
        for (const input of inputs) {
          assert.strictEqual(
            isMatch(input, pattern, options),
            isMatch(input, pattern, { ...options, maxExtglobRecursion: false }),
            JSON.stringify({ pattern, input, options })
          );
        }
      }
    }
  });

  it('keeps non-matching malicious inputs bounded in a subprocess', () => {
    const { execFileSync } = require('child_process');
    const patterns = ['+(*)', '*(*)', '+(*a)', '*(*a)',
      '+(a*)', '*(a*)', '+(a?*)', 'x+(*a)y'];
    const code = 'const assert=require("assert");' +
      'const pm=require(' + JSON.stringify(require.resolve('..')) + ');' +
      'const pats=' + JSON.stringify(patterns) + ';' +
      'for(const p of pats){ assert(!pm.isMatch("a".repeat(48)+"/",p)); }';
    execFileSync(process.execPath, ['-e', code], { timeout: 2000 });
  });

  it('uses a literal fallback for capture and honors explicit opt-out', () => {
    const pattern = '+(*a)';
    const safe = makeRe(pattern, { capture: true });
    assert.deepStrictEqual(Array.from(safe.exec(pattern)), [pattern]);
    assert(!safe.test('aaa'));
    assert(/\)[+*]/.test(makeRe(pattern, { maxExtglobRecursion: false }).source));

    for (const simpleClass of ['+(*[ab])', '+(a*[ab])', '+(*[a-z])']) {
      assert(!/\)[+*]/.test(makeRe(simpleClass).source));
    }
    assert(isMatch('aaa', '+(*[ab])'));
    assert(isMatch('aa', '+(a*[ab])'));
    assert(isMatch('+(a*/b)', '+(a*/b)'));
    assert(!isMatch('a/b', '+(a*/b)'));
    assert.strictEqual(
      makeRe('+(" *a")').source,
      makeRe('+(" *a")', { maxExtglobRecursion: false }).source
    );
  });
});

describe('CVE-2026-112366 repeated star alternatives', () => {
  it('preserves matching for simple prefix/suffix stars and literals', () => {
    const patterns = [
      '+(*a|b)', '*(*a|b)', '+(a*|b)', '*(a*|b)',
      '+(*a|b|c)', '*(a*|b|c)', 'x+(a*|b)y', 'a/+(*a|b)'
    ];
    const inputs = [
      '', 'a', 'b', 'c', 'aa', 'ab', 'ba', 'bb', 'ax',
      'bax', 'abc', 'a/b', 'a/.', 'xaby', 'xbby', 'a/ba'
    ];
    const optionsList = [
      {}, { dot: true }, { windows: true }, { bash: true },
      { nocase: true }, { contains: true }, { strictSlashes: true }
    ];

    for (const pattern of patterns) {
      for (const options of optionsList) {
        for (const input of inputs) {
          assert.strictEqual(
            isMatch(input, pattern, options),
            isMatch(input, pattern, { ...options, maxExtglobRecursion: false }),
            JSON.stringify({ pattern, input, options })
          );
        }
      }
    }
    assert(isMatch('ax', '*(a*|b)'));
    assert(isMatch('bbbax', '+(a*|b)'));
  });

  it('bounds repeated alternatives with embedded stars', () => {
    const { execFileSync } = require('child_process');
    const patterns = [
      '+(*a|b)', '+(a*|b)', '*(a*|b)',
      '+(*a|b|c)', '+(a*|b|c)', '+(*[ab]|c)'
    ];
    const code = 'const assert=require("assert");' +
      'const pm=require(' + JSON.stringify(require.resolve('..')) + ');' +
      'const patterns=' + JSON.stringify(patterns) + ';' +
      'for(const pattern of patterns){' +
      '  assert(!pm.isMatch("a".repeat(128)+"/",pattern));' +
      '  assert(!pm.isMatch("b".repeat(128)+"/",pattern));' +
      '}';
    execFileSync(process.execPath, ['-e', code], { timeout: 2000 });
  });

  it('fails closed for complex stars and respects escaped stars', () => {
    const unsafe = '+(a*|bc)';
    assert(isMatch(unsafe, unsafe));
    assert(!isMatch('aa', unsafe));
    assert(isMatch('aa', unsafe, { maxExtglobRecursion: false }));
    const captured = makeRe('+(a*|b)', { capture: true });
    assert(captured.test('+(a*|b)'));
    assert(!captured.test('ax'));
    assert(isMatch('ax', '+(a*|b)', { capture: true, maxExtglobRecursion: false }));
    const escaped = '+(a\\*|b)';
    assert.strictEqual(
      makeRe(escaped).source,
      makeRe(escaped, { maxExtglobRecursion: false }).source
    );
  });
});

describe('CVE-2026-112366 simple bracket-class stars', () => {
  it('retains character-class and literal-bracket options', () => {
    const patterns = [
      '+(*[ab])', '+(a*[ab])', '+(*[a-z])',
      '+(*[a-z]|b)', '+(a*[ab]|b)'
    ];
    const strings = [
      '', 'a', 'b', 'aa', 'ab', 'bb', 'ba', 'ax',
      'aba', 'a[ab]', '[a-z]', 'a[a-z]', 'b[ab]',
      'a/.', 'a/b', '+(*[ab])'
    ];
    const opts = [
      {}, { dot: true }, { windows: true }, { bash: true },
      { nobracket: true }, { literalBrackets: true },
      { literalBrackets: false }
    ];

    for (const pattern of patterns) {
      for (const options of opts) {
        for (const str of strings) {
          assert.strictEqual(
            isMatch(str, pattern, options),
            isMatch(str, pattern, { ...options, maxExtglobRecursion: false }),
            JSON.stringify({ pattern, options, str })
          );
        }
      }
    }
  });

  it('bounds repeated class stars on nonmatching inputs', () => {
    const { execFileSync } = require('child_process');
    const patterns = ['+(*[ab])', '+(a*[ab])', '+(*[a-z]|b)', '+(a*[ab]|b)'];
    const code = 'const assert=require("assert");' +
      'const pm=require(' + JSON.stringify(require.resolve('..')) + ');' +
      'const pats=' + JSON.stringify(patterns) + ';' +
      'for(const pat of pats) assert(!pm.isMatch("a".repeat(128)+"/",pat));';
    execFileSync(process.execPath, ['-e', code], { timeout: 2000 });
  });
});
