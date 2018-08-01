'use strict';

const assert = require('assert');
const pm = require('./support');

describe('.isMatch():', function() {
  beforeEach(() => pm.clearCache());

  describe('error handling:', function() {
    it('should throw on bad args', function() {
      assert.throws(() => pm.isMatch({}), /expected a string/);
    });
  });

  describe('options.ignore:', function() {
    it('should not match ignored patterns', function() {
      assert(pm.isMatch('a+b/src/glimini.js', 'a+b/src/*.js', { ignore: ['**/f*'] }));
      assert(!pm.isMatch('a+b/src/glimini.js', 'a+b/src/*.js', { ignore: ['**/g*'] }));
      assert(pm.isMatch('+b/src/glimini.md', '+b/src/*', { ignore: ['**/*.js'] }));
      assert(!pm.isMatch('+b/src/glimini.js', '+b/src/*', { ignore: ['**/*.js'] }));
    });
  });

  describe('matching:', function() {
    it('should escape plus signs to match string literals', function() {
      assert(pm.isMatch('a+b/src/glimini.js', 'a+b/src/*.js'));
      assert(pm.isMatch('+b/src/glimini.js', '+b/src/*.js'));
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
      assert(!pm.isMatch('/ab', './*/'));
      assert(!pm.isMatch('/ef', '*'));
      assert(!pm.isMatch('ab', './*/'));
      assert(!pm.isMatch('ef', '/*'));
      assert(pm.isMatch('/ab', '/*'));
      assert(pm.isMatch('/cd', '/*'));
      assert(pm.isMatch('ab', '*'));
      assert(pm.isMatch('ab', './*'));
      assert(pm.isMatch('ab', 'ab'));
      assert(pm.isMatch('ab/', './*/'));
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

      // https://github.com/micromatch/micromatch/issues/15
      assert(pm.isMatch('z.js', 'z*'));
      assert(pm.isMatch('z.js', '**/z*'));
      assert(pm.isMatch('z.js', '**/z*.js'));
      assert(pm.isMatch('z.js', '**/*.js'));
      assert(pm.isMatch('foo', '**/foo'));
    });

    it('issue #23', function() {
      assert(!pm.isMatch('zzjs', 'z*.js'));
      assert(!pm.isMatch('zzjs', '*z.js'));
    });

    it('issue #24', function() {
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
      assert(!pm.isMatch('deep/foo/bar/baz/', '**/bar/*'));
      assert(!pm.isMatch('deep/foo/bar/baz', '**/bar/*/'));
      assert(pm.isMatch('a/b/j/c/z/x.md', 'a/**/j/**/z/*.md'));
      assert(pm.isMatch('a/j/z/x.md', 'a/**/j/**/z/*.md'));
      assert(pm.isMatch('bar/baz/foo', '**/foo'));
      assert(pm.isMatch('deep/foo/bar/', '**/bar/**'));
      assert(pm.isMatch('deep/foo/bar/baz', '**/bar/*'));
      assert(pm.isMatch('deep/foo/bar/baz/', '**/bar/*/'));
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

      // https://github.com/micromatch/micromatch/issues/89
      assert(pm.isMatch('foo//baz.md', 'foo//baz.md'));
      assert(pm.isMatch('foo//baz.md', 'foo//*baz.md'));
      assert(pm.isMatch('foo//baz.md', 'foo{/,//}baz.md'));
      assert(pm.isMatch('foo/baz.md', 'foo{/,//}baz.md'));
      assert(!pm.isMatch('foo//baz.md', 'foo/+baz.md'));
      assert(!pm.isMatch('foo//baz.md', 'foo//+baz.md'));
      assert(!pm.isMatch('foo//baz.md', 'foo/baz.md'));
      assert(!pm.isMatch('foo/baz.md', 'foo//baz.md'));
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

    it('should match dotfiles when `dot` or `dotfiles` is set', function() {
      assert(pm.isMatch('.c.md', '*.md', {dot: true}));
      assert(pm.isMatch('.c.md', '.*', {dot: true}));
      assert(pm.isMatch('a/b/c/.xyz.md', 'a/b/c/*.md', {dot: true}));
      assert(pm.isMatch('a/b/c/.xyz.md', 'a/b/c/.*.md', {dot: true}));
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

    it('should match paths with leading `./` when options.prefix is defined', function() {
      let opts = { prefix: '(?:\\.\\/)?' };
      assert(!pm.isMatch('./.a', '*.a', opts));
      assert(!pm.isMatch('./.a', './*.a', opts));
      assert(!pm.isMatch('./.a', 'a/**/z/*.md', opts));
      assert(!pm.isMatch('./a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md', opts));
      assert(!pm.isMatch('./a/b/c/j/e/z/c.txt', './a/**/j/**/z/*.md', opts));
      assert(!pm.isMatch('a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md', opts));
      assert(pm.isMatch('./.a', './.a', opts));
      assert(pm.isMatch('./a/b/c.md', 'a/**/*.md', opts));
      assert(pm.isMatch('./a/b/c/d/e/j/n/p/o/z/c.md', './a/**/j/**/z/*.md', opts));
      assert(pm.isMatch('./a/b/c/d/e/z/c.md', '**/*.md', opts));
      assert(pm.isMatch('./a/b/c/d/e/z/c.md', './a/**/z/*.md', opts));
      assert(pm.isMatch('./a/b/c/d/e/z/c.md', 'a/**/z/*.md', opts));
      assert(pm.isMatch('./a/b/c/j/e/z/c.md', './a/**/j/**/z/*.md', opts));
      assert(pm.isMatch('./a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md', opts));
      assert(pm.isMatch('./a/b/z/.a', './a/**/z/.a', opts));
      assert(pm.isMatch('./a/b/z/.a', 'a/**/z/.a', opts));
      assert(pm.isMatch('.a', './.a', opts));
      assert(pm.isMatch('a/b/c.md', './a/**/*.md', opts));
      assert(pm.isMatch('a/b/c.md', 'a/**/*.md', opts));
      assert(pm.isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md', opts));
      assert(pm.isMatch('a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md', opts));
    });
  });
});
