'use strict';

require('mocha');
const assert = require('assert');
const picomatch = require('..');
const { isMatch } = require('./support');

describe('negation patterns - "!"', () => {
  beforeEach(() => picomatch.clearCache());

  it('should patterns with a leading "!" as negated/inverted globs', () => {
    assert(!isMatch('abc', '!*'));
    assert(!isMatch('abc', '!abc'));
    assert(!isMatch('bar.md', '*!.md'));
    assert(!isMatch('bar.md', 'foo!.md'));
    assert(!isMatch('foo!.md', '\\!*!*.md'));
    assert(!isMatch('foo!bar.md', '\\!*!*.md'));
    assert(isMatch('!foo!.md', '*!*.md'));
    assert(isMatch('!foo!.md', '\\!*!*.md'));
    assert(isMatch('abc', '!*foo'));
    assert(isMatch('abc', '!foo*'));
    assert(isMatch('abc', '!xyz'));
    assert(isMatch('ba!r.js', '*!*.*'));
    assert(isMatch('bar.md', '*.md'));
    assert(isMatch('foo!.md', '*!*.*'));
    assert(isMatch('foo!.md', '*!*.md'));
    assert(isMatch('foo!.md', '*!.md'));
    assert(isMatch('foo!.md', '*.md'));
    assert(isMatch('foo!.md', 'foo!.md'));
    assert(isMatch('foo!bar.md', '*!*.md'));
    assert(isMatch('foobar.md', '*b*.md'));
  });

  it('should treat non-leading "!" as literal characters', () => {
    assert(!isMatch('a', 'a!!b'));
    assert(!isMatch('aa', 'a!!b'));
    assert(!isMatch('a/b', 'a!!b'));
    assert(!isMatch('a!b', 'a!!b'));
    assert(isMatch('a!!b', 'a!!b'));
    assert(!isMatch('a/!!/b', 'a!!b'));
  });

  it('should support negation in globs that have no other special characters', () => {
    assert(!isMatch('a/b', '!a/b'));
    assert(isMatch('a', '!a/b'));
    assert(isMatch('a.b', '!a/b'));
    assert(isMatch('a/a', '!a/b'));
    assert(isMatch('a/c', '!a/b'));
    assert(isMatch('b/a', '!a/b'));
    assert(isMatch('b/b', '!a/b'));
    assert(isMatch('b/c', '!a/b'));
  });

  it('should support negation with globs', () => {
    assert(!isMatch('a/a', '!(*/*)'));
    assert(!isMatch('a/b', '!(*/*)'));
    assert(!isMatch('a/c', '!(*/*)'));
    assert(!isMatch('b/a', '!(*/*)'));
    assert(!isMatch('b/b', '!(*/*)'));
    assert(!isMatch('b/c', '!(*/*)'));
    assert(!isMatch('a/b', '!(*/b)'));
    assert(!isMatch('b/b', '!(*/b)'));
    assert(!isMatch('a/b', '!(a/b)'));
    assert(!isMatch('a', '!*'));
    assert(!isMatch('a.b', '!*'));
    assert(!isMatch('a/a', '!*/*'));
    assert(!isMatch('a/b', '!*/*'));
    assert(!isMatch('a/c', '!*/*'));
    assert(!isMatch('b/a', '!*/*'));
    assert(!isMatch('b/b', '!*/*'));
    assert(!isMatch('b/c', '!*/*'));
    assert(!isMatch('a/b', '!*/b'));
    assert(!isMatch('b/b', '!*/b'));
    assert(!isMatch('a/c', '!*/c'));
    assert(!isMatch('a/c', '!*/c'));
    assert(!isMatch('b/c', '!*/c'));
    assert(!isMatch('b/c', '!*/c'));
    assert(!isMatch('bar', '!*a*'));
    assert(!isMatch('fab', '!*a*'));
    assert(!isMatch('a/a', '!a/(*)'));
    assert(!isMatch('a/b', '!a/(*)'));
    assert(!isMatch('a/c', '!a/(*)'));
    assert(!isMatch('a/b', '!a/(b)'));
    assert(!isMatch('a/a', '!a/*'));
    assert(!isMatch('a/b', '!a/*'));
    assert(!isMatch('a/c', '!a/*'));
    assert(!isMatch('fab', '!f*b'));
    assert(isMatch('a', '!(*/*)'));
    assert(isMatch('a.b', '!(*/*)'));
    assert(isMatch('a', '!(*/b)'));
    assert(isMatch('a.b', '!(*/b)'));
    assert(isMatch('a/a', '!(*/b)'));
    assert(isMatch('a/c', '!(*/b)'));
    assert(isMatch('b/a', '!(*/b)'));
    assert(isMatch('b/c', '!(*/b)'));
    assert(isMatch('a', '!(a/b)'));
    assert(isMatch('a.b', '!(a/b)'));
    assert(isMatch('a/a', '!(a/b)'));
    assert(isMatch('a/c', '!(a/b)'));
    assert(isMatch('b/a', '!(a/b)'));
    assert(isMatch('b/b', '!(a/b)'));
    assert(isMatch('b/c', '!(a/b)'));
    assert(isMatch('a/a', '!*'));
    assert(isMatch('a/b', '!*'));
    assert(isMatch('a/c', '!*'));
    assert(isMatch('b/a', '!*'));
    assert(isMatch('b/b', '!*'));
    assert(isMatch('b/c', '!*'));
    assert(isMatch('a', '!*/*'));
    assert(isMatch('a.b', '!*/*'));
    assert(isMatch('a', '!*/b'));
    assert(isMatch('a.b', '!*/b'));
    assert(isMatch('a/a', '!*/b'));
    assert(isMatch('a/c', '!*/b'));
    assert(isMatch('b/a', '!*/b'));
    assert(isMatch('b/c', '!*/b'));
    assert(isMatch('a', '!*/c'));
    assert(isMatch('a.b', '!*/c'));
    assert(isMatch('a/a', '!*/c'));
    assert(isMatch('a/b', '!*/c'));
    assert(isMatch('b/a', '!*/c'));
    assert(isMatch('b/b', '!*/c'));
    assert(isMatch('foo', '!*a*'));
    assert(isMatch('a', '!a/(*)'));
    assert(isMatch('a.b', '!a/(*)'));
    assert(isMatch('b/a', '!a/(*)'));
    assert(isMatch('b/b', '!a/(*)'));
    assert(isMatch('b/c', '!a/(*)'));
    assert(isMatch('a', '!a/(b)'));
    assert(isMatch('a.b', '!a/(b)'));
    assert(isMatch('a/a', '!a/(b)'));
    assert(isMatch('a/c', '!a/(b)'));
    assert(isMatch('b/a', '!a/(b)'));
    assert(isMatch('b/b', '!a/(b)'));
    assert(isMatch('b/c', '!a/(b)'));
    assert(isMatch('a', '!a/*'));
    assert(isMatch('a.b', '!a/*'));
    assert(isMatch('b/a', '!a/*'));
    assert(isMatch('b/b', '!a/*'));
    assert(isMatch('b/c', '!a/*'));
    assert(isMatch('bar', '!f*b'));
    assert(isMatch('foo', '!f*b'));
  });

  it('should negate files with extensions', () => {
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
    assert(isMatch('"!*".md', '"!*".md'));
    assert(isMatch('!*.md', '"!*".md'));

    assert(!isMatch('foo.md', '"!*".md', { keepQuotes: true }));
    assert(isMatch('"!*".md', '"!*".md', { keepQuotes: true }));
    assert(!isMatch('!*.md', '"!*".md', { keepQuotes: true }));

    assert(!isMatch('foo.md', '"**".md'));
    assert(isMatch('"**".md', '"**".md'));
    assert(isMatch('**.md', '"**".md'));

    assert(!isMatch('foo.md', '"**".md', { keepQuotes: true }));
    assert(isMatch('"**".md', '"**".md', { keepQuotes: true }));
    assert(!isMatch('**.md', '"**".md', { keepQuotes: true }));
  });

  it('should negate dotfiles', () => {
    assert(!isMatch('.dotfile.md', '!.*.md'));
    assert(isMatch('.dotfile.md', '!*.md'));
    assert(isMatch('.dotfile.txt', '!*.md'));
    assert(isMatch('.dotfile.txt', '!*.md'));
    assert(isMatch('a/b/.dotfile', '!*.md'));
    assert(!isMatch('.gitignore', '!.gitignore'));
    assert(isMatch('a', '!.gitignore'));
    assert(isMatch('b', '!.gitignore'));
  });

  it('should not match slashes with a single star', () => {
    assert(isMatch('foo/bar.md', '!*.md'));
    assert(!isMatch('foo.md', '!*.md'));
  });

  it('should match nested directories with globstars', () => {
    assert(!isMatch('a/', '!a/**'));
    assert(!isMatch('a/b', '!a/**'));
    assert(!isMatch('a/b/c', '!a/**'));
    assert(isMatch('a', '!a/**'));
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

    assert(isMatch('a/a/', 'a/!(b*)/**'));
    assert(isMatch('a/a', 'a/!(b*)'));
    assert(!isMatch('a/a', 'a/!(b*)/**'));
    assert(!isMatch('a/b', 'a/!(b*)/**'));
    assert(!isMatch('a/b/c', 'a/!(b*)/**'));
    assert(!isMatch('a/c', 'a/!(b*)/**'));
    assert(isMatch('a/c', 'a/!(b*)'));
    assert(isMatch('a/c/', 'a/!(b*)/**'));

    assert(isMatch('foo', '!f*b'));
    assert(isMatch('bar', '!f*b'));
    assert(!isMatch('fab', '!f*b'));
  });
});
