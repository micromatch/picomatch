'use strict';

require('mocha');
const assert = require('assert');
const { isMatch, match } = require('./support');
const pm = require('..');

const equal = (actual, expected, msg) => {
  if (Array.isArray(actual)) actual.sort();
  if (Array.isArray(expected)) expected.sort();
  assert.deepEqual(actual, expected, msg);
};

describe('options.onMatch', () => {
  beforeEach(() => pm.clearCache());

  it('should call options.onMatch on each matching string', () => {
    let opts = {
      prepend: '(\\.\\/(?=.))?',
      onMatch(str) {
        if (str.length > 2 && str.startsWith('./') || str.startsWith('.\\')) {
          return str.slice(2);
        }
        return str;
      }
    };

    let fixtures = ['a', './a', 'b', 'a/a', './a/b', 'a/c', './a/x', './a/a/a', 'a/a/b', './a/a/a/a', './a/a/a/a/a', 'x/y', './z/z'];

    assert(!pm.isMatch('./.a', '*.a', opts));
    assert(!pm.isMatch('./.a', './*.a', opts));
    assert(!pm.isMatch('./.a', 'a/**/z/*.md', opts));
    assert(!pm.isMatch('./a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md', opts));
    assert(!pm.isMatch('./a/b/c/j/e/z/c.txt', './a/**/j/**/z/*.md', opts));
    assert(!pm.isMatch('a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md', opts));
    assert(pm.isMatch('./.a', './.a', opts));
    assert(pm.isMatch('./a/b/c.md', 'a/**/*.md', opts));
    assert(pm.isMatch('./a/b/c/d/e/j/n/p/o/z/c.md', './a/**/j/**/z/*.md', opts));
    assert(pm.isMatch('./a/b/c/d/e/z/c.md', '**/*.md', opts));
    assert(pm.isMatch('./a/b/c/d/e/z/c.md', './a/**/z/*.md', opts));
    assert(pm.isMatch('./a/b/c/d/e/z/c.md', 'a/**/z/*.md', opts));
    assert(pm.isMatch('./a/b/c/j/e/z/c.md', './a/**/j/**/z/*.md', opts));
    assert(pm.isMatch('./a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md', opts));
    assert(pm.isMatch('./a/b/z/.a', './a/**/z/.a', opts));
    assert(pm.isMatch('./a/b/z/.a', 'a/**/z/.a', opts));
    assert(pm.isMatch('.a', './.a', opts));
    assert(pm.isMatch('a/b/c.md', './a/**/*.md', opts));
    assert(pm.isMatch('a/b/c.md', 'a/**/*.md', opts));
    assert(pm.isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md', opts));
    assert(pm.isMatch('a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md', opts));
    equal(match(fixtures, '*', opts), ['a', 'b']);
    equal(match(fixtures, '**/a/**', opts), ['a/a', 'a/c', 'a/b', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a']);
    equal(match(fixtures, '*/*', opts), ['a/a', 'a/b', 'a/c', 'a/x', 'x/y', 'z/z']);
    equal(match(fixtures, '*/*/*', opts), ['a/a/a', 'a/a/b']);
    equal(match(fixtures, '*/*/*/*', opts), ['a/a/a/a']);
    equal(match(fixtures, '*/*/*/*/*', opts), ['a/a/a/a/a']);
    equal(match(fixtures, './*', opts), ['a', 'b']);
    equal(match(fixtures, './**/a/**', opts), ['a/a', 'a/b', 'a/c', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a']);
    equal(match(fixtures, './a/*/a', opts), ['a/a/a']);
    equal(match(fixtures, 'a/*', opts), ['a/a', 'a/b', 'a/c', 'a/x']);
    equal(match(fixtures, 'a/*/*', opts), ['a/a/a', 'a/a/b']);
    equal(match(fixtures, 'a/*/*/*', opts), ['a/a/a/a']);
    equal(match(fixtures, 'a/*/*/*/*', opts), ['a/a/a/a/a']);
    equal(match(fixtures, 'a/*/a', opts), ['a/a/a']);
  });
});
