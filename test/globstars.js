'use strict';

require('mocha');
const assert = require('assert');
const picomatch = require('..');
const pm = require('./support');

describe('globstars - "**"', () => {
  beforeEach(() => pm.clearCache());

  it('should regard non-exclusive double-stars as single stars', () => {
    assert(!pm.isMatch('aaa/bba/ccc', 'aaa/**ccc'));
    assert(!pm.isMatch('aaa/bba/ccc', 'aaa/**z'));
    assert(pm.isMatch('aaa/bba/ccc', 'aaa/**b**/ccc'));
  });

  it('should match nested directories', () => {
    assert(pm.isMatch('a/.b', 'a/.*'));
    assert(pm.isMatch('a/b', '*/*'));
    assert(pm.isMatch('a/b/c', '**/*'));
    assert(pm.isMatch('a/b/c', '**/**'));
    assert(pm.isMatch('a/b/c', '*/**'));
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
