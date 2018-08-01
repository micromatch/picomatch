'use strict';

require('mocha');
const path = require('path');
const assert = require('assert');
const pm = require('./support');

describe('.isMatch()', () => {
  describe('escaping', () => {
    it('should support escaped characters', () => {
      assert(!pm.isMatch('abc', 'abc\\*'));
      assert(pm.isMatch('abc*', 'abc\\*'));
    });
  });

  describe('negation', () => {
    it('should support negated patterns', () => {
      assert(pm.isMatch('abc', '!xyz'));
      assert(pm.isMatch('abc', '!*foo'));
      assert(pm.isMatch('abc', '!foo*'));
      assert(!pm.isMatch('abc', '!abc'));
      assert(!pm.isMatch('abc', '!*'));
    });
  });

  describe('empty patterns', () => {
    it('should correctly handle empty patterns', () => {
      assert(!pm.isMatch('', ''));
      assert(!pm.isMatch('.', ''));
      assert(!pm.isMatch('./', ''));
      assert(!pm.isMatch('a', ''));
      assert(!pm.isMatch('ab', ''));
    });
  });

  describe('slashes', () => {
    it('should correctly match slashes', () => {
      assert(!pm.isMatch('ab', './*/'));
      assert(!pm.isMatch('bar/baz/foo', '*/foo'));
      assert(!pm.isMatch('deep/foo/bar', '**/bar/*'));
      assert(!pm.isMatch('deep/foo/bar/baz/x', '*/bar/**'));
      assert(!pm.isMatch('ef', '/*'));
      assert(!pm.isMatch('foo', 'foo/**'));
      assert(!pm.isMatch('foo/bar', 'foo?bar'));
      assert(!pm.isMatch('foo/bar/baz', '**/bar*'));
      assert(!pm.isMatch('foo/bar/baz', '**/bar**'));
      assert(!pm.isMatch('foo/baz/bar', 'foo**bar'));
      assert(!pm.isMatch('foo/baz/bar', 'foo*bar'));
      assert(pm.isMatch('/ab', '/*'));
      assert(pm.isMatch('/cd', '/*'));
      assert(pm.isMatch('/ef', '/*'));
      assert(pm.isMatch('a/b/j/c/z/x.md', 'a/**/j/**/z/*.md'));
      assert(pm.isMatch('a/j/z/x.md', 'a/**/j/**/z/*.md'));
      assert(pm.isMatch('ab', './*'));
      assert(pm.isMatch('ab/', './*/'));
      assert(pm.isMatch('bar/baz/foo', '**/foo'));
      assert(pm.isMatch('deep/foo/bar/baz', '**/bar/*'));
      assert(pm.isMatch('deep/foo/bar/baz/', '**/bar/**'));
      assert(pm.isMatch('deep/foo/bar/baz/x', '**/bar/*/*'));
      assert(pm.isMatch('foo', 'foo{,/**}'));
      assert(pm.isMatch('foo/b/a/z/bar', 'foo/**/**/bar'));
      assert(pm.isMatch('foo/b/a/z/bar', 'foo/**/bar'));
      assert(pm.isMatch('foo/bar', 'foo/**/**/bar'));
      assert(pm.isMatch('foo/bar', 'foo/**/bar'));
      assert(pm.isMatch('foo/bar', 'foo[/]bar'));
      assert(pm.isMatch('foo/bar/baz/x', '*/bar/**'));
      assert(pm.isMatch('foo/baz/bar', 'foo/**/**/bar'));
      assert(pm.isMatch('foo/baz/bar', 'foo/**/bar'));
      assert(pm.isMatch('foobazbar', 'foo**bar'));
      assert(pm.isMatch('XXX/foo', '**/foo'));
    });
  });

  describe('non-globs', () => {
    it('should match literal paths', () => {
      path.sep = '\\';
      assert(pm.isMatch('aaa\\bbb', ['aaa\\bbb', 'aaa/bbb']));
      path.sep = '/';

      assert(!pm.isMatch('aaa', 'aa'));
      assert(pm.isMatch('aaa', 'aaa'));
      assert(pm.isMatch('aaa', ['aa', 'aaa']));
      assert(pm.isMatch('aaa/bbb', 'aaa/bbb'));
      assert(pm.isMatch('aaa/bbb', 'aaa[/]bbb'));
      assert(pm.isMatch('aaa\\bbb', ['aaa\\bbb', 'aaa/bbb'], { unixify: true }));
      assert(pm.isMatch('aaa/bbb', ['aaa\\bbb', 'aaa/bbb']));
    });

    it('should correctly deal with empty globs', () => {
      assert(!pm.isMatch('ab', ''));
      assert(!pm.isMatch('a', ''));
      assert(!pm.isMatch('.', ''));
    });

    it('should handle literal strings (non-glob patterns)', () => {
      assert(!pm.isMatch('/ab', '/a'));
      assert(!pm.isMatch('ab', '/a'));
      assert(!pm.isMatch('ab', 'a'));
      assert(!pm.isMatch('abc', ''));
      assert(!pm.isMatch('abcd', 'ab'));
      assert(!pm.isMatch('abcd', 'abc'));
      assert(!pm.isMatch('abcd', 'bc'));
      assert(!pm.isMatch('abcd', 'cd'));
      assert(pm.isMatch('.', '.'));
      assert(pm.isMatch('/a', '/a'));
      assert(pm.isMatch('a', 'a'));
      assert(pm.isMatch('ab', 'ab'));
      assert(pm.isMatch('abcd', 'abcd'));
    });
  });

  describe('plus', () => {
    it('should escape plus signs to match string literals', () => {
      assert(pm.isMatch('a+b/src/glimini.js', 'a+b/src/*.js'));
      assert(pm.isMatch('+b/src/glimini.js', '+b/src/*.js'));
      assert(pm.isMatch('coffee+/src/glimini.js', 'coffee+/src/*.js'));
      assert(pm.isMatch('coffee+/src/glimini.js', 'coffee+/src/*.js'));
      assert(pm.isMatch('coffee+/src/glimini.js', 'coffee+/src/*'));
    });

    it('should not escape + following brackets', () => {
      assert(pm.isMatch('a', '[a]+'));
      assert(pm.isMatch('aa', '[a]+'));
      assert(pm.isMatch('aaa', '[a]+'));
      assert(pm.isMatch('az', '[a-z]+'));
      assert(pm.isMatch('zzz', '[a-z]+'));
    });

    it('should not escape + following parens', () => {
      assert(pm.isMatch('a', '(a)+'));
      assert(pm.isMatch('ab', '(a|b)+'));
      assert(pm.isMatch('aa', '(a)+'));
      assert(pm.isMatch('aaab', '(a|b)+'));
      assert(pm.isMatch('aaabbb', '(a|b)+'));
    });
  });

  describe('wildcards', () => {
    it('should match wildcards', () => {
      assert(!pm.isMatch('a/b/c/z.js', '*.js'));
      assert(!pm.isMatch('a/b/z.js', '*.js'));
      assert(!pm.isMatch('a/z.js', '*.js'));
      assert(pm.isMatch('a/z.js', '*/z*.js'));
      assert(pm.isMatch('a/z.js', 'a/z*.js'));
      assert(pm.isMatch('ab', '*'));
      assert(pm.isMatch('abc', '*'));
      assert(pm.isMatch('abc', '*c'));
      assert(pm.isMatch('abc', 'a*'));
      assert(pm.isMatch('abc', 'a*c'));
      assert(pm.isMatch('abc', 'abc'));
      assert(pm.isMatch('one abc two', '*abc*'));
      assert(pm.isMatch('oneabctwo', '*abc*'));
      assert(pm.isMatch('z.js', '*.js'));
      assert(pm.isMatch('z.js', 'z*.js'));
    });

    it('should support one or more stars in a path segment', () => {
      assert(!pm.isMatch('a-b.c-d', '*-bc-*'));
      assert(pm.isMatch('a-b.c-d', '*-*.*-*'));
      assert(pm.isMatch('a-b.c-d', '*-b*c-*'));
      assert(pm.isMatch('a-b.c-d', '*-b.c-*'));
      assert(pm.isMatch('a-b.c-d', '*.*'));
      assert(pm.isMatch('a-b.c-d', '*.*-*'));
      assert(pm.isMatch('a-b.c-d', '*.*-d'));
      assert(pm.isMatch('a-b.c-d', '*.c-*'));
      assert(pm.isMatch('a-b.c-d', '*b.*d'));
      assert(pm.isMatch('a-b.c-d', 'a*.c*'));
      assert(pm.isMatch('a-b.c-d', 'a-*.*-d'));
      assert(pm.isMatch('a.b', '*.*'));
      assert(pm.isMatch('a.b', '*.b'));
      assert(pm.isMatch('a.b', 'a.*'));
      assert(pm.isMatch('a.b', 'a.b'));
    });

    it('should support stars following brackets', () => {
      assert(pm.isMatch('a', '[a]*'));
      assert(pm.isMatch('aa', '[a]*'));
      assert(pm.isMatch('aaa', '[a]*'));
      assert(pm.isMatch('az', '[a-z]*'));
      assert(pm.isMatch('zzz', '[a-z]*'));
    });

    it('should support stars following parens', () => {
      assert(pm.isMatch('a', '(a)*'));
      assert(pm.isMatch('ab', '(a|b)*'));
      assert(pm.isMatch('aa', '(a)*'));
      assert(pm.isMatch('aaab', '(a|b)*'));
      assert(pm.isMatch('aaabbb', '(a|b)*'));
    });

    it('should not match slashes with single stars', () => {
      assert(!pm.isMatch('a/b', '(a)*'));
      assert(!pm.isMatch('a/b', '[a]*'));
      assert(!pm.isMatch('a/b', 'a*'));
      assert(!pm.isMatch('a/b', '(a|b)*'));
    });

    it('should return true when one of the given patterns matches the string', () => {
      assert.deepEqual(pm('a/.b', 'a/'), []);
      assert.deepEqual(pm('a/b/c/d/e/z/c.md', 'b/c/d/e'), []);
      assert.deepEqual(pm('a/b/z/.a', 'b/z'), []);
      assert.deepEqual(pm('/ab', '*/*'), []);
      assert(!pm.isMatch('/ab', '*/*'));
      assert(pm.isMatch('.', '.'));
      assert(pm.isMatch('/ab', '/*'));
      assert(pm.isMatch('/ab', '/??'));
      assert(pm.isMatch('/ab', '/?b'));
      assert(pm.isMatch('/cd', '/*'));
      assert(pm.isMatch('a', 'a'));
      assert(pm.isMatch('a/.b', 'a/.*'));
      assert(pm.isMatch('a/b', '?/?'));
      assert(pm.isMatch('a/b/c/d/e/j/n/p/o/z/c.md', 'a/**/j/**/z/*.md'));
      assert(pm.isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md'));
      assert(pm.isMatch('a/b/c/xyz.md', 'a/b/c/*.md'));
      assert(pm.isMatch('a/b/c/xyz.md', ['foo', 'a/b/c/*.md']));
      assert(pm.isMatch('a/b/z/.a', 'a/*/z/.a'));
      assert(pm.isMatch('a/bb.bb/aa/b.b/aa/c/xyz.md', 'a/**/c/*.md'));
      assert(pm.isMatch('a/bb.bb/aa/bb/aa/c/xyz.md', 'a/**/c/*.md'));
      assert(pm.isMatch('a/bb.bb/c/xyz.md', 'a/*/c/*.md'));
      assert(pm.isMatch('a/bb/c/xyz.md', 'a/*/c/*.md'));
      assert(pm.isMatch('a/bbbb/c/xyz.md', 'a/*/c/*.md'));
      assert(pm.isMatch('aaa', ['foo', '*']));
      assert(pm.isMatch('ab', '*'));
      assert(pm.isMatch('ab', './*'));
      assert(pm.isMatch('ab', 'ab'));
      assert(pm.isMatch('ab/', './*/'));
    });

    it('should return false when the path does not match the pattern', () => {
      assert(!pm.isMatch('/ab', ['*/']));
      assert(!pm.isMatch('/ab', ['*/a']));
      assert(!pm.isMatch('/ab', ['/']));
      assert(!pm.isMatch('/ab', ['/?']));
      assert(!pm.isMatch('/ab', ['/a']));
      assert(!pm.isMatch('/ab', ['?/?']));
      assert(!pm.isMatch('/ab', ['a/*']));
      assert(!pm.isMatch('a/.b', ['a/']));
      assert(!pm.isMatch('a/b/c', ['a/*']));
      assert(!pm.isMatch('a/b/c', ['a/b']));
      assert(!pm.isMatch('a/b/c/d/e/z/c.md', ['b/c/d/e']));
      assert(!pm.isMatch('a/b/z/.a', ['b/z']));
      assert(!pm.isMatch('ab', ['*/*']));
      assert(!pm.isMatch('ab', ['/a']));
      assert(!pm.isMatch('ab', ['a']));
      assert(!pm.isMatch('ab', ['b']));
      assert(!pm.isMatch('ab', ['c']));
      assert(!pm.isMatch('abcd', ['ab']));
      assert(!pm.isMatch('abcd', ['bc']));
      assert(!pm.isMatch('abcd', ['c']));
      assert(!pm.isMatch('abcd', ['cd']));
      assert(!pm.isMatch('abcd', ['d']));
      assert(!pm.isMatch('abcd', ['f']));
      assert(!pm.isMatch('ef', ['/*']));
    });

    it('should match a path segment for each single star', () => {
      assert(!pm.isMatch('aaa', '*/*/*'));
      assert(!pm.isMatch('aaa/bb/aa/rr', '*/*/*'));
      assert(!pm.isMatch('aaa/bba/ccc', 'aaa*'));
      assert(!pm.isMatch('aaa/bba/ccc', 'aaa**'));
      assert(!pm.isMatch('aaa/bba/ccc', 'aaa/*'));
      assert(!pm.isMatch('aaa/bba/ccc', 'aaa/*ccc'));
      assert(!pm.isMatch('aaa/bba/ccc', 'aaa/*z'));
      assert(!pm.isMatch('aaa/bbb', '*/*/*'));
      assert(!pm.isMatch('ab/zzz/ejkl/hi', '*/*jk*/*i'));
      assert(pm.isMatch('aaa/bba/ccc', '*/*/*'));
      assert(pm.isMatch('aaa/bba/ccc', 'aaa/**'));
      assert(pm.isMatch('aaa/bbb', 'aaa/*'));
      assert(pm.isMatch('ab/zzz/ejkl/hi', '*/*z*/*/*i'));
      assert(pm.isMatch('abzzzejklhi', '*j*i'));
    });

    it('should regard non-exclusive double-stars as single stars', () => {
      assert(!pm.isMatch('aaa/bba/ccc', 'aaa/**ccc'));
      assert(!pm.isMatch('aaa/bba/ccc', 'aaa/**z'));
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

  describe('globstars', () => {
    it('should match globstars', () => {
      assert(pm.isMatch('a/b/c/z.js', '**/*.js'));
      assert(pm.isMatch('a/b/z.js', '**/*.js'));
      assert(pm.isMatch('a/z.js', '**/*.js'));
      assert(pm.isMatch('a/b/c/d/e/z.js', 'a/b/**/*.js'));
      assert(pm.isMatch('a/b/c/d/z.js', 'a/b/**/*.js'));
      assert(pm.isMatch('a/b/c/z.js', 'a/b/c/**/*.js'));
      assert(pm.isMatch('a/b/c/z.js', 'a/b/c**/*.js'));
      assert(pm.isMatch('a/b/c/z.js', 'a/b/**/*.js'));
      assert(pm.isMatch('a/b/z.js', 'a/b/**/*.js'));

      assert(!pm.isMatch('a/z.js', 'a/b/**/*.js'));
      assert(!pm.isMatch('z.js', 'a/b/**/*.js'));

      // micromatch/#23
      assert(!pm.isMatch('zzjs', 'z*.js'));
      assert(!pm.isMatch('zzjs', '*z.js'));

      // micromatch/#24
      assert(!pm.isMatch('a', 'a/**'));
      assert(!pm.isMatch('a/b/c/d/', 'a/b/**/f'));
      assert(pm.isMatch('a', '**'));
      assert(pm.isMatch('a', 'a{,/**}'));
      assert(pm.isMatch('a/', '**'));
      assert(pm.isMatch('a/', 'a/**'));
      assert(pm.isMatch('a/b/c/d', '**'));
      assert(pm.isMatch('a/b/c/d/', '**'));
      assert(pm.isMatch('a/b/c/d/', '**/**'));
      assert(pm.isMatch('a/b/c/d/', '**/b/**'));
      assert(pm.isMatch('a/b/c/d/', 'a/b/**'));
      assert(pm.isMatch('a/b/c/d/', 'a/b/**/'));
      assert(pm.isMatch('a/b/c/d/', 'a/b/**/c/**/'));
      assert(pm.isMatch('a/b/c/d/', 'a/b/**/c/**/d/'));
      assert(pm.isMatch('a/b/c/d/e.f', 'a/b/**/**/*.*'));
      assert(pm.isMatch('a/b/c/d/e.f', 'a/b/**/*.*'));
      assert(pm.isMatch('a/b/c/d/e.f', 'a/b/**/c/**/d/*.*'));
      assert(pm.isMatch('a/b/c/d/e.f', 'a/b/**/d/**/*.*'));
      assert(pm.isMatch('a/b/c/d/g/e.f', 'a/b/**/d/**/*.*'));
      assert(pm.isMatch('a/b/c/d/g/g/e.f', 'a/b/**/d/**/*.*'));

      // https://github.com/jonschlinkert/micromatch/issues/15
      assert(pm.isMatch('z.js', 'z*'));
      assert(pm.isMatch('z.js', '**/z*.js'));
      assert(pm.isMatch('z.js', '**/*.js'));
      assert(pm.isMatch('foo', '**/foo'));
      assert(pm.isMatch('z.js', '**/z*')); //<= differs from issue

      assert(pm.isMatch('a/b-c/z.js', 'a/b-*/**/z.js'));
      assert(pm.isMatch('a/b-c/d/e/z.js', 'a/b-*/**/z.js'));
    });
  });

  describe('multiple patterns', () => {
    it('should return true when any of the patterns match', () => {
      assert(pm.isMatch('.', ['.', 'foo']));
      assert(pm.isMatch('a', ['a', 'foo']));
      assert(pm.isMatch('ab', ['*', 'foo', 'bar']));
      assert(pm.isMatch('ab', ['*b', 'foo', 'bar']));
      assert(pm.isMatch('ab', ['./*', 'foo', 'bar']));
      assert(pm.isMatch('ab', ['a*', 'foo', 'bar']));
      assert(pm.isMatch('ab', ['ab', 'foo']));
    });

    it('should return false when none of the patterns match', () => {
      assert(!pm.isMatch('/ab', ['/a', 'foo']));
      assert(!pm.isMatch('/ab', ['?/?', 'foo', 'bar']));
      assert(!pm.isMatch('/ab', ['a/*', 'foo', 'bar']));
      assert(!pm.isMatch('a/b/c', ['a/b', 'foo']));
      assert(!pm.isMatch('ab', ['*/*', 'foo', 'bar']));
      assert(!pm.isMatch('ab', ['/a', 'foo', 'bar']));
      assert(!pm.isMatch('ab', ['a', 'foo']));
      assert(!pm.isMatch('ab', ['b', 'foo']));
      assert(!pm.isMatch('ab', ['c', 'foo', 'bar']));
      assert(!pm.isMatch('abcd', ['ab', 'foo']));
      assert(!pm.isMatch('abcd', ['bc', 'foo']));
      assert(!pm.isMatch('abcd', ['c', 'foo']));
      assert(!pm.isMatch('abcd', ['cd', 'foo']));
      assert(!pm.isMatch('abcd', ['d', 'foo']));
      assert(!pm.isMatch('abcd', ['f', 'foo', 'bar']));
      assert(!pm.isMatch('ef', ['/*', 'foo', 'bar']));
    });
  });

  describe('file extensions', () => {
    it('should match files that contain the given extension:', () => {
      assert(!pm.isMatch('.c.md', '*.md'));
      assert(!pm.isMatch('.c.md', '.c.'));
      assert(!pm.isMatch('.c.md', '.md'));
      assert(!pm.isMatch('.md', '*.md'));
      assert(!pm.isMatch('.md', '.m'));
      assert(!pm.isMatch('a/b/c.md', '*.md'));
      assert(!pm.isMatch('a/b/c.md', '.md'));
      assert(!pm.isMatch('a/b/c.md', 'a/*.md'));
      assert(!pm.isMatch('a/b/c/c.md', '*.md'));
      assert(!pm.isMatch('a/b/c/c.md', 'c.js'));
      assert(pm.isMatch('.c.md', '.*.md'));
      assert(pm.isMatch('.md', '.md'));
      assert(pm.isMatch('a/b/c.js', 'a/**/*.*'));
      assert(pm.isMatch('a/b/c.md', '**/*.md'));
      assert(pm.isMatch('a/b/c.md', 'a/*/*.md'));
      assert(pm.isMatch('c.md', '*.md'));
    });
  });

  describe('dot files', () => {
    it('should not match dotfiles when a leading dot is not defined in a path segment', () => {
      assert(!pm.isMatch('.a', '(a)*'));
      assert(!pm.isMatch('.a', '*(a|b)'));
      assert(!pm.isMatch('.a', '*.md'));
      assert(!pm.isMatch('.a', '*[a]'));
      assert(!pm.isMatch('.a', '*[a]*'));
      assert(!pm.isMatch('.a', '*a'));
      assert(!pm.isMatch('.a', '*a*'));
      assert(!pm.isMatch('.a.md', 'a/b/c/*.md'));
      assert(!pm.isMatch('.ab', '*.*'));
      assert(!pm.isMatch('.abc', '.a'));
      assert(!pm.isMatch('.ba', '.a'));
      assert(!pm.isMatch('.c.md', '*.md'));
      assert(!pm.isMatch('.md', 'a/b/c/*.md'));
      assert(!pm.isMatch('.txt', '.md'));
      assert(!pm.isMatch('.verb.txt', '*.md'));
      assert(!pm.isMatch('a/.c.md', '*.md'));
      assert(!pm.isMatch('a/b/d/.md', 'a/b/c/*.md'));
      assert(pm.isMatch('.a', '.a'));
      assert(pm.isMatch('.ab', '.*'));
      assert(pm.isMatch('.ab', '.a*'));
      assert(pm.isMatch('.b', '.b*'));
      assert(pm.isMatch('.md', '.md'));
      assert(pm.isMatch('a/.c.md', 'a/.c.md'));
      assert(pm.isMatch('a/b/c/.xyz.md', 'a/b/c/.*.md'));
      assert(pm.isMatch('a/b/c/d.a.md', 'a/b/c/*.md'));
    });

    it('should match dotfiles when options.dot is true', () => {
      assert(!pm.isMatch('a/b/c/.xyz.md', '.*.md', { dot: true }));
      assert(pm.isMatch('.c.md', '*.md', { dot: true }));
      assert(pm.isMatch('.c.md', '.*', { dot: true }));
      assert(pm.isMatch('a/b/c/.xyz.md', '**/*.md', { dot: true }));
      assert(pm.isMatch('a/b/c/.xyz.md', '**/.*.md', { dot: true }));
      assert(pm.isMatch('a/b/c/.xyz.md', 'a/b/c/*.md', { dot: true }));
      assert(pm.isMatch('a/b/c/.xyz.md', 'a/b/c/.*.md', { dot: true }));
    });
  });

  describe('qmarks', () => {
    it('question marks should not match slashes:', () => {
      assert(!pm.isMatch('aaa/bbb', 'aaa?bbb'));
    });
  });
});
