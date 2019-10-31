'use strict';

const assert = require('assert');
const match = require('./support/match');
const { isMatch, makeRe } = require('..');

/**
 * Ported from Bash 4.3 and 4.4 unit tests
 */

describe('extglobs', () => {
  it('should throw on imbalanced sets when `optionsBrackets` is true', () => {
    const opts = { strictBrackets: true };
    assert.throws(() => makeRe('a(b', opts), /Missing closing: "\)"/i);
    assert.throws(() => makeRe('a)b', opts), /Missing opening: "\("/i);
  });

  it('should escape special characters immediately following opening parens', () => {
    assert(isMatch('cbz', 'c!(.)z'));
    assert(!isMatch('cbz', 'c!(*)z'));
    assert(isMatch('cccz', 'c!(b*)z'));
    assert(isMatch('cbz', 'c!(+)z'));
    assert(isMatch('cbz', 'c!(?)z'));
    assert(isMatch('cbz', 'c!(@)z'));
  });

  it('should not convert capture groups to extglobs', () => {
    assert.equal(makeRe('c!(?:foo)?z').source, '^(?:c!(?:foo)?z)$');
    assert(!isMatch('c/z', 'c!(?:foo)?z'));
    assert(isMatch('c!fooz', 'c!(?:foo)?z'));
    assert(isMatch('c!z', 'c!(?:foo)?z'));
  });

  describe('negation', () => {
    it('should support negation extglobs as the entire pattern', () => {
      assert(!isMatch('abc', '!(abc)'));
      assert(!isMatch('a', '!(a)'));
      assert(isMatch('aa', '!(a)'));
      assert(isMatch('b', '!(a)'));
    });

    it('should support negation extglobs as part of a pattern', () => {
      assert(isMatch('aac', 'a!(b)c'));
      assert(!isMatch('abc', 'a!(b)c'));
      assert(isMatch('acc', 'a!(b)c'));
      assert(isMatch('abz', 'a!(z)'));
      assert(!isMatch('az', 'a!(z)'));
    });

    it('should support excluding dots with negation extglobs', () => {
      assert(!isMatch('a.', 'a!(.)'));
      assert(!isMatch('.a', '!(.)a'));
      assert(!isMatch('a.c', 'a!(.)c'));
      assert(isMatch('abc', 'a!(.)c'));
    });

    it('should support negation extglobs in patterns with slashes', () => {
      assert(!isMatch('foo/abc', 'foo/!(abc)'));
      assert(isMatch('foo/bar', 'foo/!(abc)'));

      assert(!isMatch('a/z', 'a/!(z)'));
      assert(isMatch('a/b', 'a/!(z)'));

      assert(!isMatch('c/z/v', 'c/!(z)/v'));
      assert(isMatch('c/a/v', 'c/!(z)/v'));

      assert(isMatch('a/a', '!(b/a)'));
      assert(!isMatch('b/a', '!(b/a)'));

      assert(!isMatch('foo/bar', '!(!(foo))*'));
      assert(isMatch('a/a', '!(b/a)'));
      assert(!isMatch('b/a', '!(b/a)'));

      assert(isMatch('a/a', '(!(b/a))'));
      assert(isMatch('a/a', '!((b/a))'));
      assert(!isMatch('b/a', '!((b/a))'));

      assert(!isMatch('a/a', '(!(?:b/a))'));
      assert(!isMatch('b/a', '!((?:b/a))'));

      assert(isMatch('a/a', '!(b/(a))'));
      assert(!isMatch('b/a', '!(b/(a))'));

      assert(isMatch('a/a', '!(b/a)'));
      assert(!isMatch('b/a', '!(b/a)'));
    });

    it('should not match slashes with extglobs that do not have slashes', () => {
      assert(!isMatch('c/z', 'c!(z)'));
      assert(!isMatch('c/z', 'c!(z)z'));
      assert(!isMatch('c/z', 'c!(.)z'));
      assert(!isMatch('c/z', 'c!(*)z'));
      assert(!isMatch('c/z', 'c!(+)z'));
      assert(!isMatch('c/z', 'c!(?)z'));
      assert(!isMatch('c/z', 'c!(@)z'));
    });

    it('should support matching slashes with extglobs that have slashes', () => {
      assert(!isMatch('c/z', 'a!(z)'));
      assert(!isMatch('c/z', 'c!(.)z'));
      assert(!isMatch('c/z', 'c!(/)z'));
      assert(!isMatch('c/z', 'c!(/z)z'));
      assert(!isMatch('c/b', 'c!(/z)z'));
      assert(isMatch('c/b/z', 'c!(/z)z'));
    });

    it('should support negation extglobs following !', () => {
      assert(isMatch('abc',  '!!(abc)'));
      assert(!isMatch('abc', '!!!(abc)'));
      assert(isMatch('abc',  '!!!!(abc)'));
      assert(!isMatch('abc', '!!!!!(abc)'));
      assert(isMatch('abc',  '!!!!!!(abc)'));
      assert(!isMatch('abc', '!!!!!!!(abc)'));
      assert(isMatch('abc',  '!!!!!!!!(abc)'));
    });

    it('should support nested negation extglobs', () => {
      assert(isMatch('abc',  '!(!(abc))'));
      assert(!isMatch('abc', '!(!(!(abc)))'));
      assert(isMatch('abc',  '!(!(!(!(abc))))'));
      assert(!isMatch('abc', '!(!(!(!(!(abc)))))'));
      assert(isMatch('abc',  '!(!(!(!(!(!(abc))))))'));
      assert(!isMatch('abc', '!(!(!(!(!(!(!(abc)))))))'));
      assert(isMatch('abc',  '!(!(!(!(!(!(!(!(abc))))))))'));

      assert(isMatch('foo/abc',  'foo/!(!(abc))'));
      assert(!isMatch('foo/abc', 'foo/!(!(!(abc)))'));
      assert(isMatch('foo/abc',  'foo/!(!(!(!(abc))))'));
      assert(!isMatch('foo/abc', 'foo/!(!(!(!(!(abc)))))'));
      assert(isMatch('foo/abc',  'foo/!(!(!(!(!(!(abc))))))'));
      assert(!isMatch('foo/abc', 'foo/!(!(!(!(!(!(!(abc)))))))'));
      assert(isMatch('foo/abc',  'foo/!(!(!(!(!(!(!(!(abc))))))))'));
    });

    it('should support multiple !(...) extglobs in a pattern', () => {
      assert(!isMatch('moo.cow', '!(moo).!(cow)'));
      assert(!isMatch('foo.cow', '!(moo).!(cow)'));
      assert(!isMatch('moo.bar', '!(moo).!(cow)'));
      assert(isMatch('foo.bar', '!(moo).!(cow)'));

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

      assert(!isMatch('c/z', 'a*!(z)'));
      assert(isMatch('abz', 'a*!(z)'));
      assert(isMatch('az', 'a*!(z)'));

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
    });

    it('should multiple nested negation extglobs', () => {
      assert(isMatch('moo.cow', '!(!(moo)).!(!(cow))'));
    });

    it('should support logical-or inside negation !(...) extglobs', () => {
      assert(!isMatch('ac', '!(a|b)c'));
      assert(!isMatch('bc', '!(a|b)c'));
      assert(isMatch('cc', '!(a|b)c'));
    });

    it('should support multiple logical-ors negation extglobs', () => {
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

    it('should support nested logical-ors inside negation extglobs', () => {
      assert(isMatch('ac.d', '!(!(a|b)c.!(d|e))'));
      assert(isMatch('bc.d', '!(!(a|b)c.!(d|e))'));
      assert(!isMatch('cc.d', '!(a|b)c.!(d|e)'));
      assert(isMatch('cc.d', '!(!(a|b)c.!(d|e))'));
      assert(isMatch('cc.d', '!(!(a|b)c.!(d|e))'));
      assert(isMatch('ac.e', '!(!(a|b)c.!(d|e))'));
      assert(isMatch('bc.e', '!(!(a|b)c.!(d|e))'));
      assert(isMatch('cc.e', '!(!(a|b)c.!(d|e))'));
      assert(isMatch('ac.f', '!(!(a|b)c.!(d|e))'));
      assert(isMatch('bc.f', '!(!(a|b)c.!(d|e))'));
      assert(!isMatch('cc.f', '!(!(a|b)c.!(d|e))'));
      assert(!isMatch('dc.g', '!(!(a|b)c.!(d|e))'));
    });
  });

  describe('file extensions', () => {
    it('should support matching file extensions with @(...)', () => {
      assert(!isMatch('.md', '@(a|b).md'));
      assert(!isMatch('a.js', '@(a|b).md'));
      assert(!isMatch('c.md', '@(a|b).md'));
      assert(isMatch('a.md', '@(a|b).md'));
      assert(isMatch('b.md', '@(a|b).md'));
    });

    it('should support matching file extensions with +(...)', () => {
      assert(!isMatch('.md', '+(a|b).md'));
      assert(!isMatch('a.js', '+(a|b).md'));
      assert(!isMatch('c.md', '+(a|b).md'));
      assert(isMatch('a.md', '+(a|b).md'));
      assert(isMatch('aa.md', '+(a|b).md'));
      assert(isMatch('ab.md', '+(a|b).md'));
      assert(isMatch('b.md', '+(a|b).md'));
      assert(isMatch('bb.md', '+(a|b).md'));
    });

    it('should support matching file extensions with *(...)', () => {
      assert(!isMatch('a.js', '*(a|b).md'));
      assert(!isMatch('c.md', '*(a|b).md'));
      assert(isMatch('.md', '*(a|b).md'));
      assert(isMatch('a.md', '*(a|b).md'));
      assert(isMatch('aa.md', '*(a|b).md'));
      assert(isMatch('ab.md', '*(a|b).md'));
      assert(isMatch('b.md', '*(a|b).md'));
      assert(isMatch('bb.md', '*(a|b).md'));
    });

    it('should support matching file extensions with ?(...)', () => {
      assert(!isMatch('a.js', '?(a|b).md'));
      assert(!isMatch('bb.md', '?(a|b).md'));
      assert(!isMatch('c.md', '?(a|b).md'));
      assert(isMatch('.md', '?(a|b).md'));
      assert(isMatch('a.md', '?(a|ab|b).md'));
      assert(isMatch('a.md', '?(a|b).md'));
      assert(isMatch('aa.md', '?(a|aa|b).md'));
      assert(isMatch('ab.md', '?(a|ab|b).md'));
      assert(isMatch('b.md', '?(a|ab|b).md'));

      // see https://github.com/micromatch/micromatch/issues/186
      assert(isMatch('ab', '+(a)?(b)'));
      assert(isMatch('aab', '+(a)?(b)'));
      assert(isMatch('aa', '+(a)?(b)'));
      assert(isMatch('a', '+(a)?(b)'));
    });
  });

  describe('statechar', () => {
    it('should support ?(...) extglobs ending with statechar', () => {
      assert(!isMatch('ax', 'a?(b*)'));
      assert(isMatch('ax', '?(a*|b)'));
    });

    it('should support *(...) extglobs ending with statechar', () => {
      assert(!isMatch('ax', 'a*(b*)'));
      assert(isMatch('ax', '*(a*|b)'));
    });

    it('should support @(...) extglobs ending with statechar', () => {
      assert(!isMatch('ax', 'a@(b*)'));
      assert(isMatch('ax', '@(a*|b)'));
    });

    it('should support ?(...) extglobs ending with statechar', () => {
      assert(!isMatch('ax', 'a?(b*)'));
      assert(isMatch('ax', '?(a*|b)'));
    });

    it('should support !(...) extglobs ending with statechar', () => {
      assert(isMatch('ax', 'a!(b*)'));
      assert(!isMatch('ax', '!(a*|b)'));
    });
  });

  it('should match nested directories with negation extglobs', () => {
    assert(isMatch('a', '!(a/**)'));
    assert(!isMatch('a/', '!(a/**)'));
    assert(!isMatch('a/b', '!(a/**)'));
    assert(!isMatch('a/b/c', '!(a/**)'));
    assert(isMatch('b', '!(a/**)'));
    assert(isMatch('b/c', '!(a/**)'));

    assert(isMatch('a/a', 'a/!(b*)'));
    assert(!isMatch('a/b', 'a/!(b*)'));
    assert(!isMatch('a/b/c', 'a/!(b/*)'));
    assert(!isMatch('a/b/c', 'a/!(b*)'));
    assert(isMatch('a/c', 'a/!(b*)'));

    assert(isMatch('a/a/', 'a/!(b*)/**'));
    assert(isMatch('a/a', 'a/!(b*)'));
    assert(isMatch('a/a', 'a/!(b*)/**'));
    assert(!isMatch('a/b', 'a/!(b*)/**'));
    assert(!isMatch('a/b/c', 'a/!(b*)/**'));
    assert(isMatch('a/c', 'a/!(b*)/**'));
    assert(isMatch('a/c', 'a/!(b*)'));
    assert(isMatch('a/c/', 'a/!(b*)/**'));
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
    assert(isMatch('a?z', 'a??(z)'));
    assert(isMatch('a.z', 'a??(z)'));
    assert(!isMatch('a/z', 'a??(z)'));
    assert(isMatch('a?', 'a??(z)'));
    assert(isMatch('ab', 'a??(z)'));
    assert(!isMatch('a/', 'a??(z)'));

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

  it('should support @(...) extglobs', () => {
    assert(isMatch('c/z/v', 'c/@(z)/v'));
    assert(!isMatch('c/a/v', 'c/@(z)/v'));
    assert(isMatch('moo.cow', '@(*.*)'));

    assert(!isMatch('cz', 'a*@(z)'));
    assert(isMatch('abz', 'a*@(z)'));
    assert(isMatch('az', 'a*@(z)'));

    assert(!isMatch('cz', 'a@(z)'));
    assert(!isMatch('abz', 'a@(z)'));
    assert(isMatch('az', 'a@(z)'));
  });

  it('should match exactly one of the given pattern:', () => {
    assert(!isMatch('aa.aa', '(b|a).(a)'));
    assert(!isMatch('a.bb', '(b|a).(a)'));
    assert(!isMatch('a.aa.a', '(b|a).(a)'));
    assert(!isMatch('cc.a', '(b|a).(a)'));
    assert(isMatch('a.a', '(b|a).(a)'));
    assert(!isMatch('c.a', '(b|a).(a)'));
    assert(!isMatch('dd.aa.d', '(b|a).(a)'));
    assert(isMatch('b.a', '(b|a).(a)'));

    assert(!isMatch('aa.aa', '@(b|a).@(a)'));
    assert(!isMatch('a.bb', '@(b|a).@(a)'));
    assert(!isMatch('a.aa.a', '@(b|a).@(a)'));
    assert(!isMatch('cc.a', '@(b|a).@(a)'));
    assert(isMatch('a.a', '@(b|a).@(a)'));
    assert(!isMatch('c.a', '@(b|a).@(a)'));
    assert(!isMatch('dd.aa.d', '@(b|a).@(a)'));
    assert(isMatch('b.a', '@(b|a).@(a)'));
  });

  it('should pass tests from rosenblatt\'s korn shell book', () => {
    // This one is the only difference, since picomatch does not match empty strings.
    assert(!isMatch('', '*(0|1|3|5|7|9)'));

    assert(isMatch('137577991', '*(0|1|3|5|7|9)'));
    assert(!isMatch('2468', '*(0|1|3|5|7|9)'));

    assert(isMatch('file.c', '*.c?(c)'));
    assert(!isMatch('file.C', '*.c?(c)'));
    assert(isMatch('file.cc', '*.c?(c)'));
    assert(!isMatch('file.ccc', '*.c?(c)'));

    assert(isMatch('parse.y', '!(*.c|*.h|Makefile.in|config*|README)'));
    assert(!isMatch('shell.c', '!(*.c|*.h|Makefile.in|config*|README)'));
    assert(isMatch('Makefile', '!(*.c|*.h|Makefile.in|config*|README)'));
    assert(!isMatch('Makefile.in', '!(*.c|*.h|Makefile.in|config*|README)'));

    assert(!isMatch('VMS.FILE;', '*\\;[1-9]*([0-9])'));
    assert(!isMatch('VMS.FILE;0', '*\\;[1-9]*([0-9])'));
    assert(isMatch('VMS.FILE;1', '*\\;[1-9]*([0-9])'));
    assert(isMatch('VMS.FILE;139', '*\\;[1-9]*([0-9])'));
    assert(!isMatch('VMS.FILE;1N', '*\\;[1-9]*([0-9])'));
  });

  it('tests derived from the pd-ksh test suite', () => {
    assert(isMatch('abcx', '!([*)*'));
    assert(isMatch('abcz', '!([*)*'));
    assert(isMatch('bbc', '!([*)*'));

    assert(isMatch('abcx', '!([[*])*'));
    assert(isMatch('abcz', '!([[*])*'));
    assert(isMatch('bbc', '!([[*])*'));

    assert(isMatch('abcx', '+(a|b\\[)*'));
    assert(isMatch('abcz', '+(a|b\\[)*'));
    assert(!isMatch('bbc', '+(a|b\\[)*'));

    assert(isMatch('abcx', '+(a|b[)*'));
    assert(isMatch('abcz', '+(a|b[)*'));
    assert(!isMatch('bbc', '+(a|b[)*'));

    assert(!isMatch('abcx', '[a*(]*z'));
    assert(isMatch('abcz', '[a*(]*z'));
    assert(!isMatch('bbc', '[a*(]*z'));
    assert(isMatch('aaz', '[a*(]*z'));
    assert(isMatch('aaaz', '[a*(]*z'));

    assert(!isMatch('abcx', '[a*(]*)z'));
    assert(!isMatch('abcz', '[a*(]*)z'));
    assert(!isMatch('bbc', '[a*(]*)z'));

    assert(!isMatch('abc', '+()c'));
    assert(!isMatch('abc', '+()x'));
    assert(isMatch('abc', '+(*)c'));
    assert(!isMatch('abc', '+(*)x'));
    assert(!isMatch('abc', 'no-file+(a|b)stuff'));
    assert(!isMatch('abc', 'no-file+(a*(c)|b)stuff'));

    assert(isMatch('abd', 'a+(b|c)d'));
    assert(isMatch('acd', 'a+(b|c)d'));

    assert(!isMatch('abc', 'a+(b|c)d'));

    assert(isMatch('abd', 'a!(b|B)'));
    assert(isMatch('acd', 'a!(@(b|B))'));
    assert(isMatch('ac', 'a!(@(b|B))'));
    assert(!isMatch('ab', 'a!(@(b|B))'));

    assert(!isMatch('abc', 'a!(@(b|B))d'));
    assert(!isMatch('abd', 'a!(@(b|B))d'));
    assert(isMatch('acd', 'a!(@(b|B))d'));

    assert(isMatch('abd', 'a[b*(foo|bar)]d'));
    assert(!isMatch('abc', 'a[b*(foo|bar)]d'));
    assert(!isMatch('acd', 'a[b*(foo|bar)]d'));
  });

  it('stuff from korn\'s book', () => {
    assert(!isMatch('para', 'para+([0-9])'));
    assert(!isMatch('para381', 'para?([345]|99)1'));
    assert(!isMatch('paragraph', 'para*([0-9])'));
    assert(!isMatch('paramour', 'para@(chute|graph)'));
    assert(isMatch('para', 'para*([0-9])'));
    assert(isMatch('para.38', 'para!(*.[0-9])'));
    assert(isMatch('para.38', 'para!(*.[00-09])'));
    assert(isMatch('para.graph', 'para!(*.[0-9])'));
    assert(isMatch('para13829383746592', 'para*([0-9])'));
    assert(isMatch('para39', 'para!(*.[0-9])'));
    assert(isMatch('para987346523', 'para+([0-9])'));
    assert(isMatch('para991', 'para?([345]|99)1'));
    assert(isMatch('paragraph', 'para!(*.[0-9])'));
    assert(isMatch('paragraph', 'para@(chute|graph)'));
  });

  it('simple kleene star tests', () => {
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

    assert(isMatch('foo', '*(a|b|f)*'));
    assert(isMatch('foo', '*(a|b|o)*'));
    assert(isMatch('foo', '*(a|b|f|o)'));
    assert(isMatch('*(a|b[)', '\\*\\(a\\|b\\[\\)'));
    assert(!isMatch('foo', '*(a|b)'));
    assert(!isMatch('foo', '*(a|b\\[)'));
    assert(isMatch('foo', '*(a|b\\[)|f*'));
  });

  it('should support multiple extglobs:', () => {
    assert(isMatch('moo.cow', '@(*).@(*)'));
    assert(isMatch('a.a', '*.@(a|b|@(ab|a*@(b))*@(c)d)'));
    assert(isMatch('a.b', '*.@(a|b|@(ab|a*@(b))*@(c)d)'));
    assert(!isMatch('a.c', '*.@(a|b|@(ab|a*@(b))*@(c)d)'));
    assert(!isMatch('a.c.d', '*.@(a|b|@(ab|a*@(b))*@(c)d)'));
    assert(!isMatch('c.c', '*.@(a|b|@(ab|a*@(b))*@(c)d)'));
    assert(!isMatch('a.', '*.@(a|b|@(ab|a*@(b))*@(c)d)'));
    assert(!isMatch('d.d', '*.@(a|b|@(ab|a*@(b))*@(c)d)'));
    assert(!isMatch('e.e', '*.@(a|b|@(ab|a*@(b))*@(c)d)'));
    assert(!isMatch('f.f', '*.@(a|b|@(ab|a*@(b))*@(c)d)'));
    assert(isMatch('a.abcd', '*.@(a|b|@(ab|a*@(b))*@(c)d)'));

    assert(!isMatch('a.a', '!(*.a|*.b|*.c)'));
    assert(!isMatch('a.b', '!(*.a|*.b|*.c)'));
    assert(!isMatch('a.c', '!(*.a|*.b|*.c)'));
    assert(isMatch('a.c.d', '!(*.a|*.b|*.c)'));
    assert(!isMatch('c.c', '!(*.a|*.b|*.c)'));
    assert(isMatch('a.', '!(*.a|*.b|*.c)'));
    assert(isMatch('d.d', '!(*.a|*.b|*.c)'));
    assert(isMatch('e.e', '!(*.a|*.b|*.c)'));
    assert(isMatch('f.f', '!(*.a|*.b|*.c)'));
    assert(isMatch('a.abcd', '!(*.a|*.b|*.c)'));

    assert(isMatch('a.a', '!(*.[^a-c])'));
    assert(isMatch('a.b', '!(*.[^a-c])'));
    assert(isMatch('a.c', '!(*.[^a-c])'));
    assert(!isMatch('a.c.d', '!(*.[^a-c])'));
    assert(isMatch('c.c', '!(*.[^a-c])'));
    assert(isMatch('a.', '!(*.[^a-c])'));
    assert(!isMatch('d.d', '!(*.[^a-c])'));
    assert(!isMatch('e.e', '!(*.[^a-c])'));
    assert(!isMatch('f.f', '!(*.[^a-c])'));
    assert(isMatch('a.abcd', '!(*.[^a-c])'));

    assert(!isMatch('a.a', '!(*.[a-c])'));
    assert(!isMatch('a.b', '!(*.[a-c])'));
    assert(!isMatch('a.c', '!(*.[a-c])'));
    assert(isMatch('a.c.d', '!(*.[a-c])'));
    assert(!isMatch('c.c', '!(*.[a-c])'));
    assert(isMatch('a.', '!(*.[a-c])'));
    assert(isMatch('d.d', '!(*.[a-c])'));
    assert(isMatch('e.e', '!(*.[a-c])'));
    assert(isMatch('f.f', '!(*.[a-c])'));
    assert(isMatch('a.abcd', '!(*.[a-c])'));

    assert(!isMatch('a.a', '!(*.[a-c]*)'));
    assert(!isMatch('a.b', '!(*.[a-c]*)'));
    assert(!isMatch('a.c', '!(*.[a-c]*)'));
    assert(!isMatch('a.c.d', '!(*.[a-c]*)'));
    assert(!isMatch('c.c', '!(*.[a-c]*)'));
    assert(isMatch('a.', '!(*.[a-c]*)'));
    assert(isMatch('d.d', '!(*.[a-c]*)'));
    assert(isMatch('e.e', '!(*.[a-c]*)'));
    assert(isMatch('f.f', '!(*.[a-c]*)'));
    assert(!isMatch('a.abcd', '!(*.[a-c]*)'));

    assert(!isMatch('a.a', '*.!(a|b|c)'));
    assert(!isMatch('a.b', '*.!(a|b|c)'));
    assert(!isMatch('a.c', '*.!(a|b|c)'));
    assert(isMatch('a.c.d', '*.!(a|b|c)'));
    assert(!isMatch('c.c', '*.!(a|b|c)'));
    assert(isMatch('a.', '*.!(a|b|c)'));
    assert(isMatch('d.d', '*.!(a|b|c)'));
    assert(isMatch('e.e', '*.!(a|b|c)'));
    assert(isMatch('f.f', '*.!(a|b|c)'));
    assert(isMatch('a.abcd', '*.!(a|b|c)'));

    assert(isMatch('a.a', '*!(.a|.b|.c)'));
    assert(isMatch('a.b', '*!(.a|.b|.c)'));
    assert(isMatch('a.c', '*!(.a|.b|.c)'));
    assert(isMatch('a.c.d', '*!(.a|.b|.c)'));
    assert(isMatch('c.c', '*!(.a|.b|.c)'));
    assert(isMatch('a.', '*!(.a|.b|.c)'));
    assert(isMatch('d.d', '*!(.a|.b|.c)'));
    assert(isMatch('e.e', '*!(.a|.b|.c)'));
    assert(isMatch('f.f', '*!(.a|.b|.c)'));
    assert(isMatch('a.abcd', '*!(.a|.b|.c)'));

    assert(!isMatch('a.a', '!(*.[a-c])*'));
    assert(!isMatch('a.b', '!(*.[a-c])*'));
    assert(!isMatch('a.c', '!(*.[a-c])*'));
    assert(!isMatch('a.c.d', '!(*.[a-c])*'));
    assert(!isMatch('c.c', '!(*.[a-c])*'));
    assert(isMatch('a.', '!(*.[a-c])*'));
    assert(isMatch('d.d', '!(*.[a-c])*'));
    assert(isMatch('e.e', '!(*.[a-c])*'));
    assert(isMatch('f.f', '!(*.[a-c])*'));
    assert(!isMatch('a.abcd', '!(*.[a-c])*'));

    assert(isMatch('a.a', '*!(.a|.b|.c)*'));
    assert(isMatch('a.b', '*!(.a|.b|.c)*'));
    assert(isMatch('a.c', '*!(.a|.b|.c)*'));
    assert(isMatch('a.c.d', '*!(.a|.b|.c)*'));
    assert(isMatch('c.c', '*!(.a|.b|.c)*'));
    assert(isMatch('a.', '*!(.a|.b|.c)*'));
    assert(isMatch('d.d', '*!(.a|.b|.c)*'));
    assert(isMatch('e.e', '*!(.a|.b|.c)*'));
    assert(isMatch('f.f', '*!(.a|.b|.c)*'));
    assert(isMatch('a.abcd', '*!(.a|.b|.c)*'));

    assert(!isMatch('a.a', '*.!(a|b|c)*'));
    assert(!isMatch('a.b', '*.!(a|b|c)*'));
    assert(!isMatch('a.c', '*.!(a|b|c)*'));
    assert(isMatch('a.c.d', '*.!(a|b|c)*'));
    assert(!isMatch('c.c', '*.!(a|b|c)*'));
    assert(isMatch('a.', '*.!(a|b|c)*'));
    assert(isMatch('d.d', '*.!(a|b|c)*'));
    assert(isMatch('e.e', '*.!(a|b|c)*'));
    assert(isMatch('f.f', '*.!(a|b|c)*'));
    assert(!isMatch('a.abcd', '*.!(a|b|c)*'));
  });

  it('should correctly match empty parens', () => {
    assert(!isMatch('def', '@()ef'));
    assert(isMatch('ef', '@()ef'));

    assert(!isMatch('def', '()ef'));
    assert(isMatch('ef', '()ef'));
  });

  it('should match escaped parens', () => {
    if (process.platform !== 'win32') {
      assert(isMatch('a\\(b', 'a\\\\\\(b'));
    }
    assert(isMatch('a(b', 'a(b'));
    assert(isMatch('a(b', 'a\\(b'));
    assert(!isMatch('a((b', 'a(b'));
    assert(!isMatch('a((((b', 'a(b'));
    assert(!isMatch('ab', 'a(b'));

    assert(isMatch('a(b', 'a\\(b'));
    assert(!isMatch('a((b', 'a\\(b'));
    assert(!isMatch('a((((b', 'a\\(b'));
    assert(!isMatch('ab', 'a\\(b'));

    assert(isMatch('a(b', 'a(*b'));
    assert(isMatch('a(ab', 'a\\(*b'));
    assert(isMatch('a((b', 'a(*b'));
    assert(isMatch('a((((b', 'a(*b'));
    assert(!isMatch('ab', 'a(*b'));
  });

  it('should match escaped backslashes', () => {
    assert(isMatch('a(b', 'a\\(b'));
    assert(isMatch('a((b', 'a\\(\\(b'));
    assert(isMatch('a((((b', 'a\\(\\(\\(\\(b'));

    assert(!isMatch('a(b', 'a\\\\(b'));
    assert(!isMatch('a((b', 'a\\\\(b'));
    assert(!isMatch('a((((b', 'a\\\\(b'));
    assert(!isMatch('ab', 'a\\\\(b'));

    assert(!isMatch('a/b', 'a\\\\b'));
    assert(!isMatch('ab', 'a\\\\b'));
  });

  // these are not extglobs, and do not need to pass, but they are included
  // to test integration with other features
  it('should support regex characters', () => {
    const fixtures = ['a c', 'a.c', 'a.xy.zc', 'a.zc', 'a123c', 'a1c', 'abbbbc', 'abbbc', 'abbc', 'abc', 'abq', 'axy zc', 'axy', 'axy.zc', 'axyzc'];

    if (process.platform !== 'win32') {
      assert.deepEqual(match(['a\\b', 'a/b', 'ab'], 'a/b'), ['a/b']);
    }

    assert.deepEqual(match(['a/b', 'ab'], 'a/b'), ['a/b']);
    assert.deepEqual(match(fixtures, 'ab?bc'), ['abbbc']);
    assert.deepEqual(match(fixtures, 'ab*c'), ['abbbbc', 'abbbc', 'abbc', 'abc']);
    assert.deepEqual(match(fixtures, 'a+(b)bc'), ['abbbbc', 'abbbc', 'abbc']);
    assert.deepEqual(match(fixtures, '^abc$'), []);
    assert.deepEqual(match(fixtures, 'a.c'), ['a.c']);
    assert.deepEqual(match(fixtures, 'a.*c'), ['a.c', 'a.xy.zc', 'a.zc']);
    assert.deepEqual(match(fixtures, 'a*c'), ['a c', 'a.c', 'a.xy.zc', 'a.zc', 'a123c', 'a1c', 'abbbbc', 'abbbc', 'abbc', 'abc', 'axy zc', 'axy.zc', 'axyzc']);
    assert.deepEqual(match(fixtures, 'a[\\w]+c'), ['a123c', 'a1c', 'abbbbc', 'abbbc', 'abbc', 'abc', 'axyzc'], 'Should match word characters');
    assert.deepEqual(match(fixtures, 'a[\\W]+c'), ['a c', 'a.c'], 'Should match non-word characters');
    assert.deepEqual(match(fixtures, 'a[\\d]+c'), ['a123c', 'a1c'], 'Should match numbers');
    assert.deepEqual(match(['foo@#$%123ASD #$$%^&', 'foo!@#$asdfl;', '123'], '[\\d]+'), ['123']);
    assert.deepEqual(match(['a123c', 'abbbc'], 'a[\\D]+c'), ['abbbc'], 'Should match non-numbers');
    assert.deepEqual(match(['foo', ' foo '], '(f|o)+\\b'), ['foo'], 'Should match word boundaries');
  });
});

