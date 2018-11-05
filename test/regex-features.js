'use strict';

require('mocha');
const version = process.version;
const assert = require('assert');
const pm = require('..');
const { isMatch } = require('./support');

describe('regex features', () => {
  beforeEach(() => pm.clearCache());

  describe('lookarounds', () => {
    it('should support regex lookbehinds', () => {
      if (parseInt(version.slice(1), 10) >= 10) {
        assert(isMatch('foo/cbaz', 'foo/*(?<!d)baz'));
        assert(!isMatch('foo/cbaz', 'foo/*(?<!c)baz'));
        assert(!isMatch('foo/cbaz', 'foo/*(?<=d)baz'));
        assert(isMatch('foo/cbaz', 'foo/*(?<=c)baz'));
      }
    });

    it('should throw an error when regex lookbehinds are used on an unsupported node version', () => {
      Reflect.defineProperty(process, 'version', { value: 'v6.0.0' });
      assert.throws(() => isMatch('foo/cbaz', 'foo/*(?<!c)baz'), /Node\.js v10 or higher/);
      Reflect.defineProperty(process, 'version', { value: version });
    });
  });

  describe('back-references', () => {
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

  describe('character classes', () => {
    it('should match regex character classes', () => {
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

  describe('capture groups', () => {
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
});
