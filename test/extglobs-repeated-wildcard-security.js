'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const { isMatch } = require('..');

// The deadline is enforced outside the matching process so a regression cannot
// hang the entire test runner. This covers the public GHSA-fc5q-39xc-vjpf class.
describe('repeated wildcard extglob safeguard', () => {
  it('should finish adversarial matches even when the recursion guard is disabled', function() {
    this.timeout(15000);
    const source = `
      const assert = require('assert');
      const { isMatch } = require(${JSON.stringify(require.resolve('..'))});
      for (const pattern of ['+(*a)', '+(*)', '*(*)', '*(*a)', '+(@(*a))', '+(*a|b)', '+(*[ab])']) {
        for (const options of [{}, { maxExtglobRecursion: false }, { capture: true }, { windows: true }]) {
          assert(!isMatch('a'.repeat(10000) + '!', pattern, options));
        }
      }
    `;
    const result = spawnSync(process.execPath, ['-e', source], { encoding: 'utf8', timeout: 5000 });
    assert.ifError(result.error);
    assert.strictEqual(result.status, 0, result.stderr);
  });

  it('should match the guarded syntax literally, including embedded and nested patterns', () => {
    for (const pattern of ['+(*a)', '*(*)', 'pre+(*a)post', '+(@(*a))', '+(*a|b)', '+(*[ab])']) {
      assert(isMatch(pattern, pattern), pattern);
    }
  });

  it('should preserve escaped, quoted and bracketed stars and non-repeated wildcards', () => {
    for (const pattern of ['+(\\*)', '+([*])', '+("*")']) {
      assert(isMatch('***', pattern), pattern);
    }
    assert(isMatch('abcabc', '+(abc)'));
    assert(isMatch('foobar', '*(foo|bar)'));
    assert(isMatch('foo.js', '**/*.js'));
    assert(isMatch('abc', '@(*a|abc)'));
    assert(isMatch('abc', '?(*a|abc)'));
    assert(!isMatch('foo.css', '**/*.js'));
  });
});
