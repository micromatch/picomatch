'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const { isMatch, makeRe } = require('..');

describe('repeated wildcard safeguard (GHSA-fc5q-39xc-vjpf)', () => {
  it('should bound adversarial matches outside the matching process', function() {
    this.timeout(10000);
    const source = [
      'const assert = require("assert");',
      'const { isMatch } = require(' + JSON.stringify(require.resolve('..')) + ');',
      'const patterns = ["+(*a)", "+(*)", "*(*)", "*(a*b)", "+([ab]*)", "+(@(*a))", "*(a*|b)", "+(**)"];',
      'const options = [{}, {capture:true}, {windows:true}, {bash:true}, {dot:true}, {regex:true}, {fastpaths:false}, {maxExtglobRecursion:1}];',
      'for (const pattern of patterns) for (const opts of options) {',
      '  assert.strictEqual(isMatch("ab".repeat(2000) + "/", pattern, opts), false, pattern);',
      '}'
    ].join('\n');
    const result = spawnSync(process.execPath, ['-e', source], { encoding: 'utf8', timeout: 3000 });
    assert.ifError(result.error);
    assert.strictEqual(result.status, 0, result.stderr);
  });

  it('should use the existing literal fallback for repeated parsed wildcards', () => {
    for (const pattern of ['+(*a)', '*(a*b)', '+([ab]*)', 'pre+(@(*a))post', '*(a*|b)', '+(**)']) {
      assert(isMatch(pattern, pattern), pattern);
    }
    assert(!isMatch('abc', '+(*)c'));
    assert(isMatch('+(*)c', '+(*)c'));
  });

  it('should distinguish wildcard tokens from escaped, quoted and bracketed stars', () => {
    for (const pattern of ['+(\\*)', '+("*")', '+([*])']) {
      assert(isMatch('***', pattern), pattern);
    }
    assert(isMatch('abcabc', '+(abc)'));
    assert(isMatch('foobar', '*(foo|bar)'));
    assert(isMatch('fffooo', '*(*(f)*(o))'));
    assert(isMatch('src/index.js', '**/*.js'));
    assert(isMatch('abc', '@(a*|b)'));
    assert(isMatch('abc', '?(a*|b)'));
  });

  it('should preserve the explicit safeguard opt-out without running hostile input', () => {
    assert(makeRe('+(*a)', { maxExtglobRecursion: false }).source.includes('[^/]*?a)+'));
    assert(isMatch('abc', '+(*)c', { maxExtglobRecursion: false }));
  });
});
