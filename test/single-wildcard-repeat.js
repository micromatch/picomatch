'use strict';

const assert = require('assert');
const cp = require('child_process');
const { isMatch, makeRe } = require('..');

describe('single-wildcard repeated extglobs', () => {
  it('preserves ordinary matches and suffixes without nested repetition', () => {
    for (const [pattern, yes, no] of [
      ['+(*)c', ['abc', 'c'], ['ab!']],
      ['+(*a)', ['a', 'aba', 'aaa'], ['b', 'aaa!']],
      ['+(a*)', ['a', 'aba'], ['b']],
      ['+(a*b)', ['ab', 'abab', 'acbab'], ['a', 'aba']],
      ['+(a*b*c)', ['abc', 'abcabc', 'axbyc'], ['ab', 'abc!']],
      ['*(a*b)c', ['c', 'abc', 'ababc'], ['abb']],
      ['x+(*a)y', ['xay', 'xabaay'], ['xby']]
    ]) {
      for (const input of yes) assert(isMatch(input, pattern), `${pattern}: ${input}`);
      for (const input of no) assert(!isMatch(input, pattern), `${pattern}: ${input}`);
      assert(!/\)[+*]/.test(makeRe(pattern).source), pattern);
    }
  });

  it('finishes hostile failing inputs within an isolated process deadline', () => {
    const script = 'const p=require(\'./\'); for(const pat of [\'+(*)a\',\'+(*a)\',\'*(a*)b\',\'+(a*b)c\']) p.isMatch(\'a\'.repeat(10000)+\'!\',pat);';
    cp.execFileSync(process.execPath, ['-e', script], { cwd: require('path').resolve(__dirname, '..'), timeout: 2000 });
  });

  it('keeps escaped stars, alternatives, captures, and the explicit opt-out', () => {
    assert(isMatch('*a*a', '+(\\*a)'));
    assert(isMatch('foobar', '+(foo|bar)'));
    assert.deepStrictEqual(makeRe('+(*a)', { capture: true }).exec('aba').slice(1), ['aba', 'ab']);
    assert(/\)\+/.test(makeRe('+(*a)', { maxExtglobRecursion: false }).source));
  });
});
