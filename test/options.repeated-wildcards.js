'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const picomatch = require('..');

describe('repeated wildcard extglobs', () => {
  it('should preserve ordinary wildcard and alternative matches', () => {
    for (const options of [{}, { dot: true }, { windows: true }, { bash: true }, { nocase: true }]) {
      assert(picomatch('*(a*|b)', options)('ax'));
      assert(picomatch('+(a*|b)', options)('bbab'));
      assert(picomatch('+(ab*|c)', options)('ccabcc'));
      assert(picomatch('*(a*|b)', options)('bbb'));
      assert(!picomatch('*(a*|b)', options)('cx'));
      assert(picomatch('*/*(W*, *)*', options)('my/folder (Work, Accts)'));
      assert(picomatch('+(W*, *)', options)('W, W, '));
      assert(picomatch('+(*a)', options)('aaa'));
      assert(picomatch('+(a*b)', options)('abab'));
      assert(picomatch('+([*])', options)('***'));
      assert(picomatch('+("*")', options)('***'));
      assert(picomatch('+(\\*)', options)('***'));
    }
    assert(picomatch('*(A*|b)', { nocase: true })('ax'));
    assert(picomatch('*(A*|b)', { flags: 'i' })('ax'));
  });

  it('should retain the explicit opt-out and literalize unsafe capture forms', () => {
    // Unsupported alternative shapes must not be normalized by trimming them.
    assert(!picomatch('+(a*| b)')('ab'));
    assert(picomatch('+(a*| b)')('+(a*| b)'));
    const options = { capture: true };
    assert(picomatch('+(*a)', options)('+(*a)'));
    assert(!picomatch('+(*a)', options)('aaa'));
    assert(/\)[+*]/.test(picomatch.makeRe('+(*a)', { maxExtglobRecursion: false }).source));
  });

  it('should finish direct, alternative and parser-option regressions within a deadline', function() {
    this.timeout(10000);
    // A blocked regexp cannot interrupt its own event loop; bound it from outside.
    const script = [
      "const assert = require('assert');",
      `const pm = require(${JSON.stringify(require.resolve('..'))});`,
      "const input = 'a'.repeat(60000) + '/';",
      "const patterns = ['+(*a)', '*(*a)', '+(*)b', '+(a*)b', '+(@(*a))', '+(@(*)a)', '+(*a|b)', '+(*a|b)b', '*(*a|b)b', '+(a*a*a*a*a*)', '*(a*|b)z', '+(a*|b)z'];",
      'for (const options of [{}, { dot: true }, { windows: true }, { bash: true }, { capture: true }]) {',
      '  for (const pattern of patterns) {',
      '    console.log(pattern, JSON.stringify(options));',
      '    assert.strictEqual(pm(pattern, options)(input), false);',
      '  }',
      '}',
      "for (const options of [{ nocase: true }, { flags: 'i' }]) {",
      "  assert.strictEqual(pm('+(A*|a)', options)(input), false);",
      "  assert.strictEqual(pm('*(A*|a)', options)(input), false);",
      '}',
      'for (const options of [{}, { nobracket: true }]) {',
      "  assert.strictEqual(pm('+([*a)', options)('[a'.repeat(10000) + '!'), false);",
      "  assert.strictEqual(pm('+([*a])', options)('[a]'.repeat(10000) + '!'), false);",
      '}',
      "assert.strictEqual(pm('+(W*, *)z')('W, '.repeat(10000) + '!'), false);",
      "assert.strictEqual(pm('*(W*, *)z')('W, '.repeat(10000) + '!'), false);"
    ].join('\n');
    const result = spawnSync(process.execPath, ['-e', script], {
      encoding: 'utf8', timeout: 2000, killSignal: 'SIGKILL'
    });
    assert.ifError(result.error);
    assert.strictEqual(result.status, 0, result.stderr + result.stdout);
  });
});
