'use strict';

require('mocha');
const assert = require('assert');
const pm = require('.');

describe('picomatch', function() {
  describe('main export',function() {
    it('should take an array of patterns',function() {
      assert.deepEqual(pm(['foo', 'bar'], ['f*', 'b*']), ['foo', 'bar']);
    });

    it('should support negation patterns',function() {
      const fixtures = ['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'];
      assert.deepEqual(pm(['foo', 'bar', 'fab'], ['!*a*']), ['foo']);
      assert.deepEqual(pm(['foo', 'bar', 'fab'], ['!f*b']), ['foo', 'bar']);
      assert.deepEqual(pm(['foo', 'bar', 'fab'], ['f*', '!f*b']), ['foo']);
      assert.deepEqual(pm(fixtures, '!(*/b)'), ['a/a', 'a/c', 'b/a', 'b/c']);
      assert.deepEqual(pm(fixtures, '!(a/b)'), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, '!*/b'), ['a/a', 'a/c', 'b/a', 'b/c']);
      assert.deepEqual(pm(fixtures, '!a/(*)'), ['b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, '!a/(b)'), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, '!a/*'), ['b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, '!a/b'), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, ['!(a/b)']), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, ['!a/(b)']), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, ['!a/*', '*/*']), ['b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, ['!a/*']), ['b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, ['!a/b', '!*/c']), ['a/a', 'b/a', 'b/b']);
      assert.deepEqual(pm(fixtures, ['!a/b', '!a/c']), ['a/a', 'b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, ['!a/b']), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, ['*/*', '!a/*']), ['b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, ['*/*', '!a/b', '!*/c']), ['a/a', 'b/a', 'b/b']);
      assert.deepEqual(pm(fixtures.concat('a'), '!*'), ['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures.concat('a'), '!*/*'), ['a']);
    });

    it('should support negation with nested directories',function() {
      assert.deepEqual(pm(['a', 'a/', 'a/b', 'a/b/c', 'b', 'b/c'], ['!a/**']), ['b', 'b/c']);
      assert.deepEqual(pm(['a/a', 'a/b', 'a/b/c', 'a/c'], 'a/!(b*)'), ['a/a', 'a/c']);
      assert.deepEqual(pm(['a/a', 'a/b', 'a/b/c', 'a/c'], 'a/!(b*)/**'), ['a/a', 'a/c']);
      assert.deepEqual(pm(['foo', 'bar', 'fab'], ['!f*b']), ['foo', 'bar']);
      assert.deepEqual(pm(['foo', 'bar', 'fab'], ['f*', '!f*b']), ['foo']);
    });

    it('should return an array of matches for a literal string', function() {
      assert.deepEqual(pm(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], '(a/b)'), ['a/b']);
      assert.deepEqual(pm(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], 'a/b'), ['a/b']);
    });

    it('should return an array of matches for an array of literal strings', function() {
      assert.deepEqual(pm(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], ['(a/b)', 'a/c']), ['a/b', 'a/c']);
      assert.deepEqual(pm(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], ['a/b', 'b/b']), ['a/b', 'b/b']);
    });

    it('should support regex logical or', function() {
      assert.deepEqual(pm(['a/a', 'a/b', 'a/c'], ['a/(a|c)']), ['a/a', 'a/c']);
      assert.deepEqual(pm(['a/a', 'a/b', 'a/c'], ['a/(a|b|c)', 'a/b']), ['a/a', 'a/b', 'a/c', 'a/b']);
    });

    it('should support regex ranges', function() {
      assert.deepEqual(pm(['a/a', 'a/b', 'a/c'], 'a/[b-c]'), ['a/b', 'a/c']);
      assert.deepEqual(pm(['a/a', 'a/b', 'a/c', 'a/x/y', 'a/x'], 'a/[a-z]'), ['a/a', 'a/b', 'a/c', 'a/x']);
    });

    it('should support single globs (*)', function() {
      const fixtures = ['a', 'b', 'a/a', 'a/b', 'a/c', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a', 'x/y', 'z/z'];
      assert.deepEqual(pm(fixtures, ['*']), ['a', 'b']);
      assert.deepEqual(pm(fixtures, ['*/*']), ['a/a', 'a/b', 'a/c', 'a/x', 'x/y', 'z/z']);
      assert.deepEqual(pm(fixtures, ['*/*/*']), ['a/a/a', 'a/a/b']);
      assert.deepEqual(pm(fixtures, ['*/*/*/*']), ['a/a/a/a']);
      assert.deepEqual(pm(fixtures, ['*/*/*/*/*']), ['a/a/a/a/a']);
      assert.deepEqual(pm(fixtures, ['a/*']), ['a/a', 'a/b', 'a/c', 'a/x']);
      assert.deepEqual(pm(fixtures, ['a/*/*']), ['a/a/a', 'a/a/b']);
      assert.deepEqual(pm(fixtures, ['a/*/*/*']), ['a/a/a/a']);
      assert.deepEqual(pm(fixtures, ['a/*/*/*/*']), ['a/a/a/a/a']);
      assert.deepEqual(pm(fixtures, ['a/*/a']), ['a/a/a']);
      assert.deepEqual(pm(fixtures, ['a/*/b']), ['a/a/b']);
    });

    it('should optionally match a trailing slash when single star is last char', function() {
      const fixtures = ['a', 'a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z'];
      assert.deepEqual(pm(fixtures, ['*']), ['a']);
      assert.deepEqual(pm(fixtures, ['*/']), ['a/']);
      assert.deepEqual(pm(fixtures, ['*/*']), ['a/', 'a/a', 'a/b', 'a/c', 'a/x']);
      assert.deepEqual(pm(fixtures, ['a/*']), ['a/', 'a/a', 'a/b', 'a/c', 'a/x']);
    });

    it('should support globstars (**)', function() {
      const fixtures = ['a', 'a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z'];
      assert.deepEqual(pm(fixtures, ['**']), fixtures);
      assert.deepEqual(pm(fixtures, ['**/a']), ['a', 'a/', 'a/a']);
      assert.deepEqual(pm(fixtures, ['a/**']), ['a', 'a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(fixtures, ['a/**/*']), ['a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(fixtures, ['a/**/**/*']), ['a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(fixtures, ['a/**/**/**/*']), ['a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(['a/b/foo/bar/baz.qux'], 'a/b/**/bar/**/*.*'), ['a/b/foo/bar/baz.qux']);
      assert.deepEqual(pm(['a/b/bar/baz.qux'], 'a/b/**/bar/**/*.*'), ['a/b/bar/baz.qux']);
    });

    it('should work with file extensions', function() {
      const fixtures = ['a.txt', 'a/b.txt', 'a/x/y.txt', 'a/x/y/z'];
      assert.deepEqual(pm(fixtures, ['a/**/*.txt']), ['a.txt', 'a/b.txt', 'a/x/y.txt']);
      assert.deepEqual(pm(fixtures, ['a/*.txt']), ['a/b.txt']);
      assert.deepEqual(pm(fixtures, ['a*.txt']), ['a.txt']);
      assert.deepEqual(pm(fixtures, ['*.txt']), ['a.txt']);
    });

    it('should correctly match slashes', function() {
      assert(!pm.isMatch('foo/bar', '**/'));
      assert(!pm.isMatch('foo/bar', '**/*/'));
      assert(!pm.isMatch('foo/bar', '*/*/'));
      assert(!pm.isMatch('foo/bar/', '*/*'));
      assert(pm.isMatch('foo', '*/**'));
      assert(pm.isMatch('foo/', '*/**'));
      assert(pm.isMatch('foo/bar', '*/**'));
      assert(pm.isMatch('foo/bar/', '*/**'));
      assert(pm.isMatch('foo/bar', '**/*'));
      assert(pm.isMatch('foo/bar', '*/*'));
      assert(pm.isMatch('foo/bar/', '**/'));
      assert(pm.isMatch('foo/bar/', '**/*'));
      assert(pm.isMatch('foo/bar/', '**/*/'));
      assert(pm.isMatch('foo/bar/', '*/*/'));
    });

    it('should match regex character classes', function() {
      assert(pm.isMatch('foo/bar', '**/[a-k]*'));
      assert(pm.isMatch('foo/jar', '**/[a-k]*'));
      assert(!pm.isMatch('foo/jar', '**/[a-i]*'));
      assert(!pm.isMatch('foo/jar', '**/[a-i]ar'));
    });

    it('should match literal brackets', function() {
      assert.deepEqual(pm(['a [b]'], 'a \\[b\\]'), ['a [b]']);
      assert.deepEqual(pm(['a [b] c'], 'a [b] c'), ['a [b] c']);
      assert.deepEqual(pm(['a [b]'], 'a \\[b\\]*'), ['a [b]']);
      assert.deepEqual(pm(['a [bc]'], 'a \\[bc\\]*'), ['a [bc]']);
      assert.deepEqual(pm(['a [b]', 'a [b].js'], 'a \\[b\\].*'), ['a [b].js']);
    });
  });

  describe('.match()',function() {
    it('should match a string literally',function() {
      assert.deepEqual(pm.match(['foo', 'bar'], 'foo'), ['foo']);
    });

    it('should match using wildcards',function() {
      assert.deepEqual(pm.match(['foo', 'bar'], '*a*'), ['bar']);
      assert.deepEqual(pm.match(['foo', 'bar'], 'b*'), ['bar']);
      assert.deepEqual(pm.match(['foo', 'bar'], '*r'), ['bar']);
    });

    it('should not match dotfiles by default',function() {
      assert.deepEqual(pm.match(['foo', '.bar', 'foo/bar', 'foo/.bar'], '**/*'), ['foo/bar']);
      assert.deepEqual(pm.match(['foo', '.bar', 'foo/.bar'], '**/*a*'), []);
      assert.deepEqual(pm.match(['foo', '.bar'], '*a*'), []);
      assert.deepEqual(pm.match(['foo', '.bar'], 'b*'), []);
      assert.deepEqual(pm.match(['foo', '.bar'], '*r'), []);
    });

    it('should match dotfiles when a leading dot is in the pattern',function() {
      assert.deepEqual(pm.match(['foo', '.bar', 'foo/.bar'], '**/.*a*'), ['foo/.bar']);
      assert.deepEqual(pm.match(['foo', '.bar', 'bar'], '.*a*'), ['.bar']);
      assert.deepEqual(pm.match(['foo', '.bar', 'bar'], '.b*'), ['.bar']);
      assert.deepEqual(pm.match(['foo', '.bar', 'bar'], '.*r'), ['.bar']);
    });
  });

  describe('.isMatch()',function() {
    it('should match wildcards',function() {
      assert(pm.isMatch('abc', '*'));
      assert(pm.isMatch('abc', 'a*'));
      assert(pm.isMatch('abc', '*c'));
      assert(pm.isMatch('abc', 'a*c'));
      assert(pm.isMatch('abc', 'abc'));
      assert(pm.isMatch('oneabctwo', '*abc*'));
      assert(pm.isMatch('one abc two', '*abc*'));
      assert(!pm.isMatch('abc', ''));
    });

    it('should support escaped characters',function() {
      assert(!pm.isMatch('abc', 'abc\\*'));
      assert(pm.isMatch('abc*', 'abc\\*'));
    });

    it('should support negation',function() {
      assert(pm.isMatch('abc', '!xyz'));
      assert(pm.isMatch('abc', '!*foo'));
      assert(pm.isMatch('abc', '!foo*'));
      assert(!pm.isMatch('abc', '!abc'));
      assert(!pm.isMatch('abc', '!*'));
    });
  });

  describe('negation', function() {
    it('should negate files with extensions:', function() {
      assert.deepEqual(pm(['.md'], '!.md'), []);
      assert.deepEqual(pm(['a.js', 'b.md', 'c.txt'], '!**/*.md'), ['a.js', 'c.txt']);
      assert.deepEqual(pm(['a.js', 'b.md', 'c.txt'], '!*.md'), ['a.js', 'c.txt']);
      assert.deepEqual(pm(['abc.md', 'abc.txt'], '!*.md'), ['abc.txt']);
      assert.deepEqual(pm(['foo.md'], '!*.md'), []);
      assert.deepEqual(pm(['foo.md'], '!.md'), ['foo.md']);
    });

    it('should only treat leading exclamation as special', function() {
      assert.deepEqual(pm(['foo!.md', 'bar.md'], 'foo!.md'), ['foo!.md']);
      assert.deepEqual(pm(['foo!.md', 'bar.md'], '*.md'), ['foo!.md', 'bar.md']);
      assert.deepEqual(pm(['foo!.md', 'bar.md'], '*!.md'), ['foo!.md']);
      assert.deepEqual(pm(['foobar.md'], '*b*.md'), ['foobar.md']);
      assert.deepEqual(pm(['foo!bar.md', 'foo!.md', '!foo!.md'], '*!*.md'), ['foo!bar.md', 'foo!.md', '!foo!.md']);
      assert.deepEqual(pm(['foo!bar.md', 'foo!.md', '!foo!.md'], '\\!*!*.md'), ['!foo!.md']);
      assert.deepEqual(pm(['foo!.md', 'ba!r.js'], '**/*!*.*'), ['foo!.md', 'ba!r.js']);
    });

    it('should support negated globs ("*")', function() {
      assert.deepEqual(pm(['a.js', 'b.txt', 'c.md'], '!*.md'), ['a.js', 'b.txt']);
      assert.deepEqual(pm(['a/a/a.js', 'a/b/a.js', 'a/c/a.js'], '!a/*/a.js'), []);
      assert.deepEqual(pm(['a/a/a/a.js', 'b/a/b/a.js', 'c/a/c/a.js'], '!a/*/*/a.js'), ['b/a/b/a.js', 'c/a/c/a.js']);
      assert.deepEqual(pm(['a/a.txt', 'a/b.txt', 'a/c.txt'], '!a/a*.txt'), ['a/b.txt', 'a/c.txt']);
      assert.deepEqual(pm(['a.a.txt', 'a.b.txt', 'a.c.txt'], '!a.a*.txt'), ['a.b.txt', 'a.c.txt']);
      assert.deepEqual(pm(['a/a.txt', 'a/b.txt', 'a/c.txt'], '!a/*.txt'), []);
    });

    it('should support negated globstars ("**")', function() {
      assert.deepEqual(pm(['a.js', 'b.txt', 'c.md'], '!*.md'), ['a.js', 'b.txt']);
      assert.deepEqual(pm(['a/a/a.js', 'a/b/a.js', 'a/c/a.js', 'a/a/b.js'], '!**/a.js'), ['a/a/b.js']);
      assert.deepEqual(pm(['a/a/a/a.js', 'b/a/b/a.js', 'c/a/c/a.js'], '!a/**/a.js'), ['b/a/b/a.js', 'c/a/c/a.js']);
      assert.deepEqual(pm(['a/a.txt', 'a/b.txt', 'a/c.txt'], '!a/b.txt'), ['a/a.txt', 'a/c.txt']);
      assert.deepEqual(pm(['a/b.js', 'a.js', 'a/b.md', 'a.md'], '!**/*.md'), ['a/b.js', 'a.js']);
      assert.deepEqual(pm(['a/b.js', 'a.js', 'a/b.md', 'a.md'], '**/*.md'), ['a/b.md', 'a.md']);

      assert.deepEqual(pm(['a/b.js'], '!**/*.md'), ['a/b.js']);
      assert.deepEqual(pm(['a.js'], '!**/*.md'), ['a.js']);
      assert.deepEqual(pm(['a/b.md'], '!**/*.md'), []);
      assert.deepEqual(pm(['a.md'], '!**/*.md'), []);

      assert.deepEqual(pm(['a/b.js'], '!*.md'), ['a/b.js']);
      assert.deepEqual(pm(['a.js'], '!*.md'), ['a.js']);
      assert.deepEqual(pm(['a/b.md'], '!*.md'), ['a/b.md']);
      assert.deepEqual(pm(['a.md'], '!*.md'), []);

      assert.deepEqual(pm(['a.js'], '!**/*.md'), ['a.js']);
      assert.deepEqual(pm(['b.md'], '!**/*.md'), []);
      assert.deepEqual(pm(['c.txt'], '!**/*.md'), ['c.txt']);
    });

    it('should negate dotfiles:', function() {
      assert.deepEqual(pm(['.dotfile.md'], '!*.md'), []);
      assert.deepEqual(pm(['.dotfile.md'], '!.*.md'), []);
      assert.deepEqual(pm(['.dotfile.txt'], '!*.md'), ['.dotfile.txt']);
      assert.deepEqual(pm(['.dotfile.txt', 'a/b/.dotfile'], '!*.md'), ['.dotfile.txt', 'a/b/.dotfile']);
      assert.deepEqual(pm(['.gitignore', 'a', 'b'], '!.gitignore'), ['a', 'b']);
    });

    it('should negate files in the immediate directory:', function() {
      assert.deepEqual(pm(['a/b.js', 'a.js', 'a/b.md', 'a.md'], '!*.md'), ['a/b.js', 'a.js', 'a/b.md']);
    });

    it('should not give special meaning to non-leading exclamations', function() {
      assert.deepEqual(pm(['a', 'aa', 'a/b', 'a!b', 'a!!b', 'a/!!/b'], 'a!!b'), ['a!!b']);
    });

    it('should negate files in any directory:', function() {
      assert.deepEqual(pm(['a/a.txt', 'a/b.txt', 'a/c.txt'], '!a/b.txt'), ['a/a.txt', 'a/c.txt']);
    });
  });

  describe('isMatch:', function() {
    it('should escape plus signs to match string literals', function() {
      assert(pm.isMatch('a+b/src/glimini.js', 'a+b/src/*.js'));
      assert(pm.isMatch('+b/src/glimini.js', '+b/src/*.js'));
      assert(pm.isMatch('coffee+/src/glimini.js', 'coffee+/src/*.js'));
      assert(pm.isMatch('coffee+/src/glimini.js', 'coffee+/src/*.js'));
      assert(pm.isMatch('coffee+/src/glimini.js', 'coffee+/src/*'));
    });

    it('should not escape plus signs that follow brackets', function() {
      assert(pm.isMatch('a', '[a]+'));
      assert(pm.isMatch('aa', '[a]+'));
      assert(pm.isMatch('aaa', '[a]+'));
      assert(pm.isMatch('az', '[a-z]+'));
      assert(pm.isMatch('zzz', '[a-z]+'));
    });

    it('should support stars following brackets', function() {
      assert(pm.isMatch('a', '[a]*'));
      assert(pm.isMatch('aa', '[a]*'));
      assert(pm.isMatch('aaa', '[a]*'));
      assert(pm.isMatch('az', '[a-z]*'));
      assert(pm.isMatch('zzz', '[a-z]*'));
    });

    it('should not escape plus signs that follow parens', function() {
      assert(pm.isMatch('a', '(a)+'));
      assert(pm.isMatch('ab', '(a|b)+'));
      assert(pm.isMatch('aa', '(a)+'));
      assert(pm.isMatch('aaab', '(a|b)+'));
      assert(pm.isMatch('aaabbb', '(a|b)+'));
    });

    it('should support stars following parens', function() {
      assert(pm.isMatch('a', '(a)*'));
      assert(pm.isMatch('ab', '(a|b)*'));
      assert(pm.isMatch('aa', '(a)*'));
      assert(pm.isMatch('aaab', '(a|b)*'));
      assert(pm.isMatch('aaabbb', '(a|b)*'));
    });

    it('should not match slashes with single stars', function() {
      assert(!pm.isMatch('a/b', '(a)*'));
      assert(!pm.isMatch('a/b', '[a]*'));
      assert(!pm.isMatch('a/b', 'a*'));
      assert(!pm.isMatch('a/b', '(a|b)*'));
    });

    it('should not match dots with stars by default', function() {
      assert(!pm.isMatch('.a', '(a)*'));
      assert(!pm.isMatch('.a', '*[a]*'));
      assert(!pm.isMatch('.a', '*[a]'));
      assert(!pm.isMatch('.a', '*a*'));
      assert(!pm.isMatch('.a', '*a'));
      assert(!pm.isMatch('.a', '*(a|b)'));
    });

    it('should correctly deal with empty globs', function() {
      assert(!pm.isMatch('ab', ''));
      assert(!pm.isMatch('a', ''));
      assert(!pm.isMatch('.', ''));
    });

    it('should match with non-glob patterns', function() {
      assert(pm.isMatch('.', '.'));
      assert(pm.isMatch('/a', '/a'));
      assert(!pm.isMatch('/ab', '/a'));
      assert(pm.isMatch('a', 'a'));
      assert(!pm.isMatch('ab', '/a'));
      assert(!pm.isMatch('ab', 'a'));
      assert(pm.isMatch('ab', 'ab'));
      assert(!pm.isMatch('abcd', 'cd'));
      assert(!pm.isMatch('abcd', 'bc'));
      assert(!pm.isMatch('abcd', 'ab'));
    });

    it('should match file names', function() {
      assert(pm.isMatch('a.b', 'a.b'));
      assert(pm.isMatch('a.b', '*.b'));
      assert(pm.isMatch('a.b', 'a.*'));
      assert(pm.isMatch('a.b', '*.*'));
      assert(pm.isMatch('a-b.c-d', 'a*.c*'));
      assert(pm.isMatch('a-b.c-d', '*b.*d'));
      assert(pm.isMatch('a-b.c-d', '*.*'));
      assert(pm.isMatch('a-b.c-d', '*.*-*'));
      assert(pm.isMatch('a-b.c-d', '*-*.*-*'));
      assert(pm.isMatch('a-b.c-d', '*.c-*'));
      assert(pm.isMatch('a-b.c-d', '*.*-d'));
      assert(pm.isMatch('a-b.c-d', 'a-*.*-d'));
      assert(pm.isMatch('a-b.c-d', '*-b.c-*'));
      assert(pm.isMatch('a-b.c-d', '*-b*c-*'));

      // false
      assert(!pm.isMatch('a-b.c-d', '*-bc-*'));
    });

    it('should match with copmon glob patterns', function() {
      assert(pm.isMatch('/ab', '/*'));
      assert(pm.isMatch('/cd', '/*'));
      assert(!pm.isMatch('ef', '/*'));
      assert(pm.isMatch('ab', './*'));
      assert(pm.isMatch('ab/', './*/'));
      assert(!pm.isMatch('ab', './*/'));
      assert(pm.isMatch('ab', '*'));
      assert(pm.isMatch('ab', 'ab'));
    });

    it('should exactly match leading slash', function() {
      assert(!pm.isMatch('ef', '/*'));
      assert(pm.isMatch('/ef', '/*'));
    });

    it('should match files with the given extension', function() {
      assert(!pm.isMatch('.md', '*.md'));
      assert(pm.isMatch('.md', '.md'));
      assert(!pm.isMatch('.c.md', '*.md'));
      assert(pm.isMatch('.c.md', '.*.md'));
      assert(pm.isMatch('c.md', '*.md'));
      assert(pm.isMatch('c.md', '*.md'));
      assert(!pm.isMatch('a/b/c/c.md', '*.md'));
      assert(!pm.isMatch('a/b/c.md', 'a/*.md'));
      assert(pm.isMatch('a/b/c.md', 'a/*/*.md'));
      assert(pm.isMatch('a/b/c.md', '**/*.md'));
      assert(pm.isMatch('a/b/c.js', 'a/**/*.*'));
    });

    it('should match wildcards', function() {
      assert(!pm.isMatch('a/b/c/z.js', '*.js'));
      assert(!pm.isMatch('a/b/z.js', '*.js'));
      assert(!pm.isMatch('a/z.js', '*.js'));
      assert(pm.isMatch('z.js', '*.js'));

      assert(pm.isMatch('z.js', 'z*.js'));
      assert(pm.isMatch('a/z.js', 'a/z*.js'));
      assert(pm.isMatch('a/z.js', '*/z*.js'));
    });

    it('should match globstars', function() {
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

      // issue #23
      assert(!pm.isMatch('zzjs', 'z*.js'));
      assert(!pm.isMatch('zzjs', '*z.js'));

      // issue #24
      assert(pm.isMatch('a', '**'));
      // assert(!pm.isMatch('a', 'a/**'));
      assert(pm.isMatch('a/', '**'));
      assert(pm.isMatch('a/b/c/d', '**'));
      assert(pm.isMatch('a/b/c/d/', '**'));
      assert(pm.isMatch('a/b/c/d/', '**/**'));
      assert(pm.isMatch('a/b/c/d/', '**/b/**'));
      assert(pm.isMatch('a/b/c/d/', 'a/b/**'));
      assert(pm.isMatch('a/b/c/d/', 'a/b/**/'));
      assert(pm.isMatch('a/b/c/d/', 'a/b/**/c/**/'));
      assert(pm.isMatch('a/b/c/d/', 'a/b/**/c/**/d/'));
      assert(!pm.isMatch('a/b/c/d/', 'a/b/**/f'));
      assert(pm.isMatch('a/b/c/d/e.f', 'a/b/**/**/*.*'));
      assert(pm.isMatch('a/b/c/d/e.f', 'a/b/**/*.*'));
      assert(pm.isMatch('a/b/c/d/e.f', 'a/b/**/c/**/d/*.*'));
      assert(pm.isMatch('a/b/c/d/e.f', 'a/b/**/d/**/*.*'));
      assert(pm.isMatch('a/b/c/d/g/e.f', 'a/b/**/d/**/*.*'));
      assert(pm.isMatch('a/b/c/d/g/g/e.f', 'a/b/**/d/**/*.*'));

      // https://github.com/jonschlinkert/micromatch/issues/15
      assert(pm.isMatch('z.js', 'z*'));
      // assert(pm.isMatch('z.js', '**/z*'));
      // assert(pm.isMatch('z.js', '**/z*.js'));
      assert(pm.isMatch('z.js', '**/*.js'));
      assert(pm.isMatch('foo', '**/foo'));

      assert(pm.isMatch('a/b-c/z.js', 'a/b-*/**/z.js'));
      assert(pm.isMatch('a/b-c/d/e/z.js', 'a/b-*/**/z.js'));
    });

    it('should match slashes', function() {
      assert(!pm.isMatch('bar/baz/foo', '*/foo'));
      assert(!pm.isMatch('deep/foo/bar', '**/bar/*'));
      assert(!pm.isMatch('deep/foo/bar/baz/x', '*/bar/**'));
      // assert(!pm.isMatch('foo', 'foo/**'));
      assert(!pm.isMatch('foo/bar', 'foo?bar'));
      // assert(!pm.isMatch('foo/bar/baz', '**/bar*'));
      // assert(!pm.isMatch('foo/bar/baz', '**/bar**'));
      // assert(!pm.isMatch('foo/baz/bar', 'foo**bar'));
      assert(!pm.isMatch('foo/baz/bar', 'foo*bar'));
      assert(pm.isMatch('a/b/j/c/z/x.md', 'a/**/j/**/z/*.md'));
      assert(pm.isMatch('a/j/z/x.md', 'a/**/j/**/z/*.md'));
      assert(pm.isMatch('bar/baz/foo', '**/foo'));
      assert(pm.isMatch('deep/foo/bar/baz', '**/bar/*'));
      assert(pm.isMatch('deep/foo/bar/baz/', '**/bar/**'));
      assert(pm.isMatch('deep/foo/bar/baz/x', '**/bar/*/*'));
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

    it('question marks should not match slashes', function() {
      assert(!pm.isMatch('aaa/bbb', 'aaa?bbb'));
    });

    it('should not match dotfiles when `dot` or `dotfiles` are not set', function() {
      assert(!pm.isMatch('.c.md', '*.md'));
      assert(!pm.isMatch('a/.c.md', '*.md'));
      assert(pm.isMatch('a/.c.md', 'a/.c.md'));
      assert(!pm.isMatch('.a', '*.md'));
      assert(!pm.isMatch('.verb.txt', '*.md'));
      assert(pm.isMatch('a/b/c/.xyz.md', 'a/b/c/.*.md'));
      assert(pm.isMatch('.md', '.md'));
      assert(!pm.isMatch('.txt', '.md'));
      assert(pm.isMatch('.md', '.md'));
      assert(pm.isMatch('.a', '.a'));
      assert(pm.isMatch('.b', '.b*'));
      assert(pm.isMatch('.ab', '.a*'));
      assert(pm.isMatch('.ab', '.*'));
      assert(!pm.isMatch('.ab', '*.*'));
      assert(!pm.isMatch('.md', 'a/b/c/*.md'));
      assert(!pm.isMatch('.a.md', 'a/b/c/*.md'));
      assert(pm.isMatch('a/b/c/d.a.md', 'a/b/c/*.md'));
      assert(!pm.isMatch('a/b/d/.md', 'a/b/c/*.md'));
    });

    it('should match file paths', function() {
      assert(pm.isMatch('a/b/c/xyz.md', 'a/b/c/*.md'));
      assert(pm.isMatch('a/bb/c/xyz.md', 'a/*/c/*.md'));
      assert(pm.isMatch('a/bbbb/c/xyz.md', 'a/*/c/*.md'));
      assert(pm.isMatch('a/bb.bb/c/xyz.md', 'a/*/c/*.md'));
      assert(pm.isMatch('a/bb.bb/aa/bb/aa/c/xyz.md', 'a/**/c/*.md'));
      assert(pm.isMatch('a/bb.bb/aa/b.b/aa/c/xyz.md', 'a/**/c/*.md'));
    });

    it('should match full file paths', function() {
      assert(!pm.isMatch('a/.b', 'a/**/z/*.md'));
      assert(pm.isMatch('a/.b', 'a/.*'));
      // assert(!pm.isMatch('a/b/z/.a', 'a/**/z/*.a'));
      // assert(!pm.isMatch('a/b/z/.a', 'a/*/z/*.a'));
      assert(pm.isMatch('a/b/z/.a', 'a/*/z/.a'));
      assert(pm.isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md'));
      assert(pm.isMatch('a/b/c/d/e/j/n/p/o/z/c.md', 'a/**/j/**/z/*.md'));
      assert(!pm.isMatch('a/b/c/j/e/z/c.txt', 'a/**/j/**/z/*.md'));
    });

    it('should match paths with leading `./` when pattern has `./`', function() {
      assert(pm.isMatch('./a/b/c/d/e/j/n/p/o/z/c.md', './a/**/j/**/z/*.md'));
      assert(pm.isMatch('./a/b/c/d/e/z/c.md', './a/**/z/*.md'));
      assert(pm.isMatch('./a/b/c/j/e/z/c.md', './a/**/j/**/z/*.md'));
      assert(pm.isMatch('./a/b/z/.a', './a/**/z/.a'));
      // sanity checks
      assert(!pm.isMatch('./a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md'));
      assert(!pm.isMatch('./a/b/c/j/e/z/c.txt', './a/**/j/**/z/*.md'));
    });

    it('should match paths with leading `./`', function() {
      assert(!pm.isMatch('./.a', '*.a'));
      assert(!pm.isMatch('./.a', './*.a'));
      assert(!pm.isMatch('./.a', 'a/**/z/*.md'));
      assert(!pm.isMatch('./a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md'));
      assert(!pm.isMatch('./a/b/c/j/e/z/c.txt', './a/**/j/**/z/*.md'));
      assert(!pm.isMatch('a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md'));
      assert(pm.isMatch('./.a', './.a'));
      assert(pm.isMatch('./a/b/c.md', 'a/**/*.md'));
      assert(pm.isMatch('./a/b/c/d/e/j/n/p/o/z/c.md', './a/**/j/**/z/*.md'));
      assert(pm.isMatch('./a/b/c/d/e/z/c.md', '**/*.md'));
      assert(pm.isMatch('./a/b/c/d/e/z/c.md', './a/**/z/*.md'));
      assert(pm.isMatch('./a/b/c/d/e/z/c.md', 'a/**/z/*.md'));
      assert(pm.isMatch('./a/b/c/j/e/z/c.md', './a/**/j/**/z/*.md'));
      assert(pm.isMatch('./a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md'));
      assert(pm.isMatch('./a/b/z/.a', './a/**/z/.a'));
      assert(pm.isMatch('./a/b/z/.a', 'a/**/z/.a'));
      assert(pm.isMatch('.a', './.a'));
      assert(pm.isMatch('a/b/c.md', './a/**/*.md'));
      assert(pm.isMatch('a/b/c.md', 'a/**/*.md'));
      assert(pm.isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md'));
      assert(pm.isMatch('a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md'));
    });
  });
});
