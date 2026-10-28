'use strict';

const assert = require('assert');
const picomatch = require('..');

describe('options.bash fastpaths', () => {
  for (const windows of [false, true]) {
    const options = { bash: true, windows };
    const format = input => windows ? input.replace(/\//g, '\\') : input;

    for (const [pattern, input] of [
      ['a*', 'a/.b'],
      ['a*', 'a/.b/x'],
      ['a*b', 'a/.x/b'],
      ['a\\**', 'a*/.b']
    ]) {
      it(`should match ${input} with ${pattern} when windows is ${windows}`, () => {
        assert(picomatch.isMatch(format(input), pattern, options));
        assert(picomatch.isMatch(format(input), pattern, { ...options, fastpaths: false }));
      });
    }

    it(`should preserve non-bash matching when windows is ${windows}`, () => {
      assert(!picomatch.isMatch(format('a/.b'), 'a*', { bash: false, windows }));
      assert(!picomatch.isMatch(format('a/.x/b'), 'a*b', { bash: false, windows }));
      assert(picomatch.isMatch('ab', 'a*', { bash: false, windows }));
    });

    it(`should preserve dot matching when windows is ${windows}`, () => {
      assert(picomatch.isMatch(format('a/.b'), 'a*', { ...options, dot: true }));
      assert(!picomatch.isMatch('.hidden', '?*', options));
      assert(picomatch.isMatch('.hidden', '?*', { ...options, dot: true }));
    });

    it(`should preserve segment-start and globstar guards when windows is ${windows}`, () => {
      assert(!picomatch.isMatch(format('a/.hidden/b'), 'a/*/b', options));
      assert(picomatch.isMatch(format('a/.hidden/b'), 'a/**/b', options));
      assert(picomatch.isMatch(format('a/visible/b'), 'a/**/b', options));
      assert(!picomatch.isMatch(format('a/.hidden/b'), '**/b', options));
      assert(!picomatch.isMatch(format('a/.hidden/b'), 'a/**/b', { windows }));
      assert(picomatch.isMatch(format('a/.hidden/b'), 'a/**/b', { dot: true, windows }));
    });
  }

  it('should preserve capture groups for bash stars', () => {
    for (const value of ['a/x/b', 'a/.x/b']) {
      const match = picomatch.makeRe('a*b', { bash: true, capture: true }).exec(value);
      assert(match);
      assert.deepStrictEqual(match.slice(1), [value.slice(1, -1), value.slice(1, -1)]);
    }
    assert.strictEqual(picomatch.makeRe('a*', { bash: true }).exec('a/.b').length, 1);
  });

  for (const newline of ['\n', '\r', '\u2028', '\u2029']) {
    it(`should preserve matching line terminator ${JSON.stringify(newline)}`, () => {
      const input = `a/${newline}b`;
      assert(picomatch.isMatch(input, 'a*b', { bash: true }));
      const match = picomatch.makeRe('a*b', { bash: true, capture: true }).exec(input);
      assert.deepStrictEqual(match.slice(1), [`/${newline}`, `/${newline}`]);
    });
  }
});
