'use strict';

const assert = require('assert');
const minimatch = require('minimatch');
const pm = require('./support');
const { isMatch } = pm;

/**
 * Most of these tests were converted directly from
 * bash 4.3 and 4.4 unit tests.
 */

describe('extglobs', () => {
  it.skip('failing unit tests from bash', () => {
    assert(isMatch('moo.cow', '!(*.*).!(*.*)'));
    assert(isMatch('foo.js.js', '*.!(js)*'));
  });

  it('should throw on imbalanced sets when `options.strictErrors` is true', () => {
    assert.throws(() => pm.makeRe('a(b', { strictErrors: true }), /missing closing: "\)"/i);
    assert.throws(() => pm.makeRe('a)b', { strictErrors: true }), /missing opening: "\("/i);
  });

  it('should match extglobs ending with statechar', () => {
    assert(!isMatch('ax', 'a?(b*)'));
    assert(isMatch('ax', '?(a*|b)'));
  });

  it('should not choke on non-extglobs', () => {
    assert(isMatch('c/z/v', 'c/z/v'));
  });

  it('should work with file extensions', () => {
    assert(!isMatch('.md', '@(a|b).md'));
    assert(!isMatch('a.js', '@(a|b).md'));
    assert(isMatch('a.md', '@(a|b).md'));
    assert(isMatch('b.md', '@(a|b).md'));
    assert(!isMatch('c.md', '@(a|b).md'));

    assert(!isMatch('.md', '+(a|b).md'));
    assert(!isMatch('a.js', '+(a|b).md'));
    assert(isMatch('a.md', '+(a|b).md'));
    assert(isMatch('aa.md', '+(a|b).md'));
    assert(isMatch('ab.md', '+(a|b).md'));
    assert(isMatch('b.md', '+(a|b).md'));
    assert(isMatch('bb.md', '+(a|b).md'));
    assert(!isMatch('c.md', '+(a|b).md'));

    assert(isMatch('.md', '*(a|b).md'));
    assert(!isMatch('a.js', '*(a|b).md'));
    assert(isMatch('a.md', '*(a|b).md'));
    assert(isMatch('aa.md', '*(a|b).md'));
    assert(isMatch('ab.md', '*(a|b).md'));
    assert(isMatch('b.md', '*(a|b).md'));
    assert(isMatch('bb.md', '*(a|b).md'));
    assert(!isMatch('c.md', '*(a|b).md'));
  });

  it('should support !(...)', () => {
    assert(!isMatch('moo.cow', '!(moo).!(cow)'));
    assert(!isMatch('foo.cow', '!(moo).!(cow)'));
    assert(!isMatch('moo.bar', '!(moo).!(cow)'));
    assert(isMatch('foo.bar', '!(moo).!(cow)'));
    assert(isMatch('moo.cow', '!(!(moo)).!(!(cow))'));
    assert(!isMatch('c/z/v', 'c/!(z)/v'));
    assert(isMatch('c/a/v', 'c/!(z)/v'));

    assert(!isMatch('c/z', 'a!(z)'));
    assert(isMatch('abz', 'a!(z)'));
    assert(!isMatch('az', 'a!(z)'));

    assert(!isMatch('a/z', 'a/!(z)'));
    assert(isMatch('a/b', 'a/!(z)'));

    assert(!isMatch('c/z', 'a*!(z)'));
    assert(isMatch('abz', 'a*!(z)'));
    assert(isMatch('az', 'a*!(z)'));

    assert(isMatch('a/a', '!(b/a)'));
    assert(isMatch('a/b', '!(b/a)'));
    assert(isMatch('a/c', '!(b/a)'));
    assert(!isMatch('b/a', '!(b/a)'));
    assert(isMatch('b/b', '!(b/a)'));
    assert(isMatch('b/c', '!(b/a)'));

    assert(isMatch('a/a', '!(b/a)'));
    assert(isMatch('a/b', '!(b/a)'));
    assert(isMatch('a/c', '!(b/a)'));
    assert(!isMatch('b/a', '!(b/a)'));
    assert(isMatch('b/b', '!(b/a)'));
    assert(isMatch('b/c', '!(b/a)'));

    assert(isMatch('a/a', '!((b/a))'));
    assert(isMatch('a/b', '!((b/a))'));
    assert(isMatch('a/c', '!((b/a))'));
    assert(!isMatch('b/a', '!((b/a))'));
    assert(isMatch('b/b', '!((b/a))'));
    assert(isMatch('b/c', '!((b/a))'));

    assert(isMatch('a/a', '!((?:b/a))'));
    assert(isMatch('a/b', '!((?:b/a))'));
    assert(isMatch('a/c', '!((?:b/a))'));
    assert(!isMatch('b/a', '!((?:b/a))'));
    assert(isMatch('b/b', '!((?:b/a))'));
    assert(isMatch('b/c', '!((?:b/a))'));

    assert(isMatch('a/a', '!(b/(a))'));
    assert(isMatch('a/b', '!(b/(a))'));
    assert(isMatch('a/c', '!(b/(a))'));
    assert(!isMatch('b/a', '!(b/(a))'));
    assert(isMatch('b/b', '!(b/(a))'));
    assert(isMatch('b/c', '!(b/(a))'));

    assert(isMatch('a/a', '!(b/a)'));
    assert(isMatch('a/b', '!(b/a)'));
    assert(isMatch('a/c', '!(b/a)'));
    assert(!isMatch('b/a', '!(b/a)'));
    assert(isMatch('b/b', '!(b/a)'));
    assert(isMatch('b/c', '!(b/a)'));

    assert(!isMatch('a   ', '@(!(a) )*'));
    assert(!isMatch('a   b', '@(!(a) )*'));
    assert(!isMatch('a  b', '@(!(a) )*'));
    assert(!isMatch('a  ', '@(!(a) )*'));
    assert(!isMatch('a ', '@(!(a) )*'));
    assert(!isMatch('a', '@(!(a) )*'));
    assert(!isMatch('aa', '@(!(a) )*'));
    assert(!isMatch('b', '@(!(a) )*'));
    assert(!isMatch('bb', '@(!(a) )*'));
    assert(isMatch(' a ', '@(!(a) )*'));
    assert(isMatch('b  ', '@(!(a) )*'));
    assert(isMatch('b ', '@(!(a) )*'));

    assert(!isMatch('a', '!(a)'));
    assert(isMatch('aa', '!(a)'));
    assert(isMatch('b', '!(a)'));

    assert(!isMatch('a', '!(a*)'));
    assert(!isMatch('aa', '!(a*)'));
    assert(!isMatch('ab', '!(a*)'));
    assert(isMatch('b', '!(a*)'));

    assert(!isMatch('a', '!(*a*)'));
    assert(!isMatch('aa', '!(*a*)'));
    assert(!isMatch('ab', '!(*a*)'));
    assert(!isMatch('ac', '!(*a*)'));
    assert(isMatch('b', '!(*a*)'));

    assert(!isMatch('a', '!(*a)'));
    assert(!isMatch('aa', '!(*a)'));
    assert(!isMatch('bba', '!(*a)'));
    assert(isMatch('ab', '!(*a)'));
    assert(isMatch('ac', '!(*a)'));
    assert(isMatch('b', '!(*a)'));

    assert(!isMatch('a', '!(*a)*'));
    assert(!isMatch('aa', '!(*a)*'));
    assert(!isMatch('bba', '!(*a)*'));
    assert(!isMatch('ab', '!(*a)*'));
    assert(!isMatch('ac', '!(*a)*'));
    assert(isMatch('b', '!(*a)*'));

    assert(!isMatch('a', '!(a)*'));
    assert(!isMatch('abb', '!(a)*'));
    assert(isMatch('ba', '!(a)*'));

    assert(isMatch('aa', 'a!(b)*'));
    assert(!isMatch('ab', 'a!(b)*'));
    assert(!isMatch('aba', 'a!(b)*'));
    assert(isMatch('ac', 'a!(b)*'));

    assert(isMatch('aac', 'a!(b)c'));
    assert(!isMatch('abc', 'a!(b)c'));
    assert(isMatch('acc', 'a!(b)c'));

    assert(!isMatch('a.c', 'a!(.)c'));
    assert(isMatch('abc', 'a!(.)c'));
  });

  it('should support logical-or inside negation !(...) extglobs', () => {
    assert(!isMatch('ac', '!(a|b)c'));
    assert(!isMatch('bc', '!(a|b)c'));
    assert(isMatch('cc', '!(a|b)c'));
  });

  it('should support multiple negation !(...) extglobs in one expression', () => {
    assert(!isMatch('ac.d', '!(a|b)c.!(d|e)'));
    assert(!isMatch('bc.d', '!(a|b)c.!(d|e)'));
    assert(!isMatch('cc.d', '!(a|b)c.!(d|e)'));
    assert(!isMatch('ac.e', '!(a|b)c.!(d|e)'));
    assert(!isMatch('bc.e', '!(a|b)c.!(d|e)'));
    assert(!isMatch('cc.e', '!(a|b)c.!(d|e)'));
    assert(!isMatch('ac.f', '!(a|b)c.!(d|e)'));
    assert(!isMatch('bc.f', '!(a|b)c.!(d|e)'));
    assert(isMatch('cc.f', '!(a|b)c.!(d|e)'));
    assert(isMatch('dc.g', '!(a|b)c.!(d|e)'));
  });

  it('should support nested negation !(...) extglobs', () => {
    assert(isMatch('ac.d', '!(!(a|b)c.!(d|e))'));
    assert(isMatch('bc.d', '!(!(a|b)c.!(d|e))'));
    assert(isMatch('cc.d', '!(!(a|b)c.!(d|e))'));
    assert(isMatch('ac.e', '!(!(a|b)c.!(d|e))'));
    assert(isMatch('bc.e', '!(!(a|b)c.!(d|e))'));
    assert(isMatch('cc.e', '!(!(a|b)c.!(d|e))'));
    assert(isMatch('ac.f', '!(!(a|b)c.!(d|e))'));
    assert(isMatch('bc.f', '!(!(a|b)c.!(d|e))'));
    assert(!isMatch('cc.f', '!(!(a|b)c.!(d|e))'));
    assert(!isMatch('dc.g', '!(!(a|b)c.!(d|e))'));
  });

  it('should support *(...)', () => {
    assert(isMatch('a', 'a*(z)'));
    assert(isMatch('az', 'a*(z)'));
    assert(isMatch('azz', 'a*(z)'));
    assert(isMatch('azzz', 'a*(z)'));
    assert(!isMatch('abz', 'a*(z)'));
    assert(!isMatch('cz', 'a*(z)'));

    assert(!isMatch('a/a', '*(b/a)'));
    assert(!isMatch('a/b', '*(b/a)'));
    assert(!isMatch('a/c', '*(b/a)'));
    assert(isMatch('b/a', '*(b/a)'));
    assert(!isMatch('b/b', '*(b/a)'));
    assert(!isMatch('b/c', '*(b/a)'));

    assert(!isMatch('cz', 'a**(z)'));
    assert(isMatch('abz', 'a**(z)'));
    assert(isMatch('az', 'a**(z)'));

    assert(!isMatch('c/z/v', '*(z)'));
    assert(isMatch('z', '*(z)'));
    assert(!isMatch('zf', '*(z)'));
    assert(!isMatch('fz', '*(z)'));

    assert(!isMatch('c/a/v', 'c/*(z)/v'));
    assert(isMatch('c/z/v', 'c/*(z)/v'));

    assert(!isMatch('a.md.js', '*.*(js).js'));
    assert(isMatch('a.js.js', '*.*(js).js'));
  });

  it('should support +(...) extglobs', () => {
    assert(!isMatch('a', 'a+(z)'));
    assert(isMatch('az', 'a+(z)'));
    assert(!isMatch('cz', 'a+(z)'));
    assert(!isMatch('abz', 'a+(z)'));
    assert(!isMatch('a+z', 'a+(z)'));
    assert(isMatch('a+z', 'a++(z)'));
    assert(!isMatch('c+z', 'a+(z)'));
    assert(!isMatch('a+bz', 'a+(z)'));
    assert(!isMatch('az', '+(z)'));
    assert(!isMatch('cz', '+(z)'));
    assert(!isMatch('abz', '+(z)'));
    assert(!isMatch('fz', '+(z)'));
    assert(isMatch('z', '+(z)'));
    assert(isMatch('zz', '+(z)'));
    assert(isMatch('c/z/v', 'c/+(z)/v'));
    assert(isMatch('c/zz/v', 'c/+(z)/v'));
    assert(!isMatch('c/a/v', 'c/+(z)/v'));
  });

  it('should support ?(...) extglobs', () => {
    assert(!isMatch('a?z', 'a??(z)'));

    assert(!isMatch('a?z', 'a?(z)'));
    assert(!isMatch('abz', 'a?(z)'));
    assert(!isMatch('z', 'a?(z)'));
    assert(isMatch('a', 'a?(z)'));
    assert(isMatch('az', 'a?(z)'));

    assert(!isMatch('abz', '?(z)'));
    assert(!isMatch('az', '?(z)'));
    assert(!isMatch('cz', '?(z)'));
    assert(!isMatch('fz', '?(z)'));
    assert(!isMatch('zz', '?(z)'));
    assert(isMatch('z', '?(z)'));

    assert(!isMatch('c/a/v', 'c/?(z)/v'));
    assert(!isMatch('c/zz/v', 'c/?(z)/v'));
    assert(isMatch('c/z/v', 'c/?(z)/v'));
  });

  it.skip('should support @(...) extglobs', () => {
    assert(isMatch(['c/z/v', 'c/a/v'], 'c/@(z)/v', ['c/z/v']));
    assert(isMatch(['cz', 'abz', 'az'], 'a*@(z)', ['az', 'abz']));
    assert(isMatch(['cz', 'abz', 'az'], 'a@(z)', ['az']));
    assert(isMatch('moo.cow', '@(*.*)'));
  });

  it.skip('should support multiple @(...) extglobs in one expression', () => {
    assert(isMatch('moo.cow', '@(*).@(*)'));
  });

  it.skip('should support qmark matching', () => {
    var arr = ['a', 'aa', 'ab', 'aaa', 'abcdefg'];
    assert.deepEqual(pm.match(arr, '?', ['a']));
    assert.deepEqual(pm.match(arr, '??', ['aa', 'ab']));
    assert.deepEqual(pm.match(arr, '???', ['aaa']));
  });

  it.skip('should match exactly one of the given pattern:', () => {
    var arr = ['aa.aa', 'a.bb', 'a.aa.a', 'cc.a', 'a.a', 'c.a', 'dd.aa.d', 'b.a'];
    assert.deepEqual(pm.match(arr, '(b|a).(a)', []));
    assert.deepEqual(pm.match(arr, '@(b|a).@(a)', ['a.a', 'b.a']));
  });

  it("stuff from korn's book", () => {
    assert(!isMatch('para', 'para+([0-9])'));
    assert(!isMatch('para381', 'para?([345]|99)1'));
    assert(!isMatch('paragraph', 'para*([0-9])'));
    assert(!isMatch('paragraph', 'para*([0-9])'));
    assert(!isMatch('paramour', 'para@(chute|graph)'));
    assert(isMatch('para', 'para*([0-9])'));
    assert(isMatch('para.38', 'para!(*.[00-09])'));
    assert(isMatch('para.graph', 'para!(*.[0-9])'));
    assert(isMatch('para13829383746592', 'para*([0-9])'));
    assert(isMatch('para39', 'para!(*.[0-9])'));
    assert(isMatch('para987346523', 'para+([0-9])'));
    assert(isMatch('para991', 'para?([345]|99)1'));
    assert(isMatch('paragraph', 'para!(*.[0-9])'));
    assert(isMatch('paragraph', 'para@(chute|graph)'));
  });

  it.skip("tests derived from those in rosenblatt's korn shell book", () => {
    assert.deepEqual(pm.match(['', '137577991', '2468'], '*(0|1|3|5|7|9)', ['', '137577991']));
    assert.deepEqual(pm.match(['file.c', 'file.C', 'file.cc', 'file.ccc'], '*.c?(c)', ['file.c', 'file.cc']));
    assert.deepEqual(pm.match(['parse.y', 'shell.c', 'Makefile', 'Makefile.in'], '!(*.c|*.h|Makefile.in|config*|README)', ['parse.y', 'Makefile']) );
    assert.deepEqual(pm.match(['VMS.FILE;', 'VMS.FILE;0', 'VMS.FILE;1', 'VMS.FILE;139', 'VMS.FILE;1N'], '*\\;[1-9]*([0-9])', ['VMS.FILE;1', 'VMS.FILE;139']) );
  });

  it.skip('tests derived from the pd-ksh test suite', () => {
    assert.deepEqual(pm.match(['abcx', 'abcz', 'bbc'], '!([[*])*'), ['abcx', 'abcz', 'bbc']);
    assert.deepEqual(pm.match(['abcx', 'abcz', 'bbc'], '+(a|b\\[)*'), ['abcx', 'abcz']);
    assert.deepEqual(pm.match(['abd', 'acd'], 'a+(b|c)d'), ['abd', 'acd']);
    assert.deepEqual(pm.match(['abd', 'acd', 'ac', 'ab'], 'a!(@(b|B))'), ['abd', 'acd', 'ac']);
    assert.deepEqual(pm.match(['abd', 'acd'], 'a!(@(b|B))d'), ['acd']);
    assert.deepEqual(pm.match(['abd', 'acd'], 'a[b*(foo|bar)]d'), ['abd']);
    assert.deepEqual(pm.match(['abcx', 'abcz', 'bbc', 'aaz', 'aaaz'], '[a*(]*z'), ['abcz', 'aaz', 'aaaz']);
  });

  it.skip('simple kleene star tests', () => {
    assert(isMatch('foo', '*(a|b|f)*'));
    assert(isMatch('foo', '*(a|b|o)*'));
    assert(isMatch('foo', '*(a|b|f|o)'));
    assert(isMatch('*(a|b[)', '*(a|b\\[)'));
    assert(isMatch('*(a|b[)', '\\*\\(a\\|b\\[\\)'));
    assert(!isMatch('foo', '*(a|b)'));
    assert(!isMatch('foo', '*(a|b\\[)'));
    assert(!isMatch('foo', '*(a|b\\[)|f*'));
  });

  it.skip('should support multiple extglobs:', () => {
    var arr = ['a.a', 'a.b', 'a.c', 'a.c.d', 'c.c', 'a.', 'd.d', 'e.e', 'f.f', 'a.abcd'];
    assert.deepEqual(pm.match(arr, '*.@(a|b|@(ab|a*@(b))*@(c)d)', ['a.a', 'a.b', 'a.abcd']));
    assert.deepEqual(pm.match(arr, '!(*.a|*.b|*.c)', ['a.', 'a.c.d', 'a.abcd', 'd.d', 'e.e', 'f.f']));
    assert.deepEqual(pm.match(arr, '!(*.[^a-c])', ['a.a', 'a.b', 'a.c', 'c.c', 'a.', 'a.abcd']));
    assert.deepEqual(pm.match(arr, '!(*.[a-c])', ['a.', 'a.c.d', 'a.abcd', 'd.d', 'e.e', 'f.f']));
    assert.deepEqual(pm.match(arr, '!(*.[a-c]*)', ['a.', 'd.d', 'e.e', 'f.f']));
    assert.deepEqual(pm.match(arr, '*.!(a|b|c)', ['a.c.d', 'a.abcd', 'a.', 'd.d', 'e.e', 'f.f']));
    assert.deepEqual(pm.match(arr, '*!(.a|.b|.c)', arr));
    assert.deepEqual(pm.match(arr, '!(*.[a-c])*', arr));
    assert.deepEqual(pm.match(arr, '*!(.a|.b|.c)*', arr));
    assert.deepEqual(pm.match(arr, '*.!(a|b|c)*', arr));
  });

  it.skip('should correctly match empty parens', () => {
    assert.deepEqual(pm.match(['def', 'ef'], '@()ef', ['ef']));
    assert.deepEqual(pm.match(['def', 'ef'], '()ef', []));
  });

  it.skip('should match escaped parens', () => {
    var arr = ['a(b', 'a\\(b', 'a((b', 'a((((b', 'ab'];
    assert.deepEqual(pm.match(arr, 'a(b', []));
    assert.deepEqual(pm.match(arr, 'a\\(b', []));
    assert.deepEqual(pm.match(arr, 'a(*b', []));
  });

  it.skip('should match escaped backslashes', () => {
    assert.deepEqual(pm.match(['a(b', 'a\\(b', 'a((b', 'a((((b', 'ab'], 'a\\\\(b', []));
    assert.deepEqual(pm.match(['a\\b', 'a/b', 'ab'], 'a\\\\b', ['ab', 'ab']));
  });

  // these are not extglobs, and do not need to pass, but they are included
  // to test integration with expand-brackets
  it.skip('should match common regex patterns', () => {
    var fixtures = [
      'a c',
      'a1c',
      'a123c',
      'a.c',
      'a.xy.zc',
      'a.zc',
      'abbbbc',
      'abbbc',
      'abbc',
      'abc',
      'abq',
      'axy zc',
      'axy',
      'axy.zc',
      'axyzc'
    ];

    assert.deepEqual(pm.match(['a\\b', 'a/b', 'ab'], 'a/b', ['a/b']));
    assert.deepEqual(pm.match(fixtures, 'ab?bc', ['abbbc']));
    assert.deepEqual(pm.match(fixtures, 'ab*c', ['abbbbc', 'abbbc', 'abbc', 'abc']));
    assert.deepEqual(pm.match(fixtures, 'a+(b)bc', ['abbbbc', 'abbbc', 'abbc']));
    assert.deepEqual(pm.match(fixtures, '^abc$', ['abc']));
    assert.deepEqual(pm.match(fixtures, 'a.c', ['a.c']));
    assert.deepEqual(pm.match(fixtures, 'a.*c', ['a.c', 'a.xy.zc', 'a.zc']));
    assert.deepEqual(
      pm.match(fixtures, 'a*c', [
        'a c',
        'a.c',
        'a1c',
        'a123c',
        'abbbbc',
        'abbbc',
        'abbc',
        'abc',
        'axyzc',
        'axy zc',
        'axy.zc',
        'a.xy.zc',
        'a.zc'
      ])
    );
    assert.deepEqual(
      pm.match(
        fixtures,
        'a\\w+c',
        ['a1c', 'a123c', 'abbbbc', 'abbbc', 'abbc', 'abc', 'axyzc'],
        'Should match word characters'
      )
    );
    assert.deepEqual(pm.match(fixtures, 'a\\W+c', ['a.c', 'a c'], 'Should match non-word characters'));
    assert.deepEqual(pm.match(fixtures, 'a\\d+c', ['a1c', 'a123c'], 'Should match numbers'));
    assert.deepEqual(pm.match(['foo@#$%123ASD #$$%^&', 'foo!@#$asdfl;', '123'], '\\d+', ['123']));
    assert.deepEqual(pm.match(['a123c', 'abbbc'], 'a\\D+c', ['abbbc'], 'Should match non-numbers'));
    assert.deepEqual(pm.match(['foo', ' foo '], '(f|o)+\\b', ['foo'], 'Should match word boundaries'));
  });
});

describe('bash unit tests', () => {
  var fixtures = [
    'ffffffo',
    'fffooofoooooffoofffooofff',
    'ffo',
    'fofo',
    'fofoofoofofoo',
    'foo',
    'foob',
    'foobb',
    'foofoofo',
    'fooofoofofooo',
    'foooofo',
    'foooofof',
    'foooofofx',
    'foooxfooxfoxfooox',
    'foooxfooxfxfooox',
    'foooxfooxofoxfooox',
    'foot',
    'foox',
    'ofoofo',
    'ofooofoofofooo',
    'ofoooxoofxo',
    'ofoooxoofxoofoooxoofxo',
    'ofoooxoofxoofoooxoofxofo',
    'ofoooxoofxoofoooxoofxoo',
    'ofoooxoofxoofoooxoofxooofxofxo',
    'ofxoofxo',
    'oofooofo',
    'ooo',
    'oxfoxfox',
    'oxfoxoxfox',
    'xfoooofof'
  ];

  it.skip('should match extended globs from the bash spec:', () => {
    var f2 = [
      'bar',
      'f',
      'fa',
      'fb',
      'ff',
      'fff',
      'fo',
      'foo',
      'foo/bar',
      'foobar',
      'foot',
      'foox',
      'o',
      'of',
      'ooo',
      'ox',
      'x',
      'xx'
    ];
    assert.deepEqual(
      pm.match(f2, '!(foo)', [
        'bar',
        'f',
        'fa',
        'fb',
        'ff',
        'fff',
        'fo',
        'foo/bar',
        'foobar',
        'foot',
        'foox',
        'o',
        'of',
        'ooo',
        'ox',
        'x',
        'xx'
      ])
    );
    assert.deepEqual(pm.match(f2, '!(!(foo))', ['foo']));
    assert.deepEqual(
      pm.match(f2, '!(!(!(foo)))', [
        'bar',
        'f',
        'fa',
        'fb',
        'ff',
        'fff',
        'fo',
        'foo/bar',
        'foobar',
        'foot',
        'foox',
        'o',
        'of',
        'ooo',
        'ox',
        'x',
        'xx'
      ])
    );
    assert.deepEqual(pm.match(f2, '!(!(!(!(foo))))', ['foo']));
    assert.deepEqual(pm.match(f2, '!(!(foo))*', ['foo', 'foo/bar', 'foobar', 'foot', 'foox']));
    assert.deepEqual(pm.match(f2, '!(f!(o))', ['fo']));
    assert.deepEqual(
      pm.match(f2, '!(f(o))', [
        'bar',
        'f',
        'fa',
        'fb',
        'ff',
        'fff',
        'foo',
        'foobar',
        'foo/bar',
        'foot',
        'foox',
        'o',
        'of',
        'ooo',
        'ox',
        'x',
        'xx'
      ])
    );
    assert.deepEqual(
      pm.match(f2, '!(f)', [
        'bar',
        'fa',
        'fb',
        'ff',
        'fff',
        'fo',
        'foo',
        'foobar',
        'foo/bar',
        'foot',
        'foox',
        'o',
        'of',
        'ooo',
        'ox',
        'x',
        'xx'
      ])
    );
    assert.deepEqual(
      pm.match(f2, '!(f)', [
        'bar',
        'fa',
        'fb',
        'ff',
        'fff',
        'fo',
        'foo',
        'foobar',
        'foo/bar',
        'foot',
        'foox',
        'o',
        'of',
        'ooo',
        'ox',
        'x',
        'xx'
      ])
    );
    assert.deepEqual(
      pm.match(f2, '!(foo)', [
        'bar',
        'f',
        'fa',
        'fb',
        'ff',
        'fff',
        'fo',
        'foobar',
        'foo/bar',
        'foot',
        'foox',
        'o',
        'of',
        'ooo',
        'ox',
        'x',
        'xx'
      ])
    );
    assert.deepEqual(
      pm.match(f2, '!(foo)*', ['bar', 'f', 'fa', 'fb', 'ff', 'fff', 'fo', 'o', 'of', 'ooo', 'ox', 'x', 'xx'])
    );
    assert.deepEqual(
      pm.match(f2, '!(x)', [
        'bar',
        'f',
        'fa',
        'fb',
        'ff',
        'fff',
        'fo',
        'foo',
        'foobar',
        'foo/bar',
        'foot',
        'foox',
        'o',
        'of',
        'ooo',
        'ox',
        'xx'
      ])
    );
    assert.deepEqual(
      pm.match(f2, '!(x)*', [
        'bar',
        'f',
        'fa',
        'fb',
        'ff',
        'fff',
        'fo',
        'foo',
        'foobar',
        'foo/bar',
        'foot',
        'foox',
        'o',
        'of',
        'ooo',
        'ox'
      ])
    );
    assert.deepEqual(
      pm.match(f2, '*(!(f))', [
        'bar',
        'fa',
        'fb',
        'ff',
        'fff',
        'fo',
        'foo',
        'foobar',
        'foo/bar',
        'foot',
        'foox',
        'o',
        'of',
        'ooo',
        'ox',
        'x',
        'xx'
      ])
    );
    assert.deepEqual(pm.match(f2, '*((foo))', ['foo']));
    assert.deepEqual(
      pm.match(f2, '+(!(f))', [
        'bar',
        'fa',
        'fb',
        'ff',
        'fff',
        'fo',
        'foo',
        'foobar',
        'foo/bar',
        'foot',
        'foox',
        'o',
        'of',
        'ooo',
        'ox',
        'x',
        'xx'
      ])
    );
    assert.deepEqual(
      pm.match(f2, '@(!(z*)|*x)', [
        'bar',
        'f',
        'fa',
        'fb',
        'ff',
        'fff',
        'fo',
        'foo',
        'foobar',
        'foo/bar',
        'foot',
        'foox',
        'o',
        'of',
        'ooo',
        'ox',
        'x',
        'xx'
      ])
    );
    assert.deepEqual(pm.match(f2, 'foo/!(foo)', ['foo/bar']));

    assert.deepEqual(pm.match(fixtures, '(foo)bb', ['foobb']));
    assert.deepEqual(
      pm.match(fixtures, '*(*(f)*(o))', [
        'ffffffo',
        'fffooofoooooffoofffooofff',
        'ffo',
        'fofo',
        'fofoofoofofoo',
        'foo',
        'foofoofo',
        'fooofoofofooo',
        'foooofo',
        'foooofof',
        'ofoofo',
        'ofooofoofofooo',
        'oofooofo',
        'ooo'
      ])
    );
    assert.deepEqual(
      pm.match(fixtures, '*(*(of*(o)x)o)', [
        'ofoooxoofxo',
        'ofoooxoofxoofoooxoofxo',
        'ofoooxoofxoofoooxoofxoo',
        'ofoooxoofxoofoooxoofxooofxofxo',
        'ofxoofxo',
        'ooo'
      ])
    );
    assert.deepEqual(
      pm.match(fixtures, '*(f*(o))', [
        'ffffffo',
        'fffooofoooooffoofffooofff',
        'ffo',
        'fofo',
        'fofoofoofofoo',
        'foo',
        'foofoofo',
        'fooofoofofooo',
        'foooofo',
        'foooofof'
      ])
    );
    assert.deepEqual(pm.match(fixtures, '*(f*(o)x)', ['foooxfooxfoxfooox', 'foooxfooxfxfooox', 'foox']));
    assert.deepEqual(
      pm.match(fixtures, '*(f+(o))', ['fofo', 'fofoofoofofoo', 'foo', 'foofoofo', 'fooofoofofooo', 'foooofo'])
    );
    assert.deepEqual(pm.match(fixtures, '*(of+(o))', ['ofoofo']));
    assert.deepEqual(pm.match(fixtures, '*(of+(o)|f)', ['fofo', 'fofoofoofofoo', 'ofoofo', 'ofooofoofofooo']));
    assert.deepEqual(pm.match(fixtures, '*(of|oof+(o))', ['ofoofo', 'oofooofo']));
    assert.deepEqual(pm.match(fixtures, '*(oxf+(ox))', ['oxfoxoxfox']));
    assert.deepEqual(
      pm.match(fixtures, '@(!(z*)|*x)', [
        'ffffffo',
        'fffooofoooooffoofffooofff',
        'ffo',
        'fofo',
        'fofoofoofofoo',
        'foo',
        'foob',
        'foobb',
        'foofoofo',
        'fooofoofofooo',
        'foooofo',
        'foooofof',
        'foooofofx',
        'foooxfooxfoxfooox',
        'foooxfooxfxfooox',
        'foooxfooxofoxfooox',
        'foot',
        'foox',
        'ofoofo',
        'ofooofoofofooo',
        'ofoooxoofxo',
        'ofoooxoofxoofoooxoofxo',
        'ofoooxoofxoofoooxoofxofo',
        'ofoooxoofxoofoooxoofxoo',
        'ofoooxoofxoofoooxoofxooofxofxo',
        'ofxoofxo',
        'oofooofo',
        'ooo',
        'oxfoxfox',
        'oxfoxoxfox',
        'xfoooofof'
      ])
    );
    assert.deepEqual(
      pm.match(fixtures, '@(foo|f|fo)*(f|of+(o))', ['fofo', 'fofoofoofofoo', 'foo', 'foofoofo', 'fooofoofofooo'])
    );

    var arr = ['aaac', 'aac', 'ac', 'abbcd', 'abcd', 'acd', 'baaac', 'c', 'foo'];
    assert.deepEqual(pm.match(arr, '*(@(a))a@(c)', ['aaac', 'aac', 'ac']));
    assert.deepEqual(pm.match(arr, '@(ab|a*(b))*(c)d', ['abbcd', 'abcd', 'acd']));
    assert.deepEqual(pm.match(arr, '?@(a|b)*@(c)d', ['abbcd', 'abcd']));
    assert.deepEqual(pm.match(arr, '@(ab|a*@(b))*(c)d', ['abbcd', 'abcd']));
    assert.deepEqual(pm.match(['aac'], '*(@(a))b@(c)', []));
  });

  it.skip('should backtrack in alternation matches', () => {
    assert.deepEqual(pm.match(fixtures, '*(fo|foo)', ['fofo', 'fofoofoofofoo', 'foo', 'foofoofo']));
  });

  it.skip('should support exclusions', () => {
    assert.deepEqual(pm.match(['foob', 'foobb', 'foo', 'bar', 'baz', 'foobar'], '!(foo)b*', ['bar', 'baz']));
    assert.deepEqual(pm.match(['foo', 'bar', 'baz', 'foobar'], '*(!(foo))', ['bar', 'baz', 'foobar']));

    // Bash 4.3 says this should match `foo` and `foobar` too
    assert.deepEqual(pm.match(['foo', 'bar', 'baz', 'foobar'], '!(foo)*', ['bar', 'baz']));

    assert.deepEqual(pm.match(['moo.cow', 'moo', 'cow'], '!(*.*)', ['moo', 'cow']));
    assert.deepEqual(pm.match(['mad.moo.cow'], '!(*.*).!(*.*)', []));
    assert.deepEqual(pm.match(['moo.cow', 'moo', 'cow'], '!(*.*).', []));
    assert.deepEqual(pm.match(['moo.cow', 'moo', 'cow'], '.!(*.*)', []));
    assert.deepEqual(pm.match(['mucca.pazza'], 'mu!(*(c))?.pa!(*(z))?', []));

    assert.deepEqual(pm.match(['effgz'], '@(b+(c)d|e*(f)g?|?(h)i@(j|k))', ['effgz']));
    assert.deepEqual(pm.match(['efgz'], '@(b+(c)d|e*(f)g?|?(h)i@(j|k))', ['efgz']));
    assert.deepEqual(pm.match(['egz'], '@(b+(c)d|e*(f)g?|?(h)i@(j|k))', ['egz']));
    assert.deepEqual(pm.match(['egz'], '@(b+(c)d|e+(f)g?|?(h)i@(j|k))', []));
    assert.deepEqual(pm.match(['egzefffgzbcdij'], '*(b+(c)d|e*(f)g?|?(h)i@(j|k))', ['egzefffgzbcdij']));
  });

  it.skip('valid numbers', () => {
    assert(isMatch('/dev/udp/129.22.8.102/45', '/dev/@(tcp|udp)/*/*'));
    assert.deepEqual(pm.match(['0', '12', '1', '12abc', '555'], '[1-6]([0-9])', ['12']));
    assert.deepEqual(pm.match(['0', '12', '1', '12abc', '555'], '[1-6]*([0-9])', ['1', '12', '555']));
    assert.deepEqual(pm.match(['0', '12', '1', '12abc', '555'], '[1-5]*([6-9])', ['1']));
    assert.deepEqual(pm.match(['0', '12', '1', '12abc', '555'], '0|[1-6]*([0-9])', ['0', '1', '12', '555']));
    assert.deepEqual(pm.match(['07', '0377', '09'], '+([0-7])', ['0377', '07']));
  });

  it("stuff from korn's book", () => {
    assert(!isMatch('para', 'para+([0-9])'));
    assert(!isMatch('para381', 'para?([345]|99)1'));
    assert(!isMatch('paragraph', 'para*([0-9])'));
    assert(!isMatch('paragraph', 'para*([0-9])'));
    assert(!isMatch('paramour', 'para@(chute|graph)'));
    assert(isMatch('para', 'para*([0-9])'));
    assert(isMatch('para.38', 'para!(*.[0-9])'));
    assert(isMatch('para.graph', 'para!(*.[0-9])'));
    assert(isMatch('para13829383746592', 'para*([0-9])'));
    assert(isMatch('para39', 'para!(*.[0-9])'));
    assert(isMatch('para987346523', 'para+([0-9])'));
    assert(isMatch('para991', 'para?([345]|99)1'));
    assert(isMatch('paragraph', 'para!(*.[0-9])'));
    assert(isMatch('paragraph', 'para@(chute|graph)'));
  });

  it.skip("tests derived from those in rosenblatt's korn shell book", () => {
    assert(isMatch('', '*(0|1|3|5|7|9)'));
    assert(isMatch('137577991', '*(0|1|3|5|7|9)'));
    assert(!isMatch('2468', '*(0|1|3|5|7|9)'));

    assert(!isMatch('file.C', '*.c?(c)'));
    assert(!isMatch('file.ccc', '*.c?(c)'));
    assert(isMatch('file.c', '*.c?(c)'));
    assert(isMatch('file.cc', '*.c?(c)'));

    assert(isMatch('parse.y', '!(*.c|*.h|Makefile.in|config*|README)'));
    assert(isMatch('Makefile', '!(*.c|*.h|Makefile.in|config*|README)'));
    assert(!isMatch('shell.c', '!(*.c|*.h|Makefile.in|config*|README)'));

    assert(!isMatch('VMS.FILE;', '*\\;[1-9]*([0-9])'));
    assert(!isMatch('VMS.FILE;0', '*\\;[1-9]*([0-9])'));
    assert(!isMatch('VMS.FILE;1N', '*\\;[1-9]*([0-9])'));
    assert(isMatch('VMS.FILE;1', '*\\;[1-9]*([0-9])'));
    assert(isMatch('VMS.FILE;139', '*\\;[1-9]*([0-9])'));
  });

  it.skip('tests derived from the pd-ksh test suite', () => {
    assert.deepEqual(pm.match(['abcx', 'abcz', 'bbc'], '!([*)*', ['abcx', 'abcz', 'bbc']));
    assert.deepEqual(pm.match(['abcx', 'abcz', 'bbc'], '+(a|b[)*', ['abcx', 'abcz']));
    assert.deepEqual(pm.match(['abcx', 'abcz', 'bbc'], '[a*(]*)z', []));

    assert.deepEqual(pm.match(['abc'], '+()c', []));
    assert.deepEqual(pm.match(['abc'], '+()x', []));
    assert.deepEqual(pm.match(['abc'], '+(*)c', ['abc']));
    assert.deepEqual(pm.match(['abc'], '+(*)x', []));

    assert.deepEqual(pm.match(['abc'], 'no-file+(a|b)stuff', []));
    assert.deepEqual(pm.match(['abc'], 'no-file+(a*(c)|b)stuff', []));

    assert.deepEqual(pm.match(['abd', 'acd'], 'a+(b|c)d', ['abd', 'acd']));
    assert.deepEqual(pm.match(['abc'], 'a+(b|c)d', []));

    assert.deepEqual(pm.match(['acd'], 'a!(@(b|B))d', ['acd']));
    assert.deepEqual(pm.match(['abc', 'abd'], 'a!(@(b|B))d', []));

    assert.deepEqual(pm.match(['abd'], 'a[b*(foo|bar)]d', ['abd']));
    assert.deepEqual(pm.match(['abc', 'acd'], 'a[b*(foo|bar)]d', []));
  });

  it.skip('simple kleene star tests', () => {
    assert(!isMatch('foo', '*(a|b[)'));
    assert(!isMatch('(', '*(a|b[)'));
    assert(!isMatch(')', '*(a|b[)'));
    assert(!isMatch('|', '*(a|b[)'));
    assert(isMatch('a', '*(a|b)'));
    assert(isMatch('b', '*(a|b)'));
    assert(isMatch('b[', '*(a|b\\[)'));
    assert(isMatch('ab[', '+(a|b\\[)'));
    assert(!isMatch('ab[cde', '+(a|b\\[)'));
    assert(isMatch('ab[cde', '+(a|b\\[)*'));
  });

  it.skip('check extended globbing in pattern removal', () => {
    assert.deepEqual(pm.match(['a', 'abc'], '+(a|abc)', ['a', 'abc']));
    assert.deepEqual(pm.match(['abcd', 'abcde', 'abcedf'], '+(a|abc)', []));

    assert.deepEqual(pm.match(['f'], '+(def|f)', ['f']));

    assert.deepEqual(pm.match(['def'], '+(f|def)', ['def']));
    assert.deepEqual(pm.match(['cdef', 'bcdef', 'abcedf'], '+(f|def)', []));

    assert.deepEqual(pm.match(['abcd'], '*(a|b)cd', ['abcd']));
    assert.deepEqual(pm.match(['a', 'ab', 'abc'], '*(a|b)cd', []));

    assert.deepEqual(pm.match(['a', 'ab', 'abc', 'abcde', 'abcdef'], '"*(a|b)cd"', []));
  });

  it.skip('More tests derived from a bug report (in bash) concerning extended glob patterns following a *', () => {
    var fixtures = ['123abc', 'ab', 'abab', 'abcdef', 'accdef', 'abcfefg', 'abef', 'abcfef', 'abd', 'acd'];
    assert.deepEqual(pm.match(['/dev/udp/129.22.8.102/45'], '/dev\\/@(tcp|udp)\\/*\\/*', ['/dev/udp/129.22.8.102/45']));
    assert.deepEqual(
      pm.match(fixtures, '(a+|b)*', ['ab', 'abab', 'accdef', 'abcdef', 'abcfefg', 'abef', 'abcfef', 'abd', 'acd'])
    );
    assert.deepEqual(pm.match(fixtures, '(a+|b)+', ['ab', 'abab']));
    assert.deepEqual(pm.match(fixtures, 'a(b*(foo|bar))d', ['abd']));
    assert.deepEqual(pm.match(fixtures, 'ab*(e|f)', ['ab', 'abef']));
    assert.deepEqual(pm.match(fixtures, 'ab**(e|f)', ['ab', 'abab', 'abcdef', 'abcfef', 'abd', 'abef', 'abcfefg']));
    assert.deepEqual(pm.match(fixtures, 'ab**(e|f)g', ['abcfefg']));
    assert.deepEqual(pm.match(fixtures, 'ab***ef', ['abcdef', 'abcfef', 'abef']));
    assert.deepEqual(pm.match(fixtures, 'ab*+(e|f)', ['abcdef', 'abcfef', 'abef']));
    assert.deepEqual(pm.match(fixtures, 'ab*d*(e|f)', ['abcdef', 'abd']));
    assert.deepEqual(pm.match(fixtures, 'ab*d+(e|f)', ['abcdef']));
    assert.deepEqual(pm.match(fixtures, 'ab?*(e|f)', ['abcfef', 'abd', 'abef']));
  });

  it.skip('bug in all versions up to and including bash-2.05b', () => {
    assert(isMatch('123abc', '*?(a)bc'));
  });

  it.skip('should work with character classes', () => {
    var fixtures = ['a.b', 'a,b', 'a:b', 'a-b', 'a;b', 'a b', 'a_b'];
    assert.deepEqual(pm.match(fixtures, 'a[^[:alnum:]]b', fixtures));
    assert.deepEqual(pm.match(fixtures, 'a[-.,:\\;\\ _]b', fixtures));
    assert.deepEqual(pm.match(fixtures, 'a@([^[:alnum:]])b', fixtures));
    assert.deepEqual(pm.match(fixtures, 'a@([-.,:; _])b', fixtures));
    assert.deepEqual(pm.match(fixtures, 'a@([.])b', ['a.b']));
    assert.deepEqual(pm.match(fixtures, 'a@([^.])b', ['a,b', 'a:b', 'a-b', 'a;b', 'a b', 'a_b']));
    assert.deepEqual(pm.match(fixtures, 'a@([^x])b', ['a,b', 'a:b', 'a-b', 'a;b', 'a b', 'a_b']));
    assert.deepEqual(pm.match(fixtures, 'a+([^[:alnum:]])b', fixtures));
    assert.deepEqual(pm.match(fixtures, 'a@(.|[^[:alnum:]])b', fixtures));
  });

  it.skip('should support POSIX character classes in extglobs', () => {
    assert(isMatch('a.c', '+([[:alpha:].])'));
    assert(isMatch('a.c', '+([[:alpha:].])+([[:alpha:].])'));
    assert(isMatch('a.c', '*([[:alpha:].])'));
    assert(isMatch('a.c', '*([[:alpha:].])*([[:alpha:].])'));
    assert(isMatch('a.c', '?([[:alpha:].])?([[:alpha:].])?([[:alpha:].])'));
    assert(isMatch('a.c', '@([[:alpha:].])@([[:alpha:].])@([[:alpha:].])'));
    assert(!isMatch('.', '!(\\.)'));
    assert(!isMatch('.', '!([[:alpha:].])'));
    assert(isMatch('.', '?([[:alpha:].])'));
    assert(isMatch('.', '@([[:alpha:].])'));
  });

  // ported from http://www.bashcookbook.com/bashinfo/source/bash-4.3/tests/extglob2.tests
  it.skip('should pass extglob2 tests', () => {
    assert(!isMatch('baaac', '*(@(a))a@(c)'));
    assert(!isMatch('c', '*(@(a))a@(c)'));
    assert(!isMatch('egz', '@(b+(c)d|e+(f)g?|?(h)i@(j|k))'));
    assert(!isMatch('foooofof', '*(f+(o))'));
    assert(!isMatch('foooofofx', '*(f*(o))'));
    assert(!isMatch('foooxfooxofoxfooox', '*(f*(o)x)'));
    assert(!isMatch('ofooofoofofooo', '*(f*(o))'));
    assert(!isMatch('ofoooxoofxoofoooxoofxofo', '*(*(of*(o)x)o)'));
    assert(!isMatch('oxfoxfox', '*(oxf+(ox))'));
    assert(!isMatch('xfoooofof', '*(f*(o))'));
    assert(isMatch('aaac', '*(@(a))a@(c)'));
    assert(isMatch('aac', '*(@(a))a@(c)'));
    assert(isMatch('abbcd', '@(ab|a*(b))*(c)d'));
    assert(isMatch('abcd', '?@(a|b)*@(c)d'));
    assert(isMatch('abcd', '@(ab|a*@(b))*(c)d'));
    assert(isMatch('ac', '*(@(a))a@(c)'));
    assert(isMatch('acd', '@(ab|a*(b))*(c)d'));
    assert(isMatch('effgz', '@(b+(c)d|e*(f)g?|?(h)i@(j|k))'));
    assert(isMatch('efgz', '@(b+(c)d|e*(f)g?|?(h)i@(j|k))'));
    assert(isMatch('egz', '@(b+(c)d|e*(f)g?|?(h)i@(j|k))'));
    assert(isMatch('egzefffgzbcdij', '*(b+(c)d|e*(f)g?|?(h)i@(j|k))'));
    assert(isMatch('fffooofoooooffoofffooofff', '*(*(f)*(o))'));
    assert(isMatch('ffo', '*(f*(o))'));
    assert(isMatch('fofo', '*(f*(o))'));
    assert(isMatch('foofoofo', '@(foo|f|fo)*(f|of+(o))'));
    assert(isMatch('fooofoofofooo', '*(f*(o))'));
    assert(isMatch('foooofo', '*(f*(o))'));
    assert(isMatch('foooofof', '*(f*(o))'));
    assert(isMatch('foooxfooxfoxfooox', '*(f*(o)x)'));
    assert(isMatch('foooxfooxfxfooox', '*(f*(o)x)'));
    assert(isMatch('ofoofo', '*(of+(o))'));
    assert(isMatch('ofoofo', '*(of+(o)|f)'));
    assert(isMatch('ofoooxoofxo', '*(*(of*(o)x)o)'));
    assert(isMatch('ofoooxoofxoofoooxoofxo', '*(*(of*(o)x)o)'));
    assert(isMatch('ofoooxoofxoofoooxoofxoo', '*(*(of*(o)x)o)'));
    assert(isMatch('ofoooxoofxoofoooxoofxooofxofxo', '*(*(of*(o)x)o)'));
    assert(isMatch('ofxoofxo', '*(*(of*(o)x)o)'));
    assert(isMatch('oofooofo', '*(of|oof+(o))'));
    assert(isMatch('oxfoxoxfox', '*(oxf+(ox))'));
  });

  it.skip('should support backtracking in alternation matches', () => {
    assert(isMatch('fofoofoofofoo', '*(fo|foo)'));
  });

  it.skip('should support exclusions', () => {
    assert(!isMatch('f', '!(f)'));
    assert(!isMatch('f', '*(!(f))'));
    assert(!isMatch('f', '+(!(f))'));
    assert(!isMatch('foo', '!(foo)'));
    assert(!isMatch('foob', '!(foo)b*'));
    assert(!isMatch('mad.moo.cow', '!(*.*).!(*.*)'));
    assert(!isMatch('mucca.pazza', 'mu!(*(c))?.pa!(*(z))?'));
    assert(!isMatch('zoot', '@(!(z*)|*x)'));
    assert(isMatch('fff', '!(f)'));
    assert(isMatch('fff', '*(!(f))'));
    assert(isMatch('fff', '+(!(f))'));
    assert(isMatch('foo', '!(f)'));
    assert(isMatch('foo', '!(x)'));
    assert(isMatch('foo', '!(x)*'));
    assert(isMatch('foo', '*(!(f))'));
    assert(isMatch('foo', '+(!(f))'));
    assert(isMatch('foobar', '!(foo)'));
    assert(isMatch('foot', '@(!(z*)|*x)'));
    assert(isMatch('foox', '@(!(z*)|*x)'));
    assert(isMatch('ooo', '!(f)'));
    assert(isMatch('ooo', '*(!(f))'));
    assert(isMatch('ooo', '+(!(f))'));
    assert(isMatch('zoox', '@(!(z*)|*x)'));
  });

  it.skip('should pass extglob3 tests', () => {
    assert(isMatch('ab/../', '+(??)/..?(/)'));
    assert(isMatch('ab/../', '+(??|a*)/..?(/)'));
    assert(isMatch('ab/../', '+(?b)/..?(/)'));
    assert(isMatch('ab/../', '+(?b|?b)/..?(/)'));
    assert(isMatch('ab/../', '+([!/])/../'));
    assert(isMatch('ab/../', '+([!/])/..?(/)'));
    assert(isMatch('ab/../', '+([!/])/..@(/)'));
    assert(isMatch('ab/../', '+([^/])/../'));
    assert(isMatch('ab/../', '+([^/])/..?(/)'));
    assert(isMatch('ab/../', '+(a*)/..?(/)'));
    assert(isMatch('ab/../', '+(ab)/..?(/)'));
    assert(isMatch('ab/../', '?(ab)/..?(/)'));
    assert(isMatch('ab/../', '?(ab|??)/..?(/)'));
    assert(isMatch('ab/../', '?b/..?(/)'));
    assert(isMatch('ab/../', '@(??)/..?(/)'));
    assert(isMatch('ab/../', '@(??|a*)/..?(/)'));
    assert(isMatch('ab/../', '@(?b|?b)/..?(/)'));
    assert(isMatch('ab/../', '@(a*)/..?(/)'));
    assert(isMatch('ab/../', '@(a?|?b)/..?(/)'));
    assert(isMatch('ab/../', '@(ab|+([!/]))/..?(/)'));
    assert(isMatch('ab/../', '@(ab|+([^/]))/..?(/)'));
    assert(isMatch('ab/../', '@(ab|?b)/..?(/)'));
    assert(isMatch('ab/../', '[!/][!/]/../'));
    assert(isMatch('ab/../', '[^/][^/]/../'));
    assert(isMatch('x', '@(x)'));
  });
});
