'use strict';

const assert = require('assert');
const { isMatch } = require('..');

describe('brackets', () => {
  describe('POSIX `[!...]` negation', () => {
    it('should negate a bracket expression with a leading `!`, like `[^...]`', () => {
      assert(!isMatch('a', '[!a]'));
      assert(isMatch('b', '[!a]'));
      assert(!isMatch('b', '[!a-c]'));
      assert(isMatch('d', '[!a-c]'));
      assert(!isMatch('a', '[!abc]'));
      assert(isMatch('aXc', 'a[!b]c'));
      assert(!isMatch('abc', 'a[!b]c'));
    });

    it('should treat `!` as a literal when it is not the first bracket character', () => {
      assert(isMatch('!', '[a!]'));
      assert(isMatch('a', '[a!]'));
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
