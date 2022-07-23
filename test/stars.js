
import assert from 'assert';
const { isMatch } = require('../lib');

describe('stars', () => {
  describe('issue related', () => {
    it('should respect dots defined in glob pattern (micromatch/#23)', () => {
      assert(isMatch('z.js', 'z*'));
      assert(!isMatch('zzjs', 'z*.js'));
      assert(!isMatch('zzjs', '*z.js'));
    });
  });

  describe('single stars', () => {
    it('should match anything except slashes and leading dots', () => {
      assert(!isMatch('a/b/c/z.js', '*.js'));
      assert(!isMatch('a/b/z.js', '*.js'));
      assert(!isMatch('a/z.js', '*.js'));
      assert(isMatch('z.js', '*.js'));

      assert(!isMatch('a/.ab', '*/*'));
      assert(!isMatch('.ab', '*'));

      assert(isMatch('z.js', 'z*.js'));
      assert(isMatch('a/z', '*/*'));
      assert(isMatch('a/z.js', '*/z*.js'));
      assert(isMatch('a/z.js', 'a/z*.js'));

      assert(isMatch('ab', '*'));
      assert(isMatch('abc', '*'));

      assert(!isMatch('bar', 'f*'));
      assert(!isMatch('foo', '*r'));
      assert(!isMatch('foo', 'b*'));
      assert(!isMatch('foo/bar', '*'));
      assert(isMatch('abc', '*c'));
      assert(isMatch('abc', 'a*'));
      assert(isMatch('abc', 'a*c'));
      assert(isMatch('bar', '*r'));
      assert(isMatch('bar', 'b*'));
      assert(isMatch('foo', 'f*'));
    });

    it('should match spaces', () => {
      assert(isMatch('one abc two', '*abc*'));
      assert(isMatch('a         b', 'a*b'));
    });

    it('should support multiple non-consecutive stars in a path segment', () => {
      assert(!isMatch('foo', '*a*'));
      assert(isMatch('bar', '*a*'));
      assert(isMatch('oneabctwo', '*abc*'));
      assert(!isMatch('a-b.c-d', '*-bc-*'));
      assert(isMatch('a-b.c-d', '*-*.*-*'));
      assert(isMatch('a-b.c-d', '*-b*c-*'));
      assert(isMatch('a-b.c-d', '*-b.c-*'));
      assert(isMatch('a-b.c-d', '*.*'));
      assert(isMatch('a-b.c-d', '*.*-*'));
      assert(isMatch('a-b.c-d', '*.*-d'));
      assert(isMatch('a-b.c-d', '*.c-*'));
      assert(isMatch('a-b.c-d', '*b.*d'));
      assert(isMatch('a-b.c-d', 'a*.c*'));
      assert(isMatch('a-b.c-d', 'a-*.*-d'));
      assert(isMatch('a.b', '*.*'));
      assert(isMatch('a.b', '*.b'));
      assert(isMatch('a.b', 'a.*'));
      assert(isMatch('a.b', 'a.b'));
    });

    it('should support multiple stars in a segment', () => {
      assert(!isMatch('a-b.c-d', '**-bc-**'));
      assert(isMatch('a-b.c-d', '**-**.**-**'));
      assert(isMatch('a-b.c-d', '**-b**c-**'));
      assert(isMatch('a-b.c-d', '**-b.c-**'));
      assert(isMatch('a-b.c-d', '**.**'));
      assert(isMatch('a-b.c-d', '**.**-**'));
      assert(isMatch('a-b.c-d', '**.**-d'));
      assert(isMatch('a-b.c-d', '**.c-**'));
      assert(isMatch('a-b.c-d', '**b.**d'));
      assert(isMatch('a-b.c-d', 'a**.c**'));
      assert(isMatch('a-b.c-d', 'a-**.**-d'));
      assert(isMatch('a.b', '**.**'));
      assert(isMatch('a.b', '**.b'));
      assert(isMatch('a.b', 'a.**'));
      assert(isMatch('a.b', 'a.b'));
    });

    it('should return true when one of the given patterns matches the string', () => {
      assert(isMatch('/ab', '*/*'));
      assert(isMatch('.', '.'));
      assert(!isMatch('a/.b', 'a/'));
      assert(isMatch('/ab', '/*'));
      assert(isMatch('/ab', '/??'));
      assert(isMatch('/ab', '/?b'));
      assert(isMatch('/cd', '/*'));
      assert(isMatch('a', 'a'));
      assert(isMatch('a/.b', 'a/.*'));
      assert(isMatch('a/b', '?/?'));
      assert(isMatch('a/b/c/d/e/j/n/p/o/z/c.md', 'a/**/j/**/z/*.md'));
      assert(isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md'));
      assert(isMatch('a/b/c/xyz.md', 'a/b/c/*.md'));
      assert(isMatch('a/b/c/xyz.md', 'a/b/c/*.md'));
      assert(isMatch('a/b/z/.a', 'a/*/z/.a'));
      assert(!isMatch('a/b/z/.a', 'bz'));
      assert(isMatch('a/bb.bb/aa/b.b/aa/c/xyz.md', 'a/**/c/*.md'));
      assert(isMatch('a/bb.bb/aa/bb/aa/c/xyz.md', 'a/**/c/*.md'));
      assert(isMatch('a/bb.bb/c/xyz.md', 'a/*/c/*.md'));
      assert(isMatch('a/bb/c/xyz.md', 'a/*/c/*.md'));
      assert(isMatch('a/bbbb/c/xyz.md', 'a/*/c/*.md'));
      assert(isMatch('aaa', '*'));
      assert(isMatch('ab', '*'));
      assert(isMatch('ab', 'ab'));
    });

    it('should return false when the path does not match the pattern', () => {
      assert(!isMatch('/ab', ['*/']));
      assert(!isMatch('/ab', ['*/a']));
      assert(!isMatch('/ab', ['/']));
      assert(!isMatch('/ab', ['/?']));
      assert(!isMatch('/ab', ['/a']));
      assert(!isMatch('/ab', ['?/?']));
      assert(!isMatch('/ab', ['a/*']));
      assert(!isMatch('a/.b', ['a/']));
      assert(!isMatch('a/b/c', ['a/*']));
      assert(!isMatch('a/b/c', ['a/b']));
      assert(!isMatch('a/b/c/d/e/z/c.md', ['b/c/d/e']));
      assert(!isMatch('a/b/z/.a', ['b/z']));
      assert(!isMatch('ab', ['*/*']));
      assert(!isMatch('ab', ['/a']));
      assert(!isMatch('ab', ['a']));
      assert(!isMatch('ab', ['b']));
      assert(!isMatch('ab', ['c']));
      assert(!isMatch('abcd', ['ab']));
      assert(!isMatch('abcd', ['bc']));
      assert(!isMatch('abcd', ['c']));
      assert(!isMatch('abcd', ['cd']));
      assert(!isMatch('abcd', ['d']));
      assert(!isMatch('abcd', ['f']));
      assert(!isMatch('ef', ['/*']));
    });

    it('should match a path segment for each single star', () => {
      assert(!isMatch('aaa', '*/*/*'));
      assert(!isMatch('aaa/bb/aa/rr', '*/*/*'));
      assert(!isMatch('aaa/bba/ccc', 'aaa*'));
      assert(!isMatch('aaa/bba/ccc', 'aaa**'));
      assert(!isMatch('aaa/bba/ccc', 'aaa/*'));
      assert(!isMatch('aaa/bba/ccc', 'aaa/*ccc'));
      assert(!isMatch('aaa/bba/ccc', 'aaa/*z'));
      assert(!isMatch('aaa/bbb', '*/*/*'));
      assert(!isMatch('ab/zzz/ejkl/hi', '*/*jk*/*i'));
      assert(isMatch('aaa/bba/ccc', '*/*/*'));
      assert(isMatch('aaa/bba/ccc', 'aaa/**'));
      assert(isMatch('aaa/bbb', 'aaa/*'));
      assert(isMatch('ab/zzz/ejkl/hi', '*/*z*/*/*i'));
      assert(isMatch('abzzzejklhi', '*j*i'));
    });

    it('should support single globs (*)', () => {
      assert(isMatch('a', '*'));
      assert(isMatch('b', '*'));
      assert(!isMatch('a/a', '*'));
      assert(!isMatch('a/a/a', '*'));
      assert(!isMatch('a/a/b', '*'));
      assert(!isMatch('a/a/a/a', '*'));
      assert(!isMatch('a/a/a/a/a', '*'));

      assert(!isMatch('a', '*/*'));
      assert(isMatch('a/a', '*/*'));
      assert(!isMatch('a/a/a', '*/*'));

      assert(!isMatch('a', '*/*/*'));
      assert(!isMatch('a/a', '*/*/*'));
      assert(isMatch('a/a/a', '*/*/*'));
      assert(!isMatch('a/a/a/a', '*/*/*'));

      assert(!isMatch('a', '*/*/*/*'));
      assert(!isMatch('a/a', '*/*/*/*'));
      assert(!isMatch('a/a/a', '*/*/*/*'));
      assert(isMatch('a/a/a/a', '*/*/*/*'));
      assert(!isMatch('a/a/a/a/a', '*/*/*/*'));

      assert(!isMatch('a', '*/*/*/*/*'));
      assert(!isMatch('a/a', '*/*/*/*/*'));
      assert(!isMatch('a/a/a', '*/*/*/*/*'));
      assert(!isMatch('a/a/b', '*/*/*/*/*'));
      assert(!isMatch('a/a/a/a', '*/*/*/*/*'));
      assert(isMatch('a/a/a/a/a', '*/*/*/*/*'));
      assert(!isMatch('a/a/a/a/a/a', '*/*/*/*/*'));

      assert(!isMatch('a', 'a/*'));
      assert(isMatch('a/a', 'a/*'));
      assert(!isMatch('a/a/a', 'a/*'));
      assert(!isMatch('a/a/a/a', 'a/*'));
      assert(!isMatch('a/a/a/a/a', 'a/*'));

      assert(!isMatch('a', 'a/*/*'));
      assert(!isMatch('a/a', 'a/*/*'));
      assert(isMatch('a/a/a', 'a/*/*'));
      assert(!isMatch('b/a/a', 'a/*/*'));
      assert(!isMatch('a/a/a/a', 'a/*/*'));
      assert(!isMatch('a/a/a/a/a', 'a/*/*'));

      assert(!isMatch('a', 'a/*/*/*'));
      assert(!isMatch('a/a', 'a/*/*/*'));
      assert(!isMatch('a/a/a', 'a/*/*/*'));
      assert(isMatch('a/a/a/a', 'a/*/*/*'));
      assert(!isMatch('a/a/a/a/a', 'a/*/*/*'));

      assert(!isMatch('a', 'a/*/*/*/*'));
      assert(!isMatch('a/a', 'a/*/*/*/*'));
      assert(!isMatch('a/a/a', 'a/*/*/*/*'));
      assert(!isMatch('a/a/b', 'a/*/*/*/*'));
      assert(!isMatch('a/a/a/a', 'a/*/*/*/*'));
      assert(isMatch('a/a/a/a/a', 'a/*/*/*/*'));

      assert(!isMatch('a', 'a/*/a'));
      assert(!isMatch('a/a', 'a/*/a'));
      assert(isMatch('a/a/a', 'a/*/a'));
      assert(!isMatch('a/a/b', 'a/*/a'));
      assert(!isMatch('a/a/a/a', 'a/*/a'));
      assert(!isMatch('a/a/a/a/a', 'a/*/a'));

      assert(!isMatch('a', 'a/*/b'));
      assert(!isMatch('a/a', 'a/*/b'));
      assert(!isMatch('a/a/a', 'a/*/b'));
      assert(isMatch('a/a/b', 'a/*/b'));
      assert(!isMatch('a/a/a/a', 'a/*/b'));
      assert(!isMatch('a/a/a/a/a', 'a/*/b'));
    });

    it('should only match a single folder per star when globstars are used', () => {
      assert(!isMatch('a', '*/**/a'));
      assert(!isMatch('a/a/b', '*/**/a'));
      assert(isMatch('a/a', '*/**/a'));
      assert(isMatch('a/a/a', '*/**/a'));
      assert(isMatch('a/a/a/a', '*/**/a'));
      assert(isMatch('a/a/a/a/a', '*/**/a'));
    });

    it('should not match a trailing slash when a star is last char', () => {
      assert(!isMatch('a', '*/'));
      assert(!isMatch('a', '*/*'));
      assert(!isMatch('a', 'a/*'));
      assert(!isMatch('a/', '*/*'));
      assert(!isMatch('a/', 'a/*'));
      assert(!isMatch('a/a', '*'));
      assert(!isMatch('a/a', '*/'));
      assert(!isMatch('a/x/y', '*/'));
      assert(!isMatch('a/x/y', '*/*'));
      assert(!isMatch('a/x/y', 'a/*'));
      assert(!isMatch('a/', '*', { strictSlashes: true }));
      assert(isMatch('a/', '*'));
      assert(isMatch('a', '*'));
      assert(isMatch('a/', '*/'));
      assert(isMatch('a/', '*{,/}'));
      assert(isMatch('a/a', '*/*'));
      assert(isMatch('a/a', 'a/*'));
    });

    it('should work with file extensions', () => {
      assert(!isMatch('a.txt', 'a/**/*.txt'));
      assert(isMatch('a/x/y.txt', 'a/**/*.txt'));
      assert(!isMatch('a/x/y/z', 'a/**/*.txt'));

      assert(!isMatch('a.txt', 'a/*.txt'));
      assert(isMatch('a/b.txt', 'a/*.txt'));
      assert(!isMatch('a/x/y.txt', 'a/*.txt'));
      assert(!isMatch('a/x/y/z', 'a/*.txt'));

      assert(isMatch('a.txt', 'a*.txt'));
      assert(!isMatch('a/b.txt', 'a*.txt'));
      assert(!isMatch('a/x/y.txt', 'a*.txt'));
      assert(!isMatch('a/x/y/z', 'a*.txt'));

      assert(isMatch('a.txt', '*.txt'));
      assert(!isMatch('a/b.txt', '*.txt'));
      assert(!isMatch('a/x/y.txt', '*.txt'));
      assert(!isMatch('a/x/y/z', '*.txt'));
    });

    it('should not match slashes when globstars are not exclusive in a path segment', () => {
      assert(!isMatch('foo/baz/bar', 'foo**bar'));
      assert(isMatch('foobazbar', 'foo**bar'));
    });

    it('should match slashes when defined in braces', () => {
      assert(isMatch('foo', 'foo{,/**}'));
    });

    it('should correctly match slashes', () => {
      assert(!isMatch('a/b', 'a*'));
      assert(!isMatch('a/a/bb', 'a/**/b'));
      assert(!isMatch('a/bb', 'a/**/b'));

      assert(!isMatch('foo', '*/**'));
      assert(!isMatch('foo/bar', '**/'));
      assert(!isMatch('foo/bar', '**/*/'));
      assert(!isMatch('foo/bar', '*/*/'));
      assert(!isMatch('foo/bar/', '**/*', { strictSlashes: true }));

      assert(isMatch('/home/foo/..', '**/..'));
      assert(isMatch('a', '**/a'));
      assert(isMatch('a/a', '**'));
      assert(isMatch('a/a', 'a/**'));
      assert(isMatch('a/', 'a/**'));
      assert(isMatch('a', 'a/**'));
      assert(!isMatch('a/a', '**/'));
      assert(isMatch('a', '**/a/**'));
      assert(isMatch('a', 'a/**'));
      assert(!isMatch('a/a', '**/'));
      assert(isMatch('a/a', '*/**/a'));
      assert(isMatch('a', 'a/**'));
      assert(isMatch('foo/', '*/**'));
      assert(isMatch('foo/bar', '**/*'));
      assert(isMatch('foo/bar', '*/*'));
      assert(isMatch('foo/bar', '*/**'));
      assert(isMatch('foo/bar/', '**/'));
      assert(isMatch('foo/bar/', '**/*'));
      assert(isMatch('foo/bar/', '**/*/'));
      assert(isMatch('foo/bar/', '*/**'));
      assert(isMatch('foo/bar/', '*/*/'));

      assert(!isMatch('bar/baz/foo', '*/foo'));
      assert(!isMatch('deep/foo/bar', '**/bar/*'));
      assert(!isMatch('deep/foo/bar/baz/x', '*/bar/**'));
      assert(!isMatch('ef', '/*'));
      assert(!isMatch('foo/bar', 'foo?bar'));
      assert(!isMatch('foo/bar/baz', '**/bar*'));
      assert(!isMatch('foo/bar/baz', '**/bar**'));
      assert(!isMatch('foo/baz/bar', 'foo**bar'));
      assert(!isMatch('foo/baz/bar', 'foo*bar'));
      assert(isMatch('foo', 'foo/**'));
      assert(isMatch('/ab', '/*'));
      assert(isMatch('/cd', '/*'));
      assert(isMatch('/ef', '/*'));
      assert(isMatch('a/b/j/c/z/x.md', 'a/**/j/**/z/*.md'));
      assert(isMatch('a/j/z/x.md', 'a/**/j/**/z/*.md'));

      assert(isMatch('bar/baz/foo', '**/foo'));
      assert(isMatch('deep/foo/bar/baz', '**/bar/*'));
      assert(isMatch('deep/foo/bar/baz/', '**/bar/**'));
      assert(isMatch('deep/foo/bar/baz/x', '**/bar/*/*'));
      assert(isMatch('foo/b/a/z/bar', 'foo/**/**/bar'));
      assert(isMatch('foo/b/a/z/bar', 'foo/**/bar'));
      assert(isMatch('foo/bar', 'foo/**/**/bar'));
      assert(isMatch('foo/bar', 'foo/**/bar'));
      assert(isMatch('foo/bar/baz/x', '*/bar/**'));
      assert(isMatch('foo/baz/bar', 'foo/**/**/bar'));
      assert(isMatch('foo/baz/bar', 'foo/**/bar'));
      assert(isMatch('XXX/foo', '**/foo'));
    });

    it('should ignore leading "./" when defined on pattern', () => {
      assert(isMatch('ab', './*'));
      assert(!isMatch('ab', './*/'));
      assert(isMatch('ab/', './*/'));
    });

    it('should optionally match trailing slashes with braces', () => {
      assert(isMatch('foo', '**/*'));
      assert(isMatch('foo', '**/*{,/}'));
      assert(isMatch('foo/', '**/*{,/}'));
      assert(isMatch('foo/bar', '**/*{,/}'));
      assert(isMatch('foo/bar/', '**/*{,/}'));
    });
  });
});
