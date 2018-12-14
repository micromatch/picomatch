'use strict';

require('mocha');
const assert = require('assert');
const { isMatch, match } = require('./support');
const pm = require('..');

describe('stars', () => {
  beforeEach(() => pm.clearCache());

  it('should regard non-exclusive double-stars as single stars', () => {
    assert(!pm.isMatch('aaa/bba/ccc', 'aaa/**ccc'));
    assert(!pm.isMatch('aaa/bba/ccc', 'aaa/**z'));
    assert(pm.isMatch('aaa/bba/ccc', 'aaa/**b**/ccc'));
  });

  it('should match file extensions:', () => {
    assert.deepEqual(match(['.md', 'a.md', 'a/b/c.md', '.txt'], '**/*.md'), ['a.md', 'a/b/c.md']);
    assert.deepEqual(match(['.md/.md', '.md', 'a/.md', 'a/b/.md'], '**/.md'), ['.md', 'a/.md', 'a/b/.md']);
    assert.deepEqual(match(['.md/.md', '.md/foo/.md', '.md', 'a/.md', 'a/b/.md'], '.md/**/.md'), ['.md/.md', '.md/foo/.md']);
  });

  it('should support globstars (**)', () => {
    assert(!isMatch('a', 'a/**/*'));
    assert(!isMatch('a', 'a/**/**/*'));
    assert(!isMatch('a', 'a/**/**/**/*'));
    assert(!isMatch('a/', 'a/**/*'));
    assert(!isMatch('a/', 'a/**/**/*'));
    assert(!isMatch('a/', 'a/**/**/**/*'));
    assert(!isMatch('a/.b', 'a/**/z/*.md'));
    assert(!isMatch('a/b', '**/a'));
    assert(!isMatch('a/b/c/j/e/z/c.txt', 'a/**/j/**/z/*.md'));
    assert(!isMatch('a/b/z/.a', 'a/**/z/*.a'));
    assert(!isMatch('a/b/z/.a', 'a/*/z/*.a'));
    assert(!isMatch('a/b/z/.a', 'b/a'));
    assert(!isMatch('a/bb', 'a/**/b'));
    assert(!isMatch('a/c', '**/a'));
    assert(!isMatch('a/foo/z/.b', 'a/**/z/*.md'));
    assert(!isMatch('a/x', '**/a'));
    assert(!isMatch('a/x/y', '**/a'));
    assert(!isMatch('a/x/y/z', '**/a'));
    assert(!isMatch('a', 'a/**'));
    assert(isMatch('a', '**/a'));
    assert(isMatch('a', '**'));
    assert(isMatch('a/', '**'));
    assert(isMatch('a/', 'a/**'));
    assert(isMatch('a/', 'a/**'));
    assert(isMatch('a/', 'a/**/**'));
    assert(isMatch('a/.b', 'a/.*'));
    assert(isMatch('a/a', '**'));
    assert(isMatch('a/a', 'a/**'));
    assert(isMatch('a/a', 'a/**/*'));
    assert(isMatch('a/a', 'a/**/**/*'));
    assert(isMatch('a/a', 'a/**/**/**/*'));
    assert(isMatch('a/b', 'a/**'));
    assert(isMatch('a/b', 'a/**/*'));
    assert(isMatch('a/b', 'a/**/**/*'));
    assert(isMatch('a/b', 'a/**/**/**/*'));
    assert(isMatch('a/b', 'a/**/b'));
    assert(isMatch('a/b', '**'));
    assert(isMatch('a/b', '*/*'));
    assert(isMatch('a', '**/a'));
    assert(isMatch('a/a', '**/a'));
    assert(isMatch('a/b/bar/baz.qux', 'a/b/**/bar/**/*.*'));
    assert(isMatch('a/b/c', '**/*'));
    assert(isMatch('a/b/c', '**/**'));
    assert(isMatch('a/b/c', '*/**'));
    assert(isMatch('a/b/c/d/e/j/n/p/o/z/c.md', 'a/**/j/**/z/*.md'));
    assert(isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md'));
    assert(isMatch('a/b/c/xyz.md', 'a/b/c/*.md'));
    assert(isMatch('a/b/foo/bar/baz.qux', 'a/b/**/bar/**/*.*'));
    assert(isMatch('a/b/z/.a', 'a/*/z/.a'));
    assert(isMatch('a/bb.bb/aa/b.b/aa/c/xyz.md', 'a/**/c/*.md'));
    assert(isMatch('a/bb.bb/aa/bb/aa/c/xyz.md', 'a/**/c/*.md'));
    assert(isMatch('a/bb.bb/c/xyz.md', 'a/*/c/*.md'));
    assert(isMatch('a/bb/c/xyz.md', 'a/*/c/*.md'));
    assert(isMatch('a/bbbb/c/xyz.md', 'a/*/c/*.md'));
    assert(isMatch('a/c', '**'));
    assert(isMatch('a/c', 'a/**'));
    assert(isMatch('a/c', 'a/**/*'));
    assert(isMatch('a/c', 'a/**/**/*'));
    assert(isMatch('a/c', 'a/**/**/**/*'));
    assert(isMatch('a/x', '**'));
    assert(isMatch('a/x', 'a/**'));
    assert(isMatch('a/x', 'a/**/*'));
    assert(isMatch('a/x', 'a/**/**/*'));
    assert(isMatch('a/x', 'a/**/**/**/*'));
    assert(isMatch('a/x/y', '**'));
    assert(isMatch('a/x/y', 'a/**'));
    assert(isMatch('a/x/y', 'a/**/*'));
    assert(isMatch('a/x/y', 'a/**/**/*'));
    assert(isMatch('a/x/y', 'a/**/**/**/*'));
    assert(isMatch('a/x/y/z', '**'));
    assert(isMatch('a/x/y/z', 'a/**'));
    assert(isMatch('a/x/y/z', 'a/**/*'));
    assert(isMatch('a/x/y/z', 'a/**/**/*'));
    assert(isMatch('a/x/y/z', 'a/**/**/**/*'));
  });
});
