'use strict';

require('mocha');
const path = require('path');
const fill = require('fill-range');
const assert = require('assert');
const picomatch = require('..');
const { isMatch } = require('./support');

describe('picomatch', () => {
  beforeEach(() => picomatch.clearCache());

  describe('non-globs', () => {
    it('should match literal strings', () => {
      assert(!isMatch('aaa\\bbb', 'aaa/bbb', { nocache: true }));
      assert(isMatch('aaa/bbb', 'aaa/bbb', { nocache: true }));

      path.sep = '\\';
      assert(isMatch('aaa\\bbb', 'aaa/bbb', { nocache: true }));
      assert(isMatch('aaa/bbb', 'aaa/bbb', { nocache: true }));
      path.sep = '/';

      assert(isMatch('foo', 'foo'));
      assert(!isMatch('bar', 'foo'));
      assert(!isMatch('aaa', 'aa'));
      assert(isMatch('aaa', 'aaa'));
      assert(isMatch('aaa', ['aa', 'aaa']));
      assert(isMatch('aaa/bbb', 'aaa/bbb'));
      assert(isMatch('aaa/bbb', 'aaa[/]bbb'));
      assert(isMatch('aaa\\bbb', ['aaa\\bbb', 'aaa/bbb'], { unixify: true }));
      assert(isMatch('aaa/bbb', ['aaa\\bbb', 'aaa/bbb']));
    });

    it('should correctly deal with empty globs', () => {
      assert(!isMatch('ab', ''));
      assert(!isMatch('a', ''));
      assert(!isMatch('.', ''));
    });

    it('should handle literal strings (non-glob patterns)', () => {
      assert(!isMatch('/ab', '/a'));
      assert(!isMatch('ab', '/a'));
      assert(!isMatch('ab', 'a'));
      assert(!isMatch('abc', ''));
      assert(!isMatch('abcd', 'ab'));
      assert(!isMatch('abcd', 'abc'));
      assert(!isMatch('abcd', 'bc'));
      assert(!isMatch('abcd', 'cd'));
      assert(isMatch('.', '.'));
      assert(isMatch('/a', '/a'));
      assert(isMatch('a', 'a'));
      assert(isMatch('ab', 'ab'));
      assert(isMatch('abcd', 'abcd'));
    });
  });

  describe('character matching', () => {
    it('should match windows drives with globstars', () => {
      assert(isMatch('bar/', '**'));
      assert(isMatch('A://', '**'));
      assert(isMatch('B:foo/a/b/c/d', '**'));
      assert(isMatch('C:/Users/', '**'));
      assert(isMatch('c:\\', '**'));
      assert(isMatch('C:\\Users\\', '**'));
      assert(isMatch('C:cwd/another', '**'));
      assert(isMatch('C:cwd\\another', '**'));
    });

    it('should not match multiple windows directories with a single star', () => {
      path.sep = '\\';
      assert(isMatch('c:\\', '*', { nocache: true }));
      assert(!isMatch('C:\\Users\\', '*', { nocache: true }));
      assert(!isMatch('C:cwd\\another', '*', { nocache: true }));
      path.sep = '/';
    });

    it('should match mixed slashes on windows', () => {
      path.sep = '\\';
      assert(isMatch('//C://user\\docs\\Letter.txt', '**', { nocache: true }));
      assert(isMatch('//C:\\\\user/docs/Letter.txt', '**', { nocache: true }));
      assert(isMatch(':\\', '*', { nocache: true }));
      assert(isMatch(':\\', ':*', { nocache: true }));
      assert(isMatch('\\\\foo/bar', '**', { nocache: true }));
      assert(isMatch('\\\\foo/bar', '/*/*', { nocache: true }));
      assert(isMatch('\\\\unc\\admin$', '**', { nocache: true }));
      assert(isMatch('\\\\unc\\admin$', '/*/*$', { nocache: true }));
      assert(isMatch('\\\\unc\\admin$\\system32', '/*/*$/*32', { nocache: true }));
      assert(isMatch('\\\\unc\\share\\foo', '/u*/s*/f*', { nocache: true }));
      assert(isMatch('foo\\bar\\baz', 'f*/*/*', { nocache: true }));
      path.sep = '/';
    });

    it('should match mixed slashes when options.unixify is true', () => {
      assert(isMatch('//C://user\\docs\\Letter.txt', '**', { nocache: true, unixify: true }));
      assert(isMatch('//C:\\\\user/docs/Letter.txt', '**', { nocache: true, unixify: true }));
      assert(isMatch(':\\', '*', { nocache: true, unixify: true }));
      assert(isMatch(':\\', ':*', { nocache: true, unixify: true }));
      assert(isMatch('\\\\foo/bar', '**', { nocache: true, unixify: true }));
      assert(isMatch('\\\\foo/bar', '/*/*', { nocache: true, unixify: true }));
      assert(isMatch('\\\\unc\\admin$', '**', { nocache: true, unixify: true }));
      assert(isMatch('\\\\unc\\admin$', '/*/*$', { nocache: true, unixify: true }));
      assert(isMatch('\\\\unc\\admin$\\system32', '/*/*$/*32', { nocache: true, unixify: true }));
      assert(isMatch('\\\\unc\\share\\foo', '/u*/s*/f*', { nocache: true, unixify: true }));
      assert(isMatch('foo\\bar\\baz', 'f*/*/*', { nocache: true, unixify: true }));
      assert(isMatch('//*:/**', '**'));
      assert(!isMatch('//server/file', '//*'));
      assert(isMatch('//server/file', '/**'));
      assert(isMatch('//server/file', '//**'));
      assert(isMatch('//server/file', '**'));
      assert(isMatch('//UNC//Server01//user//docs//Letter.txt', '**'));
      assert(isMatch('/foo', '**'));
      assert(isMatch('/foo/a/b/c/d', '**'));
      assert(isMatch('/foo/bar', '**'));
      assert(isMatch('/home/foo', '**'));
      assert(isMatch('/home/foo/..', '**/..'));
      assert(isMatch('/user/docs/Letter.txt', '**'));
      assert(isMatch('directory\\directory', '**'));
      assert(isMatch('a/b/c.js', '**'));
      assert(isMatch('directory/directory', '**'));
      assert(isMatch('foo/bar', '**'));
    });

    it('should match any character zero or more times, except for /', () => {
      assert(!isMatch('foo', '*a*'));
      assert(!isMatch('foo', '*r'));
      assert(!isMatch('foo', 'b*'));
      assert(!isMatch('foo/bar', '*'));
      assert(isMatch('foo/bar', '*/*'));
      assert(!isMatch('foo/bar/baz', '*/*'));
      assert(isMatch('bar', '*a*'));
      assert(isMatch('bar', '*r'));
      assert(isMatch('bar', 'b*'));
      assert(isMatch('foo/bar/baz', '*/*/*'));
    });

    it('should match dashes surrounded by spasces', () => {
      assert(isMatch('my/folder - 1', '*/*'));
      assert(isMatch('my/folder - copy (1)', '*/*'));
      assert(isMatch('my/folder - copy [1]', '*/*'));
      assert(isMatch('my/folder - foo + bar - copy [1]', '*/*'));
      assert(!isMatch('my/folder - foo + bar - copy [1]', '*'));

      assert(isMatch('my/folder - 1', '*/*-*'));
      assert(isMatch('my/folder - copy (1)', '*/*-*'));
      assert(isMatch('my/folder - copy [1]', '*/*-*'));
      assert(isMatch('my/folder - foo + bar - copy [1]', '*/*-*'));

      assert(isMatch('my/folder - 1', '*/*1'));
      assert(!isMatch('my/folder - copy (1)', '*/*1'));
    });

    it('should match dollary signs', () => {
      assert(!isMatch('$', '!($)'));
      assert(!isMatch('$', '!$'));
      assert(isMatch('$$', '!$'));
      assert(isMatch('$$', '!($)'));
      assert(isMatch('$$$', '!($)'));
      assert(isMatch('^', '!($)'));

      assert(isMatch('$', '!($$)'));
      assert(!isMatch('$$', '!($$)'));
      assert(isMatch('$$$', '!($$)'));
      assert(isMatch('^', '!($$)'));

      assert(!isMatch('$', '!($*)'));
      assert(!isMatch('$$', '!($*)'));
      assert(!isMatch('$$$', '!($*)'));
      assert(isMatch('^', '!($*)'));

      assert(isMatch('$', '*'));
      assert(isMatch('$$', '*'));
      assert(isMatch('$$$', '*'));
      assert(isMatch('^', '*'));

      assert(isMatch('$', '$*'));
      assert(isMatch('$$', '$*'));
      assert(isMatch('$$$', '$*'));
      assert(!isMatch('^', '$*'));

      assert(isMatch('$', '*$*'));
      assert(isMatch('$$', '*$*'));
      assert(isMatch('$$$', '*$*'));
      assert(!isMatch('^', '*$*'));

      assert(isMatch('$', '*$'));
      assert(isMatch('$$', '*$'));
      assert(isMatch('$$$', '*$'));
      assert(!isMatch('^', '*$'));

      assert(!isMatch('$', '?$'));
      assert(isMatch('$$', '?$'));
      assert(!isMatch('$$$', '?$'));
      assert(!isMatch('^', '?$'));
    });

    it('should match carets', () => {
      assert(!isMatch('^', '!(^)'));
      assert(isMatch('^^', '!(^)'));
      assert(isMatch('^^^', '!(^)'));
      assert(isMatch('&', '!(^)'));

      assert(isMatch('^', '!(^^)'));
      assert(!isMatch('^^', '!(^^)'));
      assert(isMatch('^^^', '!(^^)'));
      assert(isMatch('&', '!(^^)'));

      assert(!isMatch('^', '!(^*)'));
      assert(!isMatch('^^', '!(^*)'));
      assert(!isMatch('^^^', '!(^*)'));
      assert(isMatch('&', '!(^*)'));

      assert(isMatch('^', '*'));
      assert(isMatch('^^', '*'));
      assert(isMatch('^^^', '*'));
      assert(isMatch('&', '*'));

      assert(isMatch('^', '^*'));
      assert(isMatch('^^', '^*'));
      assert(isMatch('^^^', '^*'));
      assert(!isMatch('&', '^*'));

      assert(isMatch('^', '*^*'));
      assert(isMatch('^^', '*^*'));
      assert(isMatch('^^^', '*^*'));
      assert(!isMatch('&', '*^*'));

      assert(isMatch('^', '*^'));
      assert(isMatch('^^', '*^'));
      assert(isMatch('^^^', '*^'));
      assert(!isMatch('&', '*^'));

      assert(!isMatch('^', '?^'));
      assert(isMatch('^^', '?^'));
      assert(!isMatch('^^^', '?^'));
      assert(!isMatch('&', '?^'));
    });

    it('should...', () => {
      assert(isMatch('my/folder +1', '*/*'));
      assert(isMatch('my/folder -1', '*/*'));
      assert(isMatch('my/folder *1', '*/*'));
      assert(isMatch('my/folder', '*/*'));
      assert(isMatch('my/folder+foo+bar&baz', '*/*'));
      assert(isMatch('my/folder - $1.00', '*/*'));
      assert(isMatch('my/folder - ^1.00', '*/*'));
      assert(isMatch('my/folder - %1.00', '*/*'));

      assert(isMatch('my/folder +1', '*/!(*%)*'));
      assert(isMatch('my/folder -1', '*/!(*%)*'));
      assert(isMatch('my/folder *1', '*/!(*%)*'));
      assert(isMatch('my/folder', '*/!(*%)*'));
      assert(isMatch('my/folder+foo+bar&baz', '*/!(*%)*'));
      assert(isMatch('my/folder - $1.00', '*/!(*%)*'));
      assert(isMatch('my/folder - ^1.00', '*/!(*%)*'));
      assert(!isMatch('my/folder - %1.00', '*/!(*%)*'));

      assert(!isMatch('my/folder +1', '*/*$*'));
      assert(!isMatch('my/folder -1', '*/*$*'));
      assert(!isMatch('my/folder *1', '*/*$*'));
      assert(!isMatch('my/folder', '*/*$*'));
      assert(!isMatch('my/folder+foo+bar&baz', '*/*$*'));
      assert(isMatch('my/folder - $1.00', '*/*$*'));
      assert(!isMatch('my/folder - ^1.00', '*/*$*'));
      assert(!isMatch('my/folder - %1.00', '*/*$*'));

      assert(!isMatch('my/folder +1', '*/*^*'));
      assert(!isMatch('my/folder -1', '*/*^*'));
      assert(!isMatch('my/folder *1', '*/*^*'));
      assert(!isMatch('my/folder', '*/*^*'));
      assert(!isMatch('my/folder+foo+bar&baz', '*/*^*'));
      assert(!isMatch('my/folder - $1.00', '*/*^*'));
      assert(isMatch('my/folder - ^1.00', '*/*^*'));
      assert(!isMatch('my/folder - %1.00', '*/*^*'));

      assert(!isMatch('my/folder +1', '*/*&*'));
      assert(!isMatch('my/folder -1', '*/*&*'));
      assert(!isMatch('my/folder *1', '*/*&*'));
      assert(!isMatch('my/folder', '*/*&*'));
      assert(isMatch('my/folder+foo+bar&baz', '*/*&*'));
      assert(!isMatch('my/folder - $1.00', '*/*&*'));
      assert(!isMatch('my/folder - ^1.00', '*/*&*'));
      assert(!isMatch('my/folder - %1.00', '*/*&*'));

      assert(isMatch('my/folder +1', '*/*+*'));
      assert(!isMatch('my/folder -1', '*/*+*'));
      assert(!isMatch('my/folder *1', '*/*+*'));
      assert(!isMatch('my/folder', '*/*+*'));
      assert(isMatch('my/folder+foo+bar&baz', '*/*+*'));
      assert(!isMatch('my/folder - $1.00', '*/*+*'));
      assert(!isMatch('my/folder - ^1.00', '*/*+*'));
      assert(!isMatch('my/folder - %1.00', '*/*+*'));

      assert(!isMatch('my/folder +1', '*/*-*'));
      assert(isMatch('my/folder -1', '*/*-*'));
      assert(!isMatch('my/folder *1', '*/*-*'));
      assert(!isMatch('my/folder', '*/*-*'));
      assert(!isMatch('my/folder+foo+bar&baz', '*/*-*'));
      assert(isMatch('my/folder - $1.00', '*/*-*'));
      assert(isMatch('my/folder - ^1.00', '*/*-*'));
      assert(isMatch('my/folder - %1.00', '*/*-*'));

      assert(!isMatch('my/folder +1', '*/*\\**'));
      assert(!isMatch('my/folder -1', '*/*\\**'));
      assert(isMatch('my/folder *1', '*/*\\**'));
      assert(!isMatch('my/folder', '*/*\\**'));
      assert(!isMatch('my/folder+foo+bar&baz', '*/*\\**'));
      assert(!isMatch('my/folder - $1.00', '*/*\\**'));
      assert(!isMatch('my/folder - ^1.00', '*/*\\**'));
      assert(!isMatch('my/folder - %1.00', '*/*\\**'));
    });

    it('should match numbers', () => {
      assert(!isMatch('1', '*/*'));
      assert(isMatch('1/1', '*/*'));
      assert(isMatch('1/2', '*/*'));
      assert(!isMatch('1/1/1', '*/*'));
      assert(!isMatch('1/1/2', '*/*'));

      assert(!isMatch('1', '*/*/1'));
      assert(!isMatch('1/1', '*/*/1'));
      assert(!isMatch('1/2', '*/*/1'));
      assert(isMatch('1/1/1', '*/*/1'));
      assert(!isMatch('1/1/2', '*/*/1'));

      assert(!isMatch('1', '*/*/2'));
      assert(!isMatch('1/1', '*/*/2'));
      assert(!isMatch('1/2', '*/*/2'));
      assert(!isMatch('1/1/1', '*/*/2'));
      assert(isMatch('1/1/2', '*/*/2'));
    });

    it('should match square brackets', () => {
      assert(!isMatch('foo/bar - 1', '**/*\\[*\\]'));
      assert(!isMatch('foo/bar - copy (1)', '**/*\\[*\\]'));
      assert(!isMatch('foo/bar (1)', '**/*\\[*\\]'));
      assert(!isMatch('foo/bar (4)', '**/*\\[*\\]'));
      assert(!isMatch('foo/bar (7)', '**/*\\[*\\]'));
      assert(!isMatch('foo/bar (42)', '**/*\\[*\\]'));
      assert(isMatch('foo/bar - copy [1]', '**/*\\[*\\]'));
      assert(isMatch('foo/bar - foo + bar - copy [1]', '**/*\\[*\\]'));

      assert(isMatch('foo/bar - 1', '**/*[1]'));
      assert(!isMatch('foo/bar - copy (1)', '**/*[1]'));
      assert(!isMatch('foo/bar (1)', '**/*[1]'));
      assert(!isMatch('foo/bar (4)', '**/*[1]'));
      assert(!isMatch('foo/bar (7)', '**/*[1]'));
      assert(!isMatch('foo/bar (42)', '**/*[1]'));
      assert(isMatch('foo/bar - copy [1]', '**/*[1]'));
      assert(isMatch('foo/bar - foo + bar - copy [1]', '**/*[1]'));

      assert(!isMatch('foo/bar - 1', '**/*\\[1\\]'));
      assert(!isMatch('foo/bar - copy (1)', '**/*\\[1\\]'));
      assert(!isMatch('foo/bar (1)', '**/*\\[1\\]'));
      assert(!isMatch('foo/bar (4)', '**/*\\[1\\]'));
      assert(!isMatch('foo/bar (7)', '**/*\\[1\\]'));
      assert(!isMatch('foo/bar (42)', '**/*\\[1\\]'));
      assert(isMatch('foo/bar - copy [1]', '**/*\\[1\\]'));
      assert(isMatch('foo/bar - foo + bar - copy [1]', '**/*\\[1\\]'));

      assert(!isMatch('foo/bar - 1', '*/*\\[*\\]'));
      assert(!isMatch('foo/bar - copy (1)', '*/*\\[*\\]'));
      assert(!isMatch('foo/bar (1)', '*/*\\[*\\]'));
      assert(!isMatch('foo/bar (4)', '*/*\\[*\\]'));
      assert(!isMatch('foo/bar (7)', '*/*\\[*\\]'));
      assert(!isMatch('foo/bar (42)', '*/*\\[*\\]'));
      assert(isMatch('foo/bar - copy [1]', '*/*\\[*\\]'));
      assert(isMatch('foo/bar - foo + bar - copy [1]', '*/*\\[*\\]'));
    });

    it('should match parens', () => {
      const expandRange = (a, b) => `(${fill(a, b, { toRegex: true })})`;

      assert(!isMatch('foo/bar - 1', '*/* \\({4..10}\\)', { expandRange }));
      assert(!isMatch('foo/bar - copy (1)', '*/* \\({4..10}\\)', { expandRange }));
      assert(!isMatch('foo/bar (1)', '*/* \\({4..10}\\)', { expandRange }));
      assert(isMatch('foo/bar (4)', '*/* \\({4..10}\\)', { expandRange }));
      assert(isMatch('foo/bar (7)', '*/* \\({4..10}\\)', { expandRange }));
      assert(!isMatch('foo/bar (42)', '*/* \\({4..10}\\)', { expandRange }));
      assert(!isMatch('foo/bar - copy [1]', '*/* \\({4..10}\\)', { expandRange }));
      assert(!isMatch('foo/bar - foo + bar - copy [1]', '*/* \\({4..10}\\)', { expandRange }));

      assert(!isMatch('my/folder (Work, Accts)', '/*'));
      assert(isMatch('my/folder (Work, Accts)', '*/*'));
      assert(isMatch('my/folder (Work, Accts)', '*/*,*'));
      assert(isMatch('my/folder (Work, Accts)', '*/*(W*, *)*'));
      assert(isMatch('my/folder/(Work, Accts)', '**/*(W*, *)*'));
      assert(!isMatch('my/folder/(Work, Accts)', '*/*(W*, *)*'));
      assert(isMatch('foo(bar)baz', 'foo*baz'));
      assert(isMatch('foo(bar)baz', 'foo[bar()]+baz'));
    });

    it.skip('should throw an error on imbalanced, unescaped parens', () => {
      assert.throws(() => pm.makeRe('*)'), /Missing opening: "\("/);
      assert.throws(() => pm.makeRe('*('), /Missing closing: "\)"/);
    });

    it('should support regex lookbehinds', () => {
      let v = process.version;
      Reflect.defineProperty(process, 'version', { value: 'v6.0.0' });
      assert.throws(() => isMatch('foo/cbaz', 'foo/*(?<!c)baz'), /Node\.js v10 or higher/);
      Reflect.defineProperty(process, 'version', { value: v });

      if (parseInt(v.slice(1), 10) >= 10) {
        assert(isMatch('foo/cbaz', 'foo/*(?<!d)baz'));
        assert(!isMatch('foo/cbaz', 'foo/*(?<!c)baz'));
        assert(!isMatch('foo/cbaz', 'foo/*(?<=d)baz'));
        assert(isMatch('foo/cbaz', 'foo/*(?<=c)baz'));
      }
    });
  });

  describe('.match()', () => {
    it('should match ', () => {
      assert(isMatch('bar', 'b*'));
      assert(isMatch('bar', '*a*'));
      assert(isMatch('bar', '*r'));
      assert(!isMatch('foo', 'b*'));
      assert(!isMatch('foo', '*a*'));
      assert(!isMatch('foo', '*r'));
      assert(!isMatch('foo/bar', '*'));
    });

    it('should not match dotfiles with single star by default', () => {
      assert(isMatch('foo', '*'));
      assert(!isMatch('.foo', '*'));
      assert(isMatch('foo/bar', '*/*'));
      assert(!isMatch('foo/.bar', '*/*'));
      assert(!isMatch('foo/.bar/baz', '*/*/*'));
    });

    it('should not match dotfiles with globstars by default', () => {
      assert(isMatch('foo', '**/*'));
      assert(!isMatch('.foo', '**'));
      assert(!isMatch('.foo', '**/*'));
      assert(!isMatch('bar/.foo', '**/*'));
      assert(!isMatch('.bar', '**/*'));
      assert(!isMatch('foo/.bar', '**/*'));
      assert(!isMatch('foo/.bar', '**/*a*'));
    });

    it('should match dotfiles when a leading dot is in the pattern', () => {
      assert(!isMatch('foo', '**/.*a*'));
      assert(isMatch('.bar', '**/.*a*'));
      assert(isMatch('foo/.bar', '**/.*a*'));

      assert(!isMatch('foo', '.*a*'));
      assert(isMatch('.bar', '.*a*'));
      assert(!isMatch('bar', '.*a*'));

      assert(!isMatch('foo', '.b*'));
      assert(isMatch('.bar', '.b*'));
      assert(!isMatch('bar', '.b*'));

      assert(!isMatch('foo', '.*r'));
      assert(isMatch('.bar', '.*r'));
      assert(!isMatch('bar', '.*r'));
    });
  });

  describe('ranges', () => {
    it('should support valid regex ranges', () => {
      assert(isMatch('a.a', '[a-b].[a-b]'));
      assert(isMatch('a.b', '[a-b].[a-b]'));
      assert(!isMatch('a.a.a', '[a-b].[a-b]'));
      assert(!isMatch('c.a', '[a-b].[a-b]'));
      assert(!isMatch('d.a.d', '[a-b].[a-b]'));
      assert(!isMatch('a.bb', '[a-b].[a-b]'));
      assert(!isMatch('a.ccc', '[a-b].[a-b]'));

      assert(isMatch('a.a', '[a-d].[a-b]'));
      assert(isMatch('a.b', '[a-d].[a-b]'));
      assert(!isMatch('a.a.a', '[a-d].[a-b]'));
      assert(isMatch('c.a', '[a-d].[a-b]'));
      assert(!isMatch('d.a.d', '[a-d].[a-b]'));
      assert(!isMatch('a.bb', '[a-d].[a-b]'));
      assert(!isMatch('a.ccc', '[a-d].[a-b]'));

      assert(isMatch('a.a', '[a-d]*.[a-b]'));
      assert(isMatch('a.b', '[a-d]*.[a-b]'));
      assert(isMatch('a.a.a', '[a-d]*.[a-b]'));
      assert(isMatch('c.a', '[a-d]*.[a-b]'));
      assert(!isMatch('d.a.d', '[a-d]*.[a-b]'));
      assert(!isMatch('a.bb', '[a-d]*.[a-b]'));
      assert(!isMatch('a.ccc', '[a-d]*.[a-b]'));
    });

    it('should support valid regex ranges with glob negation patterns', () => {
      assert(!isMatch('a.a', '!*.[a-b]'));
      assert(!isMatch('a.b', '!*.[a-b]'));
      assert(!isMatch('a.a.a', '!*.[a-b]'));
      assert(!isMatch('c.a', '!*.[a-b]'));
      assert(isMatch('d.a.d', '!*.[a-b]'));
      assert(isMatch('a.bb', '!*.[a-b]'));
      assert(isMatch('a.ccc', '!*.[a-b]'));

      assert(!isMatch('a.a', '!*.[a-b]*'));
      assert(!isMatch('a.b', '!*.[a-b]*'));
      assert(!isMatch('a.a.a', '!*.[a-b]*'));
      assert(!isMatch('c.a', '!*.[a-b]*'));
      assert(!isMatch('d.a.d', '!*.[a-b]*'));
      assert(!isMatch('a.bb', '!*.[a-b]*'));
      assert(isMatch('a.ccc', '!*.[a-b]*'));

      assert(!isMatch('a.a', '![a-b].[a-b]'));
      assert(!isMatch('a.b', '![a-b].[a-b]'));
      assert(isMatch('a.a.a', '![a-b].[a-b]'));
      assert(isMatch('c.a', '![a-b].[a-b]'));
      assert(isMatch('d.a.d', '![a-b].[a-b]'));
      assert(isMatch('a.bb', '![a-b].[a-b]'));
      assert(isMatch('a.ccc', '![a-b].[a-b]'));

      assert(!isMatch('a.a', '![a-b]+.[a-b]+'));
      assert(!isMatch('a.b', '![a-b]+.[a-b]+'));
      assert(isMatch('a.a.a', '![a-b]+.[a-b]+'));
      assert(isMatch('c.a', '![a-b]+.[a-b]+'));
      assert(isMatch('d.a.d', '![a-b]+.[a-b]+'));
      assert(!isMatch('a.bb', '![a-b]+.[a-b]+'));
      assert(isMatch('a.ccc', '![a-b]+.[a-b]+'));
    });

    it('should support valid regex ranges with negation patterns', () => {
      assert(!isMatch('a.a', '*.[^a-b]'));
      assert(!isMatch('a.b', '*.[^a-b]'));
      assert(!isMatch('a.a.a', '*.[^a-b]'));
      assert(!isMatch('c.a', '*.[^a-b]'));
      assert(isMatch('d.a.d', '*.[^a-b]'));
      assert(!isMatch('a.bb', '*.[^a-b]'));
      assert(!isMatch('a.ccc', '*.[^a-b]'));

      assert(!isMatch('a.a', 'a.[^a-b]*'));
      assert(!isMatch('a.b', 'a.[^a-b]*'));
      assert(!isMatch('a.a.a', 'a.[^a-b]*'));
      assert(!isMatch('c.a', 'a.[^a-b]*'));
      assert(!isMatch('d.a.d', 'a.[^a-b]*'));
      assert(!isMatch('a.bb', 'a.[^a-b]*'));
      assert(isMatch('a.ccc', 'a.[^a-b]*'));
    });
  });

  // $echo a/{1..3}/b
  describe('bash options and features', () => {
    // from the Bash 4.3 specification/unit tests

    it('should handle "regular globbing":', () => {
      assert(!isMatch('*', 'a*'));
      assert(!isMatch('**', 'a*'));
      assert(!isMatch('\\*', 'a*'));
      assert(isMatch('a', 'a*'));
      assert(!isMatch('a/*', 'a*'));
      assert(isMatch('abc', 'a*'));
      assert(isMatch('abd', 'a*'));
      assert(isMatch('abe', 'a*'));
      assert(!isMatch('b', 'a*'));
      assert(!isMatch('bb', 'a*'));
      assert(!isMatch('bcd', 'a*'));
      assert(!isMatch('bdir/', 'a*'));
      assert(!isMatch('Beware', 'a*'));
      assert(!isMatch('c', 'a*'));
      assert(!isMatch('ca', 'a*'));
      assert(!isMatch('cb', 'a*'));
      assert(!isMatch('d', 'a*'));
      assert(!isMatch('dd', 'a*'));
      assert(!isMatch('de', 'a*'));

      assert(!isMatch('*', '\\a*'));
      assert(!isMatch('**', '\\a*'));
      assert(!isMatch('\\*', '\\a*'));
      assert(isMatch('a', '\\a*'));
      assert(!isMatch('a/*', '\\a*'));
      assert(isMatch('abc', '\\a*'));
      assert(isMatch('abd', '\\a*'));
      assert(isMatch('abe', '\\a*'));
      assert(!isMatch('b', '\\a*'));
      assert(!isMatch('bb', '\\a*'));
      assert(!isMatch('bcd', '\\a*'));
      assert(!isMatch('bdir/', '\\a*'));
      assert(!isMatch('Beware', '\\a*'));
      assert(!isMatch('c', '\\a*'));
      assert(!isMatch('ca', '\\a*'));
      assert(!isMatch('cb', '\\a*'));
      assert(!isMatch('d', '\\a*'));
      assert(!isMatch('dd', '\\a*'));
      assert(!isMatch('de', '\\a*'));
    });

    it('should match directories:', () => {
      assert(!isMatch('*', 'b*/'));
      assert(!isMatch('**', 'b*/'));
      assert(!isMatch('\\*', 'b*/'));
      assert(!isMatch('a', 'b*/'));
      assert(!isMatch('a/*', 'b*/'));
      assert(!isMatch('abc', 'b*/'));
      assert(!isMatch('abd', 'b*/'));
      assert(!isMatch('abe', 'b*/'));
      assert(!isMatch('b', 'b*/'));
      assert(!isMatch('bb', 'b*/'));
      assert(!isMatch('bcd', 'b*/'));
      assert(isMatch('bdir/', 'b*/'));
      assert(!isMatch('Beware', 'b*/'));
      assert(!isMatch('c', 'b*/'));
      assert(!isMatch('ca', 'b*/'));
      assert(!isMatch('cb', 'b*/'));
      assert(!isMatch('d', 'b*/'));
      assert(!isMatch('dd', 'b*/'));
      assert(!isMatch('de', 'b*/'));
    });

    it('should use escaped characters as literals:', () => {
      assert(!isMatch('*', '\\^'));
      assert(!isMatch('**', '\\^'));
      assert(!isMatch('\\*', '\\^'));
      assert(!isMatch('a', '\\^'));
      assert(!isMatch('a/*', '\\^'));
      assert(!isMatch('abc', '\\^'));
      assert(!isMatch('abd', '\\^'));
      assert(!isMatch('abe', '\\^'));
      assert(!isMatch('b', '\\^'));
      assert(!isMatch('bb', '\\^'));
      assert(!isMatch('bcd', '\\^'));
      assert(!isMatch('bdir/', '\\^'));
      assert(!isMatch('Beware', '\\^'));
      assert(!isMatch('c', '\\^'));
      assert(!isMatch('ca', '\\^'));
      assert(!isMatch('cb', '\\^'));
      assert(!isMatch('d', '\\^'));
      assert(!isMatch('dd', '\\^'));
      assert(!isMatch('de', '\\^'));

      assert(!isMatch('*', 'a\\*'));
      assert(!isMatch('**', 'a\\*'));
      assert(!isMatch('\\*', 'a\\*'));
      assert(!isMatch('a', 'a\\*'));
      assert(!isMatch('a/*', 'a\\*'));
      assert(!isMatch('abc', 'a\\*'));
      assert(!isMatch('abd', 'a\\*'));
      assert(!isMatch('abe', 'a\\*'));
      assert(!isMatch('b', 'a\\*'));
      assert(!isMatch('bb', 'a\\*'));
      assert(!isMatch('bcd', 'a\\*'));
      assert(!isMatch('bdir/', 'a\\*'));
      assert(!isMatch('Beware', 'a\\*'));
      assert(!isMatch('c', 'a\\*'));
      assert(!isMatch('ca', 'a\\*'));
      assert(!isMatch('cb', 'a\\*'));
      assert(!isMatch('d', 'a\\*'));
      assert(!isMatch('dd', 'a\\*'));
      assert(!isMatch('de', 'a\\*'));

      assert(isMatch('*', ['a\\*', '\\*']));
      assert(!isMatch('**', ['a\\*', '\\*']));
      assert(!isMatch('\\*', ['a\\*', '\\*']));
      assert(!isMatch('a', ['a\\*', '\\*']));
      assert(!isMatch('a/*', ['a\\*', '\\*']));
      assert(!isMatch('abc', ['a\\*', '\\*']));
      assert(!isMatch('abd', ['a\\*', '\\*']));
      assert(!isMatch('abe', ['a\\*', '\\*']));
      assert(!isMatch('b', ['a\\*', '\\*']));
      assert(!isMatch('bb', ['a\\*', '\\*']));
      assert(!isMatch('bcd', ['a\\*', '\\*']));
      assert(!isMatch('bdir/', ['a\\*', '\\*']));
      assert(!isMatch('Beware', ['a\\*', '\\*']));
      assert(!isMatch('c', ['a\\*', '\\*']));
      assert(!isMatch('ca', ['a\\*', '\\*']));
      assert(!isMatch('cb', ['a\\*', '\\*']));
      assert(!isMatch('d', ['a\\*', '\\*']));
      assert(!isMatch('dd', ['a\\*', '\\*']));
      assert(!isMatch('de', ['a\\*', '\\*']));

      assert(!isMatch('*', ['a\\*']));
      assert(!isMatch('**', ['a\\*']));
      assert(!isMatch('\\*', ['a\\*']));
      assert(!isMatch('a', ['a\\*']));
      assert(!isMatch('a/*', ['a\\*']));
      assert(!isMatch('abc', ['a\\*']));
      assert(!isMatch('abd', ['a\\*']));
      assert(!isMatch('abe', ['a\\*']));
      assert(!isMatch('b', ['a\\*']));
      assert(!isMatch('bb', ['a\\*']));
      assert(!isMatch('bcd', ['a\\*']));
      assert(!isMatch('bdir/', ['a\\*']));
      assert(!isMatch('Beware', ['a\\*']));
      assert(!isMatch('c', ['a\\*']));
      assert(!isMatch('ca', ['a\\*']));
      assert(!isMatch('cb', ['a\\*']));
      assert(!isMatch('d', ['a\\*']));
      assert(!isMatch('dd', ['a\\*']));
      assert(!isMatch('de', ['a\\*']));

      assert(!isMatch('*', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('**', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('\\*', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('a', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('a/*', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('abc', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('abd', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('abe', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('b', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('bb', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('bcd', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('bdir/', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('Beware', ['c*', 'a\\*', '*q*']));
      assert(isMatch('c', ['c*', 'a\\*', '*q*']));
      assert(isMatch('ca', ['c*', 'a\\*', '*q*']));
      assert(isMatch('cb', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('d', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('dd', ['c*', 'a\\*', '*q*']));
      assert(!isMatch('de', ['c*', 'a\\*', '*q*']));

      assert(isMatch('*', '\\**'));
      assert(isMatch('**', '\\**'));
      assert(!isMatch('\\*', '\\**'));
      assert(!isMatch('a', '\\**'));
      assert(!isMatch('a/*', '\\**'));
      assert(!isMatch('abc', '\\**'));
      assert(!isMatch('abd', '\\**'));
      assert(!isMatch('abe', '\\**'));
      assert(!isMatch('b', '\\**'));
      assert(!isMatch('bb', '\\**'));
      assert(!isMatch('bcd', '\\**'));
      assert(!isMatch('bdir/', '\\**'));
      assert(!isMatch('Beware', '\\**'));
      assert(!isMatch('c', '\\**'));
      assert(!isMatch('ca', '\\**'));
      assert(!isMatch('cb', '\\**'));
      assert(!isMatch('d', '\\**'));
      assert(!isMatch('dd', '\\**'));
      assert(!isMatch('de', '\\**'));
    });

    it('should work for quoted characters', () => {
      assert(!isMatch('*', '"***"'));
      assert(!isMatch('**', '"***"'));
      assert(!isMatch('\\*', '"***"'));
      assert(!isMatch('a', '"***"'));
      assert(!isMatch('a/*', '"***"'));
      assert(!isMatch('abc', '"***"'));
      assert(!isMatch('abd', '"***"'));
      assert(!isMatch('abe', '"***"'));
      assert(!isMatch('b', '"***"'));
      assert(!isMatch('bb', '"***"'));
      assert(!isMatch('bcd', '"***"'));
      assert(!isMatch('bdir/', '"***"'));
      assert(!isMatch('Beware', '"***"'));
      assert(!isMatch('c', '"***"'));
      assert(!isMatch('ca', '"***"'));
      assert(!isMatch('cb', '"***"'));
      assert(!isMatch('d', '"***"'));
      assert(!isMatch('dd', '"***"'));
      assert(!isMatch('de', '"***"'));
      assert(isMatch('***', '"***"'));

      assert(!isMatch('*', "'***'"));
      assert(!isMatch('**', "'***'"));
      assert(!isMatch('\\*', "'***'"));
      assert(!isMatch('a', "'***'"));
      assert(!isMatch('a/*', "'***'"));
      assert(!isMatch('abc', "'***'"));
      assert(!isMatch('abd', "'***'"));
      assert(!isMatch('abe', "'***'"));
      assert(!isMatch('b', "'***'"));
      assert(!isMatch('bb', "'***'"));
      assert(!isMatch('bcd', "'***'"));
      assert(!isMatch('bdir/', "'***'"));
      assert(!isMatch('Beware', "'***'"));
      assert(!isMatch('c', "'***'"));
      assert(!isMatch('ca', "'***'"));
      assert(!isMatch('cb', "'***'"));
      assert(!isMatch('d', "'***'"));
      assert(!isMatch('dd', "'***'"));
      assert(!isMatch('de', "'***'"));
      assert(isMatch('***', "'***'"));

      assert(!isMatch('*', '"***"'));
      assert(!isMatch('**', '"***"'));
      assert(!isMatch('\\*', '"***"'));
      assert(!isMatch('a', '"***"'));
      assert(!isMatch('a/*', '"***"'));
      assert(!isMatch('abc', '"***"'));
      assert(!isMatch('abd', '"***"'));
      assert(!isMatch('abe', '"***"'));
      assert(!isMatch('b', '"***"'));
      assert(!isMatch('bb', '"***"'));
      assert(!isMatch('bcd', '"***"'));
      assert(!isMatch('bdir/', '"***"'));
      assert(!isMatch('Beware', '"***"'));
      assert(!isMatch('c', '"***"'));
      assert(!isMatch('ca', '"***"'));
      assert(!isMatch('cb', '"***"'));
      assert(!isMatch('d', '"***"'));
      assert(!isMatch('dd', '"***"'));
      assert(!isMatch('de', '"***"'));

      assert(isMatch('*', '"*"*'));
      assert(isMatch('**', '"*"*'));
      assert(!isMatch('\\*', '"*"*'));
      assert(!isMatch('a', '"*"*'));
      assert(!isMatch('a/*', '"*"*'));
      assert(!isMatch('abc', '"*"*'));
      assert(!isMatch('abd', '"*"*'));
      assert(!isMatch('abe', '"*"*'));
      assert(!isMatch('b', '"*"*'));
      assert(!isMatch('bb', '"*"*'));
      assert(!isMatch('bcd', '"*"*'));
      assert(!isMatch('bdir/', '"*"*'));
      assert(!isMatch('Beware', '"*"*'));
      assert(!isMatch('c', '"*"*'));
      assert(!isMatch('ca', '"*"*'));
      assert(!isMatch('cb', '"*"*'));
      assert(!isMatch('d', '"*"*'));
      assert(!isMatch('dd', '"*"*'));
      assert(!isMatch('de', '"*"*'));
    });

    it('should match escaped quotes', () => {
      assert(!isMatch('*', '\\"**\\"'));
      assert(!isMatch('**', '\\"**\\"'));
      assert(!isMatch('\\*', '\\"**\\"'));
      assert(!isMatch('a', '\\"**\\"'));
      assert(!isMatch('a/*', '\\"**\\"'));
      assert(!isMatch('abc', '\\"**\\"'));
      assert(!isMatch('abd', '\\"**\\"'));
      assert(!isMatch('abe', '\\"**\\"'));
      assert(!isMatch('b', '\\"**\\"'));
      assert(!isMatch('bb', '\\"**\\"'));
      assert(!isMatch('bcd', '\\"**\\"'));
      assert(!isMatch('bdir/', '\\"**\\"'));
      assert(!isMatch('Beware', '\\"**\\"'));
      assert(!isMatch('c', '\\"**\\"'));
      assert(!isMatch('ca', '\\"**\\"'));
      assert(!isMatch('cb', '\\"**\\"'));
      assert(!isMatch('d', '\\"**\\"'));
      assert(!isMatch('dd', '\\"**\\"'));
      assert(!isMatch('de', '\\"**\\"'));
      assert(isMatch('"**"', '\\"**\\"'));

      assert(!isMatch('*', 'foo/\\"**\\"/bar'));
      assert(!isMatch('**', 'foo/\\"**\\"/bar'));
      assert(!isMatch('\\*', 'foo/\\"**\\"/bar'));
      assert(!isMatch('a', 'foo/\\"**\\"/bar'));
      assert(!isMatch('a/*', 'foo/\\"**\\"/bar'));
      assert(!isMatch('abc', 'foo/\\"**\\"/bar'));
      assert(!isMatch('abd', 'foo/\\"**\\"/bar'));
      assert(!isMatch('abe', 'foo/\\"**\\"/bar'));
      assert(!isMatch('b', 'foo/\\"**\\"/bar'));
      assert(!isMatch('bb', 'foo/\\"**\\"/bar'));
      assert(!isMatch('bcd', 'foo/\\"**\\"/bar'));
      assert(!isMatch('bdir/', 'foo/\\"**\\"/bar'));
      assert(!isMatch('Beware', 'foo/\\"**\\"/bar'));
      assert(!isMatch('c', 'foo/\\"**\\"/bar'));
      assert(!isMatch('ca', 'foo/\\"**\\"/bar'));
      assert(!isMatch('cb', 'foo/\\"**\\"/bar'));
      assert(!isMatch('d', 'foo/\\"**\\"/bar'));
      assert(!isMatch('dd', 'foo/\\"**\\"/bar'));
      assert(!isMatch('de', 'foo/\\"**\\"/bar'));
      assert(isMatch('foo/"**"/bar', 'foo/\\"**\\"/bar'));

      assert(!isMatch('*', 'foo/\\"*\\"/bar'));
      assert(!isMatch('**', 'foo/\\"*\\"/bar'));
      assert(!isMatch('\\*', 'foo/\\"*\\"/bar'));
      assert(!isMatch('a', 'foo/\\"*\\"/bar'));
      assert(!isMatch('a/*', 'foo/\\"*\\"/bar'));
      assert(!isMatch('abc', 'foo/\\"*\\"/bar'));
      assert(!isMatch('abd', 'foo/\\"*\\"/bar'));
      assert(!isMatch('abe', 'foo/\\"*\\"/bar'));
      assert(!isMatch('b', 'foo/\\"*\\"/bar'));
      assert(!isMatch('bb', 'foo/\\"*\\"/bar'));
      assert(!isMatch('bcd', 'foo/\\"*\\"/bar'));
      assert(!isMatch('bdir/', 'foo/\\"*\\"/bar'));
      assert(!isMatch('Beware', 'foo/\\"*\\"/bar'));
      assert(!isMatch('c', 'foo/\\"*\\"/bar'));
      assert(!isMatch('ca', 'foo/\\"*\\"/bar'));
      assert(!isMatch('cb', 'foo/\\"*\\"/bar'));
      assert(!isMatch('d', 'foo/\\"*\\"/bar'));
      assert(!isMatch('dd', 'foo/\\"*\\"/bar'));
      assert(!isMatch('de', 'foo/\\"*\\"/bar'));
      assert(isMatch('foo/"*"/bar', 'foo/\\"*\\"/bar'));
      assert(isMatch('foo/"a"/bar', 'foo/\\"*\\"/bar'));
      assert(isMatch('foo/"b"/bar', 'foo/\\"*\\"/bar'));
      assert(isMatch('foo/"c"/bar', 'foo/\\"*\\"/bar'));
      assert(!isMatch("foo/'*'/bar", 'foo/\\"*\\"/bar'));
      assert(!isMatch("foo/'a'/bar", 'foo/\\"*\\"/bar'));
      assert(!isMatch("foo/'b'/bar", 'foo/\\"*\\"/bar'));
      assert(!isMatch("foo/'c'/bar", 'foo/\\"*\\"/bar'));

      assert(!isMatch('*', 'foo/"*"/bar'));
      assert(!isMatch('**', 'foo/"*"/bar'));
      assert(!isMatch('\\*', 'foo/"*"/bar'));
      assert(!isMatch('a', 'foo/"*"/bar'));
      assert(!isMatch('a/*', 'foo/"*"/bar'));
      assert(!isMatch('abc', 'foo/"*"/bar'));
      assert(!isMatch('abd', 'foo/"*"/bar'));
      assert(!isMatch('abe', 'foo/"*"/bar'));
      assert(!isMatch('b', 'foo/"*"/bar'));
      assert(!isMatch('bb', 'foo/"*"/bar'));
      assert(!isMatch('bcd', 'foo/"*"/bar'));
      assert(!isMatch('bdir/', 'foo/"*"/bar'));
      assert(!isMatch('Beware', 'foo/"*"/bar'));
      assert(!isMatch('c', 'foo/"*"/bar'));
      assert(!isMatch('ca', 'foo/"*"/bar'));
      assert(!isMatch('cb', 'foo/"*"/bar'));
      assert(!isMatch('d', 'foo/"*"/bar'));
      assert(!isMatch('dd', 'foo/"*"/bar'));
      assert(!isMatch('de', 'foo/"*"/bar'));
      assert(isMatch('foo/*/bar', 'foo/"*"/bar'));
      assert(!isMatch('foo/"*"/bar', 'foo/"*"/bar'));
      assert(!isMatch('foo/"a"/bar', 'foo/"*"/bar'));
      assert(!isMatch('foo/"b"/bar', 'foo/"*"/bar'));
      assert(!isMatch('foo/"c"/bar', 'foo/"*"/bar'));
      assert(!isMatch("foo/'*'/bar", 'foo/"*"/bar'));
      assert(!isMatch("foo/'a'/bar", 'foo/"*"/bar'));
      assert(!isMatch("foo/'b'/bar", 'foo/"*"/bar'));
      assert(!isMatch("foo/'c'/bar", 'foo/"*"/bar'));

      assert(!isMatch('*', "\\'**\\'"));
      assert(!isMatch('**', "\\'**\\'"));
      assert(!isMatch('\\*', "\\'**\\'"));
      assert(!isMatch('a', "\\'**\\'"));
      assert(!isMatch('a/*', "\\'**\\'"));
      assert(!isMatch('abc', "\\'**\\'"));
      assert(!isMatch('abd', "\\'**\\'"));
      assert(!isMatch('abe', "\\'**\\'"));
      assert(!isMatch('b', "\\'**\\'"));
      assert(!isMatch('bb', "\\'**\\'"));
      assert(!isMatch('bcd', "\\'**\\'"));
      assert(!isMatch('bdir/', "\\'**\\'"));
      assert(!isMatch('Beware', "\\'**\\'"));
      assert(!isMatch('c', "\\'**\\'"));
      assert(!isMatch('ca', "\\'**\\'"));
      assert(!isMatch('cb', "\\'**\\'"));
      assert(!isMatch('d', "\\'**\\'"));
      assert(!isMatch('dd', "\\'**\\'"));
      assert(!isMatch('de', "\\'**\\'"));
      assert(isMatch("'**'", "\\'**\\'"));
    });

    it("Pattern from Larry Wall's Configure that caused bash to blow up:", () => {
      assert(!isMatch('*', '[a-c]b*'));
      assert(!isMatch('**', '[a-c]b*'));
      assert(!isMatch('\\*', '[a-c]b*'));
      assert(!isMatch('a', '[a-c]b*'));
      assert(!isMatch('a/*', '[a-c]b*'));
      assert(isMatch('abc', '[a-c]b*'));
      assert(isMatch('abd', '[a-c]b*'));
      assert(isMatch('abe', '[a-c]b*'));
      assert(!isMatch('b', '[a-c]b*'));
      assert(isMatch('bb', '[a-c]b*'));
      assert(!isMatch('bcd', '[a-c]b*'));
      assert(!isMatch('bdir/', '[a-c]b*'));
      assert(!isMatch('Beware', '[a-c]b*'));
      assert(!isMatch('c', '[a-c]b*'));
      assert(!isMatch('ca', '[a-c]b*'));
      assert(isMatch('cb', '[a-c]b*'));
      assert(!isMatch('d', '[a-c]b*'));
      assert(!isMatch('dd', '[a-c]b*'));
      assert(!isMatch('de', '[a-c]b*'));
    });

    it('should support character classes', () => {
      assert(!isMatch('*', 'a*[^c]'));
      assert(!isMatch('**', 'a*[^c]'));
      assert(!isMatch('\\*', 'a*[^c]'));
      assert(!isMatch('a', 'a*[^c]'));
      assert(!isMatch('a/*', 'a*[^c]'));
      assert(!isMatch('abc', 'a*[^c]'));
      assert(isMatch('abd', 'a*[^c]'));
      assert(isMatch('abe', 'a*[^c]'));
      assert(!isMatch('b', 'a*[^c]'));
      assert(!isMatch('bb', 'a*[^c]'));
      assert(!isMatch('bcd', 'a*[^c]'));
      assert(!isMatch('bdir/', 'a*[^c]'));
      assert(!isMatch('Beware', 'a*[^c]'));
      assert(!isMatch('c', 'a*[^c]'));
      assert(!isMatch('ca', 'a*[^c]'));
      assert(!isMatch('cb', 'a*[^c]'));
      assert(!isMatch('d', 'a*[^c]'));
      assert(!isMatch('dd', 'a*[^c]'));
      assert(!isMatch('de', 'a*[^c]'));
      assert(!isMatch('baz', 'a*[^c]'));
      assert(!isMatch('bzz', 'a*[^c]'));
      assert(!isMatch('BZZ', 'a*[^c]'));
      assert(!isMatch('beware', 'a*[^c]'));
      assert(!isMatch('BewAre', 'a*[^c]'));

      assert(isMatch('a-b', 'a[X-]b'));
      assert(isMatch('aXb', 'a[X-]b'));

      assert(!isMatch('*', '[a-y]*[^c]'));
      assert(!isMatch('**', '[a-y]*[^c]'));
      assert(!isMatch('\\*', '[a-y]*[^c]'));
      assert(!isMatch('a', '[a-y]*[^c]'));
      assert(!isMatch('a/*', '[a-y]*[^c]'));
      assert(!isMatch('abc', '[a-y]*[^c]'));
      assert(isMatch('abd', '[a-y]*[^c]'));
      assert(isMatch('abe', '[a-y]*[^c]'));
      assert(!isMatch('b', '[a-y]*[^c]'));
      assert(isMatch('bb', '[a-y]*[^c]'));
      assert(isMatch('bcd', '[a-y]*[^c]'));
      assert(isMatch('bdir/', '[a-y]*[^c]'));
      assert(!isMatch('Beware', '[a-y]*[^c]'));
      assert(!isMatch('c', '[a-y]*[^c]'));
      assert(isMatch('ca', '[a-y]*[^c]'));
      assert(isMatch('cb', '[a-y]*[^c]'));
      assert(!isMatch('d', '[a-y]*[^c]'));
      assert(isMatch('dd', '[a-y]*[^c]'));
      assert(isMatch('de', '[a-y]*[^c]'));
      assert(isMatch('baz', '[a-y]*[^c]'));
      assert(isMatch('bzz', '[a-y]*[^c]'));
      assert(!isMatch('BZZ', '[a-y]*[^c]'));
      assert(isMatch('beware', '[a-y]*[^c]'));
      assert(!isMatch('BewAre', '[a-y]*[^c]'));

      assert(isMatch('a*b/ooo', 'a\\*b/*'));
      assert(isMatch('a*b/ooo', 'a\\*?/*'));

      assert(!isMatch('*', 'a[b]c'));
      assert(!isMatch('**', 'a[b]c'));
      assert(!isMatch('\\*', 'a[b]c'));
      assert(!isMatch('a', 'a[b]c'));
      assert(!isMatch('a/*', 'a[b]c'));
      assert(isMatch('abc', 'a[b]c'));
      assert(!isMatch('abd', 'a[b]c'));
      assert(!isMatch('abe', 'a[b]c'));
      assert(!isMatch('b', 'a[b]c'));
      assert(!isMatch('bb', 'a[b]c'));
      assert(!isMatch('bcd', 'a[b]c'));
      assert(!isMatch('bdir/', 'a[b]c'));
      assert(!isMatch('Beware', 'a[b]c'));
      assert(!isMatch('c', 'a[b]c'));
      assert(!isMatch('ca', 'a[b]c'));
      assert(!isMatch('cb', 'a[b]c'));
      assert(!isMatch('d', 'a[b]c'));
      assert(!isMatch('dd', 'a[b]c'));
      assert(!isMatch('de', 'a[b]c'));
      assert(!isMatch('baz', 'a[b]c'));
      assert(!isMatch('bzz', 'a[b]c'));
      assert(!isMatch('BZZ', 'a[b]c'));
      assert(!isMatch('beware', 'a[b]c'));
      assert(!isMatch('BewAre', 'a[b]c'));

      assert(!isMatch('*', 'a["b"]c'));
      assert(!isMatch('**', 'a["b"]c'));
      assert(!isMatch('\\*', 'a["b"]c'));
      assert(!isMatch('a', 'a["b"]c'));
      assert(!isMatch('a/*', 'a["b"]c'));
      assert(isMatch('abc', 'a["b"]c'));
      assert(!isMatch('abd', 'a["b"]c'));
      assert(!isMatch('abe', 'a["b"]c'));
      assert(!isMatch('b', 'a["b"]c'));
      assert(!isMatch('bb', 'a["b"]c'));
      assert(!isMatch('bcd', 'a["b"]c'));
      assert(!isMatch('bdir/', 'a["b"]c'));
      assert(!isMatch('Beware', 'a["b"]c'));
      assert(!isMatch('c', 'a["b"]c'));
      assert(!isMatch('ca', 'a["b"]c'));
      assert(!isMatch('cb', 'a["b"]c'));
      assert(!isMatch('d', 'a["b"]c'));
      assert(!isMatch('dd', 'a["b"]c'));
      assert(!isMatch('de', 'a["b"]c'));
      assert(!isMatch('baz', 'a["b"]c'));
      assert(!isMatch('bzz', 'a["b"]c'));
      assert(!isMatch('BZZ', 'a["b"]c'));
      assert(!isMatch('beware', 'a["b"]c'));
      assert(!isMatch('BewAre', 'a["b"]c'));

      assert(!isMatch('*', 'a[\\\\b]c'));
      assert(!isMatch('**', 'a[\\\\b]c'));
      assert(!isMatch('\\*', 'a[\\\\b]c'));
      assert(!isMatch('a', 'a[\\\\b]c'));
      assert(!isMatch('a/*', 'a[\\\\b]c'));
      assert(isMatch('abc', 'a[\\\\b]c'));
      assert(!isMatch('abd', 'a[\\\\b]c'));
      assert(!isMatch('abe', 'a[\\\\b]c'));
      assert(!isMatch('b', 'a[\\\\b]c'));
      assert(!isMatch('bb', 'a[\\\\b]c'));
      assert(!isMatch('bcd', 'a[\\\\b]c'));
      assert(!isMatch('bdir/', 'a[\\\\b]c'));
      assert(!isMatch('Beware', 'a[\\\\b]c'));
      assert(!isMatch('c', 'a[\\\\b]c'));
      assert(!isMatch('ca', 'a[\\\\b]c'));
      assert(!isMatch('cb', 'a[\\\\b]c'));
      assert(!isMatch('d', 'a[\\\\b]c'));
      assert(!isMatch('dd', 'a[\\\\b]c'));
      assert(!isMatch('de', 'a[\\\\b]c'));
      assert(!isMatch('baz', 'a[\\\\b]c'));
      assert(!isMatch('bzz', 'a[\\\\b]c'));
      assert(!isMatch('BZZ', 'a[\\\\b]c'));
      assert(!isMatch('beware', 'a[\\\\b]c'));
      assert(!isMatch('BewAre', 'a[\\\\b]c'));

      assert(!isMatch('*', 'a[\\b]c'));
      assert(!isMatch('**', 'a[\\b]c'));
      assert(!isMatch('\\*', 'a[\\b]c'));
      assert(!isMatch('a', 'a[\\b]c'));
      assert(!isMatch('a/*', 'a[\\b]c'));
      assert(!isMatch('abc', 'a[\\b]c'));
      assert(!isMatch('abd', 'a[\\b]c'));
      assert(!isMatch('abe', 'a[\\b]c'));
      assert(!isMatch('b', 'a[\\b]c'));
      assert(!isMatch('bb', 'a[\\b]c'));
      assert(!isMatch('bcd', 'a[\\b]c'));
      assert(!isMatch('bdir/', 'a[\\b]c'));
      assert(!isMatch('Beware', 'a[\\b]c'));
      assert(!isMatch('c', 'a[\\b]c'));
      assert(!isMatch('ca', 'a[\\b]c'));
      assert(!isMatch('cb', 'a[\\b]c'));
      assert(!isMatch('d', 'a[\\b]c'));
      assert(!isMatch('dd', 'a[\\b]c'));
      assert(!isMatch('de', 'a[\\b]c'));
      assert(!isMatch('baz', 'a[\\b]c'));
      assert(!isMatch('bzz', 'a[\\b]c'));
      assert(!isMatch('BZZ', 'a[\\b]c'));
      assert(!isMatch('beware', 'a[\\b]c'));
      assert(!isMatch('BewAre', 'a[\\b]c'));

      assert(!isMatch('*', 'a[b-d]c'));
      assert(!isMatch('**', 'a[b-d]c'));
      assert(!isMatch('\\*', 'a[b-d]c'));
      assert(!isMatch('a', 'a[b-d]c'));
      assert(!isMatch('a/*', 'a[b-d]c'));
      assert(isMatch('abc', 'a[b-d]c'));
      assert(!isMatch('abd', 'a[b-d]c'));
      assert(!isMatch('abe', 'a[b-d]c'));
      assert(!isMatch('b', 'a[b-d]c'));
      assert(!isMatch('bb', 'a[b-d]c'));
      assert(!isMatch('bcd', 'a[b-d]c'));
      assert(!isMatch('bdir/', 'a[b-d]c'));
      assert(!isMatch('Beware', 'a[b-d]c'));
      assert(!isMatch('c', 'a[b-d]c'));
      assert(!isMatch('ca', 'a[b-d]c'));
      assert(!isMatch('cb', 'a[b-d]c'));
      assert(!isMatch('d', 'a[b-d]c'));
      assert(!isMatch('dd', 'a[b-d]c'));
      assert(!isMatch('de', 'a[b-d]c'));
      assert(!isMatch('baz', 'a[b-d]c'));
      assert(!isMatch('bzz', 'a[b-d]c'));
      assert(!isMatch('BZZ', 'a[b-d]c'));
      assert(!isMatch('beware', 'a[b-d]c'));
      assert(!isMatch('BewAre', 'a[b-d]c'));

      assert(!isMatch('*', 'a?c'));
      assert(!isMatch('**', 'a?c'));
      assert(!isMatch('\\*', 'a?c'));
      assert(!isMatch('a', 'a?c'));
      assert(!isMatch('a/*', 'a?c'));
      assert(isMatch('abc', 'a?c'));
      assert(!isMatch('abd', 'a?c'));
      assert(!isMatch('abe', 'a?c'));
      assert(!isMatch('b', 'a?c'));
      assert(!isMatch('bb', 'a?c'));
      assert(!isMatch('bcd', 'a?c'));
      assert(!isMatch('bdir/', 'a?c'));
      assert(!isMatch('Beware', 'a?c'));
      assert(!isMatch('c', 'a?c'));
      assert(!isMatch('ca', 'a?c'));
      assert(!isMatch('cb', 'a?c'));
      assert(!isMatch('d', 'a?c'));
      assert(!isMatch('dd', 'a?c'));
      assert(!isMatch('de', 'a?c'));
      assert(!isMatch('baz', 'a?c'));
      assert(!isMatch('bzz', 'a?c'));
      assert(!isMatch('BZZ', 'a?c'));
      assert(!isMatch('beware', 'a?c'));
      assert(!isMatch('BewAre', 'a?c'));

      assert(isMatch('man/man1/bash.1', '*/man*/bash.*'));

      assert(isMatch('*', '[^a-c]*'));
      assert(isMatch('**', '[^a-c]*'));
      assert(isMatch('\\*', '[^a-c]*'));
      assert(!isMatch('a', '[^a-c]*'));
      assert(!isMatch('a/*', '[^a-c]*'));
      assert(!isMatch('abc', '[^a-c]*'));
      assert(!isMatch('abd', '[^a-c]*'));
      assert(!isMatch('abe', '[^a-c]*'));
      assert(!isMatch('b', '[^a-c]*'));
      assert(!isMatch('bb', '[^a-c]*'));
      assert(!isMatch('bcd', '[^a-c]*'));
      assert(!isMatch('bdir/', '[^a-c]*'));
      assert(isMatch('Beware', '[^a-c]*'));
      assert(!isMatch('c', '[^a-c]*'));
      assert(!isMatch('ca', '[^a-c]*'));
      assert(!isMatch('cb', '[^a-c]*'));
      assert(isMatch('d', '[^a-c]*'));
      assert(isMatch('dd', '[^a-c]*'));
      assert(isMatch('de', '[^a-c]*'));
      assert(!isMatch('baz', '[^a-c]*'));
      assert(!isMatch('bzz', '[^a-c]*'));
      assert(isMatch('BZZ', '[^a-c]*'));
      assert(!isMatch('beware', '[^a-c]*'));
      assert(isMatch('BewAre', '[^a-c]*'));
    });

    it('should support basic wildmatch (brackets) features', () => {
      assert(!isMatch('aab', 'a[]-]b'));
      assert(!isMatch('ten', '[ten]'));
      assert(isMatch(']', ']'));
      assert(isMatch('a-b', 'a[]-]b'));
      assert(isMatch('a]b', 'a[]-]b'));
      assert(isMatch('a]b', 'a[]]b'));
      assert(isMatch('aab', 'a[\\]a\\-]b'));
      assert(isMatch('ten', 't[a-g]n'));
      assert(isMatch('ton', 't[^a-g]n'));
    });

    it('should support Extended slash-matching features', () => {
      assert(!isMatch('foo/bar', 'f[^eiu][^eiu][^eiu][^eiu][^eiu]r'));
      assert(isMatch('foo/bar', 'foo[/]bar'));
      assert(isMatch('foo-bar', 'f[^eiu][^eiu][^eiu][^eiu][^eiu]r'));
    });

    it('should match braces', () => {
      assert(isMatch('foo{}baz', 'foo[{a,b}]+baz'));
    });

    it('should match with brace patterns', () => {
      assert(isMatch('a/a', 'a/{a,b}'));
      assert(isMatch('a/b', 'a/{a,b}'));
      assert(!isMatch('a/c', 'a/{a,b}'));
      assert(!isMatch('b/b', 'a/{a,b}'));
      assert(!isMatch('b/b', 'a/{a,b,c}'));
      assert(isMatch('a/c', 'a/{a,b,c}'));
      assert(isMatch('a/a', 'a/{a..c}'));
      assert(isMatch('a/b', 'a/{a..c}'));
      assert(isMatch('a/c', 'a/{a..c}'));
      assert(isMatch('a/c', 'a/{a..c}', { expandRange: (a, b) => `([${a}-${b}])` }));
      assert(!isMatch('a/z', 'a/{a..c}', { expandRange: (a, b) => `([${a}-${b}])` }));
      assert(isMatch('a/99', 'a/{1..100}', {
        expandRange(a, b) {
          return `(${fill(a, b, { toRegex: true })})`;
        }
      }));
    });

    it('should match escaped characters', () => {
      assert(isMatch('\\*', '\\\\*'));
      assert(isMatch('XXX/\\', '[A-Z]+/\\\\'));
      assert(isMatch('[ab]', '\\[ab]'));
      assert(isMatch('[ab]', '[\\[:]ab]'));
    });

    it('should consolidate extra stars:', () => {
      assert(!isMatch('bbc', 'a**c'));
      assert(isMatch('abc', 'a**c'));
      assert(!isMatch('bbd', 'a**c'));

      assert(!isMatch('bbc', 'a***c'));
      assert(isMatch('abc', 'a***c'));
      assert(!isMatch('bbd', 'a***c'));

      assert(!isMatch('bbc', 'a*****?c'));
      assert(isMatch('abc', 'a*****?c'));
      assert(!isMatch('bbc', 'a*****?c'));

      assert(isMatch('bbc', '?*****??'));
      assert(isMatch('abc', '?*****??'));

      assert(isMatch('bbc', '*****??'));
      assert(isMatch('abc', '*****??'));

      assert(isMatch('bbc', '?*****?c'));
      assert(isMatch('abc', '?*****?c'));

      assert(isMatch('bbc', '?***?****c'));
      assert(isMatch('abc', '?***?****c'));
      assert(!isMatch('bbd', '?***?****c'));

      assert(isMatch('bbc', '?***?****?'));
      assert(isMatch('abc', '?***?****?'));

      assert(isMatch('bbc', '?***?****'));
      assert(isMatch('abc', '?***?****'));

      assert(isMatch('bbc', '*******c'));
      assert(isMatch('abc', '*******c'));

      assert(isMatch('bbc', '*******?'));
      assert(isMatch('abc', '*******?'));

      assert(isMatch('abcdecdhjk', 'a*cd**?**??k'));
      assert(isMatch('abcdecdhjk', 'a**?**cd**?**??k'));
      assert(isMatch('abcdecdhjk', 'a**?**cd**?**??k***'));
      assert(isMatch('abcdecdhjk', 'a**?**cd**?**??***k'));
      assert(isMatch('abcdecdhjk', 'a**?**cd**?**??***k**'));
      assert(isMatch('abcdecdhjk', 'a****c**?**??*****'));
    });

    it('none of these should output anything:', () => {
      assert(!isMatch('abc', '??**********?****?'));
      assert(!isMatch('abc', '??**********?****c'));
      assert(!isMatch('abc', '?************c****?****'));
      assert(!isMatch('abc', '*c*?**'));
      assert(!isMatch('abc', 'a*****c*?**'));
      assert(!isMatch('abc', 'a********???*******'));
      assert(!isMatch('a', '[]'));
      assert(!isMatch('[', '[abc'));
    });
  });

  describe('wildmat (git)', () => {
    it('Basic wildmat features', () => {
      assert(!isMatch('foo', '*f'));
      assert(!isMatch('foo', '??'));
      assert(!isMatch('foo', 'bar'));
      assert(!isMatch('foobar', 'foo\\*bar'));
      assert(!isMatch('', ''));
      assert(isMatch('?a?b', '\\??\\?b'));
      assert(isMatch('aaaaaaabababab', '*ab'));
      assert(isMatch('foo', '*'));
      assert(isMatch('foo', '*foo*'));
      assert(isMatch('foo', '???'));
      assert(isMatch('foo', 'f*'));
      assert(isMatch('foo', 'foo'));
      assert(isMatch('foobar', '*ob*a*r*'));
    });

    it('should support recursion', () => {
      assert(!isMatch('-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'));
      assert(!isMatch('-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'));
      assert(!isMatch('ab/cXd/efXg/hi', '*X*i'));
      assert(!isMatch('ab/cXd/efXg/hi', '*Xg*i'));
      assert(!isMatch('abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz', '**/*a*b*g*n*t'));
      assert(!isMatch('foo', '*/*/*'));
      assert(!isMatch('foo', 'fo'));
      assert(!isMatch('foo/bar', '*/*/*'));
      assert(!isMatch('foo/bar', 'foo?bar'));
      assert(!isMatch('foo/bb/aa/rr', '*/*/*'));
      assert(!isMatch('foo/bba/arr', 'foo*'));
      assert(!isMatch('foo/bba/arr', 'foo**'));
      assert(!isMatch('foo/bba/arr', 'foo/*'));
      assert(!isMatch('foo/bba/arr', 'foo/**arr'));
      assert(!isMatch('foo/bba/arr', 'foo/**z'));
      assert(!isMatch('foo/bba/arr', 'foo/*arr'));
      assert(!isMatch('foo/bba/arr', 'foo/*z'));
      assert(
        !isMatch('XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1', 'XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*')
      );
      assert(isMatch('-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'));
      assert(isMatch('ab/cXd/efXg/hi', '**/*X*/**/*i'));
      assert(isMatch('ab/cXd/efXg/hi', '*/*X*/*/*i'));
      assert(isMatch('abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt', '**/*a*b*g*n*t'));
      assert(isMatch('abcXdefXghi', '*X*i'));
      assert(isMatch('foo', 'foo'));
      assert(isMatch('foo/bar', 'foo/*'));
      assert(isMatch('foo/bar', 'foo/bar'));
      assert(isMatch('foo/bar', 'foo[/]bar'));
      assert(isMatch('foo/bb/aa/rr', '**/**/**'));
      assert(isMatch('foo/bba/arr', '*/*/*'));
      assert(isMatch('foo/bba/arr', 'foo/**'));
    });
  });

  describe('dotfiles', () => {
    describe('file name matching', () => {
      it('should not match a dot when the dot is not explicitly defined', () => {
        assert(!isMatch('.dot', '*dot'));
        assert(!isMatch('a/.dot', 'a/*dot'));
        assert(!isMatch('.dot', '**/*dot'));
        assert(!isMatch('.dot', '**/?dot'));
        assert(!isMatch('.dot', '*/*dot'));
        assert(!isMatch('.dot', '*/?dot'));
        assert(!isMatch('.dot', '/*dot'));
        assert(!isMatch('.dot', '/?dot'));
        assert(!isMatch('/.dot', '**/*dot'));
        assert(!isMatch('/.dot', '**/?dot'));
        assert(!isMatch('/.dot', '*/*dot'));
        assert(!isMatch('/.dot', '*/?dot'));
        assert(!isMatch('/.dot', '/*dot'));
        assert(!isMatch('/.dot', '/?dot'));
        assert(!isMatch('a/.dot', '*/*dot'));
        assert(!isMatch('a/.dot', '*/?dot'));
        assert(!isMatch('a/b/.dot', '**/*dot'));
        assert(!isMatch('a/b/.dot', '**/?dot'));

        // related https://github.com/jonschlinkert/micromatch/issues/63
        assert(!isMatch('/aaa/bbb/.git', '/aaa/bbb/**'));
        assert(!isMatch('aaa/bbb/.git', 'aaa/bbb/**'));
        assert(!isMatch('/aaa/bbb/ccc/.git', '/aaa/bbb/**'));
      });

      it('should not match leading dots with question marks', () => {
        assert(!isMatch('.dot', '?dot'));
        assert(!isMatch('/.dot', '/?dot'));
        assert(!isMatch('a/.dot', 'a/?dot'));
      });

      it('should match with double dots', () => {
        assert(!isMatch('a/../a', '../*'));
        assert(!isMatch('ab/../ac', '../*'));
        assert(isMatch('../a', '../*'));
        assert(!isMatch('a', '../*'));
        assert(!isMatch('../../b', '../*'));
        assert(isMatch('../c', '../*'));
        assert(!isMatch('../c/d', '../*'));

        assert(isMatch('a/../a', '*/../*'));
        assert(isMatch('ab/../ac', '*/../*'));
        assert(!isMatch('../a', '*/../*'));
        assert(!isMatch('a', '*/../*'));
        assert(!isMatch('../../b', '*/../*'));
        assert(!isMatch('../c', '*/../*'));
        assert(!isMatch('../c/d', '*/../*'));

        assert(isMatch('a/../a', '**/../*'));
        assert(isMatch('ab/../ac', '**/../*'));
        assert(isMatch('../a', '**/../*'));
        assert(!isMatch('a', '**/../*'));
        assert(!isMatch('../../b', '**/../*'));
        assert(isMatch('../c', '**/../*'));
        assert(!isMatch('../c/d', '**/../*'));
      });

      it('should match dots in root path when glob is prefixed with **/', () => {
        assert(isMatch('.x/', '**/.x/**'));
        assert(isMatch('.x/.x', '**/.x/**'));
        assert(isMatch('.x/a', '**/.x/**'));
        assert(isMatch('.x/a/b', '**/.x/**'));
        assert(isMatch('a/.x/b', '**/.x/**'));
        assert(isMatch('a/b/.x/', '**/.x/**'));
        assert(isMatch('a/b/.x/c', '**/.x/**'));
        assert(isMatch('a/b/.x/c/d', '**/.x/**'));
        assert(isMatch('a/b/.x/c/d/e', '**/.x/**'));
        assert(!isMatch('.x', '**/.x/**'));
        assert(!isMatch('a/b/.x', '**/.x/**'));
      });

      it('should match a dot when the dot is explicitly defined', () => {
        assert(isMatch('.bar.baz', '.*.*'));
        assert(isMatch('.bar.baz', '.*.*'));
        assert(!isMatch('.bar.baz', '.*.*/'));
        assert(isMatch('.bar.baz', '.*.baz'));
        assert(isMatch('.bar.baz/', '.*.*'));
        assert(isMatch('.bar.baz/', '.*.*/'));
        assert(isMatch('.dot', '.*ot'));
        assert(isMatch('.dot', '.[d]ot'));
        assert(isMatch('.dot.foo.bar', '.*ot.*.*'));
        assert(isMatch('.dotfile.js', '.*.js'));
        assert(isMatch('/.dot', '**/.[d]ot'));
        assert(isMatch('/.dot', '**/.dot*'));
        assert(isMatch('/.dot', '/.[d]ot'));
        assert(isMatch('/.dot', '/.dot*'));
        assert(isMatch('a/.dot', '**/.[d]ot'));
        assert(isMatch('a/.dot', '*/.[d]ot'));
        assert(isMatch('a/.dot', '*/.dot*'));
        assert(isMatch('a/b/.dot', '**/.[d]ot'));
        assert(isMatch('a/b/.dot', '**/.dot*'));
        assert(isMatch('.dot', '.[d]ot'));
        assert(isMatch('.dot', '.d?t'));
        assert(isMatch('.dot', '.dot*'));
      });
    });

    describe('options.dot', () => {
      it('should match dotfiles when `options.dot` is true', () => {
        assert(isMatch('/a/b/.dot', '**/*dot', { dot: true }));
        assert(isMatch('/a/b/.dot', '**/.[d]ot', { dot: true }));
        assert(isMatch('/a/b/.dot', '**/?dot', { dot: true }));
        assert(isMatch('.dotfile.js', '.*.js', { dot: true }));
        assert(isMatch('.dot', '*dot', { dot: true }));
        assert(isMatch('.dot', '?dot', { dot: true }));
        assert(isMatch('/a/b/.dot', '/**/*dot', { dot: true }));
        assert(isMatch('/a/b/.dot', '/**/.[d]ot', { dot: true }));
        assert(isMatch('/a/b/.dot', '/**/?dot', { dot: true }));
        assert(isMatch('a/b/.dot', '**/*dot', { dot: true }));
        assert(isMatch('a/b/.dot', '**/.[d]ot', { dot: true }));
        assert(isMatch('a/b/.dot', '**/?dot', { dot: true }));
      });

      it('should not match dotfiles when `options.dot` is false', () => {
        assert(!isMatch('a/b/.dot', '**/*dot', { dot: false }));
        assert(!isMatch('a/b/.dot', '**/?dot', { dot: false }));
      });

      it('should not match dotfiles when `.dot` is not defined and a dot is not in the glob pattern', () => {
        assert(!isMatch('a/b/.dot', '**/*dot'));
        assert(!isMatch('a/b/.dot', '**/?dot'));
      });
    });
  });

  describe('posix paths', () => {
    it('should match a literal string', () => {
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

    it('should match an array of literal strings', () => {
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

    it('should support globstars (**)', () => {
      assert(isMatch('a', ['a']));
      assert(isMatch('a/', ['a']));
      assert(!isMatch('a/a', ['a']));
      assert(!isMatch('a/b', ['a']));
      assert(!isMatch('a/c', ['a']));
      assert(!isMatch('a/x', ['a']));
      assert(!isMatch('a/x/y', ['a']));
      assert(!isMatch('a/x/y/z', ['a']));

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

      assert(isMatch('a', ['**']));
      assert(isMatch('a/', ['**']));
      assert(isMatch('a/a', ['**']));
      assert(isMatch('a/b', ['**']));
      assert(isMatch('a/c', ['**']));
      assert(isMatch('a/x', ['**']));
      assert(isMatch('a/x/y', ['**']));
      assert(isMatch('a/x/y/z', ['**']));

      assert(isMatch('a', ['**/a']));
      assert(isMatch('a/', ['**/a']));
      assert(isMatch('a/a', ['**/a']));
      assert(!isMatch('a/b', ['**/a']));
      assert(!isMatch('a/c', ['**/a']));
      assert(!isMatch('a/x', ['**/a']));
      assert(!isMatch('a/x/y', ['**/a']));
      assert(!isMatch('a/x/y/z', ['**/a']));

      assert(!isMatch('a', ['a/*']));
      assert(!isMatch('a/', ['a/*']));
      assert(isMatch('a/a', ['a/*']));
      assert(isMatch('a/b', ['a/*']));
      assert(isMatch('a/c', ['a/*']));
      assert(isMatch('a/x', ['a/*']));
      assert(!isMatch('a/x/y', ['a/*']));
      assert(!isMatch('a/x/y/z', ['a/*']));

      assert(!isMatch('a', ['a/**']));
      assert(isMatch('a/', ['a/**']));
      assert(isMatch('a/a', ['a/**']));
      assert(isMatch('a/b', ['a/**']));
      assert(isMatch('a/c', ['a/**']));
      assert(isMatch('a/x', ['a/**']));
      assert(isMatch('a/x/y', ['a/**']));
      assert(isMatch('a/x/y/z', ['a/**']));

      assert(!isMatch('a', ['a/**/*']));
      assert(!isMatch('a/', ['a/**/*']));
      assert(isMatch('a/a', ['a/**/*']));
      assert(isMatch('a/b', ['a/**/*']));
      assert(isMatch('a/c', ['a/**/*']));
      assert(isMatch('a/x', ['a/**/*']));
      assert(isMatch('a/x/y', ['a/**/*']));
      assert(isMatch('a/x/y/z', ['a/**/*']));

      assert(!isMatch('a', ['a/**/**/*']));
      assert(!isMatch('a/', ['a/**/**/*']));
      assert(isMatch('a/a', ['a/**/**/*']));
      assert(isMatch('a/b', ['a/**/**/*']));
      assert(isMatch('a/c', ['a/**/**/*']));
      assert(isMatch('a/x', ['a/**/**/*']));
      assert(isMatch('a/x/y', ['a/**/**/*']));
      assert(isMatch('a/x/y/z', ['a/**/**/*']));

      assert(isMatch('a/b/foo/bar/baz.qux', 'a/b/**/bar/**/*.*'));
      assert(isMatch('a/b/bar/baz.qux', 'a/b/**/bar/**/*.*'));
    });

    it('should support negation patterns', () => {
      assert(isMatch('a/a', ['!a/b']));
      assert(!isMatch('a/b', ['!a/b']));
      assert(isMatch('a/c', ['!a/b']));
      assert(isMatch('b/a', ['!a/b']));
      assert(isMatch('b/b', ['!a/b']));
      assert(isMatch('b/c', ['!a/b']));

      assert(isMatch('a/a', ['*/*', '!a/b', '!*/c']));
      assert(isMatch('a/b', ['*/*', '!a/b', '!*/c']));
      assert(isMatch('a/c', ['*/*', '!a/b', '!*/c']));
      assert(isMatch('b/a', ['*/*', '!a/b', '!*/c']));
      assert(isMatch('b/b', ['*/*', '!a/b', '!*/c']));
      assert(isMatch('b/c', ['*/*', '!a/b', '!*/c']));

      assert(isMatch('a/a', ['!a/b', '!*/c']));
      assert(isMatch('a/b', ['!a/b', '!*/c']));
      assert(isMatch('a/c', ['!a/b', '!*/c']));
      assert(isMatch('b/a', ['!a/b', '!*/c']));
      assert(isMatch('b/b', ['!a/b', '!*/c']));
      assert(isMatch('b/c', ['!a/b', '!*/c']));

      assert(isMatch('a/a', ['!a/b', '!a/c']));
      assert(isMatch('a/b', ['!a/b', '!a/c']));
      assert(isMatch('a/c', ['!a/b', '!a/c']));
      assert(isMatch('b/a', ['!a/b', '!a/c']));
      assert(isMatch('b/b', ['!a/b', '!a/c']));
      assert(isMatch('b/c', ['!a/b', '!a/c']));

      assert(isMatch('a/a', ['!a/(b)']));
      assert(!isMatch('a/b', ['!a/(b)']));
      assert(isMatch('a/c', ['!a/(b)']));
      assert(isMatch('b/a', ['!a/(b)']));
      assert(isMatch('b/b', ['!a/(b)']));
      assert(isMatch('b/c', ['!a/(b)']));

      assert(isMatch('a/a', ['!(a/b)']));
      assert(!isMatch('a/b', ['!(a/b)']));
      assert(isMatch('a/c', ['!(a/b)']));
      assert(isMatch('b/a', ['!(a/b)']));
      assert(isMatch('b/b', ['!(a/b)']));
      assert(isMatch('b/c', ['!(a/b)']));
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

    it('should match literal brackets', () => {
      assert(isMatch('a [b]', 'a \\[b\\]'));
      assert(isMatch('a [b] c', 'a [b] c'));
      assert(isMatch('a [b]', 'a \\[b\\]*'));
      assert(isMatch('a [bc]', 'a \\[bc\\]*'));
      assert(!isMatch('a [b]', 'a \\[b\\].*'));
      assert(isMatch('a [b].js', 'a \\[b\\].*'));
    });
  });

  describe('error handling:', () => {
    it('should throw on bad args', () => {
      assert.throws(() => isMatch({}), /expected a string/);
    });
  });

  describe('escaping', () => {
    it('should support escaped characters', () => {
      assert(!isMatch('abc', 'abc\\*'));
      assert(isMatch('abc*', 'abc\\*'));
    });
  });

  describe('negation', () => {
    it('should support negated patterns', () => {
      assert(isMatch('abc', '!xyz'));
      assert(isMatch('abc', '!*foo'));
      assert(isMatch('abc', '!foo*'));
      assert(!isMatch('abc', '!abc'));
      assert(!isMatch('abc', '!*'));
    });
  });

  describe('empty patterns', () => {
    it('should correctly handle empty patterns', () => {
      assert(!isMatch('', ''));
      assert(!isMatch('.', ''));
      assert(!isMatch('./', ''));
      assert(!isMatch('a', ''));
      assert(!isMatch('ab', ''));
    });
  });

  describe('slashes', () => {
    it('should correctly match slashes', () => {
      assert(!isMatch('ab', './*/'));
      assert(!isMatch('bar/baz/foo', '*/foo'));
      assert(!isMatch('deep/foo/bar', '**/bar/*'));
      assert(!isMatch('deep/foo/bar/baz/x', '*/bar/**'));
      assert(!isMatch('ef', '/*'));
      assert(!isMatch('foo', 'foo/**'));
      assert(!isMatch('foo/bar', 'foo?bar'));
      assert(!isMatch('foo/bar/baz', '**/bar*'));
      assert(!isMatch('foo/bar/baz', '**/bar**'));
      assert(!isMatch('foo/baz/bar', 'foo**bar'));
      assert(!isMatch('foo/baz/bar', 'foo*bar'));
      assert(isMatch('/ab', '/*'));
      assert(isMatch('/cd', '/*'));
      assert(isMatch('/ef', '/*'));
      assert(isMatch('a/b/j/c/z/x.md', 'a/**/j/**/z/*.md'));
      assert(isMatch('a/j/z/x.md', 'a/**/j/**/z/*.md'));
      assert(isMatch('ab', './*'));
      assert(isMatch('ab/', './*/'));
      assert(isMatch('bar/baz/foo', '**/foo'));
      assert(isMatch('deep/foo/bar/baz', '**/bar/*'));
      assert(isMatch('deep/foo/bar/baz/', '**/bar/**'));
      assert(isMatch('deep/foo/bar/baz/x', '**/bar/*/*'));
      assert(isMatch('foo', 'foo{,/**}'));
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
    });
  });

  describe('plus', () => {
    it('should escape plus signs to match string literals', () => {
      assert(isMatch('a+b/src/glimini.js', 'a+b/src/*.js'));
      assert(isMatch('+b/src/glimini.js', '+b/src/*.js'));
      assert(isMatch('coffee+/src/glimini.js', 'coffee+/src/*.js'));
      assert(isMatch('coffee+/src/glimini.js', 'coffee+/src/*.js'));
      assert(isMatch('coffee+/src/glimini.js', 'coffee+/src/*'));
    });

    it('should not escape + following brackets', () => {
      assert(isMatch('a', '[a]+'));
      assert(isMatch('aa', '[a]+'));
      assert(isMatch('aaa', '[a]+'));
      assert(isMatch('az', '[a-z]+'));
      assert(isMatch('zzz', '[a-z]+'));
    });

    it('should not escape + following parens', () => {
      assert(isMatch('a', '(a)+'));
      assert(isMatch('ab', '(a|b)+'));
      assert(isMatch('aa', '(a)+'));
      assert(isMatch('aaab', '(a|b)+'));
      assert(isMatch('aaabbb', '(a|b)+'));
    });
  });

  describe('wildcards', () => {
    it('should match wildcards', () => {
      assert(!isMatch('a/b/c/z.js', '*.js'));
      assert(!isMatch('a/b/z.js', '*.js'));
      assert(!isMatch('a/z.js', '*.js'));
      assert(isMatch('a/z.js', '*/z*.js'));
      assert(isMatch('a/z.js', 'a/z*.js'));
      assert(isMatch('ab', '*'));
      assert(isMatch('abc', '*'));
      assert(isMatch('abc', '*c'));
      assert(isMatch('abc', 'a*'));
      assert(isMatch('abc', 'a*c'));
      assert(isMatch('abc', 'abc'));
      assert(isMatch('one abc two', '*abc*'));
      assert(isMatch('oneabctwo', '*abc*'));
      assert(isMatch('z.js', '*.js'));
      assert(isMatch('z.js', 'z*.js'));
    });

    it('should support one or more stars in a path segment', () => {
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

    it('should support stars following brackets', () => {
      assert(isMatch('a', '[a]*'));
      assert(isMatch('aa', '[a]*'));
      assert(isMatch('aaa', '[a]*'));
      assert(isMatch('az', '[a-z]*'));
      assert(isMatch('zzz', '[a-z]*'));
    });

    it('should support stars following parens', () => {
      assert(isMatch('a', '(a)*'));
      assert(isMatch('ab', '(a|b)*'));
      assert(isMatch('aa', '(a)*'));
      assert(isMatch('aaab', '(a|b)*'));
      assert(isMatch('aaabbb', '(a|b)*'));
    });

    it('should not match slashes with single stars', () => {
      assert(!isMatch('a/b', '(a)*'));
      assert(!isMatch('a/b', '[a]*'));
      assert(!isMatch('a/b', 'a*'));
      assert(!isMatch('a/b', '(a|b)*'));
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
      assert(isMatch('a/b/c/xyz.md', ['foo', 'a/b/c/*.md']));
      assert(isMatch('a/b/z/.a', 'a/*/z/.a'));
      assert(!isMatch('a/b/z/.a', 'bz'));
      assert(isMatch('a/bb.bb/aa/b.b/aa/c/xyz.md', 'a/**/c/*.md'));
      assert(isMatch('a/bb.bb/aa/bb/aa/c/xyz.md', 'a/**/c/*.md'));
      assert(isMatch('a/bb.bb/c/xyz.md', 'a/*/c/*.md'));
      assert(isMatch('a/bb/c/xyz.md', 'a/*/c/*.md'));
      assert(isMatch('a/bbbb/c/xyz.md', 'a/*/c/*.md'));
      assert(isMatch('aaa', ['foo', '*']));
      assert(isMatch('ab', '*'));
      assert(isMatch('ab', './*'));
      assert(isMatch('ab', 'ab'));
      assert(isMatch('ab/', './*/'));
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

    it('should regard non-exclusive double-stars as single stars', () => {
      assert(!isMatch('aaa/bba/ccc', 'aaa/**ccc'));
      assert(!isMatch('aaa/bba/ccc', 'aaa/**z'));
    });

    it('should match nested directories', () => {
      assert(isMatch('a/.b', 'a/.*'));
      assert(isMatch('a/b', '*/*'));
      assert(isMatch('a/b/c', '**/*'));
      assert(isMatch('a/b/c', '**/**'));
      assert(isMatch('a/b/c', '*/**'));
      assert(isMatch('a/b/c/d/e/j/n/p/o/z/c.md', 'a/**/j/**/z/*.md'));
      assert(isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md'));
      assert(isMatch('a/b/c/xyz.md', 'a/b/c/*.md'));
      assert(isMatch('a/b/z/.a', 'a/*/z/.a'));
      assert(isMatch('a/bb.bb/aa/b.b/aa/c/xyz.md', 'a/**/c/*.md'));
      assert(isMatch('a/bb.bb/aa/bb/aa/c/xyz.md', 'a/**/c/*.md'));
      assert(isMatch('a/bb.bb/c/xyz.md', 'a/*/c/*.md'));
      assert(isMatch('a/bb/c/xyz.md', 'a/*/c/*.md'));
      assert(isMatch('a/bbbb/c/xyz.md', 'a/*/c/*.md'));
      assert(!isMatch('a/.b', 'a/**/z/*.md'));
      assert(!isMatch('a/b/c/j/e/z/c.txt', 'a/**/j/**/z/*.md'));
      assert(!isMatch('a/b/c/xyz.md', 'a/b/**/c{d,e}/**/xyz.md'));
      assert(!isMatch('a/b/d/xyz.md', 'a/b/**/c{d,e}/**/xyz.md'));
      assert(!isMatch('a/b/z/.a', 'a/**/z/*.a'));
      assert(!isMatch('a/b/z/.a', 'a/*/z/*.a'));
      assert(!isMatch('a/b/z/.a', 'b/a'));
      assert(!isMatch('a/foo/z/.b', 'a/**/z/*.md'));
    });
  });

  describe('globstars', () => {
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

      // micromatch/#23
      assert(!isMatch('zzjs', 'z*.js'));
      assert(!isMatch('zzjs', '*z.js'));

      // micromatch/#24
      assert(!isMatch('a', 'a/**'));
      assert(!isMatch('a/b/c/d/', 'a/b/**/f'));
      assert(isMatch('a', '**'));
      assert(isMatch('a', 'a{,/**}'));
      assert(isMatch('a/', '**'));
      assert(isMatch('a/', 'a/**'));
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

      // https://github.com/jonschlinkert/micromatch/issues/15
      assert(isMatch('z.js', 'z*'));
      assert(isMatch('z.js', '**/z*.js'));
      assert(isMatch('z.js', '**/*.js'));
      assert(isMatch('foo', '**/foo'));
      assert(isMatch('z.js', '**/z*')); //<= differs from issue

      assert(isMatch('a/b-c/z.js', 'a/b-*/**/z.js'));
      assert(isMatch('a/b-c/d/e/z.js', 'a/b-*/**/z.js'));
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

  describe('qmarks', () => {
    it('question marks should not match slashes:', () => {
      assert(!isMatch('aaa/bbb', 'aaa?bbb'));
    });
  });

  describe('options.ignore:', () => {
    it('should not match ignored patterns', () => {
      assert(isMatch('a+b/src/glimini.js', 'a+b/src/*.js', { ignore: ['**/f*'] }));
      assert(!isMatch('a+b/src/glimini.js', 'a+b/src/*.js', { ignore: ['**/g*'] }));
      assert(isMatch('+b/src/glimini.md', '+b/src/*', { ignore: ['**/*.js'] }));
      assert(!isMatch('+b/src/glimini.js', '+b/src/*', { ignore: ['**/*.js'] }));
    });
  });

  describe('matching:', () => {
    it('should escape plus signs to match string literals', () => {
      assert(isMatch('a+b/src/glimini.js', 'a+b/src/*.js'));
      assert(isMatch('+b/src/glimini.js', '+b/src/*.js'));
      assert(isMatch('coffee+/src/glimini.js', 'coffee+/src/*.js'));
      assert(isMatch('coffee+/src/glimini.js', 'coffee+/src/*'));
    });

    it('should not escape plus signs that follow brackets', () => {
      assert(isMatch('a', '[a]+'));
      assert(isMatch('aa', '[a]+'));
      assert(isMatch('aaa', '[a]+'));
      assert(isMatch('az', '[a-z]+'));
      assert(isMatch('zzz', '[a-z]+'));
    });

    it('should support stars following brackets', () => {
      assert(isMatch('a', '[a]*'));
      assert(isMatch('aa', '[a]*'));
      assert(isMatch('aaa', '[a]*'));
      assert(isMatch('az', '[a-z]*'));
      assert(isMatch('zzz', '[a-z]*'));
    });

    it('should not escape plus signs that follow parens', () => {
      assert(isMatch('a', '(a)+'));
      assert(isMatch('ab', '(a|b)+'));
      assert(isMatch('aa', '(a)+'));
      assert(isMatch('aaab', '(a|b)+'));
      assert(isMatch('aaabbb', '(a|b)+'));
    });

    it('should support stars following parens', () => {
      assert(isMatch('a', '(a)*'));
      assert(isMatch('ab', '(a|b)*'));
      assert(isMatch('aa', '(a)*'));
      assert(isMatch('aaab', '(a|b)*'));
      assert(isMatch('aaabbb', '(a|b)*'));
    });

    it('should not match slashes with single stars', () => {
      assert(!isMatch('a/b', '(a)*'));
      assert(!isMatch('a/b', '[a]*'));
      assert(!isMatch('a/b', 'a*'));
      assert(!isMatch('a/b', '(a|b)*'));
    });

    it('should not match dots with stars by default', () => {
      assert(!isMatch('.a', '(a)*'));
      assert(!isMatch('.a', '*[a]*'));
      assert(!isMatch('.a', '*[a]'));
      assert(!isMatch('.a', '*a*'));
      assert(!isMatch('.a', '*a'));
      assert(!isMatch('.a', '*(a|b)'));
    });

    it('should correctly deal with empty globs', () => {
      assert(!isMatch('ab', ''));
      assert(!isMatch('a', ''));
      assert(!isMatch('.', ''));
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

      // false
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

    it('should exactly match leading slash', () => {
      assert(!isMatch('ef', '/*'));
      assert(isMatch('/ef', '/*'));
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
      assert(isMatch('a', '**'));
      assert(!isMatch('a', 'a/**'));
      assert(isMatch('a/', '**'));
      assert(isMatch('a/b/c/d', '**'));
      assert(isMatch('a/b/c/d/', '**'));
      assert(isMatch('a/b/c/d/', '**/**'));
      assert(isMatch('a/b/c/d/', '**/b/**'));
      assert(isMatch('a/b/c/d/', 'a/b/**'));
      assert(isMatch('a/b/c/d/', 'a/b/**/'));
      assert(isMatch('a/b/c/d/', 'a/b/**/c/**/'));
      assert(isMatch('a/b/c/d/', 'a/b/**/c/**/d/'));
      assert(!isMatch('a/b/c/d/', 'a/b/**/f'));
      assert(isMatch('a/b/c/d/e.f', 'a/b/**/**/*.*'));
      assert(isMatch('a/b/c/d/e.f', 'a/b/**/*.*'));
      assert(isMatch('a/b/c/d/e.f', 'a/b/**/c/**/d/*.*'));
      assert(isMatch('a/b/c/d/e.f', 'a/b/**/d/**/*.*'));
      assert(isMatch('a/b/c/d/g/e.f', 'a/b/**/d/**/*.*'));
      assert(isMatch('a/b/c/d/g/g/e.f', 'a/b/**/d/**/*.*'));
      assert(isMatch('a/b-c/z.js', 'a/b-*/**/z.js'));
      assert(isMatch('a/b-c/d/e/z.js', 'a/b-*/**/z.js'));
    });

    it('should match slashes', () => {
      assert(!isMatch('bar/baz/foo', '*/foo'));
      assert(!isMatch('deep/foo/bar', '**/bar/*'));
      assert(!isMatch('deep/foo/bar/baz/x', '*/bar/**'));
      assert(!isMatch('foo', 'foo/**'));
      assert(!isMatch('foo/bar', 'foo?bar'));
      assert(!isMatch('foo/bar/baz', '**/bar*'));
      assert(!isMatch('foo/bar/baz', '**/bar**'));
      assert(!isMatch('foo/baz/bar', 'foo**bar'));
      assert(!isMatch('foo/baz/bar', 'foo*bar'));
      assert(!isMatch('deep/foo/bar/baz/', '**/bar/*'));
      assert(!isMatch('deep/foo/bar/baz', '**/bar/*/'));
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
