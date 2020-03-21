'use strict';

const assert = require('assert');
const scan = require('../lib/scan');
const base = (...args) => scan(...args).base;
const both = (...args) => {
  const { base, glob } = scan(...args);
  return [base, glob];
};

/**
 * @param {String} pattern
 * @param {String[]} parts
 */
function assertParts(pattern, parts) {
  const info = scan(pattern, { parts: true });

  assert.deepStrictEqual(info.parts, parts);
}

/**
 * Most of the unit tests in this file were from https://github.com/es128/glob-parent
 * and https://github.com/jonschlinkert/glob-base. Both libraries use a completely
 * different approach to separating the glob pattern from the "path" from picomatch,
 * and both libraries use path.dirname. Picomatch does not.
 */

describe('picomatch', () => {
  describe('.scan', () => {
    it('should get the "base" and "glob" from a pattern', () => {
      assert.deepStrictEqual(both('foo/bar'), ['foo/bar', '']);
      assert.deepStrictEqual(both('foo/@bar'), ['foo/@bar', '']);
      assert.deepStrictEqual(both('foo/@bar\\+'), ['foo/@bar\\+', '']);
      assert.deepStrictEqual(both('foo/bar+'), ['foo/bar+', '']);
      assert.deepStrictEqual(both('foo/bar*'), ['foo', 'bar*']);
    });

    it('should handle leading "./"', () => {
      assert.deepStrictEqual(scan('./foo/bar/*.js'), {
        input: './foo/bar/*.js',
        prefix: './',
        start: 2,
        base: 'foo/bar',
        glob: '*.js',
        isBrace: false,
        isBracket: false,
        isGlob: true,
        isGlobstar: false,
        isExtglob: false,
        negated: false
      });
    });

    it('should detect braces', () => {
      assert.deepStrictEqual(scan('foo/{a,b,c}/*.js', { scanToEnd: true }), {
        input: 'foo/{a,b,c}/*.js',
        prefix: '',
        start: 0,
        base: 'foo',
        glob: '{a,b,c}/*.js',
        isBrace: true,
        isBracket: false,
        isGlob: true,
        isGlobstar: false,
        isExtglob: false,
        negated: false
      });
    });

    it('should detect globstars', () => {
      assert.deepStrictEqual(scan('./foo/**/*.js', { scanToEnd: true }), {
        input: './foo/**/*.js',
        prefix: './',
        start: 2,
        base: 'foo',
        glob: '**/*.js',
        isBrace: false,
        isBracket: false,
        isGlob: true,
        isGlobstar: true,
        isExtglob: false,
        negated: false
      });
    });

    it('should detect extglobs', () => {
      assert.deepStrictEqual(scan('./foo/@(foo)/*.js'), {
        input: './foo/@(foo)/*.js',
        prefix: './',
        start: 2,
        base: 'foo',
        glob: '@(foo)/*.js',
        isBrace: false,
        isBracket: false,
        isGlob: true,
        isGlobstar: false,
        isExtglob: true,
        negated: false
      });
    });

    it('should detect extglobs and globstars', () => {
      assert.deepStrictEqual(scan('./foo/@(bar)/**/*.js', { parts: true }), {
        input: './foo/@(bar)/**/*.js',
        prefix: './',
        start: 2,
        base: 'foo',
        glob: '@(bar)/**/*.js',
        isBrace: false,
        isBracket: false,
        isGlob: true,
        isGlobstar: true,
        isExtglob: true,
        negated: false,
        slashes: [1, 5, 12, 15],
        parts: ['foo', '@(bar)', '**', '*.js']
      });
    });

    it('should handle leading "!"', () => {
      assert.deepStrictEqual(scan('!foo/bar/*.js'), {
        input: '!foo/bar/*.js',
        prefix: '!',
        start: 1,
        base: 'foo/bar',
        glob: '*.js',
        isBrace: false,
        isBracket: false,
        isGlob: true,
        isGlobstar: false,
        isExtglob: false,
        negated: true
      });
    });

    it('should handle leading "./" when negated', () => {
      assert.deepStrictEqual(scan('./!foo/bar/*.js'), {
        input: './!foo/bar/*.js',
        prefix: './!',
        start: 3,
        base: 'foo/bar',
        glob: '*.js',
        isBrace: false,
        isBracket: false,
        isGlob: true,
        isGlobstar: false,
        isExtglob: false,
        negated: true
      });

      assert.deepStrictEqual(scan('!./foo/bar/*.js'), {
        input: '!./foo/bar/*.js',
        prefix: '!./',
        start: 3,
        base: 'foo/bar',
        glob: '*.js',
        isBrace: false,
        isBracket: false,
        isGlob: true,
        isGlobstar: false,
        isExtglob: false,
        negated: true
      });
    });

    it('should recognize leading ./', () => {
      assert.strictEqual(base('./(a|b)'), '');
    });

    it('should strip glob magic to return base path', () => {
      assert.strictEqual(base('.'), '.');
      assert.strictEqual(base('.*'), '');
      assert.strictEqual(base('/.*'), '/');
      assert.strictEqual(base('/.*/'), '/');
      assert.strictEqual(base('a/.*/b'), 'a');
      assert.strictEqual(base('a*/.*/b'), '');
      assert.strictEqual(base('*/a/b/c'), '');
      assert.strictEqual(base('*'), '');
      assert.strictEqual(base('*/'), '');
      assert.strictEqual(base('*/*'), '');
      assert.strictEqual(base('*/*/'), '');
      assert.strictEqual(base('**'), '');
      assert.strictEqual(base('**/'), '');
      assert.strictEqual(base('**/*'), '');
      assert.strictEqual(base('**/*/'), '');
      assert.strictEqual(base('/*.js'), '/');
      assert.strictEqual(base('*.js'), '');
      assert.strictEqual(base('**/*.js'), '');
      assert.strictEqual(base('/root/path/to/*.js'), '/root/path/to');
      assert.strictEqual(base('[a-z]'), '');
      assert.strictEqual(base('chapter/foo [bar]/'), 'chapter');
      assert.strictEqual(base('path/!/foo'), 'path/!/foo');
      assert.strictEqual(base('path/!/foo/'), 'path/!/foo/');
      assert.strictEqual(base('path/!subdir/foo.js'), 'path/!subdir/foo.js');
      assert.strictEqual(base('path/**/*'), 'path');
      assert.strictEqual(base('path/**/subdir/foo.*'), 'path');
      assert.strictEqual(base('path/*/foo'), 'path');
      assert.strictEqual(base('path/*/foo/'), 'path');
      assert.strictEqual(base('path/+/foo'), 'path/+/foo', 'plus sign must be escaped');
      assert.strictEqual(base('path/+/foo/'), 'path/+/foo/', 'plus sign must be escaped');
      assert.strictEqual(base('path/?/foo'), 'path', 'qmarks must be escaped');
      assert.strictEqual(base('path/?/foo/'), 'path', 'qmarks must be escaped');
      assert.strictEqual(base('path/@/foo'), 'path/@/foo');
      assert.strictEqual(base('path/@/foo/'), 'path/@/foo/');
      assert.strictEqual(base('path/[a-z]'), 'path');
      assert.strictEqual(base('path/subdir/**/foo.js'), 'path/subdir');
      assert.strictEqual(base('path/to/*.js'), 'path/to');
    });

    it('should respect escaped characters', () => {
      assert.strictEqual(base('path/\\*\\*/subdir/foo.*'), 'path/\\*\\*/subdir');
      assert.strictEqual(base('path/\\[\\*\\]/subdir/foo.*'), 'path/\\[\\*\\]/subdir');
      assert.strictEqual(base('path/\\[foo bar\\]/subdir/foo.*'), 'path/\\[foo bar\\]/subdir');
      assert.strictEqual(base('path/\\[bar]/'), 'path/\\[bar]/');
      assert.strictEqual(base('path/\\[bar]'), 'path/\\[bar]');
      assert.strictEqual(base('[bar]'), '');
      assert.strictEqual(base('[bar]/'), '');
      assert.strictEqual(base('./\\[bar]'), '\\[bar]');
      assert.strictEqual(base('\\[bar]/'), '\\[bar]/');
      assert.strictEqual(base('\\[bar\\]/'), '\\[bar\\]/');
      assert.strictEqual(base('[bar\\]/'), '[bar\\]/');
      assert.strictEqual(base('path/foo \\[bar]/'), 'path/foo \\[bar]/');
      assert.strictEqual(base('\\[bar]'), '\\[bar]');
      assert.strictEqual(base('[bar\\]'), '[bar\\]');
    });

    it('should return full non-glob paths', () => {
      assert.strictEqual(base('path'), 'path');
      assert.strictEqual(base('path/foo'), 'path/foo');
      assert.strictEqual(base('path/foo/'), 'path/foo/');
      assert.strictEqual(base('path/foo/bar.js'), 'path/foo/bar.js');
    });

    it('should not return glob when noext is true', () => {
      assert.deepStrictEqual(scan('./foo/bar/*.js', { noext: true }), {
        input: './foo/bar/*.js',
        prefix: './',
        start: 2,
        base: 'foo/bar/*.js',
        glob: '',
        isBrace: false,
        isBracket: false,
        isGlob: false,
        isGlobstar: false,
        isExtglob: false,
        negated: false
      });
    });

    it('should respect nonegate opts', () => {
      assert.deepStrictEqual(scan('!foo/bar/*.js', { nonegate: true }), {
        input: '!foo/bar/*.js',
        prefix: '',
        start: 0,
        base: '!foo/bar',
        glob: '*.js',
        isBrace: false,
        isBracket: false,
        isGlob: true,
        isGlobstar: false,
        isExtglob: false,
        negated: false
      });
    });

    it('should return parts of the pattern', () => {
      // Right now it returns []
      // assertParts('', ['']);
      // assertParts('*', ['*']);
      // assertParts('.*', ['.*']);
      // assertParts('**', ['**']);
      // assertParts('foo', ['foo']);
      // assertParts('foo*', ['foo*']);
      // assertParts('/', ['', '']);
      // assertParts('/*', ['', '*']);
      // assertParts('./', ['']);
      // assertParts('{1..9}', ['{1..9}']);
      // assertParts('c!(.)z', ['c!(.)z']);
      // assertParts('(b|a).(a)', ['(b|a).(a)']);
      // assertParts('+(a|b\\[)*', ['+(a|b\\[)*']);
      // assertParts('@(a|b).md', ['@(a|b).md']);
      // assertParts('(a/b)', ['(a/b)']);
      // assertParts('(a\\b)', ['(a\\b)']);
      // assertParts('foo\\[a\\/]', ['foo\\[a\\/]']);
      // assertParts('foo[/]bar', ['foo[/]bar']);
      // assertParts('/dev\\/@(tcp|udp)\\/*\\/*', ['', '/dev\\/@(tcp|udp)\\/*\\/*']);

      // Right now it returns ['*']
      // assertParts('*/', ['*', '']);

      // Right now it returns ['!(!(bar)', 'baz)']
      // assertParts('!(!(bar)/baz)', ['!(!(bar)/baz)']);

      assertParts('./foo', ['foo']);
      assertParts('../foo', ['..', 'foo']);

      assertParts('foo/bar', ['foo', 'bar']);
      assertParts('foo/*', ['foo', '*']);
      assertParts('foo/**', ['foo', '**']);
      assertParts('foo/**/*', ['foo', '**', '*']);
      assertParts('フォルダ/**/*', ['フォルダ', '**', '*']);

      assertParts('foo/!(abc)', ['foo', '!(abc)']);
      assertParts('c/!(z)/v', ['c', '!(z)', 'v']);
      assertParts('c/@(z)/v', ['c', '@(z)', 'v']);
      assertParts('foo/(bar|baz)', ['foo', '(bar|baz)']);
      assertParts('foo/(bar|baz)*', ['foo', '(bar|baz)*']);
      assertParts('**/*(W*, *)*', ['**', '*(W*, *)*']);
      assertParts('a/**@(/x|/z)/*.md', ['a', '**@(/x|/z)', '*.md']);
      assertParts('foo/(bar|baz)/*.js', ['foo', '(bar|baz)', '*.js']);

      assertParts('XXX/*/*/12/*/*/m/*/*', ['XXX', '*', '*', '12', '*', '*', 'm', '*', '*']);
      assertParts('foo/\\"**\\"/bar', ['foo', '\\"**\\"', 'bar']);
    });
  });

  describe('.base (glob2base test patterns)', () => {
    it('should get a base name', () => {
      assert.strictEqual(base('js/*.js'), 'js');
    });

    it('should get a base name from a nested glob', () => {
      assert.strictEqual(base('js/**/test/*.js'), 'js');
    });

    it('should get a base name from a flat file', () => {
      assert.strictEqual(base('js/test/wow.js'), 'js/test/wow.js'); // differs
    });

    it('should get a base name from character class pattern', () => {
      assert.strictEqual(base('js/t[a-z]st}/*.js'), 'js');
    });

    it('should get a base name from extglob', () => {
      assert.strictEqual(base('js/t+(wo|est)/*.js'), 'js');
    });

    it('should get a base name from a path with non-exglob parens', () => {
      assert.strictEqual(base('(a|b)'), '');
      assert.strictEqual(base('foo/(a|b)'), 'foo');
      assert.strictEqual(base('/(a|b)'), '/');
      assert.strictEqual(base('a/(b c)'), 'a');
      assert.strictEqual(base('foo/(b c)/baz'), 'foo');
      assert.strictEqual(base('a/(b c)/'), 'a');
      assert.strictEqual(base('a/(b c)/d'), 'a');
      assert.strictEqual(base('a/(b c)', { noparen: true }), 'a/(b c)');
      assert.strictEqual(base('a/(b c)/', { noparen: true }), 'a/(b c)/');
      assert.strictEqual(base('a/(b c)/d', { noparen: true }), 'a/(b c)/d');
      assert.strictEqual(base('foo/(b c)/baz', { noparen: true }), 'foo/(b c)/baz');
      assert.strictEqual(base('path/(foo bar)/subdir/foo.*', { noparen: true }), 'path/(foo bar)/subdir');
      assert.strictEqual(base('a/\\(b c)'), 'a/\\(b c)', 'parens must be escaped');
      assert.strictEqual(base('a/\\+\\(b c)/foo'), 'a/\\+\\(b c)/foo', 'parens must be escaped');
      assert.strictEqual(base('js/t(wo|est)/*.js'), 'js');
      assert.strictEqual(base('js/t/(wo|est)/*.js'), 'js/t');
      assert.strictEqual(base('path/(foo bar)/subdir/foo.*'), 'path', 'parens must be escaped');
      assert.strictEqual(base('path/(foo/bar|baz)'), 'path');
      assert.strictEqual(base('path/(foo/bar|baz)/'), 'path');
      assert.strictEqual(base('path/(to|from)'), 'path');
      assert.strictEqual(base('path/\\(foo/bar|baz)/'), 'path/\\(foo/bar|baz)/');
      assert.strictEqual(base('path/\\*(a|b)'), 'path');
      assert.strictEqual(base('path/\\*(a|b)/subdir/foo.*'), 'path');
      assert.strictEqual(base('path/\\*/(a|b)/subdir/foo.*'), 'path/\\*');
      assert.strictEqual(base('path/\\*\\(a\\|b\\)/subdir/foo.*'), 'path/\\*\\(a\\|b\\)/subdir');
    });
  });

  describe('technically invalid windows globs', () => {
    it('should support simple globs with backslash path separator', () => {
      assert.strictEqual(base('C:\\path\\*.js'), 'C:\\path\\*.js');
      assert.strictEqual(base('C:\\\\path\\\\*.js'), '');
      assert.strictEqual(base('C:\\\\path\\*.js'), 'C:\\\\path\\*.js');
    });
  });

  describe('glob base >', () => {
    it('should parse globs', () => {
      assert.deepStrictEqual(both('!foo'), ['foo', '']);
      assert.deepStrictEqual(both('*'), ['', '*']);
      assert.deepStrictEqual(both('**'), ['', '**']);
      assert.deepStrictEqual(both('**/*.md'), ['', '**/*.md']);
      assert.deepStrictEqual(both('**/*.min.js'), ['', '**/*.min.js']);
      assert.deepStrictEqual(both('**/*foo.js'), ['', '**/*foo.js']);
      assert.deepStrictEqual(both('**/.*'), ['', '**/.*']);
      assert.deepStrictEqual(both('**/d'), ['', '**/d']);
      assert.deepStrictEqual(both('*.*'), ['', '*.*']);
      assert.deepStrictEqual(both('*.js'), ['', '*.js']);
      assert.deepStrictEqual(both('*.md'), ['', '*.md']);
      assert.deepStrictEqual(both('*.min.js'), ['', '*.min.js']);
      assert.deepStrictEqual(both('*/*'), ['', '*/*']);
      assert.deepStrictEqual(both('*/*/*/*'), ['', '*/*/*/*']);
      assert.deepStrictEqual(both('*/*/*/e'), ['', '*/*/*/e']);
      assert.deepStrictEqual(both('*/b/*/e'), ['', '*/b/*/e']);
      assert.deepStrictEqual(both('*b'), ['', '*b']);
      assert.deepStrictEqual(both('.*'), ['', '.*']);
      assert.deepStrictEqual(both('*'), ['', '*']);
      assert.deepStrictEqual(both('a/**/j/**/z/*.md'), ['a', '**/j/**/z/*.md']);
      assert.deepStrictEqual(both('a/**/z/*.md'), ['a', '**/z/*.md']);
      assert.deepStrictEqual(both('node_modules/*-glob/**/*.js'), ['node_modules', '*-glob/**/*.js']);
      assert.deepStrictEqual(both('{a/b/{c,/foo.js}/e.f.g}'), ['', '{a/b/{c,/foo.js}/e.f.g}']);
      assert.deepStrictEqual(both('.a*'), ['', '.a*']);
      assert.deepStrictEqual(both('.b*'), ['', '.b*']);
      assert.deepStrictEqual(both('/*'), ['/', '*']);
      assert.deepStrictEqual(both('a/***'), ['a', '***']);
      assert.deepStrictEqual(both('a/**/b/*.{foo,bar}'), ['a', '**/b/*.{foo,bar}']);
      assert.deepStrictEqual(both('a/**/c/*'), ['a', '**/c/*']);
      assert.deepStrictEqual(both('a/**/c/*.md'), ['a', '**/c/*.md']);
      assert.deepStrictEqual(both('a/**/e'), ['a', '**/e']);
      assert.deepStrictEqual(both('a/**/j/**/z/*.md'), ['a', '**/j/**/z/*.md']);
      assert.deepStrictEqual(both('a/**/z/*.md'), ['a', '**/z/*.md']);
      assert.deepStrictEqual(both('a/**c*'), ['a', '**c*']);
      assert.deepStrictEqual(both('a/**c/*'), ['a', '**c/*']);
      assert.deepStrictEqual(both('a/*/*/e'), ['a', '*/*/e']);
      assert.deepStrictEqual(both('a/*/c/*.md'), ['a', '*/c/*.md']);
      assert.deepStrictEqual(both('a/b/**/c{d,e}/**/xyz.md'), ['a/b', '**/c{d,e}/**/xyz.md']);
      assert.deepStrictEqual(both('a/b/**/e'), ['a/b', '**/e']);
      assert.deepStrictEqual(both('a/b/*.{foo,bar}'), ['a/b', '*.{foo,bar}']);
      assert.deepStrictEqual(both('a/b/*/e'), ['a/b', '*/e']);
      assert.deepStrictEqual(both('a/b/.git/'), ['a/b/.git/', '']);
      assert.deepStrictEqual(both('a/b/.git/**'), ['a/b/.git', '**']);
      assert.deepStrictEqual(both('a/b/.{foo,bar}'), ['a/b', '.{foo,bar}']);
      assert.deepStrictEqual(both('a/b/c/*'), ['a/b/c', '*']);
      assert.deepStrictEqual(both('a/b/c/**/*.min.js'), ['a/b/c', '**/*.min.js']);
      assert.deepStrictEqual(both('a/b/c/*.md'), ['a/b/c', '*.md']);
      assert.deepStrictEqual(both('a/b/c/.*.md'), ['a/b/c', '.*.md']);
      assert.deepStrictEqual(both('a/b/{c,.gitignore,{a,b}}/{a,b}/abc.foo.js'), ['a/b', '{c,.gitignore,{a,b}}/{a,b}/abc.foo.js']);
      assert.deepStrictEqual(both('a/b/{c,/.gitignore}'), ['a/b', '{c,/.gitignore}']);
      assert.deepStrictEqual(both('a/b/{c,d}/'), ['a/b', '{c,d}/']);
      assert.deepStrictEqual(both('a/b/{c,d}/e/f.g'), ['a/b', '{c,d}/e/f.g']);
      assert.deepStrictEqual(both('b/*/*/*'), ['b', '*/*/*']);
    });

    it('should support file extensions', () => {
      assert.deepStrictEqual(both('.md'), ['.md', '']);
    });

    it('should support negation pattern', () => {
      assert.deepStrictEqual(both('!*.min.js'), ['', '*.min.js']);
      assert.deepStrictEqual(both('!foo'), ['foo', '']);
      assert.deepStrictEqual(both('!foo/*.js'), ['foo', '*.js']);
      assert.deepStrictEqual(both('!foo/(a|b).min.js'), ['foo', '(a|b).min.js']);
      assert.deepStrictEqual(both('!foo/[a-b].min.js'), ['foo', '[a-b].min.js']);
      assert.deepStrictEqual(both('!foo/{a,b}.min.js'), ['foo', '{a,b}.min.js']);
      assert.deepStrictEqual(both('a/b/c/!foo'), ['a/b/c/!foo', '']);
    });

    it('should support extglobs', () => {
      assert.deepStrictEqual(both('/a/b/!(a|b)/e.f.g/'), ['/a/b', '!(a|b)/e.f.g/']);
      assert.deepStrictEqual(both('/a/b/@(a|b)/e.f.g/'), ['/a/b', '@(a|b)/e.f.g/']);
      assert.deepStrictEqual(both('@(a|b)/e.f.g/'), ['', '@(a|b)/e.f.g/']);
      assert.strictEqual(base('path/!(to|from)'), 'path');
      assert.strictEqual(base('path/*(to|from)'), 'path');
      assert.strictEqual(base('path/+(to|from)'), 'path');
      assert.strictEqual(base('path/?(to|from)'), 'path');
      assert.strictEqual(base('path/@(to|from)'), 'path');
    });

    it('should support regex character classes', () => {
      const opts = { unescape: true };
      assert.deepStrictEqual(both('[a-c]b*'), ['', '[a-c]b*']);
      assert.deepStrictEqual(both('[a-j]*[^c]'), ['', '[a-j]*[^c]']);
      assert.deepStrictEqual(both('[a-j]*[^c]b/c'), ['', '[a-j]*[^c]b/c']);
      assert.deepStrictEqual(both('[a-j]*[^c]bc'), ['', '[a-j]*[^c]bc']);
      assert.deepStrictEqual(both('[ab][ab]'), ['', '[ab][ab]']);
      assert.deepStrictEqual(both('foo/[a-b].min.js'), ['foo', '[a-b].min.js']);
      assert.strictEqual(base('path/foo[a\\/]/', opts), 'path');
      assert.strictEqual(base('path/foo\\[a\\/]/', opts), 'path/foo[a\\/]/');
      assert.strictEqual(base('foo[a\\/]', opts), '');
      assert.strictEqual(base('foo\\[a\\/]', opts), 'foo[a\\/]');
    });

    it('should support qmarks', () => {
      assert.deepStrictEqual(both('?'), ['', '?']);
      assert.deepStrictEqual(both('?/?'), ['', '?/?']);
      assert.deepStrictEqual(both('??'), ['', '??']);
      assert.deepStrictEqual(both('???'), ['', '???']);
      assert.deepStrictEqual(both('?a'), ['', '?a']);
      assert.deepStrictEqual(both('?b'), ['', '?b']);
      assert.deepStrictEqual(both('a?b'), ['', 'a?b']);
      assert.deepStrictEqual(both('a/?/c.js'), ['a', '?/c.js']);
      assert.deepStrictEqual(both('a/?/c.md'), ['a', '?/c.md']);
      assert.deepStrictEqual(both('a/?/c/?/*/f.js'), ['a', '?/c/?/*/f.js']);
      assert.deepStrictEqual(both('a/?/c/?/*/f.md'), ['a', '?/c/?/*/f.md']);
      assert.deepStrictEqual(both('a/?/c/?/e.js'), ['a', '?/c/?/e.js']);
      assert.deepStrictEqual(both('a/?/c/?/e.md'), ['a', '?/c/?/e.md']);
      assert.deepStrictEqual(both('a/?/c/???/e.js'), ['a', '?/c/???/e.js']);
      assert.deepStrictEqual(both('a/?/c/???/e.md'), ['a', '?/c/???/e.md']);
      assert.deepStrictEqual(both('a/??/c.js'), ['a', '??/c.js']);
      assert.deepStrictEqual(both('a/??/c.md'), ['a', '??/c.md']);
      assert.deepStrictEqual(both('a/???/c.js'), ['a', '???/c.js']);
      assert.deepStrictEqual(both('a/???/c.md'), ['a', '???/c.md']);
      assert.deepStrictEqual(both('a/????/c.js'), ['a', '????/c.js']);
    });

    it('should support non-glob patterns', () => {
      assert.deepStrictEqual(both(''), ['', '']);
      assert.deepStrictEqual(both('.'), ['.', '']);
      assert.deepStrictEqual(both('a'), ['a', '']);
      assert.deepStrictEqual(both('.a'), ['.a', '']);
      assert.deepStrictEqual(both('/a'), ['/a', '']);
      assert.deepStrictEqual(both('a/'), ['a/', '']);
      assert.deepStrictEqual(both('/a/'), ['/a/', '']);
      assert.deepStrictEqual(both('/a/b/c'), ['/a/b/c', '']);
      assert.deepStrictEqual(both('/a/b/c/'), ['/a/b/c/', '']);
      assert.deepStrictEqual(both('a/b/c/'), ['a/b/c/', '']);
      assert.deepStrictEqual(both('a.min.js'), ['a.min.js', '']);
      assert.deepStrictEqual(both('a/.x.md'), ['a/.x.md', '']);
      assert.deepStrictEqual(both('a/b/.gitignore'), ['a/b/.gitignore', '']);
      assert.deepStrictEqual(both('a/b/c/d.md'), ['a/b/c/d.md', '']);
      assert.deepStrictEqual(both('a/b/c/d.e.f/g.min.js'), ['a/b/c/d.e.f/g.min.js', '']);
      assert.deepStrictEqual(both('a/b/.git'), ['a/b/.git', '']);
      assert.deepStrictEqual(both('a/b/.git/'), ['a/b/.git/', '']);
      assert.deepStrictEqual(both('a/b/c'), ['a/b/c', '']);
      assert.deepStrictEqual(both('a/b/c.d/e.md'), ['a/b/c.d/e.md', '']);
      assert.deepStrictEqual(both('a/b/c.md'), ['a/b/c.md', '']);
      assert.deepStrictEqual(both('a/b/c.min.js'), ['a/b/c.min.js', '']);
      assert.deepStrictEqual(both('a/b/git/'), ['a/b/git/', '']);
      assert.deepStrictEqual(both('aa'), ['aa', '']);
      assert.deepStrictEqual(both('ab'), ['ab', '']);
      assert.deepStrictEqual(both('bb'), ['bb', '']);
      assert.deepStrictEqual(both('c.md'), ['c.md', '']);
      assert.deepStrictEqual(both('foo'), ['foo', '']);
    });
  });

  describe('braces', () => {
    it('should recognize brace sets', () => {
      assert.strictEqual(base('path/{to,from}'), 'path');
      assert.strictEqual(base('path/{foo,bar}/'), 'path');
      assert.strictEqual(base('js/{src,test}/*.js'), 'js');
      assert.strictEqual(base('{a,b}'), '');
      assert.strictEqual(base('/{a,b}'), '/');
      assert.strictEqual(base('/{a,b}/'), '/');
    });

    it('should recognize brace ranges', () => {
      assert.strictEqual(base('js/test{0..9}/*.js'), 'js');
    });

    it('should respect brace enclosures with embedded separators', () => {
      const opts = { unescape: true };
      assert.strictEqual(base('path/{,/,bar/baz,qux}/', opts), 'path');
      assert.strictEqual(base('path/\\{,/,bar/baz,qux}/', opts), 'path/{,/,bar/baz,qux}/');
      assert.strictEqual(base('path/\\{,/,bar/baz,qux\\}/', opts), 'path/{,/,bar/baz,qux}/');
      assert.strictEqual(base('/{,/,bar/baz,qux}/', opts), '/');
      assert.strictEqual(base('/\\{,/,bar/baz,qux}/', opts), '/{,/,bar/baz,qux}/');
      assert.strictEqual(base('{,/,bar/baz,qux}', opts), '');
      assert.strictEqual(base('\\{,/,bar/baz,qux\\}', opts), '{,/,bar/baz,qux}');
      assert.strictEqual(base('\\{,/,bar/baz,qux}/', opts), '{,/,bar/baz,qux}/');
    });

    it('should handle escaped nested braces', () => {
      const opts = { unescape: true };
      assert.strictEqual(base('\\{../,./,\\{bar,/baz},qux}', opts), '{../,./,{bar,/baz},qux}');
      assert.strictEqual(base('\\{../,./,\\{bar,/baz},qux}/', opts), '{../,./,{bar,/baz},qux}/');
      assert.strictEqual(base('path/\\{,/,bar/{baz,qux}}/', opts), 'path/{,/,bar/{baz,qux}}/');
      assert.strictEqual(base('path/\\{../,./,\\{bar,/baz},qux}/', opts), 'path/{../,./,{bar,/baz},qux}/');
      assert.strictEqual(base('path/\\{../,./,\\{bar,/baz},qux}/', opts), 'path/{../,./,{bar,/baz},qux}/');
      assert.strictEqual(base('path/\\{../,./,{bar,/baz},qux}/', opts), 'path/{../,./,{bar,/baz},qux}/');
      assert.strictEqual(base('path/{,/,bar/\\{baz,qux}}/', opts), 'path');
    });

    it('should recognize escaped braces', () => {
      const opts = { unescape: true };
      assert.strictEqual(base('\\{foo,bar\\}', opts), '{foo,bar}');
      assert.strictEqual(base('\\{foo,bar\\}/', opts), '{foo,bar}/');
      assert.strictEqual(base('\\{foo,bar}/', opts), '{foo,bar}/');
      assert.strictEqual(base('path/\\{foo,bar}/', opts), 'path/{foo,bar}/');
    });

    it('should get a base name from a complex brace glob', () => {
      assert.strictEqual(base('one/{foo,bar}/**/{baz,qux}/*.txt'), 'one');
      assert.strictEqual(base('two/baz/**/{abc,xyz}/*.js'), 'two/baz');
      assert.strictEqual(base('foo/{bar,baz}/**/aaa/{bbb,ccc}'), 'foo');
    });

    it('should support braces: no path', () => {
      assert.deepStrictEqual(both('/a/b/{c,/foo.js}/e.f.g/'), ['/a/b', '{c,/foo.js}/e.f.g/']);
      assert.deepStrictEqual(both('{a/b/c.js,/a/b/{c,/foo.js}/e.f.g/}'), ['', '{a/b/c.js,/a/b/{c,/foo.js}/e.f.g/}']);
      assert.deepStrictEqual(both('/a/b/{c,d}/'), ['/a/b', '{c,d}/']);
      assert.deepStrictEqual(both('/a/b/{c,d}/*.js'), ['/a/b', '{c,d}/*.js']);
      assert.deepStrictEqual(both('/a/b/{c,d}/*.min.js'), ['/a/b', '{c,d}/*.min.js']);
      assert.deepStrictEqual(both('/a/b/{c,d}/e.f.g/'), ['/a/b', '{c,d}/e.f.g/']);
      assert.deepStrictEqual(both('{.,*}'), ['', '{.,*}']);
    });

    it('should support braces in filename', () => {
      assert.deepStrictEqual(both('a/b/.{c,.gitignore}'), ['a/b', '.{c,.gitignore}']);
      assert.deepStrictEqual(both('a/b/.{c,/.gitignore}'), ['a/b', '.{c,/.gitignore}']);
      assert.deepStrictEqual(both('a/b/.{foo,bar}'), ['a/b', '.{foo,bar}']);
      assert.deepStrictEqual(both('a/b/{c,.gitignore}'), ['a/b', '{c,.gitignore}']);
      assert.deepStrictEqual(both('a/b/{c,/.gitignore}'), ['a/b', '{c,/.gitignore}']);
      assert.deepStrictEqual(both('a/b/{c,/gitignore}'), ['a/b', '{c,/gitignore}']);
      assert.deepStrictEqual(both('a/b/{c,d}'), ['a/b', '{c,d}']);
    });

    it('should support braces in dirname', () => {
      assert.deepStrictEqual(both('a/b/{c,./d}/e/f.g'), ['a/b', '{c,./d}/e/f.g']);
      assert.deepStrictEqual(both('a/b/{c,./d}/e/f.min.g'), ['a/b', '{c,./d}/e/f.min.g']);
      assert.deepStrictEqual(both('a/b/{c,.gitignore,{a,./b}}/{a,b}/abc.foo.js'), ['a/b', '{c,.gitignore,{a,./b}}/{a,b}/abc.foo.js']);
      assert.deepStrictEqual(both('a/b/{c,.gitignore,{a,b}}/{a,b}/*.foo.js'), ['a/b', '{c,.gitignore,{a,b}}/{a,b}/*.foo.js']);
      assert.deepStrictEqual(both('a/b/{c,.gitignore,{a,b}}/{a,b}/abc.foo.js'), ['a/b', '{c,.gitignore,{a,b}}/{a,b}/abc.foo.js']);
      assert.deepStrictEqual(both('a/b/{c,/d}/e/f.g'), ['a/b', '{c,/d}/e/f.g']);
      assert.deepStrictEqual(both('a/b/{c,/d}/e/f.min.g'), ['a/b', '{c,/d}/e/f.min.g']);
      assert.deepStrictEqual(both('a/b/{c,d}/'), ['a/b', '{c,d}/']);
      assert.deepStrictEqual(both('a/b/{c,d}/*.js'), ['a/b', '{c,d}/*.js']);
      assert.deepStrictEqual(both('a/b/{c,d}/*.min.js'), ['a/b', '{c,d}/*.min.js']);
      assert.deepStrictEqual(both('a/b/{c,d}/e.f.g/'), ['a/b', '{c,d}/e.f.g/']);
      assert.deepStrictEqual(both('a/b/{c,d}/e/f.g'), ['a/b', '{c,d}/e/f.g']);
      assert.deepStrictEqual(both('a/b/{c,d}/e/f.min.g'), ['a/b', '{c,d}/e/f.min.g']);
      assert.deepStrictEqual(both('foo/{a,b}.min.js'), ['foo', '{a,b}.min.js']);
    });
  });
});
