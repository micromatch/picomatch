'use strict';

require('mocha');
const assert = require('assert');
const picomatch = require('..');
const match = require('./support/match');
const { clearCache, isMatch } = picomatch;

const equal = (actual, expected, msg) => {
  if (Array.isArray(actual)) actual.sort();
  if (Array.isArray(expected)) expected.sort();
  assert.deepEqual(actual, expected, msg);
};

const options = () => {
  return {
    matches: new Set(),
    format: str => str.replace(/^\.\//, ''),
    onMatch({ pattern, regex, input, value }, matches) {
      if (value.length > 2 && (value.startsWith('./') || value.startsWith('.\\'))) {
        value = value.slice(2);
      }
      matches.add(value);
    }
  };
};

describe.only('options.onMatch', () => {
  beforeEach(() => clearCache());

  it('should call options.onMatch on each matching string', () => {
    let fixtures = ['a', './a', 'b', 'a/a', './a/b', 'a/c', './a/x', './a/a/a', 'a/a/b', './a/a/a/a', './a/a/a/a/a', 'x/y', './z/z'];

    assert(!isMatch('./.a', '*.a', options()));
    assert(!isMatch('./.a', './*.a', options()));
    assert(!isMatch('./.a', 'a/**/z/*.md', options()));
    assert(!isMatch('./a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md', options()));
    assert(!isMatch('./a/b/c/j/e/z/c.txt', './a/**/j/**/z/*.md', options()));
    assert(!isMatch('a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md', options()));
    assert(isMatch('./.a', './.a', options()));
    assert(isMatch('./a/b/c.md', 'a/**/*.md', options()));
    assert(isMatch('./a/b/c/d/e/j/n/p/o/z/c.md', './a/**/j/**/z/*.md', options()));
    assert(isMatch('./a/b/c/d/e/z/c.md', '**/*.md', options()));
    assert(isMatch('./a/b/c/d/e/z/c.md', './a/**/z/*.md', options()));
    assert(isMatch('./a/b/c/d/e/z/c.md', 'a/**/z/*.md', options()));
    assert(isMatch('./a/b/c/j/e/z/c.md', './a/**/j/**/z/*.md', options()));
    assert(isMatch('./a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md', options()));
    assert(isMatch('./a/b/z/.a', './a/**/z/.a', options()));
    assert(isMatch('./a/b/z/.a', 'a/**/z/.a', options()));
    assert(isMatch('.a', './.a', options()));
    assert(isMatch('a/b/c.md', './a/**/*.md', options()));
    assert(isMatch('a/b/c.md', 'a/**/*.md', options()));
    assert(isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md', options()));
    assert(isMatch('a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md', options()));
    equal(match(fixtures, '*', options()), ['a', 'b']);
    equal(match(fixtures, '**/a/**', options()), ['a', 'a/a', 'a/c', 'a/b', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a']);
    equal(match(fixtures, '*/*', options()), ['a/a', 'a/b', 'a/c', 'a/x', 'x/y', 'z/z']);
    equal(match(fixtures, '*/*/*', options()), ['a/a/a', 'a/a/b']);
    equal(match(fixtures, '*/*/*/*', options()), ['a/a/a/a']);
    equal(match(fixtures, '*/*/*/*/*', options()), ['a/a/a/a/a']);
    equal(match(fixtures, './*', options()), ['a', 'b']);
    equal(match(fixtures, './**/a/**', options()), ['a', 'a/a', 'a/b', 'a/c', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a']);
    equal(match(fixtures, './a/*/a', options()), ['a/a/a']);
    equal(match(fixtures, 'a/*', options()), ['a/a', 'a/b', 'a/c', 'a/x']);
    equal(match(fixtures, 'a/*/*', options()), ['a/a/a', 'a/a/b']);
    equal(match(fixtures, 'a/*/*/*', options()), ['a/a/a/a']);
    equal(match(fixtures, 'a/*/*/*/*', options()), ['a/a/a/a/a']);
    equal(match(fixtures, 'a/*/a', options()), ['a/a/a']);
  });
});
