'use strict';

require('mocha');
const fill = require('fill-range');
const assert = require('assert');
const picomatch = require('..');
const pm = require('./support');

describe('picomatch', () => {
  beforeEach(() => picomatch.clearCache());

  describe('character matching', () => {
    const fixtures = [
      '//C://user\\docs\\Letter.txt',
      '//server/file',
      '//UNC//Server01//user//docs//Letter.txt',
      '/foo',
      '/foo/a/b/c/d',
      '/foo/bar',
      '/home/foo',
      '/home/foo/..',
      '/user/docs/Letter.txt',
      ':\\',
      '\\\\foo/bar',
      '\\\\foo\\admin$',
      '\\\\foo\\admin$\\system32',
      '\\\\foo\\bar',
      '\\\\foo\\fixtures',
      '\\\\server\\file',
      '\\\\unc\\share',
      '\\\\unc\\share\\foo',
      '\\\\unc\\share\\foo\\',
      '\\\\unc\\share\\foo\\bar',
      '\\\\unc\\share\\foo\\bar\\',
      '\\\\unc\\share\\foo\\bar\\baz',
      'a/b/c.js',
      'a:foo/a/b/c/d',
      'bar/',
      'C:/Users/',
      'c:\\',
      'C:\\Users\\',
      'C:cwd/another',
      'C:cwd\\another',
      'directory/directory',
      'directory\\directory',
      'foo/bar',
      'foo\\bar\\baz',
      'foo\\bar\\baz\\',
      'pages/*.txt'
    ];

    it('should match windows drives', () => {
      // console.log(pm(fixtures, '//*:/**'))
    });

    it('should match dashes', () => {
      const fixtures = ['my/folder - 1', 'my/folder - copy (1)', 'my/folder - copy [1]', 'my/folder - foo + bar - copy [1]'];
      assert.deepEqual(pm(fixtures, '*/*'), fixtures);
      assert.deepEqual(pm(fixtures, '*/*1'), ['my/folder - 1']);
      assert.deepEqual(pm(fixtures, '*/*-*'), fixtures);
    });

    it('should match special characters', () => {
      const fixtures = ['my/folder +1', 'my/folder -1', 'my/folder *1', 'my/folder', 'my/folder+foo+bar&baz', 'my/folder - $1.00', 'my/folder - ^1.00', 'my/folder - %1.00'];
      assert.deepEqual(pm(fixtures, '*/*'), fixtures);
      assert.deepEqual(pm(fixtures, '*/!(*%)*'), fixtures.filter(v => !v.includes('%')));
      assert.deepEqual(pm(fixtures, '*/*$*'), ['my/folder - $1.00']);
      assert.deepEqual(pm(fixtures, '*/*^*'), ['my/folder - ^1.00']);
      assert.deepEqual(pm(fixtures, '*/*&*'), ['my/folder+foo+bar&baz']);
      assert.deepEqual(pm(fixtures, '*/*+*'), ['my/folder +1', 'my/folder+foo+bar&baz']);
      assert.deepEqual(pm(fixtures, '*/*-*'), ['my/folder -1', 'my/folder - $1.00', 'my/folder - ^1.00', 'my/folder - %1.00']);
      assert.deepEqual(pm(fixtures, '*/*\\**'), ['my/folder *1']);
      assert.deepEqual(pm(['$', '$$', '$$$', '^'], '!($)'), ['$$', '$$$', '^']);
      assert.deepEqual(pm(['$', '$$', '$$$', '^'], '!($$)'), ['$', '$$$', '^']);
      assert.deepEqual(pm(['$', '$$', '$$$', '^'], '!($*)'), ['^']);
      assert.deepEqual(pm(['$', '$$', '$$$'], '*'), ['$', '$$', '$$$']);
      assert.deepEqual(pm(['$', '$$', '$$$'], '$*'), ['$', '$$', '$$$']);
      assert.deepEqual(pm(['$', '$$', '$$$'], '*$*'), ['$', '$$', '$$$']);
      assert.deepEqual(pm(['$', '$$', '$$$'], '*$'), ['$', '$$', '$$$']);
      assert.deepEqual(pm(['$', '$$', '$$$'], '?$'), ['$$']);
      assert.deepEqual(pm(['^', '^^', '^^^'], '^*'), ['^', '^^', '^^^']);
      assert.deepEqual(pm(['^', '^^', '^^^'], '*^*'), ['^', '^^', '^^^']);
      assert.deepEqual(pm(['^', '^^', '^^^'], '*^'), ['^', '^^', '^^^']);
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

  describe('array of patterns', () => {
    it('should take an array of patterns', () => {
      assert.deepEqual(pm(['foo', 'bar'], ['f*', 'b*']), ['foo', 'bar']);
    });
  });

  describe('.match()', () => {
    it('should match a string literally', () => {
      assert.deepEqual(pm(['foo', 'bar'], 'foo'), ['foo']);
    });

    it('should match using wildcards', () => {
      assert.deepEqual(pm(['foo', 'bar'], '*a*'), ['bar']);
      assert.deepEqual(pm(['foo', 'bar'], 'b*'), ['bar']);
      assert.deepEqual(pm(['foo', 'bar'], '*r'), ['bar']);
    });

    it('should not match dotfiles by default', () => {
      assert.deepEqual(pm(['foo', '.bar', 'foo/bar', 'foo/.bar'], '**/*'), ['foo', 'foo/bar']);
      assert.deepEqual(pm(['foo', '.bar', 'foo/.bar'], '**/*a*'), []);
      assert.deepEqual(pm(['foo', '.bar'], '*a*'), []);
      assert.deepEqual(pm(['foo', '.bar'], 'b*'), []);
      assert.deepEqual(pm(['foo', '.bar'], '*r'), []);
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
});
