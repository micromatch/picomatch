'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const pm = require('..');

describe('repeated wildcard extglob security', () => {
  it('preserves supported short-input matching, including an optional outer repeat', () => {
    const originals = [
      ['+(*a)', /^(?:(?=.)(?:[^/]*?a)+)$/],
      ['*(*a)', /^(?:(?=.)(?:[^/]*?a)*)$/],
      ['+(a*b)', /^(?:(?=.)(?:a[^/]*?b)+)$/],
      ['+(*)', /^(?:(?=.)(?:[^/]*?)+)$/],
      ['x*(*a)y', /^(?:x(?:[^/]*?a)*y)$/]
    ];
    const strings = [''];
    for (let length = 0; length < 5; length++) {
      for (const value of strings.filter(str => str.length === length)) {
        for (const ch of ['a', 'b', '/', '.', '\n', 'x', 'y']) strings.push(value + ch);
      }
    }
    for (const [pattern, original] of originals) {
      const patched = pm.makeRe(pattern);
      for (const input of strings) {
        assert.strictEqual(patched.test(input), original.test(input), `${pattern}: ${JSON.stringify(input)}`);
      }
    }
  });

  it('preserves Windows separators, Unicode paths and ordinary safe repetitions', () => {
    assert(pm.isMatch('aab', '+(a*b)', { windows: true }));
    assert(!pm.isMatch('a\\b', '+(a*b)', { windows: true }));
    assert(pm.isMatch('Québeca', '+(*a)'));
    assert(pm.isMatch('abab', '+(ab)'));
    assert(pm.isMatch('a*a', '+([*a])'));
    assert(pm.isMatch('aaabbb', '+(*(a)|*(b))'));
    assert(pm.isMatch('a*a*', '+("a*")'));
    assert(pm.isMatch('***', '+(\\*)'));
  });

  it('uses the existing literal safeguard for complex wildcard bodies and capture APIs', () => {
    for (const [pattern, options, literal] of [
      ['+(*[ab])', {}], ['+(*/*)', {}], ['+(*"a")', {}],
      ['+(*a)', { capture: true }], ['+(*a)', { contains: true }],
      ['+(.a*)', { bash: true }], ['+(\na*)', { bash: true }],
      ['+(*a)@(b)', {}, '+(*a)b']
    ]) {
      assert(pm.makeRe(pattern, options).test(literal || pattern), pattern);
      assert(!pm.makeRe(pattern, options).test('a'.repeat(100) + '!'), pattern);
    }
  });

  it('cannot expose collapsed iteration captures or spans by changing compileRe options later', () => {
    const state = pm.parse('+(*a)');
    assert.throws(() => pm.compileRe(state, { contains: true }), /Reparse repeated wildcard/);
    assert.throws(() => pm.compileRe(state, { capture: true }), /Reparse repeated wildcard/);
    assert(pm.compileRe(state).test('aaaa'));
  });

  it('bounds advisory inputs even when the optional legacy recursion safeguard is disabled', function() {
    this.timeout(15000);
    const source = `
      const assert = require('assert');
      const pm = require(process.argv[1]);
      const options = JSON.parse(process.argv[2]);
      const input = 'a'.repeat(50000) + '!';
      for (const pattern of ['+(*a)', '*(*a)', '+(a*)b', '+(*)b', '*(*)b']) {
        assert.strictEqual(pm.makeRe(pattern, options).test(input), false, pattern);
        assert.strictEqual(pm(pattern, options)(input), false, pattern);
      }
      assert.strictEqual(pm.makeRe('+(*)', options).test('a'.repeat(50000) + '/'), options.bash === true);
    `;
    for (const options of [
      {}, { maxExtglobRecursion: false }, { maxExtglobRecursion: 100 },
      { windows: true }, { capture: true }, { contains: true },
      { nocase: true }, { flags: 'iu' }, { bash: true }, { fastpaths: false }
    ]) {
      const result = spawnSync(process.execPath,
        ['--max-old-space-size=64', '-e', source, require.resolve('..'), JSON.stringify(options)],
        { timeout: 1000, encoding: 'utf8' });
      assert.ifError(result.error);
      assert.strictEqual(result.status, 0, result.stderr);
    }
  });
});
