'use strict';

const assert = require('assert');
const picomatch = require('..');

describe('escaped backslashes', () => {
  for (const fastpaths of [true, false]) {
    const options = { windows: false, fastpaths };

    describe(`fastpaths: ${fastpaths}`, () => {
      it('should preserve every escaped backslash in a literal segment', () => {
        for (const count of [1, 2, 3, 4, 8]) {
          for (const [prefix, suffix] of [['a', 'b'], ['', 'b'], ['a', '']]) {
            const pattern = prefix + '\\'.repeat(2 * count) + suffix;
            const regex = picomatch.makeRe(pattern, options);
            const isMatch = picomatch(pattern, options);

            for (const actualCount of [count - 1, count, count + 1]) {
              const input = prefix + '\\'.repeat(actualCount) + suffix;
              assert.strictEqual(regex.test(input), actualCount === count, JSON.stringify({ pattern, input }));
            }

            assert(isMatch(prefix + '\\'.repeat(count) + suffix));
            assert(!isMatch(prefix + '\\'.repeat(count - 1) + suffix));
          }
        }
      });

      it('should keep the following wildcard active after an even escape run', () => {
        for (const count of [1, 2, 3, 4]) {
          const literal = 'a' + '\\'.repeat(count);
          const pattern = 'a' + '\\'.repeat(2 * count) + '*';
          const regex = picomatch.makeRe(pattern, options);

          assert(regex.test(literal + 'file'));
          assert(!regex.test('a' + '\\'.repeat(count - 1) + 'file'));
          assert(!regex.test(literal + '/file'));
        }
      });

      it('should escape the following special character after an odd escape run', () => {
        for (const count of [1, 2, 3, 4]) {
          for (const symbol of ['*', '?', '(', '[', '{', '|']) {
            const pattern = 'a' + '\\'.repeat(2 * count + 1) + symbol + 'b';
            const input = 'a' + '\\'.repeat(count) + symbol + 'b';
            const regex = picomatch.makeRe(pattern, options);

            assert(regex.test(input), JSON.stringify({ pattern, input }));
            assert(!regex.test('a' + '\\'.repeat(count - 1) + symbol + 'b'));
            assert(!regex.test('a' + '\\'.repeat(count) + 'xb'));
          }
        }
      });

      it('should preserve escaped backslashes before a path separator', () => {
        for (const count of [1, 2, 3, 4]) {
          const pattern = 'a' + '\\'.repeat(2 * count) + '/**/*.js';
          const regex = picomatch.makeRe(pattern, options);
          const prefix = 'a' + '\\'.repeat(count);

          assert(regex.test(prefix + '/file.js'));
          assert(regex.test(prefix + '/nested/file.js'));
          assert(!regex.test('a' + '\\'.repeat(count - 1) + '/file.js'));
          assert(!regex.test(prefix + '/file.txt'));
        }
      });

      it('should preserve long escape runs and retain the pattern length limit', () => {
        const count = 32767;
        const pattern = 'a' + '\\'.repeat(2 * count) + 'b';
        const regex = picomatch.makeRe(pattern, { ...options, debug: true });

        assert(regex.test('a' + '\\'.repeat(count) + 'b'));
        assert(!regex.test('a\\b'));
        assert.doesNotThrow(() => picomatch.parse('\\'.repeat(65536), options));
        assert.throws(() => picomatch.makeRe('\\'.repeat(65537), options), SyntaxError);
      });
    });
  }
});
