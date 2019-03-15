'use strict';

require('mocha');
const assert = require('assert');
const support = require('./support');
const match = require('./support/match');
const { isMatch } = require('..');

const equal = (actual, expected, msg) => {
  assert.deepEqual([].concat(actual).sort(), [].concat(expected).sort(), msg);
};

describe('options.format - cached', () => {
  before(() => support.enableCache());
  after(() => support.disableCache());

  // see https://github.com/isaacs/minimatch/issues/30
  it('should match the string returned by options.format', () => {
    let opts = { format: str => str.replace(/\\/g, '/').replace(/^\.\//, ''), strictSlashes: true };
    let fixtures = ['a', './a', 'b', 'a/a', './a/b', 'a/c', './a/x', './a/a/a', 'a/a/b', './a/a/a/a', './a/a/a/a/a', 'x/y', './z/z'];

    assert(!isMatch('./.a', '*.a', opts));
    assert(!isMatch('./.a', './*.a', opts));
    assert(!isMatch('./.a', 'a/**/z/*.md', opts));
    assert(!isMatch('./a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md', opts));
    assert(!isMatch('./a/b/c/j/e/z/c.txt', './a/**/j/**/z/*.md', opts));
    assert(!isMatch('a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md', opts));
    assert(isMatch('./.a', './.a', opts));
    assert(isMatch('./a/b/c.md', 'a/**/*.md', opts));
    assert(isMatch('./a/b/c/d/e/j/n/p/o/z/c.md', './a/**/j/**/z/*.md', opts));
    assert(isMatch('./a/b/c/d/e/z/c.md', '**/*.md', opts));
    assert(isMatch('./a/b/c/d/e/z/c.md', './a/**/z/*.md', opts));
    assert(isMatch('./a/b/c/d/e/z/c.md', 'a/**/z/*.md', opts));
    assert(isMatch('./a/b/c/j/e/z/c.md', './a/**/j/**/z/*.md', opts));
    assert(isMatch('./a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md', opts));
    assert(isMatch('./a/b/z/.a', './a/**/z/.a', opts));
    assert(isMatch('./a/b/z/.a', 'a/**/z/.a', opts));
    assert(isMatch('.a', './.a', opts));
    assert(isMatch('a/b/c.md', './a/**/*.md', opts));
    assert(isMatch('a/b/c.md', 'a/**/*.md', opts));
    assert(isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md', opts));
    assert(isMatch('a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md', opts));
    assert(isMatch('./a', '*', opts));

    assert(isMatch('./foo/bar.js', '**/foo/**', opts));
    assert(isMatch('./foo/bar.js', './**/foo/**', opts));
    assert(isMatch('.\\foo\\bar.js', '**/foo/**', { ...opts, unixify: false }));
    assert(isMatch('.\\foo\\bar.js', './**/foo/**', opts));
    equal(match(fixtures, '*', opts), ['a', 'b']);
    equal(match(fixtures, '**/a/**', opts), ['a/a', 'a/c', 'a/b', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a']);
    equal(match(fixtures, '*/*', opts), ['a/a', 'a/b', 'a/c', 'a/x', 'x/y', 'z/z']);
    equal(match(fixtures, '*/*/*', opts), ['a/a/a', 'a/a/b']);
    equal(match(fixtures, '*/*/*/*', opts), ['a/a/a/a']);
    equal(match(fixtures, '*/*/*/*/*', opts), ['a/a/a/a/a']);
    equal(match(fixtures, '*', opts), ['a', 'b']);
    equal(match(fixtures, '**/a/**', opts), ['a/a', 'a/c', 'a/b', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a']);
    equal(match(fixtures, 'a/*/a', opts), ['a/a/a']);
    equal(match(fixtures, 'a/*', opts), ['a/a', 'a/b', 'a/c', 'a/x']);
    equal(match(fixtures, 'a/*/*', opts), ['a/a/a', 'a/a/b']);
    equal(match(fixtures, 'a/*/*/*', opts), ['a/a/a/a']);
    equal(match(fixtures, 'a/*/*/*/*', opts), ['a/a/a/a/a']);
    equal(match(fixtures, 'a/*/a', opts), ['a/a/a']);
  });
});
