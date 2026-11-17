'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const { isMatch, makeRe } = require('..');

describe('repeated wildcard safeguards', () => {
  it('removes redundant repetition around a single star-containing segment', () => {
    for (const body of ['*', '*a', 'a*', '*?a', 'a*b', '*[ab]']) {
      const plus = makeRe(`+(${body})`).source;
      const star = makeRe(`*(${body})`).source;
      assert(!plus.includes(')+'), plus);
      assert(!star.includes(')*'), star);
    }
  });

  it('preserves the language of simple repeated wildcard segments', () => {
    for (const body of ['*', '*a', 'a*', '*?a', 'a*b', '*[ab]']) {
      for (const str of ['', 'a', 'b', 'ab', 'aa', 'aba', 'abab', 'aab', '.a', 'a/b']) {
        const once = isMatch(str, `@(${body})`);
        assert.strictEqual(isMatch(str, `+(${body})`), once, `${body}: ${str}`);
        if (str !== '') assert.strictEqual(isMatch(str, `*(${body})`), once, `${body}: ${str}`);
      }
    }
    assert(isMatch('abc', '+(*)c'));
    assert(isMatch('c', '*(*a)c'));
    assert(!isMatch('c', '+(*a)c'));
  });

  it('does not collapse escaped stars or stars in character classes and quotes', () => {
    assert(isMatch('**', '+(\\*)'));
    assert(isMatch('**', '+([*])'));
    assert(isMatch('**', '+("*")'));
  });

  it('literalizes complex star branches that cannot safely be collapsed', () => {
    for (const pattern of ['+(*a/b)', '+(*{a,b})', '+(@(*a))', '+(*a|b)', '+(@(*a)|b)', '+(*(a)a)', '+(a*(a))', '+(a+(a))']) {
      assert(isMatch(pattern, pattern), pattern);
      assert(!isMatch('a'.repeat(100) + '!', pattern), pattern);
    }
  });

  it('blocks overlapping multi-character alternatives as well as single-character ones', () => {
    for (const pattern of ['+(ab|abab)', '*(ab|abab)', '+(abc|abcabc)']) {
      assert(isMatch(pattern, pattern), pattern);
      assert(!isMatch('ab'.repeat(100) + '!', pattern), pattern);
    }
  });

  it('rejects adversarial non-matches within a bounded subprocess', () => {
    const modulePath = require.resolve('..');
    const patterns = ['+(*)b', '+(*a)', '*(*a)', '+(*?a)', '+(ab|abab)', '+(*a|b)', '+(@(*a)|b)', '+(*(a)a)', '+(a*(a))', '+(a+(a))'];
    for (const pattern of patterns) {
      const code = `const pm = require(${JSON.stringify(modulePath)});
        const pattern = ${JSON.stringify(pattern)};
        const value = pattern.includes('ab|') ? 'ab'.repeat(60) + '!' : 'a'.repeat(60) + '!';
        if (pm(pattern)(value)) process.exit(1);`;
      const result = spawnSync(process.execPath, ['-e', code], { timeout: 1000 });
      assert.ifError(result.error);
      assert.strictEqual(result.status, 0, pattern);
    }
  });

  it('preserves matching across options for simple wildcard branches', () => {
    const bodies = ['*', '*a', 'a*', '*?a', 'a*b', '*[ab]', '*[!b]', 'a*?', '*"a"', '*\\?', '*[.]a'];
    let values = [''];
    for (let n = 0; n < 4; n++) values = [...values, ...values.flatMap(value => ['a', 'b', '.'].map(ch => value + ch))];
    for (const options of [{}, { dot: true }, { windows: true }, { capture: true }, { bash: true }]) {
      for (const body of bodies) {
        for (const value of values) {
          for (const quantifier of ['+', '*']) {
            const pattern = `pre${quantifier}(${body})post`;
            const input = `pre${value}post`;
            assert.strictEqual(
              isMatch(input, pattern, options),
              isMatch(input, pattern, { ...options, maxExtglobRecursion: false }),
              `${pattern}: ${input} (${JSON.stringify(options)})`
            );
          }
        }
      }
    }
  });

  it('keeps the explicit safeguard opt-out', () => {
    assert(makeRe('+(*a)', { maxExtglobRecursion: false }).source.includes(')+'));
  });
});
