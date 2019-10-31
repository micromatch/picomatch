'use strict';

require('mocha');
const assert = require('assert');
const { isMatch } = require('..');

describe('brackets', () => {
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
