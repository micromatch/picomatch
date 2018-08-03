'use strict';

require('mocha');
const path = require('path');
const fill = require('fill-range');
const assert = require('assert');
const picomatch = require('..');
const pm = require('./support');

describe('picomatch', () => {
  beforeEach(() => picomatch.clearCache());

  describe('non-globs', () => {
    it('should match literal strings', () => {
      assert(!pm.isMatch('aaa\\bbb', 'aaa/bbb', { nocache: true }));
      assert(pm.isMatch('aaa/bbb', 'aaa/bbb', { nocache: true }));

      path.sep = '\\';
      assert(pm.isMatch('aaa\\bbb', 'aaa/bbb', { nocache: true }));
      assert(pm.isMatch('aaa/bbb', 'aaa/bbb', { nocache: true }));
      path.sep = '/';

      assert(pm.isMatch('foo', 'foo'));
      assert(!pm.isMatch('bar', 'foo'));
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

  describe('character matching', () => {
    it('should match windows drives with globstars', () => {
      assert(pm.isMatch('bar/', '**'));
      assert(pm.isMatch('A://', '**'));
      assert(pm.isMatch('B:foo/a/b/c/d', '**'));
      assert(pm.isMatch('C:/Users/', '**'));
      assert(pm.isMatch('c:\\', '**'));
      assert(pm.isMatch('C:\\Users\\', '**'));
      assert(pm.isMatch('C:cwd/another', '**'));
      assert(pm.isMatch('C:cwd\\another', '**'));
    });

    it('should not match multiple windows directories with a single star', () => {
      path.sep = '\\';
      assert(pm.isMatch('c:\\', '*', { nocache: true }));
      assert(!pm.isMatch('C:\\Users\\', '*', { nocache: true }));
      assert(!pm.isMatch('C:cwd\\another', '*', { nocache: true }));
      path.sep = '/';
    });

    it('should match mixed slashes on windows', () => {
      path.sep = '\\';
      assert(pm.isMatch('//C://user\\docs\\Letter.txt', '**', { nocache: true }));
      assert(pm.isMatch('//C:\\\\user/docs/Letter.txt', '**', { nocache: true }));
      assert(pm.isMatch(':\\', '*', { nocache: true }));
      assert(pm.isMatch(':\\', ':*', { nocache: true }));
      assert(pm.isMatch('\\\\foo/bar', '**', { nocache: true }));
      assert(pm.isMatch('\\\\foo/bar', '/*/*', { nocache: true }));
      assert(pm.isMatch('\\\\unc\\admin$', '**', { nocache: true }));
      assert(pm.isMatch('\\\\unc\\admin$', '/*/*$', { nocache: true }));
      assert(pm.isMatch('\\\\unc\\admin$\\system32', '/*/*$/*32', { nocache: true }));
      assert(pm.isMatch('\\\\unc\\share\\foo', '/u*/s*/f*', { nocache: true }));
      assert(pm.isMatch('foo\\bar\\baz', 'f*/*/*', { nocache: true }));
      path.sep = '/';
    });

    it('should match mixed slashes when options.unixify is true', () => {
      assert(pm.isMatch('//C://user\\docs\\Letter.txt', '**', { nocache: true, unixify: true }));
      assert(pm.isMatch('//C:\\\\user/docs/Letter.txt', '**', { nocache: true, unixify: true }));
      assert(pm.isMatch(':\\', '*', { nocache: true, unixify: true }));
      assert(pm.isMatch(':\\', ':*', { nocache: true, unixify: true }));
      assert(pm.isMatch('\\\\foo/bar', '**', { nocache: true, unixify: true }));
      assert(pm.isMatch('\\\\foo/bar', '/*/*', { nocache: true, unixify: true }));
      assert(pm.isMatch('\\\\unc\\admin$', '**', { nocache: true, unixify: true }));
      assert(pm.isMatch('\\\\unc\\admin$', '/*/*$', { nocache: true, unixify: true }));
      assert(pm.isMatch('\\\\unc\\admin$\\system32', '/*/*$/*32', { nocache: true, unixify: true }));
      assert(pm.isMatch('\\\\unc\\share\\foo', '/u*/s*/f*', { nocache: true, unixify: true }));
      assert(pm.isMatch('foo\\bar\\baz', 'f*/*/*', { nocache: true, unixify: true }));
      assert(pm.isMatch('//*:/**', '**'));
      assert(!pm.isMatch('//server/file', '//*'));
      assert(pm.isMatch('//server/file', '/**'));
      assert(pm.isMatch('//server/file', '//**'));
      assert(pm.isMatch('//server/file', '**'));
      assert(pm.isMatch('//UNC//Server01//user//docs//Letter.txt', '**'));
      assert(pm.isMatch('/foo', '**'));
      assert(pm.isMatch('/foo/a/b/c/d', '**'));
      assert(pm.isMatch('/foo/bar', '**'));
      assert(pm.isMatch('/home/foo', '**'));
      assert(pm.isMatch('/home/foo/..', '**/..'));
      assert(pm.isMatch('/user/docs/Letter.txt', '**'));
      assert(pm.isMatch('directory\\directory', '**'));
      assert(pm.isMatch('a/b/c.js', '**'));
      assert(pm.isMatch('directory/directory', '**'));
      assert(pm.isMatch('foo/bar', '**'));
    });

    it('should match any character zero or more times, except for /', () => {
      assert(!pm.isMatch('foo', '*a*'));
      assert(!pm.isMatch('foo', '*r'));
      assert(!pm.isMatch('foo', 'b*'));
      assert(!pm.isMatch('foo/bar', '*'));
      assert(pm.isMatch('foo/bar', '*/*'));
      assert(!pm.isMatch('foo/bar/baz', '*/*'));
      assert(pm.isMatch('bar', '*a*'));
      assert(pm.isMatch('bar', '*r'));
      assert(pm.isMatch('bar', 'b*'));
      assert(pm.isMatch('foo/bar/baz', '*/*/*'));
    });

    it('should match dashes surrounded by spasces', () => {
      assert(pm.isMatch('my/folder - 1', '*/*'));
      assert(pm.isMatch('my/folder - copy (1)', '*/*'));
      assert(pm.isMatch('my/folder - copy [1]', '*/*'));
      assert(pm.isMatch('my/folder - foo + bar - copy [1]', '*/*'));
      assert(!pm.isMatch('my/folder - foo + bar - copy [1]', '*'));

      assert(pm.isMatch('my/folder - 1', '*/*-*'));
      assert(pm.isMatch('my/folder - copy (1)', '*/*-*'));
      assert(pm.isMatch('my/folder - copy [1]', '*/*-*'));
      assert(pm.isMatch('my/folder - foo + bar - copy [1]', '*/*-*'));

      assert(pm.isMatch('my/folder - 1', '*/*1'));
      assert(!pm.isMatch('my/folder - copy (1)', '*/*1'));
    });

    it('should match dollary signs', () => {
      assert(!pm.isMatch('$', '!($)'));
      assert(!pm.isMatch('$', '!$'));
      assert(pm.isMatch('$$', '!$'));
      assert(pm.isMatch('$$', '!($)'));
      assert(pm.isMatch('$$$', '!($)'));
      assert(pm.isMatch('^', '!($)'));

      assert(pm.isMatch('$', '!($$)'));
      assert(!pm.isMatch('$$', '!($$)'));
      assert(pm.isMatch('$$$', '!($$)'));
      assert(pm.isMatch('^', '!($$)'));

      assert(!pm.isMatch('$', '!($*)'));
      assert(!pm.isMatch('$$', '!($*)'));
      assert(!pm.isMatch('$$$', '!($*)'));
      assert(pm.isMatch('^', '!($*)'));

      assert(pm.isMatch('$', '*'));
      assert(pm.isMatch('$$', '*'));
      assert(pm.isMatch('$$$', '*'));
      assert(pm.isMatch('^', '*'));

      assert(pm.isMatch('$', '$*'));
      assert(pm.isMatch('$$', '$*'));
      assert(pm.isMatch('$$$', '$*'));
      assert(!pm.isMatch('^', '$*'));

      assert(pm.isMatch('$', '*$*'));
      assert(pm.isMatch('$$', '*$*'));
      assert(pm.isMatch('$$$', '*$*'));
      assert(!pm.isMatch('^', '*$*'));

      assert(pm.isMatch('$', '*$'));
      assert(pm.isMatch('$$', '*$'));
      assert(pm.isMatch('$$$', '*$'));
      assert(!pm.isMatch('^', '*$'));

      assert(!pm.isMatch('$', '?$'));
      assert(pm.isMatch('$$', '?$'));
      assert(!pm.isMatch('$$$', '?$'));
      assert(!pm.isMatch('^', '?$'));
    });

    it('should match carets', () => {
      assert(!pm.isMatch('^', '!(^)'));
      assert(pm.isMatch('^^', '!(^)'));
      assert(pm.isMatch('^^^', '!(^)'));
      assert(pm.isMatch('&', '!(^)'));

      assert(pm.isMatch('^', '!(^^)'));
      assert(!pm.isMatch('^^', '!(^^)'));
      assert(pm.isMatch('^^^', '!(^^)'));
      assert(pm.isMatch('&', '!(^^)'));

      assert(!pm.isMatch('^', '!(^*)'));
      assert(!pm.isMatch('^^', '!(^*)'));
      assert(!pm.isMatch('^^^', '!(^*)'));
      assert(pm.isMatch('&', '!(^*)'));

      assert(pm.isMatch('^', '*'));
      assert(pm.isMatch('^^', '*'));
      assert(pm.isMatch('^^^', '*'));
      assert(pm.isMatch('&', '*'));

      assert(pm.isMatch('^', '^*'));
      assert(pm.isMatch('^^', '^*'));
      assert(pm.isMatch('^^^', '^*'));
      assert(!pm.isMatch('&', '^*'));

      assert(pm.isMatch('^', '*^*'));
      assert(pm.isMatch('^^', '*^*'));
      assert(pm.isMatch('^^^', '*^*'));
      assert(!pm.isMatch('&', '*^*'));

      assert(pm.isMatch('^', '*^'));
      assert(pm.isMatch('^^', '*^'));
      assert(pm.isMatch('^^^', '*^'));
      assert(!pm.isMatch('&', '*^'));

      assert(!pm.isMatch('^', '?^'));
      assert(pm.isMatch('^^', '?^'));
      assert(!pm.isMatch('^^^', '?^'));
      assert(!pm.isMatch('&', '?^'));
    });

    it('should...', () => {
      const fixtures = ['my/folder +1', 'my/folder -1', 'my/folder *1', 'my/folder', 'my/folder+foo+bar&baz', 'my/folder - $1.00', 'my/folder - ^1.00', 'my/folder - %1.00'];
      assert.deepEqual(pm(fixtures, '*/*'), fixtures);
      assert.deepEqual(pm(fixtures, '*/!(*%)*'), fixtures.filter(v => !v.includes('%')));
      assert.deepEqual(pm(fixtures, '*/*$*'), ['my/folder - $1.00']);
      assert.deepEqual(pm(fixtures, '*/*^*'), ['my/folder - ^1.00']);
      assert.deepEqual(pm(fixtures, '*/*&*'), ['my/folder+foo+bar&baz']);
      assert.deepEqual(pm(fixtures, '*/*+*'), ['my/folder +1', 'my/folder+foo+bar&baz']);
      assert.deepEqual(pm(fixtures, '*/*-*'), ['my/folder -1', 'my/folder - $1.00', 'my/folder - ^1.00', 'my/folder - %1.00']);
      assert.deepEqual(pm(fixtures, '*/*\\**'), ['my/folder *1']);
    });

    it('should match numbers', () => {
      const fixtures = ['1', '1/1', '1/2', '1/1/1', '1/1/2'];
      assert.deepEqual(pm(fixtures, '*/*'), ['1/1', '1/2']);
      assert.deepEqual(pm(fixtures, '*/*/1'), ['1/1/1']);
      assert.deepEqual(pm(fixtures, '*/*/2'), ['1/1/2']);
    });

    it('should match square brackets', () => {
       const fixtures = ['foo/bar - 1', 'foo/bar - copy (1)', 'foo/bar (1)', 'foo/bar (4)', 'foo/bar (7)', 'foo/bar (42)', 'foo/bar - copy [1]', 'foo/bar - foo + bar - copy [1]'];

      assert.deepEqual(pm(fixtures, '**/*\\[*\\]'), ['foo/bar - copy [1]', 'foo/bar - foo + bar - copy [1]']);
      assert.deepEqual(pm(fixtures, '**/*[1]'), ['foo/bar - 1', 'foo/bar - copy [1]', 'foo/bar - foo + bar - copy [1]']);
      assert.deepEqual(pm(fixtures, '**/*\\[1\\]'), ['foo/bar - copy [1]', 'foo/bar - foo + bar - copy [1]']);
      assert.deepEqual(pm(fixtures, '*/*\\[*\\]'), ['foo/bar - copy [1]', 'foo/bar - foo + bar - copy [1]']);
    });

    it('should match parens', () => {
       const fixtures = ['foo/bar - 1', 'foo/bar - copy (1)', 'foo/bar (1)', 'foo/bar (4)', 'foo/bar (7)', 'foo/bar (42)', 'foo/bar - copy [1]', 'foo/bar - foo + bar - copy [1]'];

      const toRange = (a, b) => `(${fill(a, b, { toRegex: true })})`;

      assert.deepEqual(pm(fixtures, '*/* \\({4..10}\\)', { toRange }), ['foo/bar (4)', 'foo/bar (7)']);
      assert(!pm.isMatch('my/folder (Work, Accts)', '/*'));
      assert(pm.isMatch('my/folder (Work, Accts)', '*/*'));
      assert(pm.isMatch('my/folder (Work, Accts)', '*/*,*'));
      assert(pm.isMatch('my/folder (Work, Accts)', '*/*(W*, *)*'));
      assert(pm.isMatch('my/folder/(Work, Accts)', '**/*(W*, *)*'));
      assert(!pm.isMatch('my/folder/(Work, Accts)', '*/*(W*, *)*'));
      assert(pm.isMatch('foo(bar)baz', 'foo*baz'));
      assert(pm.isMatch('foo(bar)baz', 'foo[bar()]+baz'));
    });

    it('should support regex lookbehinds', function() {
      let v = process.version;
      Reflect.defineProperty(process, 'version', { value: 'v6.0.0' });
      assert.throws(() => pm.isMatch('foo/cbaz', 'foo/*(?<!c)baz'), /Node\.js v10 or higher/);
      Reflect.defineProperty(process, 'version', { value: v });

      if (parseInt(v.slice(1), 10) >= 10) {
        assert.deepEqual(pm('foo/cbaz', 'foo/*(?<!d)baz'), ['foo/cbaz']);
        assert.deepEqual(pm('foo/cbaz', 'foo/*(?<!c)baz'), []);
        assert.deepEqual(pm('foo/cbaz', 'foo/*(?<=d)baz'), []);
        assert.deepEqual(pm('foo/cbaz', 'foo/*(?<=c)baz'), ['foo/cbaz']);
      }
    });
  });

  describe('.match()', () => {
    it('should match ', () => {
      assert(pm.isMatch('bar', 'b*'));
      assert(pm.isMatch('bar', '*a*'));
      assert(pm.isMatch('bar', '*r'));
      assert(!pm.isMatch('foo', 'b*'));
      assert(!pm.isMatch('foo', '*a*'));
      assert(!pm.isMatch('foo', '*r'));
      assert(!pm.isMatch('foo/bar', '*'));
    });

    it('should not match dotfiles with single star by default', () => {
      assert(pm.isMatch('foo', '*'));
      assert(!pm.isMatch('.foo', '*'));
      assert(pm.isMatch('foo/bar', '*/*'));
      assert(!pm.isMatch('foo/.bar', '*/*'));
      assert(!pm.isMatch('foo/.bar/baz', '*/*/*'));
    });

    it('should not match dotfiles with globstars by default', () => {
      assert(pm.isMatch('foo', '**/*'));
      assert(!pm.isMatch('.foo', '**'));
      assert(!pm.isMatch('.foo', '**/*'));
      assert(!pm.isMatch('bar/.foo', '**/*'));
      assert(!pm.isMatch('.bar', '**/*'));
      assert(!pm.isMatch('foo/.bar', '**/*'));
      assert(!pm.isMatch('foo/.bar', '**/*a*'));
    });

    it('should match dotfiles when a leading dot is in the pattern', () => {
      assert.deepEqual(pm(['foo', '.bar', 'foo/.bar'], '**/.*a*'), ['.bar', 'foo/.bar']);
      assert.deepEqual(pm(['foo', '.bar', 'bar'], '.*a*'), ['.bar']);
      assert.deepEqual(pm(['foo', '.bar', 'bar'], '.b*'), ['.bar']);
      assert.deepEqual(pm(['foo', '.bar', 'bar'], '.*r'), ['.bar']);
    });
  });

  describe('ranges', () => {
    it('should support valid regex ranges', () => {
      let fixtures = ['a.a', 'a.b', 'a.a.a', 'c.a', 'd.a.d', 'a.bb', 'a.ccc'];
      assert.deepEqual(pm(fixtures, '[a-b].[a-b]'), ['a.a', 'a.b']);
      assert.deepEqual(pm(fixtures, '[a-d].[a-b]'), ['a.a', 'a.b', 'c.a']);
      assert.deepEqual(pm(fixtures, '[a-d]*.[a-b]'), ['a.a', 'a.b', 'a.a.a', 'c.a']);
    });

    it('should support valid regex ranges with glob negation patterns', () => {
      let fixtures = ['a.a', 'a.b', 'a.a.a', 'c.a', 'd.a.d', 'a.bb', 'a.ccc'];
      assert.deepEqual(pm(fixtures, '!*.[a-b]'), ['d.a.d', 'a.bb', 'a.ccc']);
      assert.deepEqual(pm(fixtures, '!*.[a-b]*'), ['a.ccc']);
      assert.deepEqual(pm(fixtures, '![a-b].[a-b]'), ['a.a.a', 'c.a', 'd.a.d', 'a.bb', 'a.ccc']);
      assert.deepEqual(pm(fixtures, '![a-b]+.[a-b]+'), ['a.a.a', 'c.a', 'd.a.d', 'a.ccc']);
    });

    it('should support valid regex ranges with negation patterns', () => {
      let fixtures = ['a.a', 'a.b', 'a.a.a', 'c.a', 'd.a.d', 'a.bb', 'a.ccc'];
      assert.deepEqual(pm(fixtures, '*.[^a-b]'), ['d.a.d']);
      assert.deepEqual(pm(fixtures, 'a.[^a-b]*'), ['a.ccc']);
    });
  });

  // $echo a/{1..3}/b
  describe('bash options and features', () => {
    // from the Bash 4.3 specification/unit tests
    let fixtures = ['*', '**', '\\*', 'a', 'a/*', 'abc', 'abd', 'abe', 'b', 'bb', 'bcd', 'bdir/', 'Beware', 'c', 'ca', 'cb', 'd', 'dd', 'de'];
    it('should handle "regular globbing":', () => {
      assert.deepEqual(pm(fixtures, 'a*'), ['a', 'abc', 'abd', 'abe']);
      assert.deepEqual(pm(fixtures, '\\a*'), ['a', 'abc', 'abd', 'abe']);
    });

    it('should match directories:', () => {
      assert.deepEqual(pm(fixtures, 'b*/'), ['bdir/']);
    });

    it('should use escaped characters as literals:', () => {
      assert.deepEqual(pm(fixtures, '\\^'), []);
      assert.deepEqual(pm(fixtures, 'a\\*'), []);
      assert.deepEqual(pm(fixtures, ['a\\*', '\\*']), ['*']);
      assert.deepEqual(pm(fixtures, ['a\\*']), []);
      assert.deepEqual(pm(fixtures, ['c*', 'a\\*', '*q*']), ['c', 'ca', 'cb']);
      assert.deepEqual(pm(fixtures, '\\**'), ['*', '**']);
    });

    it('should work for quoted characters', () => {
      assert.deepEqual(pm(fixtures.concat('***'), '"***"'), ['***']);
      assert.deepEqual(pm(fixtures.concat('***'), "'***'"), ['***']);
      assert.deepEqual(pm(fixtures, '"***"'), []);
      assert.deepEqual(pm(fixtures, '"*"*'), ['*', '**']);
    });

    it('should match escaped quotes', () => {
      assert.deepEqual(pm(fixtures.concat(['"**"', '**']), '\\"**\\"'), ['"**"']);
      assert.deepEqual(pm(fixtures.concat(['foo/"**"/bar', '**']), 'foo/\\"**\\"/bar'), ['foo/"**"/bar']);

      let fixture = ['foo/"*"/bar', 'foo/"a"/bar', 'foo/"b"/bar', 'foo/"c"/bar', "foo/'*'/bar", "foo/'a'/bar", "foo/'b'/bar", "foo/'c'/bar"];
      let expected = ['foo/"*"/bar', 'foo/"a"/bar', 'foo/"b"/bar', 'foo/"c"/bar'];

      assert.deepEqual(pm(fixtures.concat(fixture), 'foo/\\"*\\"/bar'), expected);
      assert.deepEqual(pm(fixtures.concat(['foo/*/bar'].concat(fixtures)), 'foo/"*"/bar'), ['foo/*/bar']);
      assert.deepEqual(pm(fixtures.concat(["'**'", '**']), "\\'**\\'"), ["'**'"]);
    });

    it("Pattern from Larry Wall's Configure that caused bash to blow up:", () => {
      assert.deepEqual(pm(fixtures, '[a-c]b*'), ['abc', 'abd', 'abe', 'bb', 'cb']);
    });

    it('should support character classes', () => {
      let f = fixtures.slice().concat('baz', 'bzz', 'BZZ', 'beware', 'BewAre');

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

    it('should support basic wildmatch (brackets) features', () => {
      assert(!pm.isMatch('aab', 'a[]-]b'));
      assert(!pm.isMatch('ten', '[ten]'));
      assert(pm.isMatch(']', ']'));
      assert(pm.isMatch('a-b', 'a[]-]b'));
      assert(pm.isMatch('a]b', 'a[]-]b'));
      assert(pm.isMatch('a]b', 'a[]]b'));
      assert(pm.isMatch('aab', 'a[\\]a\\-]b'));
      assert(pm.isMatch('ten', 't[a-g]n'));
      assert(pm.isMatch('ton', 't[^a-g]n'));
    });

    it('should support Extended slash-matching features', () => {
      assert(!pm.isMatch('foo/bar', 'f[^eiu][^eiu][^eiu][^eiu][^eiu]r'));
      assert(pm.isMatch('foo/bar', 'foo[/]bar'));
      assert(pm.isMatch('foo-bar', 'f[^eiu][^eiu][^eiu][^eiu][^eiu]r'));
    });

    it('should match braces', () => {
      assert(pm.isMatch('foo{}baz', 'foo[{a,b}]+baz'));
    });

    it('should match with brace patterns', () => {
      assert(pm.isMatch('a/a', 'a/{a,b}'));
      assert(pm.isMatch('a/b', 'a/{a,b}'));
      assert(!pm.isMatch('a/c', 'a/{a,b}'));
      assert(!pm.isMatch('b/b', 'a/{a,b}'));
      assert(!pm.isMatch('b/b', 'a/{a,b,c}'));
      assert(pm.isMatch('a/c', 'a/{a,b,c}'));
      assert(pm.isMatch('a/a', 'a/{a..c}'));
      assert(pm.isMatch('a/b', 'a/{a..c}'));
      assert(pm.isMatch('a/c', 'a/{a..c}'));
      assert(pm.isMatch('a/c', 'a/{a..c}', { toRange: (a, b) => `([${a}-${b}])` }));
      assert(!pm.isMatch('a/z', 'a/{a..c}', { toRange: (a, b) => `([${a}-${b}])` }));
      assert(pm.isMatch('a/99', 'a/{1..100}', {
        toRange(a, b) {
          return `(${fill(a, b, { toRegex: true })})`;
        }
      }));
    });

    it('should match escaped characters', () => {
      assert(pm.isMatch('\\*', '\\\\*'));
      assert(pm.isMatch('XXX/\\', '[A-Z]+/\\\\'));
      assert(pm.isMatch('[ab]', '\\[ab]'));
      assert(pm.isMatch('[ab]', '[\\[:]ab]'));
    });

    it('should consolidate extra stars:', () => {
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

    it('none of these should output anything:', () => {
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

  describe('wildmat (git)', () => {
    it('Basic wildmat features', () => {
      assert(!pm.isMatch('foo', '*f'));
      assert(!pm.isMatch('foo', '??'));
      assert(!pm.isMatch('foo', 'bar'));
      assert(!pm.isMatch('foobar', 'foo\\*bar'));
      assert(!pm.isMatch('', ''));
      assert(pm.isMatch('?a?b', '\\??\\?b'));
      assert(pm.isMatch('aaaaaaabababab', '*ab'));
      assert(pm.isMatch('foo', '*'));
      assert(pm.isMatch('foo', '*foo*'));
      assert(pm.isMatch('foo', '???'));
      assert(pm.isMatch('foo', 'f*'));
      assert(pm.isMatch('foo', 'foo'));
      assert(pm.isMatch('foobar', '*ob*a*r*'));
    });

    it('should support recursion', () => {
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
      assert(
        !pm.isMatch('XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1', 'XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*')
      );
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

  describe('dotfiles', () => {
    describe('file name matching', () => {
      it('should not match a dot when the dot is not explicitly defined', () => {
        assert.deepEqual(pm(['.dot'], '*dot'), []);
        assert.deepEqual(pm(['a/.dot'], 'a/*dot'), []);
        assert.deepEqual(pm(['.dot'], '**/*dot'), []);
        assert.deepEqual(pm(['.dot'], '**/?dot'), []);
        assert.deepEqual(pm(['.dot'], '*/*dot'), []);
        assert.deepEqual(pm(['.dot'], '*/?dot'), []);
        assert.deepEqual(pm(['.dot'], '/*dot'), []);
        assert.deepEqual(pm(['.dot'], '/?dot'), []);
        assert.deepEqual(pm(['/.dot'], '**/*dot'), []);
        assert.deepEqual(pm(['/.dot'], '**/?dot'), []);
        assert.deepEqual(pm(['/.dot'], '*/*dot'), []);
        assert.deepEqual(pm(['/.dot'], '*/?dot'), []);
        assert.deepEqual(pm(['/.dot'], '/*dot'), []);
        assert.deepEqual(pm(['/.dot'], '/?dot'), []);
        assert.deepEqual(pm(['a/.dot'], '*/*dot'), []);
        assert.deepEqual(pm(['a/.dot'], '*/?dot'), []);
        assert.deepEqual(pm(['a/b/.dot'], '**/*dot'), []);
        assert.deepEqual(pm(['a/b/.dot'], '**/?dot'), []);

        // related https://github.com/jonschlinkert/micromatch/issues/63
        assert.deepEqual(pm(['/aaa/bbb/.git'], '/aaa/bbb/**'), []);
        assert.deepEqual(pm(['aaa/bbb/.git'], 'aaa/bbb/**'), []);
        assert.deepEqual(pm(['/aaa/bbb/ccc/.git'], '/aaa/bbb/**'), []);
      });

      it('should not match leading dots with question marks', () => {
        assert.deepEqual(pm(['.dot'], '?dot'), []);
        assert.deepEqual(pm(['/.dot'], '/?dot'), []);
        assert.deepEqual(pm(['a/.dot'], 'a/?dot'), []);
      });

      it('should match with double dots', () => {
        let list = ['a/../a', 'ab/../ac', '../a', 'a', '../../b', '../c', '../c/d'];
        assert.deepEqual(pm(list, '../*'), ['../a', '../c']);
        assert.deepEqual(pm(list, '*/../*'), ['a/../a', 'ab/../ac']);
        assert.deepEqual(pm(list, '**/../*'), ['a/../a', 'ab/../ac', '../a', '../c']);
      });

      it('should match dots in root path when glob is prefixed with **/', () => {
        let expected = ['.x/', '.x/.x', '.x/a', '.x/a/b', 'a/.x/b', 'a/b/.x/', 'a/b/.x/c', 'a/b/.x/c/d', 'a/b/.x/c/d/e'];

        let fixtures = expected.concat(['.x', 'a/b/.x']);
        assert.deepEqual(pm(fixtures, '**/.x/**'), expected);
      });

      it('should match a dot when the dot is explicitly defined', () => {
        let fixtures = ['a/b/.x/c', 'a/b/.x/c/d', 'a/b/.x/c/d/e', 'a/b/.x', 'a/b/.x/', 'a/.x/b', '.x', '.x/', '.x/a', '.x/a/b', 'a/.x/b/.x/c', '.x/.x'];

        assert.deepEqual(pm('.bar.baz', '.*.*'), ['.bar.baz']);
        assert.deepEqual(pm('.bar.baz', '.*.*'), ['.bar.baz']);
        assert.deepEqual(pm('.bar.baz', '.*.*/'), []);
        assert.deepEqual(pm('.bar.baz', '.*.baz'), ['.bar.baz']);
        assert.deepEqual(pm('.bar.baz/', '.*.*'), ['.bar.baz/']);
        assert.deepEqual(pm('.bar.baz/', '.*.*/'), ['.bar.baz/']);
        assert.deepEqual(pm('.dot', '.*ot'), ['.dot']);
        assert.deepEqual(pm('.dot', '.[d]ot'), ['.dot']);
        assert.deepEqual(pm('.dot.foo.bar', '.*ot.*.*'), ['.dot.foo.bar']);
        assert.deepEqual(pm('.dotfile.js', '.*.js'), ['.dotfile.js']);
        assert.deepEqual(pm('/.dot', '**/.[d]ot'), ['/.dot']);
        assert.deepEqual(pm('/.dot', '**/.dot*'), ['/.dot']);
        assert.deepEqual(pm('/.dot', '/.[d]ot'), ['/.dot']);
        assert.deepEqual(pm('/.dot', '/.dot*'), ['/.dot']);
        assert.deepEqual(pm('a/.dot', '**/.[d]ot'), ['a/.dot']);
        assert.deepEqual(pm('a/.dot', '*/.[d]ot'), ['a/.dot']);
        assert.deepEqual(pm('a/.dot', '*/.dot*'), ['a/.dot']);
        assert.deepEqual(pm('a/b/.dot', '**/.[d]ot'), ['a/b/.dot']);
        assert.deepEqual(pm('a/b/.dot', '**/.dot*'), ['a/b/.dot']);
        assert.deepEqual(pm('.dot', '.[d]ot'), ['.dot']);
        assert.deepEqual(pm('.dot', '.d?t'), ['.dot']);
        assert.deepEqual(pm('.dot', '.dot*'), ['.dot']);
      });
    });

    describe('options.dot', () => {
      it('should match dotfiles when `options.dot` is true', () => {
        assert(pm.isMatch('/a/b/.dot', '**/*dot', { dot: true }));
        assert(pm.isMatch('/a/b/.dot', '**/.[d]ot', { dot: true }));
        assert(pm.isMatch('/a/b/.dot', '**/?dot', { dot: true }));
        assert(pm.isMatch('.dotfile.js', '.*.js', { dot: true }));
        assert(pm.isMatch('.dot', '*dot', { dot: true }));
        assert(pm.isMatch('.dot', '?dot', { dot: true }));
        assert(pm.isMatch('/a/b/.dot', '/**/*dot', { dot: true }));
        assert(pm.isMatch('/a/b/.dot', '/**/.[d]ot', { dot: true }));
        assert(pm.isMatch('/a/b/.dot', '/**/?dot', { dot: true }));
        assert(pm.isMatch('a/b/.dot', '**/*dot', { dot: true }));
        assert(pm.isMatch('a/b/.dot', '**/.[d]ot', { dot: true }));
        assert(pm.isMatch('a/b/.dot', '**/?dot', { dot: true }));
      });

      it('should not match dotfiles when `options.dot` is false', () => {
        assert(!pm.isMatch('a/b/.dot', '**/*dot', { dot: false }));
        assert(!pm.isMatch('a/b/.dot', '**/?dot', { dot: false }));
      });

      it('should not match dotfiles when `.dot` is not defined and a dot is not in the glob pattern', () => {
        assert(!pm.isMatch('a/b/.dot', '**/*dot'));
        assert(!pm.isMatch('a/b/.dot', '**/?dot'));
      });
    });
  });

  describe('posix paths', () => {
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
      let fixtures = ['a', 'b', 'a/a', 'a/b', 'a/c', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a', 'x/y', 'z/z'];
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

    it('should support globstars (**)', () => {
      let fixtures = ['a', 'a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z'];
      assert.deepEqual(pm(fixtures, ['a']), ['a', 'a/']);
      assert.deepEqual(pm(fixtures, ['*']), ['a', 'a/']);
      assert.deepEqual(pm(fixtures, ['*/']), ['a/']);
      assert.deepEqual(pm(fixtures, ['*/*']), ['a/a', 'a/b', 'a/c', 'a/x']);
      assert.deepEqual(pm(fixtures, ['**']), fixtures);
      assert.deepEqual(pm(fixtures, ['**/a']), ['a', 'a/', 'a/a']);
      assert.deepEqual(pm(fixtures, ['a/*']), ['a/a', 'a/b', 'a/c', 'a/x']);
      assert.deepEqual(pm(fixtures, ['a/**']), ['a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(fixtures, ['a/**/*']), ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(fixtures, ['a/**/**/*']), ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
      assert.deepEqual(pm(['a/b/foo/bar/baz.qux'], 'a/b/**/bar/**/*.*'), ['a/b/foo/bar/baz.qux']);
      assert.deepEqual(pm(['a/b/bar/baz.qux'], 'a/b/**/bar/**/*.*'), ['a/b/bar/baz.qux']);
    });

    it('should support negation patterns', () => {
      let fixtures = ['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'];
      assert.deepEqual(pm(fixtures, ['!a/b']), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, ['*/*', '!a/b', '!*/c']), ['a/a', 'b/a', 'b/b']);
      assert.deepEqual(pm(fixtures, ['!a/b', '!*/c']), ['a/a', 'b/a', 'b/b']);
      assert.deepEqual(pm(fixtures, ['!a/b', '!a/c']), ['a/a', 'b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, ['!a/(b)']), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
      assert.deepEqual(pm(fixtures, ['!(a/b)']), ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
    });

    it('should work with file extensions', () => {
      let fixtures = ['a.txt', 'a/b.txt', 'a/x/y.txt', 'a/x/y/z'];
      assert.deepEqual(pm(fixtures, ['a/**/*.txt']), ['a/b.txt', 'a/x/y.txt']);
      assert.deepEqual(pm(fixtures, ['a/*.txt']), ['a/b.txt']);
      assert.deepEqual(pm(fixtures, ['a*.txt']), ['a.txt']);
      assert.deepEqual(pm(fixtures, ['*.txt']), ['a.txt']);
    });

    it('should match literal brackets', () => {
      assert.deepEqual(pm(['a [b]'], 'a \\[b\\]'), ['a [b]']);
      assert.deepEqual(pm(['a [b] c'], 'a [b] c'), ['a [b] c']);
      assert.deepEqual(pm(['a [b]'], 'a \\[b\\]*'), ['a [b]']);
      assert.deepEqual(pm(['a [bc]'], 'a \\[bc\\]*'), ['a [bc]']);
      assert.deepEqual(pm(['a [b]', 'a [b].js'], 'a \\[b\\].*'), ['a [b].js']);
    });
  });

  describe('error handling:', function() {
    it('should throw on bad args', function() {
      assert.throws(() => pm.isMatch({}), /expected a string/);
    });
  });

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
      assert(pm.isMatch('.c.md', '*.md', { dot: true }));
      assert(pm.isMatch('.c.md', '.*', { dot: true }));
      assert(pm.isMatch('a/b/c/.xyz.md', 'a/b/c/*.md', { dot: true }));
      assert(pm.isMatch('a/b/c/.xyz.md', 'a/b/c/.*.md', { dot: true }));
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
