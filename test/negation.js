'use strict';

require('mocha');
const assert = require('assert');
const picomatch = require('..');
const { isMatch } = require('./support');

describe('negation', () => {
  beforeEach(() => picomatch.clearCache());

  it('should support negation patterns', () => {
    assert(isMatch('foo', ['!*a*']));
    assert(!isMatch('bar', ['!*a*']));
    assert(!isMatch('fab', ['!*a*']));

    assert(isMatch('foo', ['!f*b']));
    assert(isMatch('bar', ['!f*b']));
    assert(!isMatch('fab', ['!f*b']));

    assert(isMatch('foo', ['f*', '!f*b']));
    assert(isMatch('bar', ['f*', '!f*b']));
    assert(isMatch('fab', ['f*', '!f*b']));

    assert(!isMatch('a/a', '!(*/*)'));
    assert(!isMatch('a/b', '!(*/*)'));
    assert(!isMatch('a/c', '!(*/*)'));
    assert(!isMatch('b/a', '!(*/*)'));
    assert(!isMatch('b/b', '!(*/*)'));
    assert(!isMatch('b/c', '!(*/*)'));
    assert(isMatch('a', '!(*/*)'));
    assert(isMatch('a.b', '!(*/*)'));

    assert(isMatch('a/a', '!(*/b)'));
    assert(!isMatch('a/b', '!(*/b)'));
    assert(isMatch('a/c', '!(*/b)'));
    assert(isMatch('b/a', '!(*/b)'));
    assert(!isMatch('b/b', '!(*/b)'));
    assert(isMatch('b/c', '!(*/b)'));
    assert(isMatch('a', '!(*/b)'));
    assert(isMatch('a.b', '!(*/b)'));

    assert(isMatch('a/a', '!(a/b)'));
    assert(!isMatch('a/b', '!(a/b)'));
    assert(isMatch('a/c', '!(a/b)'));
    assert(isMatch('b/a', '!(a/b)'));
    assert(isMatch('b/b', '!(a/b)'));
    assert(isMatch('b/c', '!(a/b)'));
    assert(isMatch('a', '!(a/b)'));
    assert(isMatch('a.b', '!(a/b)'));

    assert(isMatch('a/a', '!*/b'));
    assert(!isMatch('a/b', '!*/b'));
    assert(isMatch('a/c', '!*/b'));
    assert(isMatch('b/a', '!*/b'));
    assert(!isMatch('b/b', '!*/b'));
    assert(isMatch('b/c', '!*/b'));
    assert(isMatch('a', '!*/b'));
    assert(isMatch('a.b', '!*/b'));

    assert(!isMatch('a/a', '!a/(*)'));
    assert(!isMatch('a/b', '!a/(*)'));
    assert(!isMatch('a/c', '!a/(*)'));
    assert(isMatch('b/a', '!a/(*)'));
    assert(isMatch('b/b', '!a/(*)'));
    assert(isMatch('b/c', '!a/(*)'));
    assert(isMatch('a', '!a/(*)'));
    assert(isMatch('a.b', '!a/(*)'));

    assert(isMatch('a/a', '!a/(b)'));
    assert(!isMatch('a/b', '!a/(b)'));
    assert(isMatch('a/c', '!a/(b)'));
    assert(isMatch('b/a', '!a/(b)'));
    assert(isMatch('b/b', '!a/(b)'));
    assert(isMatch('b/c', '!a/(b)'));
    assert(isMatch('a', '!a/(b)'));
    assert(isMatch('a.b', '!a/(b)'));

    assert(!isMatch('a/a', '!a/*'));
    assert(!isMatch('a/b', '!a/*'));
    assert(!isMatch('a/c', '!a/*'));
    assert(isMatch('b/a', '!a/*'));
    assert(isMatch('b/b', '!a/*'));
    assert(isMatch('b/c', '!a/*'));
    assert(isMatch('a', '!a/*'));
    assert(isMatch('a.b', '!a/*'));

    assert(isMatch('a/a', '!a/b'));
    assert(!isMatch('a/b', '!a/b'));
    assert(isMatch('a/c', '!a/b'));
    assert(isMatch('b/a', '!a/b'));
    assert(isMatch('b/b', '!a/b'));
    assert(isMatch('b/c', '!a/b'));
    assert(isMatch('a', '!a/b'));
    assert(isMatch('a.b', '!a/b'));

    assert(isMatch('a/a', ['!(a/b)']));
    assert(!isMatch('a/b', ['!(a/b)']));
    assert(isMatch('a/c', ['!(a/b)']));
    assert(isMatch('b/a', ['!(a/b)']));
    assert(isMatch('b/b', ['!(a/b)']));
    assert(isMatch('b/c', ['!(a/b)']));
    assert(isMatch('a', ['!(a/b)']));
    assert(isMatch('a.b', ['!(a/b)']));

    assert(isMatch('a/a', ['!a/(b)']));
    assert(!isMatch('a/b', ['!a/(b)']));
    assert(isMatch('a/c', ['!a/(b)']));
    assert(isMatch('b/a', ['!a/(b)']));
    assert(isMatch('b/b', ['!a/(b)']));
    assert(isMatch('b/c', ['!a/(b)']));
    assert(isMatch('a', ['!a/(b)']));
    assert(isMatch('a.b', ['!a/(b)']));

    assert(isMatch('a/a', ['!a/*', '*/*']));
    assert(isMatch('a/b', ['!a/*', '*/*']));
    assert(isMatch('a/c', ['!a/*', '*/*']));
    assert(isMatch('b/a', ['!a/*', '*/*']));
    assert(isMatch('b/b', ['!a/*', '*/*']));
    assert(isMatch('b/c', ['!a/*', '*/*']));
    assert(isMatch('a', ['!a/*', '*/*']));
    assert(isMatch('a.b', ['!a/*', '*/*']));

    assert(isMatch('a/a', ['*/*', '!a/*']));
    assert(isMatch('a/b', ['*/*', '!a/*']));
    assert(isMatch('a/c', ['*/*', '!a/*']));
    assert(isMatch('b/a', ['*/*', '!a/*']));
    assert(isMatch('b/b', ['*/*', '!a/*']));
    assert(isMatch('b/c', ['*/*', '!a/*']));
    assert(isMatch('a', ['*/*', '!a/*']));
    assert(isMatch('a.b', ['*/*', '!a/*']));

    assert(!isMatch('a/a', ['!a/*']));
    assert(!isMatch('a/b', ['!a/*']));
    assert(!isMatch('a/c', ['!a/*']));
    assert(isMatch('b/a', ['!a/*']));
    assert(isMatch('b/b', ['!a/*']));
    assert(isMatch('b/c', ['!a/*']));
    assert(isMatch('a', ['!a/*']));
    assert(isMatch('a.b', ['!a/*']));

    assert(isMatch('a/a', ['!a/b', '!*/c']));
    assert(isMatch('a/b', ['!a/b', '!*/c']));
    assert(isMatch('a/c', ['!a/b', '!*/c']));
    assert(isMatch('b/a', ['!a/b', '!*/c']));
    assert(isMatch('b/b', ['!a/b', '!*/c']));
    assert(isMatch('b/c', ['!a/b', '!*/c']));
    assert(isMatch('a', ['!a/b', '!*/c']));
    assert(isMatch('a.b', ['!a/b', '!*/c']));

    assert(isMatch('a/a', ['!a/b', '!a/c']));
    assert(isMatch('a/b', ['!a/b', '!a/c']));
    assert(isMatch('a/c', ['!a/b', '!a/c']));
    assert(isMatch('b/a', ['!a/b', '!a/c']));
    assert(isMatch('b/b', ['!a/b', '!a/c']));
    assert(isMatch('b/c', ['!a/b', '!a/c']));
    assert(isMatch('a', ['!a/b', '!a/c']));
    assert(isMatch('a.b', ['!a/b', '!a/c']));

    assert(isMatch('a/a', ['!a/b']));
    assert(!isMatch('a/b', ['!a/b']));
    assert(isMatch('a/c', ['!a/b']));
    assert(isMatch('b/a', ['!a/b']));
    assert(isMatch('b/b', ['!a/b']));
    assert(isMatch('b/c', ['!a/b']));
    assert(isMatch('a', ['!a/b']));
    assert(isMatch('a.b', ['!a/b']));

    assert(isMatch('a/a', ['*/*', '!a/b', '!*/c']));
    assert(isMatch('a/b', ['*/*', '!a/b', '!*/c']));
    assert(isMatch('a/c', ['*/*', '!a/b', '!*/c']));
    assert(isMatch('b/a', ['*/*', '!a/b', '!*/c']));
    assert(isMatch('b/b', ['*/*', '!a/b', '!*/c']));
    assert(isMatch('b/c', ['*/*', '!a/b', '!*/c']));
    assert(isMatch('a', ['*/*', '!a/b', '!*/c']));
    assert(isMatch('a.b', ['*/*', '!a/b', '!*/c']));

    assert(isMatch('a/a', ['!a/b', '!*/c', '*/*', '*']));
    assert(isMatch('a/b', ['!a/b', '!*/c', '*/*', '*']));
    assert(isMatch('a/c', ['!a/b', '!*/c', '*/*', '*']));
    assert(isMatch('b/a', ['!a/b', '!*/c', '*/*', '*']));
    assert(isMatch('b/b', ['!a/b', '!*/c', '*/*', '*']));
    assert(isMatch('b/c', ['!a/b', '!*/c', '*/*', '*']));
    assert(isMatch('a', ['!a/b', '!*/c', '*/*', '*']));
    assert(isMatch('a.b', ['!a/b', '!*/c', '*/*', '*']));

    assert(isMatch('a/a', '!*'));
    assert(isMatch('a/b', '!*'));
    assert(isMatch('a/c', '!*'));
    assert(isMatch('b/a', '!*'));
    assert(isMatch('b/b', '!*'));
    assert(isMatch('b/c', '!*'));
    assert(!isMatch('a', '!*'));
    assert(!isMatch('a.b', '!*'));

    assert(!isMatch('a/a', '!*/*'));
    assert(!isMatch('a/b', '!*/*'));
    assert(!isMatch('a/c', '!*/*'));
    assert(!isMatch('b/a', '!*/*'));
    assert(!isMatch('b/b', '!*/*'));
    assert(!isMatch('b/c', '!*/*'));
    assert(isMatch('a', '!*/*'));
    assert(isMatch('a.b', '!*/*'));

  });

  it('should negate files with extensions:', () => {
    assert(!isMatch('.md', '!.md'));
    assert(isMatch('a.js', '!**/*.md'));
    assert(!isMatch('b.md', '!**/*.md'));
    assert(isMatch('c.txt', '!**/*.md'));
    assert(isMatch('a.js', '!*.md'));
    assert(!isMatch('b.md', '!*.md'));
    assert(isMatch('c.txt', '!*.md'));
    assert(!isMatch('abc.md', '!*.md'));
    assert(isMatch('abc.txt', '!*.md'));
    assert(!isMatch('foo.md', '!*.md'));
    assert(isMatch('foo.md', '!.md'));
  });

  it('should only treat leading exclamation as special', () => {
    assert(isMatch('foo!.md', 'foo!.md'));
    assert(!isMatch('bar.md', 'foo!.md'));
    assert(isMatch('foo!.md', '*.md'));
    assert(isMatch('bar.md', '*.md'));
    assert(isMatch('foo!.md', '*!.md'));
    assert(!isMatch('bar.md', '*!.md'));
    assert(isMatch('foobar.md', '*b*.md'));
    assert(isMatch('foo!bar.md', '*!*.md'));
    assert(isMatch('foo!.md', '*!*.md'));
    assert(isMatch('!foo!.md', '*!*.md'));
    assert(!isMatch('foo!bar.md', '\\!*!*.md'));
    assert(!isMatch('foo!.md', '\\!*!*.md'));
    assert(isMatch('!foo!.md', '\\!*!*.md'));
    assert(isMatch('foo!.md', '*!*.*'));
    assert(isMatch('ba!r.js', '*!*.*'));
  });

  it('should support negated single stars', () => {
    assert(isMatch('a.js', '!*.md'));
    assert(isMatch('b.txt', '!*.md'));
    assert(!isMatch('c.md', '!*.md'));
    assert(!isMatch('a/a/a.js', '!a/*/a.js'));
    assert(!isMatch('a/b/a.js', '!a/*/a.js'));
    assert(!isMatch('a/c/a.js', '!a/*/a.js'));
    assert(!isMatch('a/a/a/a.js', '!a/*/*/a.js'));
    assert(isMatch('b/a/b/a.js', '!a/*/*/a.js'));
    assert(isMatch('c/a/c/a.js', '!a/*/*/a.js'));
    assert(!isMatch('a/a.txt', '!a/a*.txt'));
    assert(isMatch('a/b.txt', '!a/a*.txt'));
    assert(isMatch('a/c.txt', '!a/a*.txt'));
    assert(!isMatch('a.a.txt', '!a.a*.txt'));
    assert(isMatch('a.b.txt', '!a.a*.txt'));
    assert(isMatch('a.c.txt', '!a.a*.txt'));
    assert(!isMatch('a/a.txt', '!a/*.txt'));
    assert(!isMatch('a/b.txt', '!a/*.txt'));
    assert(!isMatch('a/c.txt', '!a/*.txt'));
  });

  it('should support negated globstars (multiple stars)', () => {
    assert(isMatch('a.js', '!*.md'));
    assert(isMatch('b.txt', '!*.md'));
    assert(!isMatch('c.md', '!*.md'));
    assert(!isMatch('a/a/a.js', '!**/a.js'));
    assert(!isMatch('a/b/a.js', '!**/a.js'));
    assert(!isMatch('a/c/a.js', '!**/a.js'));
    assert(isMatch('a/a/b.js', '!**/a.js'));
    assert(!isMatch('a/a/a/a.js', '!a/**/a.js'));
    assert(isMatch('b/a/b/a.js', '!a/**/a.js'));
    assert(isMatch('c/a/c/a.js', '!a/**/a.js'));
    assert(isMatch('a/a.txt', '!a/b.txt'));
    assert(!isMatch('a/b.txt', '!a/b.txt'));
    assert(isMatch('a/c.txt', '!a/b.txt'));
    assert(isMatch('a/b.js', '!**/*.md'));
    assert(isMatch('a.js', '!**/*.md'));
    assert(!isMatch('a/b.md', '!**/*.md'));
    assert(!isMatch('a.md', '!**/*.md'));
    assert(!isMatch('a/b.js', '**/*.md'));
    assert(!isMatch('a.js', '**/*.md'));
    assert(isMatch('a/b.md', '**/*.md'));
    assert(isMatch('a.md', '**/*.md'));
    assert(isMatch('a/b.js', '!**/*.md'));
    assert(isMatch('a.js', '!**/*.md'));
    assert(!isMatch('a/b.md', '!**/*.md'));
    assert(!isMatch('a.md', '!**/*.md'));
    assert(isMatch('a/b.js', '!*.md'));
    assert(isMatch('a.js', '!*.md'));
    assert(isMatch('a/b.md', '!*.md'));
    assert(!isMatch('a.md', '!*.md'));
    assert(isMatch('a.js', '!**/*.md'));
    assert(!isMatch('b.md', '!**/*.md'));
    assert(isMatch('c.txt', '!**/*.md'));
  });

  it('should support quoted strings', () => {
    assert(!isMatch('foo.md', '"!*".md'));
    assert(!isMatch('"!*".md', '"!*".md'));
    assert(isMatch('!*.md', '"!*".md'));

    assert(!isMatch('foo.md', '"!*".md', { keepQuotes: true }));
    assert(isMatch('"!*".md', '"!*".md', { keepQuotes: true }));
    assert(!isMatch('!*.md', '"!*".md', { keepQuotes: true }));

    assert(!isMatch('foo.md', '"**".md'));
    assert(!isMatch('"**".md', '"**".md'));
    assert(isMatch('**.md', '"**".md'));

    assert(!isMatch('foo.md', '"**".md', { keepQuotes: true }));
    assert(isMatch('"**".md', '"**".md', { keepQuotes: true }));
    assert(!isMatch('**.md', '"**".md', { keepQuotes: true }));
  });

  it('should negate dotfiles:', () => {
    assert(!isMatch('.dotfile.md', '!*.md'));
    assert(!isMatch('.dotfile.md', '!.*.md'));
    assert(isMatch('.dotfile.txt', '!*.md'));
    assert(isMatch('.dotfile.txt', '!*.md'));
    assert(isMatch('a/b/.dotfile', '!*.md'));
    assert(!isMatch('.gitignore', '!.gitignore'));
    assert(isMatch('a', '!.gitignore'));
    assert(isMatch('b', '!.gitignore'));
  });

  it('should negate files in the immediate directory:', () => {
    assert(isMatch('a/b.js', '!*.md'));
    assert(isMatch('a.js', '!*.md'));
    assert(isMatch('a/b.md', '!*.md'));
    assert(!isMatch('a.md', '!*.md'));
  });

  it('should not give special meaning to non-leading exclamations', () => {
    assert(!isMatch('a', 'a!!b'));
    assert(!isMatch('aa', 'a!!b'));
    assert(!isMatch('a/b', 'a!!b'));
    assert(!isMatch('a!b', 'a!!b'));
    assert(isMatch('a!!b', 'a!!b'));
    assert(!isMatch('a/!!/b', 'a!!b'));
  });

  it('should negate files in any directory:', () => {
    assert(isMatch('a/a.txt', '!a/b.txt'));
    assert(!isMatch('a/b.txt', '!a/b.txt'));
    assert(isMatch('a/c.txt', '!a/b.txt'));
  });

  it('should support negation with nested directories', () => {
    assert(isMatch('a', '!a/**'));
    assert(!isMatch('a/', '!a/**'));
    assert(!isMatch('a/b', '!a/**'));
    assert(!isMatch('a/b/c', '!a/**'));
    assert(isMatch('b', '!a/**'));
    assert(isMatch('b/c', '!a/**'));

    assert(isMatch('a', '!(a/**)'));
    assert(!isMatch('a/', '!(a/**)'));
    assert(!isMatch('a/b', '!(a/**)'));
    assert(!isMatch('a/b/c', '!(a/**)'));
    assert(isMatch('b', '!(a/**)'));
    assert(isMatch('b/c', '!(a/**)'));

    assert(isMatch('a/a', 'a/!(b*)'));
    assert(!isMatch('a/b', 'a/!(b*)'));
    assert(!isMatch('a/b/c', 'a/!(b*)'));
    assert(isMatch('a/c', 'a/!(b*)'));

    assert(isMatch('a/a', 'a/!(b*)/**'));
    assert(isMatch('a/a/', 'a/!(b*)/**'));
    assert(!isMatch('a/b', 'a/!(b*)/**'));
    assert(!isMatch('a/b/c', 'a/!(b*)/**'));
    assert(isMatch('a/c', 'a/!(b*)/**'));
    assert(isMatch('a/c/', 'a/!(b*)/**'));

    assert(isMatch('foo', '!f*b'));
    assert(isMatch('bar', '!f*b'));
    assert(!isMatch('fab', '!f*b'));

    assert(isMatch('foo', ['f*', '!f*b']));
    assert(isMatch('bar', ['f*', '!f*b']));
    assert(isMatch('fab', ['f*', '!f*b']));
  });

  it('should return an array of matches for a literal string', () => {
    assert(!isMatch('a/a', '(a/b)'));
    assert(isMatch('a/b', '(a/b)'));
    assert(!isMatch('a/c', '(a/b)'));
    assert(!isMatch('b/a', '(a/b)'));
    assert(!isMatch('b/b', '(a/b)'));
    assert(!isMatch('b/c', '(a/b)'));

    assert(!isMatch('a/a', 'a/b'));
    assert(isMatch('a/b', 'a/b'));
    assert(!isMatch('a/c', 'a/b'));
    assert(!isMatch('b/a', 'a/b'));
    assert(!isMatch('b/b', 'a/b'));
    assert(!isMatch('b/c', 'a/b'));
  });

  it('should return an array of matches for an array of literal strings', () => {
    assert(!isMatch('a/a', ['(a/b)', 'a/c']));
    assert(isMatch('a/b', ['(a/b)', 'a/c']));
    assert(isMatch('a/c', ['(a/b)', 'a/c']));
    assert(!isMatch('b/a', ['(a/b)', 'a/c']));
    assert(!isMatch('b/b', ['(a/b)', 'a/c']));
    assert(!isMatch('b/c', ['(a/b)', 'a/c']));

    assert(!isMatch('a/a', ['a/b', 'b/b']));
    assert(isMatch('a/b', ['a/b', 'b/b']));
    assert(!isMatch('a/c', ['a/b', 'b/b']));
    assert(!isMatch('b/a', ['a/b', 'b/b']));
    assert(isMatch('b/b', ['a/b', 'b/b']));
    assert(!isMatch('b/c', ['a/b', 'b/b']));
  });

  it('should support regex logical or', () => {
    assert(isMatch('a/a', ['a/(a|c)']));
    assert(!isMatch('a/b', ['a/(a|c)']));
    assert(isMatch('a/c', ['a/(a|c)']));

    assert(isMatch('a/a', ['a/(a|b|c)', 'a/b']));
    assert(isMatch('a/b', ['a/(a|b|c)', 'a/b']));
    assert(isMatch('a/c', ['a/(a|b|c)', 'a/b']));
  });

  it('should support regex ranges', () => {
    assert(!isMatch('a/a', 'a/[b-c]'));
    assert(isMatch('a/b', 'a/[b-c]'));
    assert(isMatch('a/c', 'a/[b-c]'));

    assert(isMatch('a/a', 'a/[a-z]'));
    assert(isMatch('a/b', 'a/[a-z]'));
    assert(isMatch('a/c', 'a/[a-z]'));
    assert(!isMatch('a/x/y', 'a/[a-z]'));
    assert(isMatch('a/x', 'a/[a-z]'));
  });

  it('should support single globs (*)', () => {
    assert(isMatch('a', ['*']));
    assert(isMatch('b', ['*']));
    assert(!isMatch('a/a', ['*']));
    assert(!isMatch('a/b', ['*']));
    assert(!isMatch('a/c', ['*']));
    assert(!isMatch('a/x', ['*']));
    assert(!isMatch('a/a/a', ['*']));
    assert(!isMatch('a/a/b', ['*']));
    assert(!isMatch('a/a/a/a', ['*']));
    assert(!isMatch('a/a/a/a/a', ['*']));
    assert(!isMatch('x/y', ['*']));
    assert(!isMatch('z/z', ['*']));

    assert(!isMatch('a', ['*/*']));
    assert(!isMatch('b', ['*/*']));
    assert(isMatch('a/a', ['*/*']));
    assert(isMatch('a/b', ['*/*']));
    assert(isMatch('a/c', ['*/*']));
    assert(isMatch('a/x', ['*/*']));
    assert(!isMatch('a/a/a', ['*/*']));
    assert(!isMatch('a/a/b', ['*/*']));
    assert(!isMatch('a/a/a/a', ['*/*']));
    assert(!isMatch('a/a/a/a/a', ['*/*']));
    assert(isMatch('x/y', ['*/*']));
    assert(isMatch('z/z', ['*/*']));

    assert(!isMatch('a', ['*/*/*']));
    assert(!isMatch('b', ['*/*/*']));
    assert(!isMatch('a/a', ['*/*/*']));
    assert(!isMatch('a/b', ['*/*/*']));
    assert(!isMatch('a/c', ['*/*/*']));
    assert(!isMatch('a/x', ['*/*/*']));
    assert(isMatch('a/a/a', ['*/*/*']));
    assert(isMatch('a/a/b', ['*/*/*']));
    assert(!isMatch('a/a/a/a', ['*/*/*']));
    assert(!isMatch('a/a/a/a/a', ['*/*/*']));
    assert(!isMatch('x/y', ['*/*/*']));
    assert(!isMatch('z/z', ['*/*/*']));

    assert(!isMatch('a', ['*/*/*/*']));
    assert(!isMatch('b', ['*/*/*/*']));
    assert(!isMatch('a/a', ['*/*/*/*']));
    assert(!isMatch('a/b', ['*/*/*/*']));
    assert(!isMatch('a/c', ['*/*/*/*']));
    assert(!isMatch('a/x', ['*/*/*/*']));
    assert(!isMatch('a/a/a', ['*/*/*/*']));
    assert(!isMatch('a/a/b', ['*/*/*/*']));
    assert(isMatch('a/a/a/a', ['*/*/*/*']));
    assert(!isMatch('a/a/a/a/a', ['*/*/*/*']));
    assert(!isMatch('x/y', ['*/*/*/*']));
    assert(!isMatch('z/z', ['*/*/*/*']));

    assert(!isMatch('a', ['*/*/*/*/*']));
    assert(!isMatch('b', ['*/*/*/*/*']));
    assert(!isMatch('a/a', ['*/*/*/*/*']));
    assert(!isMatch('a/b', ['*/*/*/*/*']));
    assert(!isMatch('a/c', ['*/*/*/*/*']));
    assert(!isMatch('a/x', ['*/*/*/*/*']));
    assert(!isMatch('a/a/a', ['*/*/*/*/*']));
    assert(!isMatch('a/a/b', ['*/*/*/*/*']));
    assert(!isMatch('a/a/a/a', ['*/*/*/*/*']));
    assert(isMatch('a/a/a/a/a', ['*/*/*/*/*']));
    assert(!isMatch('x/y', ['*/*/*/*/*']));
    assert(!isMatch('z/z', ['*/*/*/*/*']));

    assert(!isMatch('a', ['a/*']));
    assert(!isMatch('b', ['a/*']));
    assert(isMatch('a/a', ['a/*']));
    assert(isMatch('a/b', ['a/*']));
    assert(isMatch('a/c', ['a/*']));
    assert(isMatch('a/x', ['a/*']));
    assert(!isMatch('a/a/a', ['a/*']));
    assert(!isMatch('a/a/b', ['a/*']));
    assert(!isMatch('a/a/a/a', ['a/*']));
    assert(!isMatch('a/a/a/a/a', ['a/*']));
    assert(!isMatch('x/y', ['a/*']));
    assert(!isMatch('z/z', ['a/*']));

    assert(!isMatch('a', ['a/*/*']));
    assert(!isMatch('b', ['a/*/*']));
    assert(!isMatch('a/a', ['a/*/*']));
    assert(!isMatch('a/b', ['a/*/*']));
    assert(!isMatch('a/c', ['a/*/*']));
    assert(!isMatch('a/x', ['a/*/*']));
    assert(isMatch('a/a/a', ['a/*/*']));
    assert(isMatch('a/a/b', ['a/*/*']));
    assert(!isMatch('a/a/a/a', ['a/*/*']));
    assert(!isMatch('a/a/a/a/a', ['a/*/*']));
    assert(!isMatch('x/y', ['a/*/*']));
    assert(!isMatch('z/z', ['a/*/*']));

    assert(!isMatch('a', ['a/*/*/*']));
    assert(!isMatch('b', ['a/*/*/*']));
    assert(!isMatch('a/a', ['a/*/*/*']));
    assert(!isMatch('a/b', ['a/*/*/*']));
    assert(!isMatch('a/c', ['a/*/*/*']));
    assert(!isMatch('a/x', ['a/*/*/*']));
    assert(!isMatch('a/a/a', ['a/*/*/*']));
    assert(!isMatch('a/a/b', ['a/*/*/*']));
    assert(isMatch('a/a/a/a', ['a/*/*/*']));
    assert(!isMatch('a/a/a/a/a', ['a/*/*/*']));
    assert(!isMatch('x/y', ['a/*/*/*']));
    assert(!isMatch('z/z', ['a/*/*/*']));

    assert(!isMatch('a', ['a/*/*/*/*']));
    assert(!isMatch('b', ['a/*/*/*/*']));
    assert(!isMatch('a/a', ['a/*/*/*/*']));
    assert(!isMatch('a/b', ['a/*/*/*/*']));
    assert(!isMatch('a/c', ['a/*/*/*/*']));
    assert(!isMatch('a/x', ['a/*/*/*/*']));
    assert(!isMatch('a/a/a', ['a/*/*/*/*']));
    assert(!isMatch('a/a/b', ['a/*/*/*/*']));
    assert(!isMatch('a/a/a/a', ['a/*/*/*/*']));
    assert(isMatch('a/a/a/a/a', ['a/*/*/*/*']));
    assert(!isMatch('x/y', ['a/*/*/*/*']));
    assert(!isMatch('z/z', ['a/*/*/*/*']));

    assert(!isMatch('a', ['a/*/a']));
    assert(!isMatch('b', ['a/*/a']));
    assert(!isMatch('a/a', ['a/*/a']));
    assert(!isMatch('a/b', ['a/*/a']));
    assert(!isMatch('a/c', ['a/*/a']));
    assert(!isMatch('a/x', ['a/*/a']));
    assert(isMatch('a/a/a', ['a/*/a']));
    assert(!isMatch('a/a/b', ['a/*/a']));
    assert(!isMatch('a/a/a/a', ['a/*/a']));
    assert(!isMatch('a/a/a/a/a', ['a/*/a']));
    assert(!isMatch('x/y', ['a/*/a']));
    assert(!isMatch('z/z', ['a/*/a']));

    assert(!isMatch('a', ['a/*/b']));
    assert(!isMatch('b', ['a/*/b']));
    assert(!isMatch('a/a', ['a/*/b']));
    assert(!isMatch('a/b', ['a/*/b']));
    assert(!isMatch('a/c', ['a/*/b']));
    assert(!isMatch('a/x', ['a/*/b']));
    assert(!isMatch('a/a/a', ['a/*/b']));
    assert(isMatch('a/a/b', ['a/*/b']));
    assert(!isMatch('a/a/a/a', ['a/*/b']));
    assert(!isMatch('a/a/a/a/a', ['a/*/b']));
    assert(!isMatch('x/y', ['a/*/b']));
    assert(!isMatch('z/z', ['a/*/b']));
  });

  it('should respect single star dirs with globstars', () => {
    assert(!isMatch('a', ['*/**/a']));
    assert(!isMatch('b', ['*/**/a']));
    assert(isMatch('a/a', ['*/**/a']));
    assert(!isMatch('a/b', ['*/**/a']));
    assert(!isMatch('a/c', ['*/**/a']));
    assert(!isMatch('a/x', ['*/**/a']));
    assert(isMatch('a/a/a', ['*/**/a']));
    assert(!isMatch('a/a/b', ['*/**/a']));
    assert(isMatch('a/a/a/a', ['*/**/a']));
    assert(isMatch('a/a/a/a/a', ['*/**/a']));
    assert(!isMatch('x/y', ['*/**/a']));
    assert(!isMatch('z/z', ['*/**/a']));
  });

  it('should optionally match a trailing slash when single star is last char', () => {
    assert(isMatch('a', ['*']));
    assert(isMatch('a/', ['*']));
    assert(!isMatch('a/a', ['*']));
    assert(!isMatch('a/b', ['*']));
    assert(!isMatch('a/c', ['*']));
    assert(!isMatch('a/x', ['*']));
    assert(!isMatch('a/x/y', ['*']));
    assert(!isMatch('a/x/y/z', ['*']));

    assert(!isMatch('a', ['*/']));
    assert(isMatch('a/', ['*/']));
    assert(!isMatch('a/a', ['*/']));
    assert(!isMatch('a/b', ['*/']));
    assert(!isMatch('a/c', ['*/']));
    assert(!isMatch('a/x', ['*/']));
    assert(!isMatch('a/x/y', ['*/']));
    assert(!isMatch('a/x/y/z', ['*/']));

    assert(!isMatch('a', ['*/*']));
    assert(!isMatch('a/', ['*/*']));
    assert(isMatch('a/a', ['*/*']));
    assert(isMatch('a/b', ['*/*']));
    assert(isMatch('a/c', ['*/*']));
    assert(isMatch('a/x', ['*/*']));
    assert(!isMatch('a/x/y', ['*/*']));
    assert(!isMatch('a/x/y/z', ['*/*']));

    assert(!isMatch('a', ['a/*']));
    assert(!isMatch('a/', ['a/*']));
    assert(isMatch('a/a', ['a/*']));
    assert(isMatch('a/b', ['a/*']));
    assert(isMatch('a/c', ['a/*']));
    assert(isMatch('a/x', ['a/*']));
    assert(!isMatch('a/x/y', ['a/*']));
    assert(!isMatch('a/x/y/z', ['a/*']));
  });

  it('should support globstars (**)', () => {
    assert(isMatch('a', '**'));
    assert(isMatch('a/', '**'));
    assert(isMatch('a/a', '**'));
    assert(isMatch('a/b', '**'));
    assert(isMatch('a/c', '**'));
    assert(isMatch('a/x', '**'));
    assert(isMatch('a/x/y', '**'));
    assert(isMatch('a/x/y/z', '**'));

    assert(isMatch('a', '**/a'));
    assert(isMatch('a/', '**/a'));
    assert(isMatch('a/a', '**/a'));
    assert(!isMatch('a/b', '**/a'));
    assert(!isMatch('a/c', '**/a'));
    assert(!isMatch('a/x', '**/a'));
    assert(!isMatch('a/x/y', '**/a'));
    assert(!isMatch('a/x/y/z', '**/a'));

    assert(!isMatch('a', 'a/**'));
    assert(isMatch('a/', 'a/**'));
    assert(isMatch('a/a', 'a/**'));
    assert(isMatch('a/b', 'a/**'));
    assert(isMatch('a/c', 'a/**'));
    assert(isMatch('a/x', 'a/**'));
    assert(isMatch('a/x/y', 'a/**'));
    assert(isMatch('a/x/y/z', 'a/**'));

    assert(!isMatch('a', 'a/**/*'));
    assert(!isMatch('a/', 'a/**/*'));
    assert(isMatch('a/a', 'a/**/*'));
    assert(isMatch('a/b', 'a/**/*'));
    assert(isMatch('a/c', 'a/**/*'));
    assert(isMatch('a/x', 'a/**/*'));
    assert(isMatch('a/x/y', 'a/**/*'));
    assert(isMatch('a/x/y/z', 'a/**/*'));

    assert(!isMatch('a', 'a/**/**/*'));
    assert(!isMatch('a/', 'a/**/**/*'));
    assert(isMatch('a/a', 'a/**/**/*'));
    assert(isMatch('a/b', 'a/**/**/*'));
    assert(isMatch('a/c', 'a/**/**/*'));
    assert(isMatch('a/x', 'a/**/**/*'));
    assert(isMatch('a/x/y', 'a/**/**/*'));
    assert(isMatch('a/x/y/z', 'a/**/**/*'));

    assert(!isMatch('a', 'a/**/**/**/*'));
    assert(!isMatch('a/', 'a/**/**/**/*'));
    assert(isMatch('a/a', 'a/**/**/**/*'));
    assert(isMatch('a/b', 'a/**/**/**/*'));
    assert(isMatch('a/c', 'a/**/**/**/*'));
    assert(isMatch('a/x', 'a/**/**/**/*'));
    assert(isMatch('a/x/y', 'a/**/**/**/*'));
    assert(isMatch('a/x/y/z', 'a/**/**/**/*'));


    assert(isMatch('a/b/foo/bar/baz.qux', 'a/b/**/bar/**/*.*'));
    assert(isMatch('a/b/bar/baz.qux', 'a/b/**/bar/**/*.*'));
  });

  it('should work with file extensions', () => {
    assert(!isMatch('a.txt', ['a/**/*.txt']));
    assert(isMatch('a/b.txt', ['a/**/*.txt']));
    assert(isMatch('a/x/y.txt', ['a/**/*.txt']));
    assert(!isMatch('a/x/y/z', ['a/**/*.txt']));

    assert(!isMatch('a.txt', ['a/*.txt']));
    assert(isMatch('a/b.txt', ['a/*.txt']));
    assert(!isMatch('a/x/y.txt', ['a/*.txt']));
    assert(!isMatch('a/x/y/z', ['a/*.txt']));

    assert(isMatch('a.txt', ['a*.txt']));
    assert(!isMatch('a/b.txt', ['a*.txt']));
    assert(!isMatch('a/x/y.txt', ['a*.txt']));
    assert(!isMatch('a/x/y/z', ['a*.txt']));

    assert(isMatch('a.txt', ['*.txt']));
    assert(!isMatch('a/b.txt', ['*.txt']));
    assert(!isMatch('a/x/y.txt', ['*.txt']));
    assert(!isMatch('a/x/y/z', ['*.txt']));
  });

  it('should support basic brace patterns', () => {
    assert(isMatch('a.txt', ['a{,/**/}*.txt']));
    assert(isMatch('a/b.txt', ['a{,/**/,/}*.txt']));
    assert(isMatch('a/x/y.txt', ['a{,/**/}*.txt']));
    assert(!isMatch('a/x/y/z', ['a{,/**/}*.txt']));
  });

  it('should allow globstars to be used in braces', () => {
    assert(isMatch('a/b/foo/bar/baz.qux', 'a/b{,/**}/bar{,/**}/*.*'));
    assert(isMatch('a/b/bar/baz.qux', 'a/b{,/**}/bar{,/**}/*.*'));
  });

  it('should correctly match slashes', () => {
    assert(!isMatch('foo/bar', '**/'));
    assert(!isMatch('foo/bar', '**/*/'));
    assert(!isMatch('foo/bar', '*/*/'));
    assert(!isMatch('foo/bar/', '**/*'));
    assert(!isMatch('foo/bar/', '*/*'));
    assert(isMatch('foo', '*/**'));
    assert(isMatch('foo/', '*/**'));
    assert(isMatch('foo/bar', '**/*'));
    assert(isMatch('foo/bar', '*/*'));
    assert(isMatch('foo/bar', '*/**'));
    assert(isMatch('foo/bar/', '**/'));
    assert(isMatch('foo/bar/', '**/*/'));
    assert(isMatch('foo/bar/', '*/**'));
    assert(isMatch('foo/bar/', '*/*/'));
  });

  it('should match regex character classes', () => {
    assert(!isMatch('foo/bar', '**/[c-k]*'));
    assert(isMatch('foo/jar', '**/[c-k]*'));

    assert(isMatch('foo/bar', '**/[^c-k]*'));
    assert(!isMatch('foo/jar', '**/[^c-k]*'));

    assert(isMatch('foo/bar', '**/[a-i]*'));
    assert(!isMatch('foo/jar', '**/[a-i]*'));

    assert(!isMatch('foo/bar', '**/[^a-i]*'));
    assert(isMatch('foo/jar', '**/[^a-i]*'));

    assert(isMatch('foo/bar', '**/!([a-k])*'));
    assert(isMatch('foo/jar', '**/!([a-k])*'));

    assert(isMatch('foo/bar', '**/!([a-i])*'));
    assert(isMatch('foo/jar', '**/!([a-i])*'));

    assert(isMatch('foo/bar', '**/[a-i]ar'));
    assert(!isMatch('foo/jar', '**/[a-i]ar'));
  });

  it('should match literal brackets', () => {
    assert(isMatch('a [b]', 'a \\[b\\]'));
    assert(isMatch('a [b] c', 'a [b] c'));
    assert(isMatch('a [b]', 'a \\[b\\]*'));
    assert(isMatch('a [bc]', 'a \\[bc\\]*'));
    assert(!isMatch('a [b]', 'a \\[b\\].*'));
    assert(isMatch('a [b].js', 'a \\[b\\].*'));
  });
});
