'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const { isMatch, makeRe } = require('..');

// GHSA-fc5q-39xc-vjpf: a repeated extglob whose single branch holds a wildcard
// (`+(*a)`, `+(a*)b`) nests an unbounded quantifier and backtracks exponentially.

const ATTACKS = [
  '+(*)',
  '+(*a)',
  '*(*a)',
  '+(*)b',
  '+(a*)b',
  '+(a*b)',
  '*(a*b)c',
  '+(*.js)x',
  '+(?*)',
  '+([a-z]*)',
  '+(@(*a))',
  '+(@(*)a)',
  '*(@(a*))b'
];

const OPTIONS = [{}, { dot: true }, { windows: true }, { bash: true }, { nocase: true }, { capture: true }];

describe('repeated extglobs with a single wildcard branch (ReDoS)', () => {
  it('should finish against long non-matching input within a deadline', function() {
    this.timeout(20000);
    // A regex stuck backtracking blocks its own event loop, so time it from a child process.
    const script = [
      "const assert = require('assert');",
      `const pm = require(${JSON.stringify(require.resolve('..'))});`,
      "const inputs = ['a'.repeat(50000) + '/', 'a'.repeat(50000) + '!'];",
      `for (const options of ${JSON.stringify(OPTIONS)}) {`,
      `  for (const pattern of ${JSON.stringify(ATTACKS)}) {`,
      '    for (const input of inputs) pm(pattern, options)(input);',
      '  }',
      '}',
      "console.log('done');"
    ].join('\n');

    const result = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', timeout: 15000 });
    assert.strictEqual(result.error, undefined, 'the child process timed out: a pattern backtracked');
    assert.strictEqual(result.status, 0, result.stderr);
    assert.strictEqual(result.stdout.trim(), 'done');
  });

  it('should collapse a simple wildcard branch instead of repeating it', () => {
    assert.strictEqual(makeRe('+(*a)').source, '^(?:(?=.)(?:[^/]*?a))$');
    assert.strictEqual(makeRe('*(*a)').source, '^(?:(?=.)(?:[^/]*?a)?)$');
    assert.strictEqual(makeRe('+(a*)b').source, '^(?:(?=.)(?:a[^/]*?)b)$');
    assert.strictEqual(makeRe('+(*a)', { capture: true }).source, '^(?:(?=.)((?:([^/]*?)a)))$');
  });

  it('should keep matching what the repeated pattern matched', () => {
    for (const options of [{}, { dot: true }, { windows: true }, { bash: true }, { nocase: true }]) {
      assert(isMatch('aaa', '+(*a)', options));
      assert(isMatch('a', '+(*a)', options));
      assert(!isMatch('ab', '+(*a)', options));
      assert(isMatch('', '*(*a)', options) === isMatch('', '*(x)', options));
      assert(isMatch('abab', '+(a*b)', options));
      assert(isMatch('ab', '+(a*b)', options));
      assert(!isMatch('aba', '+(a*b)', options));
      assert(isMatch('axxb', '+(a*)b', options));
      assert(isMatch('abc', '+(*)c', options));
      assert(isMatch('x.jsy.js', '+(*.js)', options));
      assert(!isMatch('x.jsy.ts', '+(*.js)', options));
      assert(isMatch('abc', '+([a-c]*)', options));
      assert(!isMatch('Xbc', '+([a-c]*)', options) || options.nocase);
    }
  });

  it('should not let the wildcard cross a slash outside bash mode', () => {
    assert(!isMatch('a/a', '+(*a)'));
    assert(!isMatch('a/b', '+(a*b)'));
    assert(isMatch('a/a', '+(*a)', { bash: true }));
  });

  it('should leave escaped, quoted and bracketed stars alone', () => {
    assert(isMatch('***', '+(\\*)'));
    assert(isMatch('***', '+([*])'));
    assert(isMatch('***', '+("*")'));
    assert.strictEqual(makeRe('+(\\*)').source, '^(?:(?=.)(?:\\*)+)$');
  });

  it('should keep slash-delimited repeats, which cannot backtrack', () => {
    assert(isMatch('src/a/src/b/', '+(src/*/)'));
    assert(!isMatch('src/a/lib/b/', '+(src/*/)'));
  });
});
