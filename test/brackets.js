'use strict';

const assert = require('assert');
const { isMatch } = require('..');

describe('brackets', () => {
  describe('character classes', () => {
    it('should not let exact string matching bypass character classes', () => {
      assert(!isMatch('[1-5]', '[1-5]'));
      assert(!isMatch('[1-5]', '[1-5]', { literalBrackets: false }));
      assert(isMatch('3', '[1-5]'));
    });

    it('should still match literal brackets when requested', () => {
      assert(isMatch('[1-5]', '\\[1-5\\]'));
      assert(isMatch('[1-5]', '[1-5]', { literalBrackets: true }));
    });
  });

  describe('trailing stars', () => {
    it('should support stars following brackets', () => {
      assert(isMatch('a', '[a]*'));
      assert(isMatch('aa', '[a]*'));
      assert(isMatch('aaa', '[a]*'));
      assert(isMatch('az', '[a-z]*'));
      assert(isMatch('zzz', '[a-z]*'));
    });

    it('should match slashes defined in brackets', () => {
      assert(isMatch('foo/bar', 'foo[/]bar'));
      assert(isMatch('foo/bar/', 'foo[/]bar[/]'));
      assert(isMatch('foo/bar/baz', 'foo[/]bar[/]baz'));
    });

    it('should not match slashes following brackets', () => {
      assert(!isMatch('a/b', '[a]*'));
    });
  });
});
