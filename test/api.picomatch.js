'use strict';

require('mocha');
const assert = require('assert');
const picomatch = require('..');
const { isMatch } = picomatch;

describe('picomatch', () => {
  describe('validation', () => {
    it('should throw an error when invalid arguments are given', () => {
      assert.throws(() => isMatch('foo', ''), /Expected pattern to be a non-empty string/);
      assert.throws(() => isMatch('foo', null), /Expected pattern to be a non-empty string/);
    });
  });

  describe('multiple patterns', () => {
    it('should return true when any of the patterns match', () => {
      assert(isMatch('.', ['.', 'foo']));
      assert(isMatch('a', ['a', 'foo']));
      assert(isMatch('ab', ['*', 'foo', 'bar']));
      assert(isMatch('ab', ['*b', 'foo', 'bar']));
      assert(isMatch('ab', ['./*', 'foo', 'bar']));
      assert(isMatch('ab', ['a*', 'foo', 'bar']));
      assert(isMatch('ab', ['ab', 'foo']));
    });

    it('should return false when none of the patterns match', () => {
      assert(!isMatch('/ab', ['/a', 'foo']));
      assert(!isMatch('/ab', ['?/?', 'foo', 'bar']));
      assert(!isMatch('/ab', ['a/*', 'foo', 'bar']));
      assert(!isMatch('a/b/c', ['a/b', 'foo']));
      assert(!isMatch('ab', ['*/*', 'foo', 'bar']));
      assert(!isMatch('ab', ['/a', 'foo', 'bar']));
      assert(!isMatch('ab', ['a', 'foo']));
      assert(!isMatch('ab', ['b', 'foo']));
      assert(!isMatch('ab', ['c', 'foo', 'bar']));
      assert(!isMatch('abcd', ['ab', 'foo']));
      assert(!isMatch('abcd', ['bc', 'foo']));
      assert(!isMatch('abcd', ['c', 'foo']));
      assert(!isMatch('abcd', ['cd', 'foo']));
      assert(!isMatch('abcd', ['d', 'foo']));
      assert(!isMatch('abcd', ['f', 'foo', 'bar']));
      assert(!isMatch('ef', ['/*', 'foo', 'bar']));
    });
  });

  describe('file extensions', () => {
    it('should match files that contain the given extension:', () => {
      assert(!isMatch('.c.md', '*.md'));
      assert(!isMatch('.c.md', '.c.'));
      assert(!isMatch('.c.md', '.md'));
      assert(!isMatch('.md', '*.md'));
      assert(!isMatch('.md', '.m'));
      assert(!isMatch('a/b/c.md', '*.md'));
      assert(!isMatch('a/b/c.md', '.md'));
      assert(!isMatch('a/b/c.md', 'a/*.md'));
      assert(!isMatch('a/b/c/c.md', '*.md'));
      assert(!isMatch('a/b/c/c.md', 'c.js'));
      assert(isMatch('.c.md', '.*.md'));
      assert(isMatch('.md', '.md'));
      assert(isMatch('a/b/c.js', 'a/**/*.*'));
      assert(isMatch('a/b/c.md', '**/*.md'));
      assert(isMatch('a/b/c.md', 'a/*/*.md'));
      assert(isMatch('c.md', '*.md'));
    });
  });

  describe('dot files', () => {
    it('should not match dotfiles when a leading dot is not defined in a path segment', () => {
      assert(!isMatch('.a', '(a)*'));
      assert(!isMatch('.a', '*(a|b)'));
      assert(!isMatch('.a', '*.md'));
      assert(!isMatch('.a', '*[a]'));
      assert(!isMatch('.a', '*[a]*'));
      assert(!isMatch('.a', '*a'));
      assert(!isMatch('.a', '*a*'));
      assert(!isMatch('.a.md', 'a/b/c/*.md'));
      assert(!isMatch('.ab', '*.*'));
      assert(!isMatch('.abc', '.a'));
      assert(!isMatch('.ba', '.a'));
      assert(!isMatch('.c.md', '*.md'));
      assert(!isMatch('.md', 'a/b/c/*.md'));
      assert(!isMatch('.txt', '.md'));
      assert(!isMatch('.verb.txt', '*.md'));
      assert(!isMatch('a/.c.md', '*.md'));
      assert(!isMatch('a/b/d/.md', 'a/b/c/*.md'));
      assert(isMatch('.a', '.a'));
      assert(isMatch('.ab', '.*'));
      assert(isMatch('.ab', '.a*'));
      assert(isMatch('.b', '.b*'));
      assert(isMatch('.md', '.md'));
      assert(isMatch('a/.c.md', 'a/.c.md'));
      assert(isMatch('a/b/c/.xyz.md', 'a/b/c/.*.md'));
      assert(isMatch('a/b/c/d.a.md', 'a/b/c/*.md'));
    });

    it('should match dotfiles when options.dot is true', () => {
      assert(!isMatch('a/b/c/.xyz.md', '.*.md', { dot: true }));
      assert(isMatch('.c.md', '*.md', { dot: true }));
      assert(isMatch('.c.md', '.*', { dot: true }));
      assert(isMatch('a/b/c/.xyz.md', '**/*.md', { dot: true }));
      assert(isMatch('a/b/c/.xyz.md', '**/.*.md', { dot: true }));
      assert(isMatch('a/b/c/.xyz.md', 'a/b/c/*.md', { dot: true }));
      assert(isMatch('a/b/c/.xyz.md', 'a/b/c/.*.md', { dot: true }));
    });
  });

  describe('matching:', () => {
    it('should escape plus signs to match string literals', () => {
      assert(isMatch('a+b/src/glimini.js', 'a+b/src/*.js'));
      assert(isMatch('+b/src/glimini.js', '+b/src/*.js'));
      assert(isMatch('coffee+/src/glimini.js', 'coffee+/src/*.js'));
      assert(isMatch('coffee+/src/glimini.js', 'coffee+/src/*'));
    });

    it('should match with non-glob patterns', () => {
      assert(isMatch('.', '.'));
      assert(isMatch('/a', '/a'));
      assert(!isMatch('/ab', '/a'));
      assert(isMatch('a', 'a'));
      assert(!isMatch('ab', '/a'));
      assert(!isMatch('ab', 'a'));
      assert(isMatch('ab', 'ab'));
      assert(!isMatch('abcd', 'cd'));
      assert(!isMatch('abcd', 'bc'));
      assert(!isMatch('abcd', 'ab'));
    });

    it('should match file names', () => {
      assert(isMatch('a.b', 'a.b'));
      assert(isMatch('a.b', '*.b'));
      assert(isMatch('a.b', 'a.*'));
      assert(isMatch('a.b', '*.*'));
      assert(isMatch('a-b.c-d', 'a*.c*'));
      assert(isMatch('a-b.c-d', '*b.*d'));
      assert(isMatch('a-b.c-d', '*.*'));
      assert(isMatch('a-b.c-d', '*.*-*'));
      assert(isMatch('a-b.c-d', '*-*.*-*'));
      assert(isMatch('a-b.c-d', '*.c-*'));
      assert(isMatch('a-b.c-d', '*.*-d'));
      assert(isMatch('a-b.c-d', 'a-*.*-d'));
      assert(isMatch('a-b.c-d', '*-b.c-*'));
      assert(isMatch('a-b.c-d', '*-b*c-*'));
      assert(!isMatch('a-b.c-d', '*-bc-*'));
    });

    it('should match with copmon glob patterns', () => {
      assert(!isMatch('/ab', './*/'));
      assert(!isMatch('/ef', '*'));
      assert(!isMatch('ab', './*/'));
      assert(!isMatch('ef', '/*'));
      assert(isMatch('/ab', '/*'));
      assert(isMatch('/cd', '/*'));
      assert(isMatch('ab', '*'));
      assert(isMatch('ab', './*'));
      assert(isMatch('ab', 'ab'));
      assert(isMatch('ab/', './*/'));
    });

    it('should match files with the given extension', () => {
      assert(!isMatch('.md', '*.md'));
      assert(isMatch('.md', '.md'));
      assert(!isMatch('.c.md', '*.md'));
      assert(isMatch('.c.md', '.*.md'));
      assert(isMatch('c.md', '*.md'));
      assert(isMatch('c.md', '*.md'));
      assert(!isMatch('a/b/c/c.md', '*.md'));
      assert(!isMatch('a/b/c.md', 'a/*.md'));
      assert(isMatch('a/b/c.md', 'a/*/*.md'));
      assert(isMatch('a/b/c.md', '**/*.md'));
      assert(isMatch('a/b/c.js', 'a/**/*.*'));
    });

    it('should match wildcards', () => {
      assert(!isMatch('a/b/c/z.js', '*.js'));
      assert(!isMatch('a/b/z.js', '*.js'));
      assert(!isMatch('a/z.js', '*.js'));
      assert(isMatch('z.js', '*.js'));

      assert(isMatch('z.js', 'z*.js'));
      assert(isMatch('a/z.js', 'a/z*.js'));
      assert(isMatch('a/z.js', '*/z*.js'));
    });

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

      // https://github.com/micromatch/micromatch/issues/15
      assert(isMatch('z.js', 'z*'));
      assert(isMatch('z.js', '**/z*'));
      assert(isMatch('z.js', '**/z*.js'));
      assert(isMatch('z.js', '**/*.js'));
      assert(isMatch('foo', '**/foo'));
    });

    it('issue #23', () => {
      assert(!isMatch('zzjs', 'z*.js'));
      assert(!isMatch('zzjs', '*z.js'));
    });

    it('issue #24', () => {
      assert(!isMatch('a/b/c/d/', 'a/b/**/f'));
      assert(isMatch('a', 'a/**'));
      assert(isMatch('a', '**'));
      assert(isMatch('a/', '**'));
      assert(isMatch('a/b-c/d/e/z.js', 'a/b-*/**/z.js'));
      assert(isMatch('a/b-c/z.js', 'a/b-*/**/z.js'));
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
    });

    it('should match slashes', () => {
      assert(!isMatch('bar/baz/foo', '*/foo'));
      assert(!isMatch('deep/foo/bar', '**/bar/*'));
      assert(!isMatch('deep/foo/bar/baz/x', '*/bar/**'));
      assert(!isMatch('foo/bar', 'foo?bar'));
      assert(!isMatch('foo/bar/baz', '**/bar*'));
      assert(!isMatch('foo/bar/baz', '**/bar**'));
      assert(!isMatch('foo/baz/bar', 'foo**bar'));
      assert(!isMatch('foo/baz/bar', 'foo*bar'));
      assert(!isMatch('deep/foo/bar/baz', '**/bar/*/'));
      assert(!isMatch('deep/foo/bar/baz/', '**/bar/*', { strictSlashes: true }));
      assert(isMatch('deep/foo/bar/baz/', '**/bar/*'));
      assert(isMatch('foo', 'foo/**'));
      assert(isMatch('deep/foo/bar/baz/', '**/bar/*{,/}'));
      assert(isMatch('a/b/j/c/z/x.md', 'a/**/j/**/z/*.md'));
      assert(isMatch('a/j/z/x.md', 'a/**/j/**/z/*.md'));
      assert(isMatch('bar/baz/foo', '**/foo'));
      assert(isMatch('deep/foo/bar/', '**/bar/**'));
      assert(isMatch('deep/foo/bar/baz', '**/bar/*'));
      assert(isMatch('deep/foo/bar/baz/', '**/bar/*/'));
      assert(isMatch('deep/foo/bar/baz/', '**/bar/**'));
      assert(isMatch('deep/foo/bar/baz/x', '**/bar/*/*'));
      assert(isMatch('foo/b/a/z/bar', 'foo/**/**/bar'));
      assert(isMatch('foo/b/a/z/bar', 'foo/**/bar'));
      assert(isMatch('foo/bar', 'foo/**/**/bar'));
      assert(isMatch('foo/bar', 'foo/**/bar'));
      assert(isMatch('foo/bar', 'foo[/]bar'));
      assert(isMatch('foo/bar/baz/x', '*/bar/**'));
      assert(isMatch('foo/baz/bar', 'foo/**/**/bar'));
      assert(isMatch('foo/baz/bar', 'foo/**/bar'));
      assert(isMatch('foobazbar', 'foo**bar'));
      assert(isMatch('XXX/foo', '**/foo'));

      // https://github.com/micromatch/micromatch/issues/89
      assert(isMatch('foo//baz.md', 'foo//baz.md'));
      assert(isMatch('foo//baz.md', 'foo//*baz.md'));
      assert(isMatch('foo//baz.md', 'foo{/,//}baz.md'));
      assert(isMatch('foo/baz.md', 'foo{/,//}baz.md'));
      assert(!isMatch('foo//baz.md', 'foo/+baz.md'));
      assert(!isMatch('foo//baz.md', 'foo//+baz.md'));
      assert(!isMatch('foo//baz.md', 'foo/baz.md'));
      assert(!isMatch('foo/baz.md', 'foo//baz.md'));
    });

    it('question marks should not match slashes', () => {
      assert(!isMatch('aaa/bbb', 'aaa?bbb'));
    });

    it('should not match dotfiles when `dot` or `dotfiles` are not set', () => {
      assert(!isMatch('.c.md', '*.md'));
      assert(!isMatch('a/.c.md', '*.md'));
      assert(isMatch('a/.c.md', 'a/.c.md'));
      assert(!isMatch('.a', '*.md'));
      assert(!isMatch('.verb.txt', '*.md'));
      assert(isMatch('a/b/c/.xyz.md', 'a/b/c/.*.md'));
      assert(isMatch('.md', '.md'));
      assert(!isMatch('.txt', '.md'));
      assert(isMatch('.md', '.md'));
      assert(isMatch('.a', '.a'));
      assert(isMatch('.b', '.b*'));
      assert(isMatch('.ab', '.a*'));
      assert(isMatch('.ab', '.*'));
      assert(!isMatch('.ab', '*.*'));
      assert(!isMatch('.md', 'a/b/c/*.md'));
      assert(!isMatch('.a.md', 'a/b/c/*.md'));
      assert(isMatch('a/b/c/d.a.md', 'a/b/c/*.md'));
      assert(!isMatch('a/b/d/.md', 'a/b/c/*.md'));
    });

    it('should match dotfiles when `dot` or `dotfiles` is set', () => {
      assert(isMatch('.c.md', '*.md', { dot: true }));
      assert(isMatch('.c.md', '.*', { dot: true }));
      assert(isMatch('a/b/c/.xyz.md', 'a/b/c/*.md', { dot: true }));
      assert(isMatch('a/b/c/.xyz.md', 'a/b/c/.*.md', { dot: true }));
    });
  });
});
