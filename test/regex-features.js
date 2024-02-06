'use strict';

const { version } = process;
const assert = require('assert');
const utils = require('../lib/utils');
const { isMatch } = require('..');

describe('regex features', () => {
  describe('word boundaries', () => {
    it('should support word boundaries', () => {
      assert(isMatch('a', 'a\\b'));
    });

    it('should support word boundaries in parens', () => {
      assert(isMatch('a', '(a\\b)'));
    });
  });

  describe('regex lookarounds', () => {
    it('should support regex lookbehinds', () => {
      assert(isMatch('foo/cbaz', 'foo/*(?<!d)baz'));
      assert(!isMatch('foo/cbaz', 'foo/*(?<!c)baz'));
      assert(!isMatch('foo/cbaz', 'foo/*(?<=d)baz'));
      assert(isMatch('foo/cbaz', 'foo/*(?<=c)baz'));
    });

    it('should throw an error when regex lookbehinds are used on an unsupported node version', () => {
      const nodeMajor = process.versions.node.split('.')[0];
      if (nodeMajor < 10) {
        assert.throws(() => isMatch('foo/cbaz', 'foo/*(?<!c)baz'), /Node\.js v10 or higher/);
      }
    });
  });

  describe('regex back-references', () => {
    it('should support regex backreferences', () => {
      assert(!isMatch('1/2', '(*)/\\1'));
      assert(isMatch('1/1', '(*)/\\1'));
      assert(isMatch('1/1/1/1', '(*)/\\1/\\1/\\1'));
      assert(!isMatch('1/11/111/1111', '(*)/\\1/\\1/\\1'));
      assert(isMatch('1/11/111/1111', '(*)/(\\1)+/(\\1)+/(\\1)+'));
      assert(!isMatch('1/2/1/1', '(*)/\\1/\\1/\\1'));
      assert(!isMatch('1/1/2/1', '(*)/\\1/\\1/\\1'));
      assert(!isMatch('1/1/1/2', '(*)/\\1/\\1/\\1'));
      assert(isMatch('1/1/1/1', '(*)/\\1/(*)/\\2'));
      assert(!isMatch('1/1/2/1', '(*)/\\1/(*)/\\2'));
      assert(!isMatch('1/1/2/1', '(*)/\\1/(*)/\\2'));
      assert(isMatch('1/1/2/2', '(*)/\\1/(*)/\\2'));
    });
  });

  describe('regex character classes', () => {
    it('should not match with character classes when disabled', () => {
      assert(!isMatch('a/a', 'a/[a-z]', { nobracket: true }));
      assert(!isMatch('a/b', 'a/[a-z]', { nobracket: true }));
      assert(!isMatch('a/c', 'a/[a-z]', { nobracket: true }));
    });

    it('should match with character classes by default', () => {
      assert(isMatch('a/a', 'a/[a-z]'));
      assert(isMatch('a/b', 'a/[a-z]'));
      assert(isMatch('a/c', 'a/[a-z]'));

      assert(!isMatch('foo/bar', '**/[jkl]*'));
      assert(isMatch('foo/jar', '**/[jkl]*'));

      assert(isMatch('foo/bar', '**/[^jkl]*'));
      assert(!isMatch('foo/jar', '**/[^jkl]*'));

      assert(isMatch('foo/bar', '**/[abc]*'));
      assert(!isMatch('foo/jar', '**/[abc]*'));

      assert(!isMatch('foo/bar', '**/[^abc]*'));
      assert(isMatch('foo/jar', '**/[^abc]*'));

      assert(isMatch('foo/bar', '**/[abc]ar'));
      assert(!isMatch('foo/jar', '**/[abc]ar'));
    });

    it('should match character classes', () => {
      assert(!isMatch('abc', 'a[bc]d'));
      assert(isMatch('abd', 'a[bc]d'));
    });

    it('should match character class alphabetical ranges', () => {
      assert(!isMatch('abc', 'a[b-d]e'));
      assert(!isMatch('abd', 'a[b-d]e'));
      assert(isMatch('abe', 'a[b-d]e'));
      assert(!isMatch('ac', 'a[b-d]e'));
      assert(!isMatch('a-', 'a[b-d]e'));

      assert(!isMatch('abc', 'a[b-d]'));
      assert(!isMatch('abd', 'a[b-d]'));
      assert(isMatch('abd', 'a[b-d]+'));
      assert(!isMatch('abe', 'a[b-d]'));
      assert(isMatch('ac', 'a[b-d]'));
      assert(!isMatch('a-', 'a[b-d]'));
    });

    it('should match character classes with leading dashes', () => {
      assert(!isMatch('abc', 'a[-c]'));
      assert(isMatch('ac', 'a[-c]'));
      assert(isMatch('a-', 'a[-c]'));
    });

    it('should match character classes with trailing dashes', () => {
      assert(!isMatch('abc', 'a[c-]'));
      assert(isMatch('ac', 'a[c-]'));
      assert(isMatch('a-', 'a[c-]'));
    });

    it('should match bracket literals', () => {
      assert(isMatch('a]c', 'a[]]c'));
      assert(isMatch('a]c', 'a]c'));
      assert(isMatch('a]', 'a]'));

      assert(isMatch('a[c', 'a[\\[]c'));
      assert(isMatch('a[c', 'a[c'));
      assert(isMatch('a[', 'a['));
    });

    it('should support negated character classes', () => {
      assert(!isMatch('a]', 'a[^bc]d'));
      assert(!isMatch('acd', 'a[^bc]d'));
      assert(isMatch('aed', 'a[^bc]d'));
      assert(isMatch('azd', 'a[^bc]d'));
      assert(!isMatch('ac', 'a[^bc]d'));
      assert(!isMatch('a-', 'a[^bc]d'));
    });

    it('should match negated dashes', () => {
      assert(!isMatch('abc', 'a[^-b]c'));
      assert(isMatch('adc', 'a[^-b]c'));
      assert(!isMatch('a-c', 'a[^-b]c'));
    });

    it('should match negated pm', () => {
      assert(isMatch('a-c', 'a[^\\]b]c'));
      assert(!isMatch('abc', 'a[^\\]b]c'));
      assert(!isMatch('a]c', 'a[^\\]b]c'));
      assert(isMatch('adc', 'a[^\\]b]c'));
    });

    it('should match alpha-numeric characters', () => {
      assert(!isMatch('0123e45g78', '[\\de]+'));
      assert(isMatch('0123e456', '[\\de]+'));
      assert(isMatch('01234', '[\\de]+'));
    });

    it('should support valid regex ranges', () => {
      assert(!isMatch('a/a', 'a/[b-c]'));
      assert(!isMatch('a/z', 'a/[b-c]'));
      assert(isMatch('a/b', 'a/[b-c]'));
      assert(isMatch('a/c', 'a/[b-c]'));
      assert(isMatch('a/b', '[a-z]/[a-z]'));
      assert(isMatch('a/z', '[a-z]/[a-z]'));
      assert(isMatch('z/z', '[a-z]/[a-z]'));
      assert(!isMatch('a/x/y', 'a/[a-z]'));

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

    it('should support valid regex ranges in negated character classes', () => {
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

  describe('regex capture groups', () => {
    it('should support regex logical "or"', () => {
      assert(isMatch('a/a', 'a/(a|c)'));
      assert(!isMatch('a/b', 'a/(a|c)'));
      assert(isMatch('a/c', 'a/(a|c)'));

      assert(isMatch('a/a', 'a/(a|b|c)'));
      assert(isMatch('a/b', 'a/(a|b|c)'));
      assert(isMatch('a/c', 'a/(a|b|c)'));
    });

    it('should support regex character classes inside extglobs', () => {
      assert(!isMatch('foo/bar', '**/!([a-k])*'));
      assert(!isMatch('foo/jar', '**/!([a-k])*'));

      assert(!isMatch('foo/bar', '**/!([a-i])*'));
      assert(isMatch('foo/bar', '**/!([c-i])*'));
      assert(isMatch('foo/jar', '**/!([a-i])*'));
    });

    it('should support regex capture groups', () => {
      assert(isMatch('a/bb/c/dd/e.md', 'a/??/?/(dd)/e.md'));
      assert(isMatch('a/b/c/d/e.md', 'a/?/c/?/(e|f).md'));
      assert(isMatch('a/b/c/d/f.md', 'a/?/c/?/(e|f).md'));
    });

    it('should support regex capture groups with slashes', () => {
      assert(!isMatch('a/a', '(a/b)'));
      assert(isMatch('a/b', '(a/b)'));
      assert(!isMatch('a/c', '(a/b)'));
      assert(!isMatch('b/a', '(a/b)'));
      assert(!isMatch('b/b', '(a/b)'));
      assert(!isMatch('b/c', '(a/b)'));
    });

    it('should support regex non-capture groups', () => {
      assert(isMatch('a/bb/c/dd/e.md', 'a/**/(?:dd)/e.md'));
      assert(isMatch('a/b/c/d/e.md', 'a/?/c/?/(?:e|f).md'));
      assert(isMatch('a/b/c/d/f.md', 'a/?/c/?/(?:e|f).md'));
    });
  });

  describe('quantifiers', () => {
    it('should support regex quantifiers by escaping braces', () => {
      assert(isMatch('a   ', 'a \\{1,5\\}', { unescape: true }));
      assert(!isMatch('a   ', 'a \\{1,2\\}', { unescape: true }));
      assert(!isMatch('a   ', 'a \\{1,2\\}'));
    });

    it('should support extglobs with regex quantifiers', () => {
      assert(!isMatch('a  ', '@(!(a) \\{1,2\\})*', { unescape: true }));
      assert(!isMatch('a ', '@(!(a) \\{1,2\\})*', { unescape: true }));
      assert(!isMatch('a', '@(!(a) \\{1,2\\})*', { unescape: true }));
      assert(!isMatch('aa', '@(!(a) \\{1,2\\})*', { unescape: true }));
      assert(!isMatch('aaa', '@(!(a) \\{1,2\\})*', { unescape: true }));
      assert(!isMatch('b', '@(!(a) \\{1,2\\})*', { unescape: true }));
      assert(!isMatch('bb', '@(!(a) \\{1,2\\})*', { unescape: true }));
      assert(!isMatch('bbb', '@(!(a) \\{1,2\\})*', { unescape: true }));
      assert(isMatch(' a ', '@(!(a) \\{1,2\\})*', { unescape: true }));
      assert(isMatch('b  ', '@(!(a) \\{1,2\\})*', { unescape: true }));
      assert(isMatch('b ', '@(!(a) \\{1,2\\})*', { unescape: true }));

      assert(isMatch('a   ', '@(!(a \\{1,2\\}))*'));
      assert(isMatch('a   b', '@(!(a \\{1,2\\}))*'));
      assert(isMatch('a  b', '@(!(a \\{1,2\\}))*'));
      assert(isMatch('a  ', '@(!(a \\{1,2\\}))*'));
      assert(isMatch('a ', '@(!(a \\{1,2\\}))*'));
      assert(isMatch('a', '@(!(a \\{1,2\\}))*'));
      assert(isMatch('aa', '@(!(a \\{1,2\\}))*'));
      assert(isMatch('b', '@(!(a \\{1,2\\}))*'));
      assert(isMatch('bb', '@(!(a \\{1,2\\}))*'));
      assert(isMatch(' a ', '@(!(a \\{1,2\\}))*'));
      assert(isMatch('b  ', '@(!(a \\{1,2\\}))*'));
      assert(isMatch('b ', '@(!(a \\{1,2\\}))*'));
    });

    it('should basename paths', () => {
      assert.equal(utils.basename('/a/b/c'), 'c');
      assert.equal(utils.basename('/a/b/c/'), 'c');
      assert.equal(utils.basename('/a\\b/c', { windows: true }), 'c');
      assert.equal(utils.basename('/a\\b/c\\', { windows: true }), 'c');
      assert.equal(utils.basename('\\a/b\\c', { windows: true }), 'c');
      assert.equal(utils.basename('\\a/b\\c/', { windows: true }), 'c');
    });
  });
});
