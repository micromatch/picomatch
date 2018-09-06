'use strict';

require('mocha');
const assert = require('assert');
const { isMatch } = require('./support');
const pm = require('..');

describe('stars', () => {
  beforeEach(() => pm.clearCache());

  it('should regard non-exclusive double-stars as single stars', () => {
    assert(!pm.isMatch('aaa/bba/ccc', 'aaa/**ccc'));
    assert(!pm.isMatch('aaa/bba/ccc', 'aaa/**z'));
    assert(pm.isMatch('aaa/bba/ccc', 'aaa/**b**/ccc'));
  });

  it('should support globstars (**)', () => {
    assert(isMatch('a', '**'));
    assert(isMatch('a/', '**'));
    assert(isMatch('a/a', '**'));
    assert(isMatch('a/b', '**'));
    assert(isMatch('a/c', '**'));
    assert(isMatch('a/x', '**'));
    assert(isMatch('a/x/y', '**'));
    assert(isMatch('a/x/y/z', '**'));

    assert(isMatch('a', '**/a'));
    assert(isMatch('a/', '**/a'));
    assert(isMatch('a/a', '**/a'));
    assert(!isMatch('a/b', '**/a'));
    assert(!isMatch('a/c', '**/a'));
    assert(!isMatch('a/x', '**/a'));
    assert(!isMatch('a/x/y', '**/a'));
    assert(!isMatch('a/x/y/z', '**/a'));

    assert(isMatch('a', 'a/**'));
    assert(isMatch('a/', 'a/**'));
    assert(isMatch('a/a', 'a/**'));
    assert(isMatch('a/b', 'a/**'));
    assert(isMatch('a/c', 'a/**'));
    assert(isMatch('a/x', 'a/**'));
    assert(isMatch('a/x/y', 'a/**'));
    assert(isMatch('a/x/y/z', 'a/**'));

    assert(!isMatch('a', 'a/**/*'));
    assert(!isMatch('a/', 'a/**/*'));
    assert(isMatch('a/a', 'a/**/*'));
    assert(isMatch('a/b', 'a/**/*'));
    assert(isMatch('a/c', 'a/**/*'));
    assert(isMatch('a/x', 'a/**/*'));
    assert(isMatch('a/x/y', 'a/**/*'));
    assert(isMatch('a/x/y/z', 'a/**/*'));

    assert(!isMatch('a', 'a/**/**/*'));
    assert(!isMatch('a/', 'a/**/**/*'));
    assert(isMatch('a/a', 'a/**/**/*'));
    assert(isMatch('a/b', 'a/**/**/*'));
    assert(isMatch('a/c', 'a/**/**/*'));
    assert(isMatch('a/x', 'a/**/**/*'));
    assert(isMatch('a/x/y', 'a/**/**/*'));
    assert(isMatch('a/x/y/z', 'a/**/**/*'));

    assert(!isMatch('a', 'a/**/**/**/*'));
    assert(!isMatch('a/', 'a/**/**/**/*'));
    assert(isMatch('a/a', 'a/**/**/**/*'));
    assert(isMatch('a/b', 'a/**/**/**/*'));
    assert(isMatch('a/c', 'a/**/**/**/*'));
    assert(isMatch('a/x', 'a/**/**/**/*'));
    assert(isMatch('a/x/y', 'a/**/**/**/*'));
    assert(isMatch('a/x/y/z', 'a/**/**/**/*'));

    assert(isMatch('a/b/foo/bar/baz.qux', 'a/b/**/bar/**/*.*'));
    assert(isMatch('a/b/bar/baz.qux', 'a/b/**/bar/**/*.*'));
    assert(pm.isMatch('a/.b', 'a/.*'));
    assert(pm.isMatch('a/b', '*/*'));
    assert(pm.isMatch('a/b/c', '**/*'));
    assert(pm.isMatch('a/b/c', '**/**'));
    assert(pm.isMatch('a/b/c', '*/**'));
    assert(pm.isMatch('a/b', 'a/**/b'));
    assert(!pm.isMatch('a/bb', 'a/**/b'));
    assert(pm.isMatch('a/b/c/d/e/j/n/p/o/z/c.md', 'a/**/j/**/z/*.md'));
    assert(pm.isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md'));
    assert(pm.isMatch('a/b/c/xyz.md', 'a/b/c/*.md'));
    assert(pm.isMatch('a/b/z/.a', 'a/*/z/.a'));
    assert(pm.isMatch('a/bb.bb/aa/b.b/aa/c/xyz.md', 'a/**/c/*.md'));
    assert(pm.isMatch('a/bb.bb/aa/bb/aa/c/xyz.md', 'a/**/c/*.md'));
    assert(pm.isMatch('a/bb.bb/c/xyz.md', 'a/*/c/*.md'));
    assert(pm.isMatch('a/bb/c/xyz.md', 'a/*/c/*.md'));
    assert(pm.isMatch('a/bbbb/c/xyz.md', 'a/*/c/*.md'));
    assert(!pm.isMatch('a/.b', 'a/**/z/*.md'));
    assert(!pm.isMatch('a/b/c/j/e/z/c.txt', 'a/**/j/**/z/*.md'));
    assert(!pm.isMatch('a/b/c/xyz.md', 'a/b/**/c{d,e}/**/xyz.md'));
    assert(!pm.isMatch('a/b/d/xyz.md', 'a/b/**/c{d,e}/**/xyz.md'));
    assert(!pm.isMatch('a/b/z/.a', 'a/**/z/*.a'));
    assert(!pm.isMatch('a/b/z/.a', 'a/*/z/*.a'));
    assert(!pm.isMatch('a/b/z/.a', 'b/a'));
    assert(!pm.isMatch('a/foo/z/.b', 'a/**/z/*.md'));
  });
});
