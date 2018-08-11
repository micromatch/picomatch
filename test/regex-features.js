'use strict';

require('mocha');
const version = process.version;
const assert = require('assert');
const pm = require('..');
const { isMatch } = require('./support');

describe('api', () => {
  beforeEach(() => pm.clearCache());

  describe('back-references', () => {
    it('should support regex backreferences', () => {
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
  });

  describe('capture groups', () => {
    it('should support regex capture groups', () => {
      assert(isMatch('a/bb/c/dd/e.md', 'a/??/?/(dd)/e.md'));
      assert(isMatch('a/b/c/d/e.md', 'a/?/c/?/(e|f).md'));
      assert(isMatch('a/b/c/d/f.md', 'a/?/c/?/(e|f).md'));
    });

    it('should support regex non-capture groups', () => {
      assert(isMatch('a/bb/c/dd/e.md', 'a/**/(?:dd)/e.md'));
      assert(isMatch('a/b/c/d/e.md', 'a/?/c/?/(?:e|f).md'));
      assert(isMatch('a/b/c/d/f.md', 'a/?/c/?/(?:e|f).md'));
    });
  });

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
});
