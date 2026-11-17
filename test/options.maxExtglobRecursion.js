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

describe('CVE-2026-112366 nested quantified extglob regressions', () => {
  const { execFileSync } = require('child_process');
  const runBounded = (pattern, text, timeout = 1000) => {
    // Isolate a potentially catastrophic RegExp to keep the test runner alive.
    const source = [
      'const assert = require("assert");',
      'const picomatch = require(' + JSON.stringify(require.resolve('..')) + ');',
      'assert.strictEqual(picomatch.isMatch(process.argv[1], process.argv[2]), false);'
    ].join('\n');
    execFileSync(process.execPath, ['-e', source, text, pattern], { timeout });
  };

  it('bounds text-prefixed nested star extglobs', () => {
    runBounded('+(a*(a))', 'a'.repeat(34) + '/');
    runBounded('+(a*(ab)|b)', 'aab'.repeat(28) + '/');
  });

  it('bounds optional nested extglobs with alternatives', () => {
    runBounded('+(a?(ab)|b)', 'aab'.repeat(28) + '/');
    runBounded('+(a?(a)|a)', 'a'.repeat(34) + '/');
  });

  it('bounds the repeated-class optimization on long inputs', () => {
    runBounded('+(a*[ab]|a)', 'a'.repeat(4096) + '/');
  });

  it('bounds repeated range classes with overlapping alternatives', () => {
    runBounded('+(a*[a-z]|a)', 'a'.repeat(4096) + '/');
  });
});

describe('CVE-2026-112366 bracket option compatibility', () => {
  it('preserves literal-bracket and nobracket matching in flat rewrites', () => {
    const patterns = ['+(a*[ab]|a)', '*(a*[ab]|a)',
      '+(a*[a-z]|a)', '*(a*[a-z]|a)'];
    const names = ['', 'a', 'aa', 'aaa', 'ab', 'a[ab]', 'a[ab]a',
      'a[a-z]', 'a[a-z]a', 'abb', 'b', 'a/b', 'a/.'];
    const optionsList = [{}, { nobracket: true },
      { literalBrackets: true }, { literalBrackets: false },
      { dot: true }, { windows: true }, { bash: true }];
    for (const pattern of patterns) {
      for (const options of optionsList) {
        for (const name of names) {
          assert.strictEqual(
            isMatch(name, pattern, options),
            isMatch(name, pattern, { ...options, maxExtglobRecursion: false }),
            JSON.stringify({ pattern, options, name })
          );
        }
      }
    }
  });

  it('bounds long non-matches with literal bracket options', () => {
    const { execFileSync } = require('child_process');
    const source = 'const assert = require("assert");' +
      'const pm = require(' + JSON.stringify(require.resolve('..')) + ');' +
      'for(const opt of [{nobracket:true},{literalBrackets:true}]) {' +
      '  assert(!pm.isMatch("a".repeat(4096)+"/", "+(a*[ab]|a)", opt));' +
      '}';
    execFileSync(process.execPath, ['-e', source], { timeout: 1300 });
  });
});

describe('CVE-2026-112366 nested star extglob continuation', () => {
  const { execFileSync } = require('child_process');
  const runBounded = (pattern, input) => {
    const code = [
      'const assert = require("assert");',
      'const pm = require(' + JSON.stringify(require.resolve('..')) + ');',
      'assert.strictEqual(pm.isMatch(process.argv[1], process.argv[2]), false);'
    ].join('\n');
    execFileSync(process.execPath, ['-e', code, input, pattern], { timeout: 1000 });
  };

  it('bounds star extglobs with nested star and optional alternatives', () => {
    runBounded('*(a*(ab)|b)', 'aab'.repeat(28) + '/');
    runBounded('*(a?(ab)|b)', 'aab'.repeat(28) + '/');
  });

  it('bounds nested star extglobs with one branch', () => {
    runBounded('*(a*(a))', 'a'.repeat(44) + '/');
  });

  it('keeps flat star/plus rewrites equivalent on short strings', function() {
    this.timeout(30000);
    const patterns = [
      '*(a*(ab)|b)', '*(a?(ab)|b)', '*(a*(a))',
      '+(a*(ab)|b)', '+(a?(ab)|b)', '+(a*(a))',
      'x*(a*(ab)|b)y'
    ];
    const optionsList = [
      {}, { dot: true }, { windows: true }, { bash: true },
      { nocase: true }, { contains: true }, { strictSlashes: true }
    ];
    const inputs = [''];
    let layer = [''];
    for (let length = 0; length < 6; length++) {
      layer = layer.flatMap(s => ['a', 'b', 'x'].map(char => s + char));
      inputs.push(...layer);
    }
    inputs.push('a/b', 'xaaby', 'xaaby/', 'xaby', 'xby');

    for (const pattern of patterns) {
      for (const options of optionsList) {
        for (const input of inputs) {
          assert.strictEqual(
            isMatch(input, pattern, options),
            isMatch(input, pattern, { ...options, maxExtglobRecursion: false }),
            JSON.stringify({ pattern, options, input })
          );
        }
      }
    }
  });
});

describe('CVE-2026-112366 redundant nested star alternatives', () => {
  const { execFileSync } = require('child_process');
  const bounded = (pattern, input) => {
    const code = [
      'const assert = require("assert");',
      'const pm = require(' + JSON.stringify(require.resolve('..')) + ');',
      'assert.strictEqual(pm.isMatch(process.argv[1], process.argv[2]), false);'
    ].join(' ');
    execFileSync(process.execPath, ['-e', code, input, pattern], { timeout: 1200 });
  };

  it('bounds same-prefix star and optional alternatives', () => {
    bounded('*(a*(ba)|a)', 'a'.repeat(50) + '/');
    bounded('*(a?(ba)|a)', 'a'.repeat(50) + '/');
  });

  it('bounds same-prefix alternatives with additional distinct branches', () => {
    bounded('*(a*(ba)|a|c)', 'a'.repeat(50) + '/');
    bounded('*(a?(ba)|a|c)', 'a'.repeat(50) + '/');
    bounded('*(a*(aba)|a)', 'a'.repeat(50) + '/');
  });

  it('preserves matching of nested patterns without capture', () => {
    const patterns = [
      '*(a*(ba)|a)', '*(a?(ba)|a)',
      '*(a*(ba)|a|c)', '*(a?(ba)|a|c)',
      '*(a*(aba)|a)', 'x*(a*(ba)|a)y',
      '*(a*(bc)|b)', '*(a*(abc)|a)', '*(a*(bc)|a)'
    ];
    const optionsList = [
      {}, { dot: true }, { windows: true }, { bash: true },
      { nocase: true }, { contains: true }, { strictSlashes: true }
    ];
    const inputs = ['', 'x', 'y', 'a/b'];
    let layer = [''];
    for (let n = 0; n < 5; n++) {
      layer = layer.flatMap(s => ['a', 'b', 'c'].map(char => s + char));
      inputs.push(...layer);
    }
    for (const pattern of patterns) {
      for (const options of optionsList) {
        for (const input of inputs) {
          assert.strictEqual(
            isMatch(input, pattern, options),
            isMatch(input, pattern, { ...options, maxExtglobRecursion: false }),
            JSON.stringify({ pattern, options, input })
          );
        }
      }
    }
  });
});

describe('CVE-2026-112366 longer-prefix redundant extglob alternatives', () => {
  const { execFileSync } = require('child_process');
  const bounded = (pattern, value) => {
    const script = 'const assert=require("assert");' +
      'const pm=require(' + JSON.stringify(require.resolve('..')) + ');' +
      'assert.strictEqual(pm.isMatch(process.argv[1],process.argv[2]),false);';
    execFileSync(process.execPath, ['-e', script, value, pattern], { timeout: 1200 });
  };
  it('bounds multi-character prefixes and repeated optional words', function() {
    this.timeout(30000);
    bounded('*(ab*(a)|ab)', 'ab'.repeat(45) + '/');
    bounded('*(ab?(a)|ab)', 'ab'.repeat(45) + '/');
    bounded('*(aba*(b)|aba)', 'aba'.repeat(45) + '/');
  });
  it('bounds literal words with a distinct third alternative', function() {
    this.timeout(30000);
    bounded('*(ab*(a)|ab|c)', 'ab'.repeat(45) + '/');
    bounded('*(a*(ba)|a|bc)', 'a'.repeat(45) + '/');
  });
  it('preserves multi-prefix matching and literal alternatives', function() {
    this.timeout(30000);
    const patterns = [
      '*(ab*(a)|ab)', '*(ab?(a)|ab)',
      '*(aba*(b)|aba)', '*(ab*(a)|ab|c)',
      '*(a*(ba)|a|bc)', '*(a*(bc)|a|bc)',
      '+(ab*(a)|ab)', 'x*(ab*(a)|ab)y'
    ];
    const opts = [{}, { dot: true }, { windows: true },
      { bash: true }, { nocase: true }, { contains: true },
      { strictSlashes: true }];
    const inputs = ['', '/', 'x', 'xaaby', 'a/b'];
    let layer = [''];
    for (let n = 0; n < 5; n++) {
      layer = layer.flatMap(s => ['a', 'b', 'c'].map(char => s + char));
      inputs.push(...layer);
    }
    for (const pattern of patterns) {
      for (const options of opts) {
        for (const value of inputs) {
          assert.strictEqual(
            isMatch(value, pattern, options),
            isMatch(value, pattern, { ...options, maxExtglobRecursion: false }),
            JSON.stringify({ pattern, options, value })
          );
        }
      }
    }
  });
});

describe('CVE-2026-112366 case-insensitive redundant extglobs', () => {
  const { execFileSync } = require('child_process');
  const bounded = (pattern, input, options) => {
    const script = 'const assert=require("assert");' +
      'const pm=require(' + JSON.stringify(require.resolve('..')) + ');' +
      'assert.strictEqual(pm.isMatch(process.argv[1],process.argv[2],' +
      JSON.stringify(options) + '),false);';
    execFileSync(process.execPath, ['-e', script, input, pattern], { timeout: 1300 });
  };
  it('bounds equivalent alternatives under nocase', function() {
    this.timeout(15000);
    bounded('*(a*(ba)|A)', 'a'.repeat(50) + '/', { nocase: true });
    bounded('*(a?(ba)|A|c)', 'a'.repeat(50) + '/', { nocase: true });
    bounded('*(ab*(a)|AB)', 'ab'.repeat(50) + '/', { nocase: true });
  });
  it('retains case-sensitive and explicit flags matching', function() {
    this.timeout(15000);
    const patterns = [
      '*(a*(ba)|A)', '*(a?(ba)|A|c)', '*(ab*(a)|AB)',
      '*(a*(ba)|a)'
    ];
    const optionsList = [
      {}, { nocase: true }, { flags: 'i' },
      { nocase: true, flags: 'm' }, { contains: true, nocase: true }
    ];
    const inputs = ['', 'a', 'aa', 'ab', 'aba', 'AB', 'aB',
      'aaba', 'aabaa', 'abc', 'abcabc', 'a/', 'xaba'];
    for (const pattern of patterns) {
      for (const options of optionsList) {
        for (const input of inputs) {
          assert.strictEqual(
            isMatch(input, pattern, options),
            isMatch(input, pattern, { ...options, maxExtglobRecursion: false }),
            JSON.stringify({ pattern, options, input })
          );
        }
      }
    }
  });
});
