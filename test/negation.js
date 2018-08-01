'use strict';

require('mocha');
const assert = require('assert');
const picomatch = require('..');
const pm = require('./support');

describe('negation', () => {
  beforeEach(() => picomatch.clearCache());

  it('should support negation patterns', () => {
    const fixtures = ['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c', 'a', 'a.b'];
    assert.deepEqual(pm(['foo', 'bar', 'fab'], ['!*a*']), ['foo']);
    assert.deepEqual(pm(['foo', 'bar', 'fab'], ['!f*b']), ['foo', 'bar']);
    assert.deepEqual(pm(['foo', 'bar', 'fab'], ['f*', '!f*b']), ['foo']);
    assert.deepEqual(pm(fixtures, '!(*/*)'), ['a', 'a.b']);
    assert.deepEqual(pm(fixtures, '!(*/b)'), ['a/a', 'a/c', 'b/a', 'b/c', 'a', 'a.b']);
    assert.deepEqual(pm(fixtures, '!(a/b)'), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c', 'a', 'a.b']);
    assert.deepEqual(pm(fixtures, '!*/b'), ['a/a', 'a/c', 'b/a', 'b/c', 'a', 'a.b']);
    assert.deepEqual(pm(fixtures, '!a/(*)'), ['b/a', 'b/b', 'b/c', 'a', 'a.b']);
    assert.deepEqual(pm(fixtures, '!a/(b)'), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c', 'a', 'a.b']);
    assert.deepEqual(pm(fixtures, '!a/*'), ['b/a', 'b/b', 'b/c', 'a', 'a.b']);
    assert.deepEqual(pm(fixtures, '!a/b'), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c', 'a', 'a.b']);
    assert.deepEqual(pm(fixtures, ['!(a/b)']), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c', 'a', 'a.b']);
    assert.deepEqual(pm(fixtures, ['!a/(b)']), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c', 'a', 'a.b']);
    assert.deepEqual(pm(fixtures, ['!a/*', '*/*']), ['b/a', 'b/b', 'b/c']);
    assert.deepEqual(pm(fixtures, ['*/*', '!a/*']), ['b/a', 'b/b', 'b/c']);
    assert.deepEqual(pm(fixtures, ['!a/*']), ['b/a', 'b/b', 'b/c', 'a', 'a.b']);
    assert.deepEqual(pm(fixtures, ['!a/b', '!*/c']), ['a/a', 'b/a', 'b/b', 'a', 'a.b']);
    assert.deepEqual(pm(fixtures, ['!a/b', '!a/c']), ['a/a', 'b/a', 'b/b', 'b/c', 'a', 'a.b']);
    assert.deepEqual(pm(fixtures, ['!a/b']), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c', 'a', 'a.b']);
    assert.deepEqual(pm(fixtures, ['*/*', '!a/b', '!*/c']), ['a/a', 'b/a', 'b/b']);
    assert.deepEqual(pm(fixtures, ['!a/b', '!*/c', '*/*', '*']), ['a/a', 'b/a', 'b/b', 'a', 'a.b']);
    assert.deepEqual(pm(fixtures, '!*'), ['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c']);
    assert.deepEqual(pm(fixtures, '!*/*'), ['a', 'a.b']);
  });

  it('should negate files with extensions:', () => {
    assert.deepEqual(pm(['.md'], '!.md'), []);
    assert.deepEqual(pm(['a.js', 'b.md', 'c.txt'], '!**/*.md'), ['a.js', 'c.txt']);
    assert.deepEqual(pm(['a.js', 'b.md', 'c.txt'], '!*.md'), ['a.js', 'c.txt']);
    assert.deepEqual(pm(['abc.md', 'abc.txt'], '!*.md'), ['abc.txt']);
    assert.deepEqual(pm(['foo.md'], '!*.md'), []);
    assert.deepEqual(pm(['foo.md'], '!.md'), ['foo.md']);
  });

  it('should only treat leading exclamation as special', () => {
    assert.deepEqual(pm(['foo!.md', 'bar.md'], 'foo!.md'), ['foo!.md']);
    assert.deepEqual(pm(['foo!.md', 'bar.md'], '*.md'), ['foo!.md', 'bar.md']);
    assert.deepEqual(pm(['foo!.md', 'bar.md'], '*!.md'), ['foo!.md']);
    assert.deepEqual(pm(['foobar.md'], '*b*.md'), ['foobar.md']);
    assert.deepEqual(pm(['foo!bar.md', 'foo!.md', '!foo!.md'], '*!*.md'), ['foo!bar.md', 'foo!.md', '!foo!.md']);
    assert.deepEqual(pm(['foo!bar.md', 'foo!.md', '!foo!.md'], '\\!*!*.md'), ['!foo!.md']);
    assert.deepEqual(pm(['foo!.md', 'ba!r.js'], '*!*.*'), ['foo!.md', 'ba!r.js']);
  });

  it('should support negated single stars', () => {
    assert.deepEqual(pm(['a.js', 'b.txt', 'c.md'], '!*.md'), ['a.js', 'b.txt']);
    assert.deepEqual(pm(['a/a/a.js', 'a/b/a.js', 'a/c/a.js'], '!a/*/a.js'), []);
    assert.deepEqual(pm(['a/a/a/a.js', 'b/a/b/a.js', 'c/a/c/a.js'], '!a/*/*/a.js'), ['b/a/b/a.js', 'c/a/c/a.js']);
    assert.deepEqual(pm(['a/a.txt', 'a/b.txt', 'a/c.txt'], '!a/a*.txt'), ['a/b.txt', 'a/c.txt']);
    assert.deepEqual(pm(['a.a.txt', 'a.b.txt', 'a.c.txt'], '!a.a*.txt'), ['a.b.txt', 'a.c.txt']);
    assert.deepEqual(pm(['a/a.txt', 'a/b.txt', 'a/c.txt'], '!a/*.txt'), []);
  });

  it('should support negated globstars (multiple stars)', () => {
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

  it('should support quoted strings', () => {
    const fixtureA = ['foo.md', '"!*".md', '!*.md'];
    assert.deepEqual(pm(fixtureA, '"!*".md'), ['!*.md']);
    assert.deepEqual(pm(fixtureA, '"!*".md', { keepQuotes: true }), ['"!*".md']);

    const fixtureB = ['foo.md', '"**".md', '**.md'];
    assert.deepEqual(pm(fixtureB, '"**".md'), ['**.md']);
    assert.deepEqual(pm(fixtureB, '"**".md', { keepQuotes: true }), ['"**".md']);
  });

  it('should negate dotfiles:', () => {
    assert.deepEqual(pm(['.dotfile.md'], '!*.md'), []);
    assert.deepEqual(pm(['.dotfile.md'], '!.*.md'), []);
    assert.deepEqual(pm(['.dotfile.txt'], '!*.md'), ['.dotfile.txt']);
    assert.deepEqual(pm(['.dotfile.txt', 'a/b/.dotfile'], '!*.md'), ['.dotfile.txt', 'a/b/.dotfile']);
    assert.deepEqual(pm(['.gitignore', 'a', 'b'], '!.gitignore'), ['a', 'b']);
  });

  it('should negate files in the immediate directory:', () => {
    assert.deepEqual(pm(['a/b.js', 'a.js', 'a/b.md', 'a.md'], '!*.md'), ['a/b.js', 'a.js', 'a/b.md']);
  });

  it('should not give special meaning to non-leading exclamations', () => {
    assert.deepEqual(pm(['a', 'aa', 'a/b', 'a!b', 'a!!b', 'a/!!/b'], 'a!!b'), ['a!!b']);
  });

  it('should negate files in any directory:', () => {
    assert.deepEqual(pm(['a/a.txt', 'a/b.txt', 'a/c.txt'], '!a/b.txt'), ['a/a.txt', 'a/c.txt']);
  });

  it('should support negation with nested directories', () => {
    assert.deepEqual(pm(['a', 'a/', 'a/b', 'a/b/c', 'b', 'b/c'], '!a/**'), ['a', 'b', 'b/c']);
    assert.deepEqual(pm(['a', 'a/', 'a/b', 'a/b/c', 'b', 'b/c'], '!(a/**)'), ['a', 'b', 'b/c']);
    assert.deepEqual(pm(['a/a', 'a/b', 'a/b/c', 'a/c'], 'a/!(b*)'), ['a/a', 'a/c']);
    assert.deepEqual(pm(['a/a', 'a/a/', 'a/b', 'a/b/c', 'a/c', 'a/c/'], 'a/!(b*)/**'), ['a/a', 'a/a/', 'a/c', 'a/c/']);
    assert.deepEqual(pm(['foo', 'bar', 'fab'], '!f*b'), ['foo', 'bar']);
    assert.deepEqual(pm(['foo', 'bar', 'fab'], ['f*', '!f*b']), ['foo']);
  });

  it('should return an array of matches for a literal string', () => {
    assert.deepEqual(pm(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], '(a/b)'), ['a/b']);
    assert.deepEqual(pm(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], 'a/b'), ['a/b']);
  });

  it('should return an array of matches for an array of literal strings', () => {
    assert.deepEqual(pm(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], ['(a/b)', 'a/c']), ['a/b', 'a/c']);
    assert.deepEqual(pm(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], ['a/b', 'b/b']), ['a/b', 'b/b']);
  });

  it('should support regex logical or', () => {
    assert.deepEqual(pm(['a/a', 'a/b', 'a/c'], ['a/(a|c)']), ['a/a', 'a/c']);
    assert.deepEqual(pm(['a/a', 'a/b', 'a/c'], ['a/(a|b|c)', 'a/b']), ['a/a', 'a/b', 'a/c']);
  });

  it('should support regex ranges', () => {
    assert.deepEqual(pm(['a/a', 'a/b', 'a/c'], 'a/[b-c]'), ['a/b', 'a/c']);
    assert.deepEqual(pm(['a/a', 'a/b', 'a/c', 'a/x/y', 'a/x'], 'a/[a-z]'), ['a/a', 'a/b', 'a/c', 'a/x']);
  });

  it('should support single globs (*)', () => {
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

  it('should respect single star dirs with globstars', () => {
    const fixtures = ['a', 'b', 'a/a', 'a/b', 'a/c', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a', 'x/y', 'z/z'];

    assert.deepEqual(pm(fixtures, ['*/**/a']), ['a/a', 'a/a/a', 'a/a/a/a', 'a/a/a/a/a']);
  });

  it('should optionally match a trailing slash when single star is last char', () => {
    const fixtures = ['a', 'a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z'];
    assert.deepEqual(pm(fixtures, ['*']), ['a', 'a/']);
    assert.deepEqual(pm(fixtures, ['*/']), ['a/']);
    assert.deepEqual(pm(fixtures, ['*/*']), ['a/a', 'a/b', 'a/c', 'a/x']);
    assert.deepEqual(pm(fixtures, ['a/*']), ['a/a', 'a/b', 'a/c', 'a/x']);
  });

  it('should support globstars (**)', () => {
    const fixtures = ['a', 'a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z'];

    assert.deepEqual(pm(fixtures, '**'), fixtures);
    assert.deepEqual(pm(fixtures, '**/a'), ['a', 'a/', 'a/a']);
    assert.deepEqual(pm(fixtures, 'a/**'), ['a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
    assert.deepEqual(pm(fixtures, 'a/**/*'), ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
    assert.deepEqual(pm(fixtures, 'a/**/**/*'), ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
    assert.deepEqual(pm(fixtures, 'a/**/**/**/*'), ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);

    assert.deepEqual(pm(['a/b/foo/bar/baz.qux'], 'a/b/**/bar/**/*.*'), ['a/b/foo/bar/baz.qux']);
    assert.deepEqual(pm(['a/b/bar/baz.qux'], 'a/b/**/bar/**/*.*'), ['a/b/bar/baz.qux']);
  });

  it('should work with file extensions', () => {
    const fixtures = ['a.txt', 'a/b.txt', 'a/x/y.txt', 'a/x/y/z'];
    assert.deepEqual(pm(fixtures, ['a/**/*.txt']), ['a/b.txt', 'a/x/y.txt']);
    assert.deepEqual(pm(fixtures, ['a/*.txt']), ['a/b.txt']);
    assert.deepEqual(pm(fixtures, ['a*.txt']), ['a.txt']);
    assert.deepEqual(pm(fixtures, ['*.txt']), ['a.txt']);
  });

  it('should support basic brace patterns', () => {
    const fixtures = ['a.txt', 'a/b.txt', 'a/x/y.txt', 'a/x/y/z'];
    assert.deepEqual(pm(fixtures, ['a{,/**/}*.txt']), ['a.txt', 'a/b.txt', 'a/x/y.txt']);
  });

  it('should allow globstars to be used in braces', () => {
    assert.deepEqual(pm(['a/b/foo/bar/baz.qux'], 'a/b{,/**}/bar{,/**}/*.*'), ['a/b/foo/bar/baz.qux']);
    assert.deepEqual(pm(['a/b/bar/baz.qux'], 'a/b{,/**}/bar{,/**}/*.*'), ['a/b/bar/baz.qux']);
  });

  it('should correctly match slashes', () => {
    assert(!pm.isMatch('foo/bar', '**/'));
    assert(!pm.isMatch('foo/bar', '**/*/'));
    assert(!pm.isMatch('foo/bar', '*/*/'));
    assert(!pm.isMatch('foo/bar/', '**/*'));
    assert(!pm.isMatch('foo/bar/', '*/*'));
    assert(pm.isMatch('foo', '*/**'));
    assert(pm.isMatch('foo/', '*/**'));
    assert(pm.isMatch('foo/bar', '**/*'));
    assert(pm.isMatch('foo/bar', '*/*'));
    assert(pm.isMatch('foo/bar', '*/**'));
    assert(pm.isMatch('foo/bar/', '**/'));
    assert(pm.isMatch('foo/bar/', '**/*/'));
    assert(pm.isMatch('foo/bar/', '*/**'));
    assert(pm.isMatch('foo/bar/', '*/*/'));
  });

  it('should match regex character classes', () => {
    assert.deepEqual(pm(['foo/bar', 'foo/jar'], '**/[c-k]*'), ['foo/jar']);
    assert.deepEqual(pm(['foo/bar', 'foo/jar'], '**/[^c-k]*'), ['foo/bar']);
    assert.deepEqual(pm(['foo/bar', 'foo/jar'], '**/[a-i]*'), ['foo/bar']);
    assert.deepEqual(pm(['foo/bar', 'foo/jar'], '**/[^a-i]*'), ['foo/jar']);
    assert.deepEqual(pm(['foo/bar', 'foo/jar'], '**/!([a-k])*'), ['foo/bar', 'foo/jar']);
    assert.deepEqual(pm(['foo/bar', 'foo/jar'], '**/!([a-i])*'), ['foo/bar', 'foo/jar']);
    assert.deepEqual(pm(['foo/bar', 'foo/jar'], '**/[a-i]ar'), ['foo/bar']);
  });

  it('should match literal brackets', () => {
    assert.deepEqual(pm(['a [b]'], 'a \\[b\\]'), ['a [b]']);
    assert.deepEqual(pm(['a [b] c'], 'a [b] c'), ['a [b] c']);
    assert.deepEqual(pm(['a [b]'], 'a \\[b\\]*'), ['a [b]']);
    assert.deepEqual(pm(['a [bc]'], 'a \\[bc\\]*'), ['a [bc]']);
    assert.deepEqual(pm(['a [b]', 'a [b].js'], 'a \\[b\\].*'), ['a [b].js']);
  });
});
