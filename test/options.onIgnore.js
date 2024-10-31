'use strict';

const assert = require('assert');
const match = require('./support/match');
const picomatch = require('..');
const { isMatch } = picomatch;

const equal = (actual, expected, msg) => {
  assert.deepStrictEqual([].concat(actual).sort(), [].concat(expected).sort(), msg);
};

describe('options.onIgnore', () => {
  it('should call options.onIgnore on each ignored string', () => {
    const ignored = [];

    const options = {
      ignore: ['b/*', 'b/*/*'],
      onIgnore({ pattern, regex, input, output }) {
        ignored.push(input);
      }
    };

    const fixtures = ['a', 'b', 'b/a', 'b/b', 'b/a/a'];

    equal(match(fixtures, '**', options), ['a', 'b']);
    equal(ignored.length, 3);
  });

  it('should allow to un-ignore from options.onIgnore', () => {
    const options = (ignore, unignore) => {
      return {
        ignore,
        onIgnore({ pattern, regex, input, output }) {
          if (unignore) return isMatch(input, unignore) && picomatch.constants.UNIGNORE;
        }
      };
    };

    const fixtures = ['a', 'b', 'b/a', 'b/b', 'b/a/a'];

    equal(match(fixtures, '**', options(['b/*', 'b/*/*'])), ['a', 'b']);
    equal(match(fixtures, '**', options(['b/*', 'b/*/*'], ['b/a'])), ['a', 'b', 'b/a']);
    equal(match(fixtures, '**', options(['b/*', 'b/*/*'], ['b/a/a'])), ['a', 'b', 'b/a/a']);
    equal(match(fixtures, '**', options(['b/*', 'b/*/*'], ['b/*'])), ['a', 'b', 'b/a', 'b/b']);
    equal(match(fixtures, '**', options(['b/*', 'b/*/*'], ['*/a'])), ['a', 'b', 'b/a']);
    equal(match(fixtures, '**', options([], ['**'])), ['a', 'b', 'b/a', 'b/b', 'b/a/a']);
  });

  it('should call onMatch for un-ignored results', () => {
    const patterns = [];

    const options = (ignore, unignore) => {
      return {
        ignore,
        onIgnore({ pattern, regex, input, output }) {
          if (unignore) return isMatch(input, unignore) && picomatch.constants.UNIGNORE;
        },
        onMatch({ pattern, regex, input, output }, matches) {
          patterns.push(output);
        }
      };
    };

    const fixtures = ['a', 'b', 'b/a', 'b/b', 'b/a/a'];

    equal(match(fixtures, '**', options(['b/a**'], ['b/a/a'])), ['a', 'b', 'b/b', 'b/a/a']);
    equal(patterns, ['a', 'b', 'b/b', 'b/a/a']);
  });
});
