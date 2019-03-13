'use strict';

require('mocha');
const assert = require('assert');
const match = require('./support/match');
const { clearCache, isMatch } = require('..');

describe('stars', () => {
  beforeEach(() => clearCache());

  describe('issue related', () => {
    it('should match paths with no slashes (micromatch/#15)', () => {
      assert(isMatch('z.js', '**/z*.js'));
      assert(isMatch('z.js', '**/*.js'));
      assert(isMatch('foo', '**/foo'));
      assert(isMatch('z.js', '**/z*'));
    });

    it('todo... (micromatch/#24)', () => {
      assert(isMatch('foo/bar/baz/one/image.png', 'foo/bar/**/one/**/*.*'));
      assert(isMatch('foo/bar/baz/one/two/image.png', 'foo/bar/**/one/**/*.*'));
      assert(isMatch('foo/bar/baz/one/two/three/image.png', 'foo/bar/**/one/**/*.*'));
      assert(!isMatch('a/b/c/d/', 'a/b/**/f'));
      assert(!isMatch('a', 'a/**', { strictSlashes: true }));
      assert(isMatch('a', 'a/**'));
      assert(isMatch('a', '**'));
      assert(isMatch('a', 'a{,/**}'));
      assert(isMatch('a/', '**'));
      assert(isMatch('a/', 'a/**'));
      assert(isMatch('a/b/c/d', '**'));
      assert(isMatch('a/b/c/d/', '**'));
      assert(isMatch('a/b/c/d/', '**/**'));
      assert(isMatch('a/b/c/d/', '**/b/**'));
      assert(isMatch('a/b/c/d/', 'a/b/**'));
      assert(isMatch('a/b/c/d/', 'a/b/**/'));
      assert(isMatch('a/b/c/d/', 'a/b/**/c/**/'));
      assert(isMatch('a/b/c/d/', 'a/b/**/c/**/d/'));
      assert(isMatch('a/b/c/d/e.f', 'a/b/**/**/*.*'));
      assert(isMatch('a/b/c/d/e.f', 'a/b/**/*.*'));
      assert(isMatch('a/b/c/d/e.f', 'a/b/**/c/**/d/*.*'));
      assert(isMatch('a/b/c/d/e.f', 'a/b/**/d/**/*.*'));
      assert(isMatch('a/b/c/d/g/e.f', 'a/b/**/d/**/*.*'));
      assert(isMatch('a/b/c/d/g/g/e.f', 'a/b/**/d/**/*.*'));

      assert(isMatch('a/b-c/z.js', 'a/b-*/**/z.js'));
      assert(isMatch('a/b-c/d/e/z.js', 'a/b-*/**/z.js'));
    });
  });

  describe('globstars', () => {
    it('should match globstars', () => {
      assert(isMatch('a/b/c/z.js', '**/*.js'));
      assert(isMatch('a/b/z.js', '**/*.js'));
      assert(isMatch('a/z.js', '**/*.js'));
      assert(isMatch('a/b/c/d/e/z.js', 'a/b/**/*.js'));
      assert(isMatch('a/b/c/d/z.js', 'a/b/**/*.js'));
      assert(isMatch('a/b/c/z.js', 'a/b/c/**/*.js'));
      assert(isMatch('a/b/c/z.js', 'a/b/c**/*.js'));
      assert(isMatch('a/b/c/z.js', 'a/b/**/*.js'));
      assert(isMatch('a/b/z.js', 'a/b/**/*.js'));

      assert(!isMatch('a/z.js', 'a/b/**/*.js'));
      assert(!isMatch('z.js', 'a/b/**/*.js'));
    });

    it('should regard non-exclusive double-stars as single stars', () => {
      assert(!isMatch('aaa/bba/ccc', '**ccc'));
      assert(!isMatch('aaa/bba/ccc', 'aaa/**ccc'));
      assert(!isMatch('aaa/bba/ccc', 'aaa/**z'));
      assert(!isMatch('aaa/a/b/aba/ccc', 'aaa/**b**/ccc'));
      assert(isMatch('aaa/bba/ccc', 'aaa/**b**/ccc'));
      assert(isMatch('aaa/aba/ccc', 'aaa/**b**/ccc'));
    });

    it('should match leading dots when defined in pattern', () => {
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
      assert(!isMatch('a', 'a/**', { strictSlashes: true }));
      assert(isMatch('a', 'a/**'));
      assert(isMatch('a', '**'));
      assert(isMatch('a', '**/a'));
      assert(isMatch('a/', '**/a/**'));
      assert(!isMatch('a/', '**/a'));
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
});
