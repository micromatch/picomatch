'use strict';

require('mocha');
var assert = require('assert');
var pm = require('./');

describe('picomatch', function() {
  describe('main export',function() {
    it('should take an array of patterns',function() {
      assert.deepEqual(pm(['foo', 'bar'], ['f*', 'b*']), ['foo', 'bar']);
    });

    it('should support negation patterns',function() {
      var fixtures = ['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'];
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
      assert.deepEqual(pm(['a', 'a/', 'a/b', 'a/b/c'], ['!a/**']), ['a', 'a/']);
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
      var fixtures = ['a', 'b', 'a/a', 'a/b', 'a/c', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a', 'x/y', 'z/z'];
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

    it('should support globstars (**)', function() {
      var fixtures = ['a', 'a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z'];
      assert.deepEqual(pm(fixtures, ['*']), ['a', 'a/']);
      assert.deepEqual(pm(fixtures, ['*/']), ['a/']);
      assert.deepEqual(pm(fixtures, ['*/*']), ['a/a', 'a/b', 'a/c', 'a/x']);
      assert.deepEqual(pm(fixtures, ['**']), fixtures);
      assert.deepEqual(pm(fixtures, ['**/a']), ['a', 'a/', 'a/a']);
      assert.deepEqual(pm(fixtures, ['a/*']), ['a/a', 'a/b', 'a/c', 'a/x']);
      assert.deepEqual(pm(fixtures, ['a/**']), ['a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(fixtures, ['a/**/*']), ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(fixtures, ['a/**/**/*']), ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(fixtures, ['a/**/**/**/*']), ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(['a/b/foo/bar/baz.qux'], 'a/b/**/bar/**/*.*'), ['a/b/foo/bar/baz.qux']);
      assert.deepEqual(pm(['a/b/bar/baz.qux'], 'a/b/**/bar/**/*.*'), ['a/b/bar/baz.qux']);
    });

    it('should work with file extensions', function() {
      var fixtures = ['a.txt', 'a/b.txt', 'a/x/y.txt', 'a/x/y/z'];
      assert.deepEqual(pm(fixtures, ['a/**/*.txt']), ['a/b.txt', 'a/x/y.txt']);
      assert.deepEqual(pm(fixtures, ['a/*.txt']), ['a/b.txt']);
      assert.deepEqual(pm(fixtures, ['a*.txt']), ['a.txt']);
      assert.deepEqual(pm(fixtures, ['*.txt']), ['a.txt']);
    });

    it('should correctly match slashes', function() {
      assert(!pm.isMatch('foo/bar', '**/'));
      assert(!pm.isMatch('foo/bar', '**/*/'));
      assert(!pm.isMatch('foo/bar', '*/*/'));
      assert(pm.isMatch('foo/bar', '**/*'));
      assert(pm.isMatch('foo/bar', '*/*'));
      assert(pm.isMatch('foo/bar/', '**/'));
      assert(pm.isMatch('foo/bar/', '**/*'));
      assert(pm.isMatch('foo/bar/', '**/*/'));
      assert(pm.isMatch('foo/bar/', '*/*'));
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
      assert.deepEqual(pm.match(['foo', '.bar', 'foo/.bar'], '**/*a*'), []);
      assert.deepEqual(pm.match(['foo', '.bar'], '*a*'), []);
      assert.deepEqual(pm.match(['foo', '.bar'], 'b*'), []);
      assert.deepEqual(pm.match(['foo', '.bar'], '*r'), []);
    });

    it('should match dotfiles when a leading dot is in the pattern',function() {
      assert.deepEqual(pm.match(['foo', '.bar', 'foo/.bar'], '**/.*a*'), ['.bar', 'foo/.bar']);
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
      assert(!pm.isMatch('a', 'a/**'));
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
      assert(pm.isMatch('z.js', '**/z*'));
      assert(pm.isMatch('z.js', '**/z*.js'));
      assert(pm.isMatch('z.js', '**/*.js'));
      assert(pm.isMatch('foo', '**/foo'));

      assert(pm.isMatch('a/b-c/z.js', 'a/b-*/**/z.js'));
      assert(pm.isMatch('a/b-c/d/e/z.js', 'a/b-*/**/z.js'));
    });

    it('should match slashes', function() {
      assert(!pm.isMatch('bar/baz/foo', '*/foo'));
      assert(!pm.isMatch('deep/foo/bar', '**/bar/*'));
      assert(!pm.isMatch('deep/foo/bar/baz/x', '*/bar/**'));
      assert(!pm.isMatch('foo', 'foo/**'));
      assert(!pm.isMatch('foo/bar', 'foo?bar'));
      assert(!pm.isMatch('foo/bar/baz', '**/bar*'));
      assert(!pm.isMatch('foo/bar/baz', '**/bar**'));
      assert(!pm.isMatch('foo/baz/bar', 'foo**bar'));
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
      assert(!pm.isMatch('a/b/z/.a', 'a/**/z/*.a'));
      assert(!pm.isMatch('a/b/z/.a', 'a/*/z/*.a'));
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

  describe('qmarks and stars', function() {
    it('should correctly handle question marks in globs', function() {
      assert.deepEqual(pm(['?', '??', '???'], '?'), ['?']);
      assert.deepEqual(pm(['?', '??', '???'], '??'), ['??']);
      assert.deepEqual(pm(['?', '??', '???'], '???'), ['???']);
      assert.deepEqual(pm(['/a/', '/a/b/', '/a/b/c/', '/a/b/c/d/'], '??'), []);
      assert.deepEqual(pm(['x/y/acb', 'acb', 'acb/', 'acb/d/e'], 'a?b'), ['acb', 'acb/']);
      assert.deepEqual(pm(['aaa', 'aac', 'abc'], 'a?c'), ['aac', 'abc']);
      assert.deepEqual(pm(['aaa', 'aac', 'abc'], 'a*?c'), ['aac', 'abc']);
      assert.deepEqual(pm(['a', 'aa', 'ab', 'ab?', 'ac', 'ac?', 'abcd', 'abbb'], 'ab?'), ['ab?']);
      assert.deepEqual(pm(['abc', 'abb', 'acc'], 'a**?c'), ['abc', 'acc']);
      assert.deepEqual(pm(['abc'], 'a*****?c'), ['abc']);
      assert.deepEqual(pm(['a', 'aa', 'abc', 'zzz', 'bbb', 'aaaa'], '*****?'), ['a', 'aa', 'abc', 'zzz', 'bbb', 'aaaa']);
      assert.deepEqual(pm(['a', 'aa', 'abc', 'zzz', 'bbb', 'aaaa'], '*****??'), ['aa', 'abc', 'zzz', 'bbb', 'aaaa']);
      assert.deepEqual(pm(['a', 'aa', 'abc', 'zzz', 'bbb', 'aaaa'], '?*****??'), ['abc', 'zzz', 'bbb', 'aaaa']);
      assert.deepEqual(pm(['abc', 'abb', 'zzz'], '?*****?c'), ['abc']);
      assert.deepEqual(pm(['abc', 'bbb', 'zzz'], '?***?****c'), ['abc']);
      assert.deepEqual(pm(['abc', 'bbb', 'zzz'], '?***?****?'), ['abc', 'bbb', 'zzz']);
      assert.deepEqual(pm(['abc'], '?***?****'), ['abc']);
      assert.deepEqual(pm(['abc'], '*******c'), ['abc']);
      assert.deepEqual(pm(['abc'], '*******?'), ['abc']);
      assert.deepEqual(pm(['abcdecdhjk'], 'a*cd**?**??k'), ['abcdecdhjk']);
      assert.deepEqual(pm(['abcdecdhjk'], 'a**?**cd**?**??k'), ['abcdecdhjk']);
      assert.deepEqual(pm(['abcdecdhjk'], 'a**?**cd**?**??k***'), ['abcdecdhjk']);
      assert.deepEqual(pm(['abcdecdhjk'], 'a**?**cd**?**??***k'), ['abcdecdhjk']);
      assert.deepEqual(pm(['abcdecdhjk'], 'a**?**cd**?**??***k**'), ['abcdecdhjk']);
      assert.deepEqual(pm(['abcdecdhjk'], 'a****c**?**??*****'), ['abcdecdhjk']);
    });

    it('should match one character per question mark', function() {
      assert.deepEqual(pm(['a/b/c.md'], 'a/?/c.md'), ['a/b/c.md']);
      assert.deepEqual(pm(['a/bb/c.md'], 'a/?/c.md'), []);
      assert.deepEqual(pm(['a/bb/c.md'], 'a/??/c.md'), ['a/bb/c.md']);
      assert.deepEqual(pm(['a/bbb/c.md'], 'a/??/c.md'), []);
      assert.deepEqual(pm(['a/bbb/c.md'], 'a/???/c.md'), ['a/bbb/c.md']);
      assert.deepEqual(pm(['a/bbbb/c.md'], 'a/????/c.md'), ['a/bbbb/c.md']);
    });

    it('should match multiple groups of question marks', function() {
      assert.deepEqual(pm(['a/bb/c/dd/e.md'], 'a/?/c/?/e.md'), []);
      assert.deepEqual(pm(['a/b/c/d/e.md'], 'a/?/c/?/e.md'), ['a/b/c/d/e.md']);
      assert.deepEqual(pm(['a/b/c/d/e.md'], 'a/?/c/???/e.md'), []);
      assert.deepEqual(pm(['a/b/c/zzz/e.md'], 'a/?/c/???/e.md'), ['a/b/c/zzz/e.md']);
    });

    it('should support regex capture groups', function() {
      assert.deepEqual(pm(['a/bb/c/dd/e.md'], 'a/**/(?:dd)/e.md'), ['a/bb/c/dd/e.md']);
      assert.deepEqual(pm(['a/b/c/d/e.md', 'a/b/c/d/f.md'], 'a/?/c/?/(?:e|f).md'), ['a/b/c/d/e.md', 'a/b/c/d/f.md']);
    });

    it('should use qmarks with other special characters', function() {
      assert.deepEqual(pm(['a/b/c/d/e.md'], 'a/?/c/?/*/e.md'), []);
      assert.deepEqual(pm(['a/b/c/d/e/e.md'], 'a/?/c/?/*/e.md'), ['a/b/c/d/e/e.md']);
      assert.deepEqual(pm(['a/b/c/d/efghijk/e.md'], 'a/?/c/?/*/e.md'), ['a/b/c/d/efghijk/e.md']);
      assert.deepEqual(pm(['a/b/c/d/efghijk/e.md'], 'a/?/**/e.md'), ['a/b/c/d/efghijk/e.md']);
      assert.deepEqual(pm(['a/bb/e.md'], 'a/?/e.md'), []);
      assert.deepEqual(pm(['a/bb/e.md'], 'a/?/**/e.md'), []);
      assert.deepEqual(pm(['a/b/c/d/efghijk/e.md'], 'a/*/?/**/e.md'), ['a/b/c/d/efghijk/e.md']);
      assert.deepEqual(pm(['a/b/c/d/efgh.ijk/e.md'], 'a/*/?/**/e.md'), ['a/b/c/d/efgh.ijk/e.md']);
      assert.deepEqual(pm(['a/b.bb/c/d/efgh.ijk/e.md'], 'a/*/?/**/e.md'), ['a/b.bb/c/d/efgh.ijk/e.md']);
      assert.deepEqual(pm(['a/bbb/c/d/efgh.ijk/e.md'], 'a/*/?/**/e.md'), ['a/bbb/c/d/efgh.ijk/e.md']);
    });

    it('question marks should not match slashes', function() {
      assert(!pm.isMatch('aaa/bbb', 'aaa?bbb'));
      assert(!pm.isMatch('aaa//bbb', 'aaa?bbb'));
      assert(!pm.isMatch('aaa\\bbb', 'aaa?bbb'));
      assert(!pm.isMatch('aaa\\\\bbb', 'aaa?bbb'));
    });

    it('question marks should match arbitrary dots', function() {
      assert(pm.isMatch('aaa.bbb', 'aaa?bbb'));
    });

    it('question marks should not match leading dots', function() {
      assert(!pm.isMatch('.aaa/bbb', '?aaa/bbb'));
      assert(!pm.isMatch('aaa/.bbb', 'aaa/?bbb'));
    });

    it('question marks should match characters preceding a dot', function() {
      assert(pm.isMatch('a/bbb/abcd.md', 'a/*/ab??.md'));
      assert(pm.isMatch('a/bbb/abcd.md', 'a/bbb/ab??.md'));
      assert(pm.isMatch('a/bbb/abcd.md', 'a/bbb/ab???md'));
    });
  });

  describe('ranges', function() {
    it('should support valid regex ranges', function() {
      var fixtures = ['a.a', 'a.b', 'a.a.a', 'c.a', 'd.a.d', 'a.bb', 'a.ccc'];
      assert.deepEqual(pm(fixtures, '[a-b].[a-b]'), ['a.a', 'a.b']);
      assert.deepEqual(pm(fixtures, '[a-d].[a-b]'), ['a.a', 'a.b', 'c.a']);
      assert.deepEqual(pm(fixtures, '[a-d]*.[a-b]'), ['a.a', 'a.b', 'a.a.a', 'c.a']);
    });

    it('should support valid regex ranges with glob negation patterns', function() {
      var fixtures = ['a.a', 'a.b', 'a.a.a', 'c.a', 'd.a.d', 'a.bb', 'a.ccc'];
      assert.deepEqual(pm(fixtures, '!*.[a-b]'), ['d.a.d', 'a.bb', 'a.ccc']);
      assert.deepEqual(pm(fixtures, '!*.[a-b]*'), ['a.ccc']);
      assert.deepEqual(pm(fixtures, '![a-b].[a-b]'), ['a.a.a', 'c.a', 'd.a.d', 'a.bb', 'a.ccc']);
      assert.deepEqual(pm(fixtures, '![a-b]+.[a-b]+'), ['a.a.a', 'c.a', 'd.a.d', 'a.ccc']);
    });

    it('should support valid regex ranges with negation patterns', function() {
      var fixtures = ['a.a', 'a.b', 'a.a.a', 'c.a', 'd.a.d', 'a.bb', 'a.ccc'];
      assert.deepEqual(pm(fixtures, '*.[^a-b]'), ['d.a.d']);
      assert.deepEqual(pm(fixtures, 'a.[^a-b]*'), ['a.ccc']);
    });
  });

  // $echo a/{1..3}/b
  describe('bash options and features', function() {
    // from the Bash 4.3 specification/unit tests
    var fixtures = ['*', '**', '\\*', 'a', 'a/*', 'abc', 'abd', 'abe', 'b', 'bb', 'bcd', 'bdir/', 'Beware', 'c', 'ca', 'cb', 'd', 'dd', 'de'];
    it('should handle "regular globbing":', function() {
      assert.deepEqual(pm(fixtures, 'a*'), ['a', 'abc', 'abd', 'abe']);
      assert.deepEqual(pm(fixtures, '\\a*'), ['a', 'abc', 'abd', 'abe']);
    });

    it('should match directories:', function() {
      assert.deepEqual(pm(fixtures, 'b*/'), ['bdir/']);
    });

    it('should use escaped characters as literals:', function() {
      assert.deepEqual(pm(fixtures, '\\^'), []);
      assert.deepEqual(pm(fixtures, 'a\\*'), []);
      assert.deepEqual(pm(fixtures, ['a\\*', '\\*']), ['*', '\\*']);
      assert.deepEqual(pm(fixtures, ['a\\*']), []);
      assert.deepEqual(pm(fixtures, ['c*', 'a\\*', '*q*']), ['c', 'ca', 'cb']);
      assert.deepEqual(pm(fixtures, '\\**'), ['*', '**']);
    });

    it('should work for quoted characters', function() {
      assert.deepEqual(pm(fixtures.concat(['"', '"a']), '"**'), ['"', '"a']);
      assert.deepEqual(pm(fixtures.concat(['"', '"a']), '\"**'), ['"', '"a']);
      assert.deepEqual(pm(fixtures.concat('"'), '\"***'), ['"']);
      assert.deepEqual(pm(fixtures.concat(['\'', '"', '"a']), '\'***'), ['\'']);
      assert.deepEqual(pm(fixtures.concat('***'), '"***"'), ['***']);
      assert.deepEqual(pm(fixtures.concat('***'), '\'***\''), ['***']);
      assert.deepEqual(pm(fixtures, '"***"'), []);
      assert.deepEqual(pm(fixtures, '"*"*'), ['*', '**']);
    });

    it('should match escaped quotes', function() {
      assert.deepEqual(pm(fixtures.concat(['"**"', '**']), '\\"**\\"'), ['"**"']);
      assert.deepEqual(pm(fixtures.concat(['foo/"**"/bar', '**']), 'foo/\\"**\\"/bar'), ['foo/"**"/bar']);
      assert.deepEqual(pm(fixtures.concat(['foo/"*"/bar', 'foo/"a"/bar', 'foo/"b"/bar', 'foo/"c"/bar', 'foo/\'*\'/bar', 'foo/\'a\'/bar', 'foo/\'b\'/bar', 'foo/\'c\'/bar']), 'foo/\\"*\\"/bar'), ['foo/"*"/bar', 'foo/"a"/bar', 'foo/"b"/bar', 'foo/"c"/bar']);
      assert.deepEqual(pm(fixtures.concat(['foo/*/bar', 'foo/"*"/bar', 'foo/"a"/bar', 'foo/"b"/bar', 'foo/"c"/bar', 'foo/\'*\'/bar', 'foo/\'a\'/bar', 'foo/\'b\'/bar', 'foo/\'c\'/bar']), 'foo/"*"/bar'), ['foo/*/bar', 'foo/"*"/bar']);
      assert.deepEqual(pm(fixtures.concat(['\'**\'', '**']), '\\\'**\\\''), ['\'**\'']);
    });

    it('Pattern from Larry Wall\'s Configure that caused bash to blow up:', function() {
      assert.deepEqual(pm(fixtures, '[a-c]b*'), ['abc', 'abd', 'abe', 'bb', 'cb']);
    });

    it('should support character classes', function() {
      var f = fixtures.slice().concat('baz', 'bzz', 'BZZ', 'beware', 'BewAre');

      assert.deepEqual(pm(f, 'a*[^c]'), ['abd', 'abe']);
      assert.deepEqual(pm(['a-b', 'aXb'], 'a[X-]b'), ['a-b', 'aXb']);
      assert.deepEqual(pm(f, '[a-y]*[^c]'), ['abd', 'abe', 'bb', 'bcd', 'bdir/', 'ca', 'cb', 'dd', 'de', 'baz', 'bzz', 'beware']);
      assert.deepEqual(pm(['a*b/ooo'], 'a\\*b/*'), ['a*b/ooo']);
      assert.deepEqual(pm(['a*b/ooo'], 'a\\*?/*'), ['a*b/ooo']);
      assert.deepEqual(pm(f, 'a[b]c'), ['abc']);
      assert.deepEqual(pm(f, 'a["b"]c'), ['abc']);
      assert.deepEqual(pm(f, 'a[\\\\b]c'), ['abc']); //<= backslash and a "b"
      assert.deepEqual(pm(f, 'a[\\b]c'), []); //<= word boundary in a character class
      assert.deepEqual(pm(f, 'a[b-d]c'), ['abc']);
      assert.deepEqual(pm(f, 'a?c'), ['abc']);
      assert.deepEqual(pm(['man/man1/bash.1'], '*/man*/bash.*'), ['man/man1/bash.1']);
      assert.deepEqual(pm(f, '[^a-c]*').sort(), ['d', 'dd', 'de', 'Beware', 'BewAre', 'BZZ', '*', '**', '\\*'].sort());
    });

    it('should support basic wildmatch (brackets) features', function() {
      assert(!pm.isMatch('aab', 'a[]-]b'));
      assert(!pm.isMatch('ten', '[ten]'));
      assert(pm.isMatch(']', ']'));
      assert(pm.isMatch('a-b', 'a[]-]b'));
      assert(pm.isMatch('a]b', 'a[]-]b'));
      assert(pm.isMatch('a]b', 'a[]]b'));
      assert(pm.isMatch('aab', 'a[\\]a\\-]b'));
      assert(pm.isMatch('ten', 't[a-g]n'));
      assert(pm.isMatch('ton', 't[!a-g]n'));
      assert(pm.isMatch('ton', 't[^a-g]n'));
    });

    it('should support Extended slash-matching features', function() {
      assert(!pm.isMatch('foo/bar', 'f[^eiu][^eiu][^eiu][^eiu][^eiu]r'));
      assert(pm.isMatch('foo/bar', 'foo[/]bar'));
      assert(pm.isMatch('foo-bar', 'f[^eiu][^eiu][^eiu][^eiu][^eiu]r'));
    });

    it('should match braces', function() {
      assert(pm.isMatch('foo{}baz', 'foo[{a,b}]+baz'));
    });

    it('should expand multiple brace patterns', function() {
      assert.deepEqual(pm.makeRe('a/{a,b}/{c,d}/e'), /^(?:(?:^|\.\/)a\/(a|b)\/(c|d)\/e)$/);
      assert.deepEqual(pm.makeRe('a{b,c}d{e,f}g'), /^(?:(?:^|\.\/)a(b|c)d(e|f)g)$/);
      assert.deepEqual(pm.makeRe('a/{x,y}/c{d,e}f.{md,txt}'), /^(?:(?:^|\.\/)a\/(x|y)\/c(d|e)f\.(md|txt))$/);
    });

    it('should match parens', function() {
      assert(pm.isMatch('foo(bar)baz', 'foo[bar()]+baz'));
    });

    it('should match escaped characters', function() {
      assert(pm.isMatch('\\', '\\'));
      assert(pm.isMatch('XXX/\\', '[A-Z]+/\\\\'));
      assert(pm.isMatch('[ab]', '\\[ab]'));
      assert(pm.isMatch('[ab]', '[\\[:]ab]'));
    });

    it('should match brackets', function() {
      assert(!pm.isMatch(']', '[!]-]'));
      assert(pm.isMatch('a', '[!]-]'));
      assert(pm.isMatch('[ab]', '[[]ab]'));
    });

    it('should consolidate extra stars:', function() {
      assert.deepEqual(pm(['bbc', 'abc', 'bbd'], 'a**c'), ['abc']);
      assert.deepEqual(pm(['bbc', 'abc', 'bbd'], 'a***c'), ['abc']);
      assert.deepEqual(pm(['bbc', 'abc', 'bbc'], 'a*****?c'), ['abc']);
      assert.deepEqual(pm(['bbc', 'abc'], '?*****??'), ['bbc', 'abc']);
      assert.deepEqual(pm(['bbc', 'abc'], '*****??'), ['bbc', 'abc']);
      assert.deepEqual(pm(['bbc', 'abc'], '?*****?c'), ['bbc', 'abc']);
      assert.deepEqual(pm(['bbc', 'abc', 'bbd'], '?***?****c'), ['bbc', 'abc']);
      assert.deepEqual(pm(['bbc', 'abc'], '?***?****?'), ['bbc', 'abc']);
      assert.deepEqual(pm(['bbc', 'abc'], '?***?****'), ['bbc', 'abc']);
      assert.deepEqual(pm(['bbc', 'abc'], '*******c'), ['bbc', 'abc']);
      assert.deepEqual(pm(['bbc', 'abc'], '*******?'), ['bbc', 'abc']);
      assert.deepEqual(pm(['abcdecdhjk'], 'a*cd**?**??k'), ['abcdecdhjk']);
      assert.deepEqual(pm(['abcdecdhjk'], 'a**?**cd**?**??k'), ['abcdecdhjk']);
      assert.deepEqual(pm(['abcdecdhjk'], 'a**?**cd**?**??k***'), ['abcdecdhjk']);
      assert.deepEqual(pm(['abcdecdhjk'], 'a**?**cd**?**??***k'), ['abcdecdhjk']);
      assert.deepEqual(pm(['abcdecdhjk'], 'a**?**cd**?**??***k**'), ['abcdecdhjk']);
      assert.deepEqual(pm(['abcdecdhjk'], 'a****c**?**??*****'), ['abcdecdhjk']);
    });

    it('none of these should output anything:', function() {
      assert.deepEqual(pm(['abc'], '??**********?****?'), []);
      assert.deepEqual(pm(['abc'], '??**********?****c'), []);
      assert.deepEqual(pm(['abc'], '?************c****?****'), []);
      assert.deepEqual(pm(['abc'], '*c*?**'), []);
      assert.deepEqual(pm(['abc'], 'a*****c*?**'), []);
      assert.deepEqual(pm(['abc'], 'a********???*******'), []);
      assert.deepEqual(pm(['a'], '[]'), []);
      assert.deepEqual(pm(['['], '[abc'), []);
    });
  });

  describe('wildmat (git)', function() {
    it('Basic wildmat features', function() {
      assert(!pm.isMatch('foo', '*f'));
      assert(!pm.isMatch('foo', '??'));
      assert(!pm.isMatch('foo', 'bar'));
      assert(!pm.isMatch('foobar', 'foo\\*bar'));
      assert(pm.isMatch('', ''));
      assert(pm.isMatch('?a?b', '\\??\\?b'));
      assert(pm.isMatch('aaaaaaabababab', '*ab'));
      assert(pm.isMatch('f\\oo', 'f\\oo'));
      assert(pm.isMatch('foo', '*'));
      assert(pm.isMatch('foo', '*foo*'));
      assert(pm.isMatch('foo', '???'));
      assert(pm.isMatch('foo', 'f*'));
      assert(pm.isMatch('foo', 'foo'));
      assert(pm.isMatch('foobar', '*ob*a*r*'));
    });

    it('should support recursion', function() {
      assert(!pm.isMatch('-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'));
      assert(!pm.isMatch('-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'));
      assert(!pm.isMatch('ab/cXd/efXg/hi', '*X*i'));
      assert(!pm.isMatch('ab/cXd/efXg/hi', '*Xg*i'));
      assert(!pm.isMatch('abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz', '**/*a*b*g*n*t'));
      assert(!pm.isMatch('foo', '*/*/*'));
      assert(!pm.isMatch('foo', 'fo'));
      assert(!pm.isMatch('foo/bar', '*/*/*'));
      assert(!pm.isMatch('foo/bar', 'foo?bar'));
      assert(!pm.isMatch('foo/bb/aa/rr', '*/*/*'));
      assert(!pm.isMatch('foo/bba/arr', 'foo*'));
      assert(!pm.isMatch('foo/bba/arr', 'foo**'));
      assert(!pm.isMatch('foo/bba/arr', 'foo/*'));
      assert(!pm.isMatch('foo/bba/arr', 'foo/**arr'));
      assert(!pm.isMatch('foo/bba/arr', 'foo/**z'));
      assert(!pm.isMatch('foo/bba/arr', 'foo/*arr'));
      assert(!pm.isMatch('foo/bba/arr', 'foo/*z'));
      assert(!pm.isMatch('XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1', 'XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*'));
      assert(pm.isMatch('-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'));
      assert(pm.isMatch('ab/cXd/efXg/hi', '**/*X*/**/*i'));
      assert(pm.isMatch('ab/cXd/efXg/hi', '*/*X*/*/*i'));
      assert(pm.isMatch('abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt', '**/*a*b*g*n*t'));
      assert(pm.isMatch('abcXdefXghi', '*X*i'));
      assert(pm.isMatch('foo', 'foo'));
      assert(pm.isMatch('foo/bar', 'foo/*'));
      assert(pm.isMatch('foo/bar', 'foo/bar'));
      assert(pm.isMatch('foo/bar', 'foo[/]bar'));
      assert(pm.isMatch('foo/bb/aa/rr', '**/**/**'));
      assert(pm.isMatch('foo/bba/arr', '*/*/*'));
      assert(pm.isMatch('foo/bba/arr', 'foo/**'));
    });
  });

  describe('globstars', function() {
    it('should support globstars (**)', function() {
      var fixtures = ['../../b', '../a', '../c', '../c/d', '.a/a', '/a', '/a/', 'a', 'a/', 'a/../a', 'a/.a', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z', 'aa/a', 'aaa/a', 'aab/a', 'ab/../ac'];

      assert.deepEqual(pm(fixtures, '/**/*'), ['/a', '/a/']);
      assert.deepEqual(pm(fixtures, '**'), ['/a', '/a/', 'a', 'a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z', 'aa/a', 'aaa/a', 'aab/a']);
      assert.deepEqual(pm(fixtures, '**/**'), ['/a', '/a/', 'a', 'a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z', 'aa/a', 'aaa/a', 'aab/a']);
      assert.deepEqual(pm(fixtures, '**/'), ['/a/', 'a/']);
      assert.deepEqual(pm(fixtures, '**/*'), ['/a', '/a/', 'a', 'a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z', 'aa/a', 'aaa/a', 'aab/a']);
      assert.deepEqual(pm(fixtures, '**/**/*'), ['/a', '/a/', 'a', 'a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z', 'aa/a', 'aaa/a', 'aab/a']);

      assert.deepEqual(pm(fixtures, '**/**/x'), ['a/x']);
      assert.deepEqual(pm(fixtures, '**/x'), ['a/x']);
      assert.deepEqual(pm(fixtures, '**/x/*'), ['a/x/y']);
      assert.deepEqual(pm(fixtures, '*/x/**'), ['a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(fixtures, '**/x/**'), ['a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(fixtures, '**/x/*/*'), ['a/x/y/z']);
      assert.deepEqual(pm(fixtures, 'a/**'), ['a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(fixtures, 'a/**/*'), ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(fixtures, 'a/**/**/*'), ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(fixtures, 'b/**'), []);

      assert(!pm.isMatch('a/b', 'a/**/'));
      assert(!pm.isMatch('a/b/.js/c.txt', '**/*'));
      assert(!pm.isMatch('a/b/c/d', 'a/**/'));
      assert(!pm.isMatch('a/bb', 'a/**/'));
      assert(!pm.isMatch('a/cb', 'a/**/'));
      assert(pm.isMatch('/a/b', '/**'));
      assert(pm.isMatch('a.b', '**/*'));
      assert(pm.isMatch('a.js', '**/*'));
      assert(pm.isMatch('a.js', '**/*.js'));
      assert(pm.isMatch('a.md', '**/*.md'));
      assert(pm.isMatch('a/', 'a/**/'));
      assert(pm.isMatch('a/a.js', '**/*.js'));
      assert(pm.isMatch('a/a/b.js', '**/*.js'));
      assert(pm.isMatch('a/b', 'a/**/b'));
      assert(pm.isMatch('a/b', 'a/**b'));
      assert(pm.isMatch('a/b.md', '**/*.md'));
      assert(pm.isMatch('a/b/c.js', '**/*'));
      assert(pm.isMatch('a/b/c.txt', '**/*'));
      assert(pm.isMatch('a/b/c/d/', 'a/**/'));
      assert(pm.isMatch('a/b/c/d/a.js', '**/*'));
      assert(pm.isMatch('a/b/c/z.js', 'a/b/**/*.js'));
      assert(pm.isMatch('a/b/z.js', 'a/b/**/*.js'));
      assert(pm.isMatch('ab', '**/*'));
      assert(pm.isMatch('ab/a/d', '**/*'));
      assert(pm.isMatch('ab/b', '**/*'));
      assert(pm.isMatch('za.js', '**/*'));
    });

    it('should support multiple globstars in one pattern', function() {
      assert(!pm.isMatch('a/b/c/d/e/z/foo.md', 'a/**/j/**/z/*.md'));
      assert(!pm.isMatch('a/b/c/j/e/z/foo.txt', 'a/**/j/**/z/*.md'));
      assert(pm.isMatch('a/b/c/d/e/j/n/p/o/z/foo.md', 'a/**/j/**/z/*.md'));
      assert(pm.isMatch('a/b/c/d/e/z/foo.md', 'a/**/z/*.md'));
      assert(pm.isMatch('a/b/c/j/e/z/foo.md', 'a/**/j/**/z/*.md'));
    });

    it('should match dotfiles', function() {
      var fixtures = ['.gitignore', 'a/b/z/.dotfile', 'a/b/z/.dotfile.js', 'a/b/z/.dotfile.txt', 'a/b/z/.dotfile.md'];
      assert(!pm.isMatch('.gitignore', 'a/**/z/*.md'));
      assert(!pm.isMatch('a/b/z/.dotfile', 'a/**/z/*.md'));
      assert(!pm.isMatch('a/b/z/.dotfile.md', '**/c/.*.md'));
      assert(pm.isMatch('a/b/z/.dotfile.md', '**/.*.md'));
      assert(pm.isMatch('a/b/z/.dotfile.md', 'a/**/z/.*.md'));
      assert.deepEqual(pm(fixtures, 'a/**/z/.*.md'), [ 'a/b/z/.dotfile.md' ]);
    });

    it('should match file extensions:', function() {
      assert.deepEqual(pm(['.md', 'a.md', 'a/b/c.md', '.txt'], '**/*.md'), ['a.md', 'a/b/c.md']);
      assert.deepEqual(pm(['.md', 'a/b/.md'], '**/.md'), ['.md', 'a/b/.md']);
    });

    it('should respect trailing slashes on paterns', function() {
      var fixtures = ['a', 'a/', 'b', 'b/', 'a/a', 'a/a/', 'a/b', 'a/b/', 'a/c', 'a/c/', 'a/x', 'a/x/', 'a/a/a', 'a/a/b', 'a/a/b/', 'a/a/a/', 'a/a/a/a', 'a/a/a/a/', 'a/a/a/a/a', 'a/a/a/a/a/', 'x/y', 'z/z', 'x/y/', 'z/z/', 'a/b/c/.d/e/'];

      assert.deepEqual(pm(fixtures, '**/*/a/'), ['a/a/', 'a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/']);
      assert.deepEqual(pm(fixtures, '**/*/a/*/'), ['a/a/b/', 'a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/']);
      assert.deepEqual(pm(fixtures, '**/*/x/'), ['a/x/']);
      assert.deepEqual(pm(fixtures, '**/*/*/*/*/'), ['a/a/a/a/', 'a/a/a/a/a/']);
      assert.deepEqual(pm(fixtures, '**/*/*/*/*/*/'), ['a/a/a/a/a/']);
      assert.deepEqual(pm(fixtures, '*a/a/*/'), ['a/a/b/', 'a/a/a/']);
      assert.deepEqual(pm(fixtures, '**a/a/*/'), ['a/a/b/', 'a/a/a/']);
      assert.deepEqual(pm(fixtures, '**/a/*/*/'), ['a/a/b/', 'a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/']);
      assert.deepEqual(pm(fixtures, '**/a/*/*/*/'), ['a/a/a/a/', 'a/a/a/a/a/']);
      assert.deepEqual(pm(fixtures, '**/a/*/*/*/*/'), ['a/a/a/a/a/']);
      assert.deepEqual(pm(fixtures, '**/a/*/a/'), ['a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/']);
      assert.deepEqual(pm(fixtures, '**/a/*/b/'), ['a/a/b/']);
    });

    it('should match slashes', function() {
      assert.deepEqual(pm(['/../c'], '/**/*'), []);
      assert.deepEqual(pm(['/', '.'], '**'), ['/']);
      assert.deepEqual(pm(['/', '.'], '**/'), ['/']);
    });

    it('should match literal globstars when escaped', function() {
      var fixtures = ['.md', '**a.md', '**.md', '.md', '**'];
      assert.deepEqual(pm(fixtures, '\\*\\**.md'), ['**a.md', '**.md']);
      assert.deepEqual(pm(fixtures, '\\*\\*.md'), ['**.md']);
    });

    // related to https://github.com/isaacs/minimatch/issues/67
    it('should work consistently with `makeRe` and matcher functions', function() {
      var re = pm.makeRe('node_modules/foobar/**/*.bar');
      assert(re.test('node_modules/foobar/foo.bar'));
      assert(pm.isMatch('node_modules/foobar/foo.bar', 'node_modules/foobar/**/*.bar'));
      assert.deepEqual(pm(['node_modules/foobar/foo.bar'], 'node_modules/foobar/**/*.bar'), ['node_modules/foobar/foo.bar']);
    });
  });

  describe('dotfiles', function() {
    describe('file name matching', function() {
      it('should not match a dot when the dot is not explicitly defined', function() {
        assert(!pm.isMatch('.dot', '*dot'));
        assert(!pm.isMatch('a/.dot', 'a/*dot'));
      });

      it('should not match leading dots with question marks', function() {
        assert(!pm.isMatch('.dot', '?dot'));
        assert(!pm.isMatch('/.dot', '/?dot'));
        assert(!pm.isMatch('a/.dot', 'a/?dot'));
      });

      it('should match with double dots', function() {
        var fixtures = ['a/../a', 'ab/../ac', '../a', 'a', '../../b', '../c', '../c/d'];
        assert.deepEqual(pm(fixtures, '../*'), ['../a', '../c']);
        assert.deepEqual(pm(fixtures, '*/../*'), ['a/../a', 'ab/../ac']);
        assert.deepEqual(pm(fixtures, '**/../*'), ['a/../a', 'ab/../ac', '../a', '../c']);
      });

      it('should not match a dot when the dot is not explicitly defined', function() {
        var fixtures = ['a/b/.x', '.x', '.x/', '.x/a', '.x/a/b', '.x/.x', 'a/.x', 'a/b/.x/c', 'a/b/.x/c/d', 'a/b/.x/c/d/e', 'a/b/.x/', 'a/.x/b', 'a/.x/b/.x/c'];
        assert.deepEqual(pm(fixtures, '**/.x/**'), ['.x/', '.x/a', '.x/a/b', 'a/b/.x/c', 'a/b/.x/c/d', 'a/b/.x/c/d/e', 'a/b/.x/', 'a/.x/b']);
      });

      it('should match a dot when the dot is explicitly defined', function() {
        // first one is from minimatch tests
        var fixtures = ['a/b/.x/c', 'a/b/.x/c/d', 'a/b/.x/c/d/e', 'a/b/.x', 'a/b/.x/', 'a/.x/b', '.x', '.x/', '.x/a', '.x/a/b', 'a/.x/b/.x/c', '.x/.x'];
        var expected = ['.x/', '.x/a', '.x/a/b', 'a/.x/b', 'a/b/.x/', 'a/b/.x/c', 'a/b/.x/c/d', 'a/b/.x/c/d/e'];

        assert.deepEqual(pm(fixtures, '**/.x/**').sort(), expected.sort());
        assert.deepEqual(pm('/.dot', '/[.]dot'), ['/.dot']);
        assert.deepEqual(pm('.dot', '[.]dot'), ['.dot']);
        assert.deepEqual(pm('.dot', '.[d]ot'), ['.dot']);
        assert.deepEqual(pm('.dot', '.dot*'), ['.dot']);
        assert.deepEqual(pm('.dot', '.d?t'), ['.dot']);

        assert(pm.isMatch('.bar.baz', '.*.*'));
        assert(!pm.isMatch('.bar.baz', '.*.*/'));
        assert(pm.isMatch('/.dot', '**/.[d]ot'));
        assert(pm.isMatch('/.dot', '**/.dot*'));
        assert(pm.isMatch('/.dot', '**/[.]dot'));
        assert(pm.isMatch('.bar.baz/', '.*.*'));
        assert(pm.isMatch('.bar.baz', '.*.*'));
        assert(pm.isMatch('.bar.baz', '.*.baz'));
        assert(pm.isMatch('.bar.baz/', '.*.*/'));
        assert(pm.isMatch('.dot', '.*ot'));
        assert(pm.isMatch('.dot', '.[d]ot'));
        assert(pm.isMatch('.dot.foo.bar', '.*ot.*.*'));
        assert(pm.isMatch('.dotfile.js', '.*.js'));
        assert(pm.isMatch('/.dot', '/.[d]ot'));
        assert(pm.isMatch('/.dot', '/.dot*'));
        assert(pm.isMatch('/.dot', '/[.]dot'));
        assert(pm.isMatch('a/.dot', '**/.[d]ot'));
        assert(pm.isMatch('a/.dot', '*/.[d]ot'));
        assert(pm.isMatch('a/.dot', '*/.dot*'));
        assert(pm.isMatch('a/b/.dot', '**/.[d]ot'));
        assert(pm.isMatch('a/b/.dot', '**/.dot*'));
        assert(pm.isMatch('a/b/.dot', '**/[.]dot'));
      });
    });

    describe('multiple directories', function() {
      it('should not match a dot when the dot is not explicitly defined', function() {
        assert(!pm.isMatch('.dot', '**/*dot'));
        assert(!pm.isMatch('.dot', '**/?dot'));
        assert(!pm.isMatch('.dot', '*/*dot'));
        assert(!pm.isMatch('.dot', '*/?dot'));
        assert(!pm.isMatch('.dot', '/*dot'));
        assert(!pm.isMatch('.dot', '/?dot'));
        assert(!pm.isMatch('/.dot', '**/*dot'));
        assert(!pm.isMatch('/.dot', '**/?dot'));
        assert(!pm.isMatch('/.dot', '*/*dot'));
        assert(!pm.isMatch('/.dot', '*/?dot'));
        assert(!pm.isMatch('/.dot', '/*dot'));
        assert(!pm.isMatch('/.dot', '/?dot'));
        assert(!pm.isMatch('a/.dot', '*/*dot'));
        assert(!pm.isMatch('a/.dot', '*/?dot'));
        assert(!pm.isMatch('a/b/.dot', '**/*dot'));
        assert(!pm.isMatch('a/b/.dot', '**/?dot'));

        // related https://github.com/jonschlinkert/micromatch/issues/63
        assert(!pm.isMatch('/aaa/bbb/.git', '/aaa/bbb/**'));
        assert(!pm.isMatch('aaa/bbb/.git', 'aaa/bbb/**'));
        assert(!pm.isMatch('/aaa/bbb/ccc/.git', '/aaa/bbb/**'));
      });
    });

    describe('options.dot', function() {
      it('should match dotfiles when `options.dot` is true', function() {
        assert(pm.isMatch('/a/b/.dot', '**/*dot', {dot: true}));
        assert(pm.isMatch('/a/b/.dot', '**/.[d]ot', {dot: true}));
        assert(pm.isMatch('/a/b/.dot', '**/?dot', {dot: true}));
        assert(pm.isMatch('.dotfile.js', '.*.js', {dot: true}));
        assert(pm.isMatch('.dot', '*dot', {dot: true}));
        assert(pm.isMatch('.dot', '?dot', {dot: true}));
        assert(pm.isMatch('/a/b/.dot', '/**/*dot', {dot: true}));
        assert(pm.isMatch('/a/b/.dot', '/**/.[d]ot', {dot: true}));
        assert(pm.isMatch('/a/b/.dot', '/**/?dot', {dot: true}));
        assert(pm.isMatch('a/b/.dot', '**/*dot', {dot: true}));
        assert(pm.isMatch('a/b/.dot', '**/.[d]ot', {dot: true}));
        assert(pm.isMatch('a/b/.dot', '**/?dot', {dot: true}));
      });

      it('should not match dotfiles when `options.dot` is false', function() {
        assert(!pm.isMatch('a/b/.dot', '**/*dot', {dot: false}));
        assert(!pm.isMatch('a/b/.dot', '**/?dot', {dot: false}));
      });

      it('should not match dotfiles when `.dot` is not defined and a dot is not in the glob pattern', function() {
        assert(!pm.isMatch('a/b/.dot', '**/*dot'));
        assert(!pm.isMatch('a/b/.dot', '**/?dot'));
      });
    });
  });
});
