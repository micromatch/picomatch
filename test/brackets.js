'use strict';

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
  describe('negation with "!"', () => {
    it('should negate a bracket expression with a leading "!"', () => {
      assert(!isMatch('a', '[!abc]'));
      assert(!isMatch('b', '[!abc]'));
      assert(!isMatch('c', '[!abc]'));
      assert(isMatch('d', '[!abc]'));
      assert(isMatch('x', '[!abc]'));
    });

    it('should negate ranges with a leading "!"', () => {
      assert(!isMatch('a', '[!a-c]'));
      assert(!isMatch('c', '[!a-c]'));
      assert(isMatch('d', '[!a-c]'));
    });

    it('should agree with "^" negation', () => {
      assert.strictEqual(isMatch('a', '[!abc]'), isMatch('a', '[^abc]'));
      assert.strictEqual(isMatch('d', '[!abc]'), isMatch('d', '[^abc]'));
      assert.strictEqual(isMatch('a', '[!a-c]'), isMatch('a', '[^a-c]'));
      assert.strictEqual(isMatch('d', '[!a-c]'), isMatch('d', '[^a-c]'));
    });

    it('should negate within a larger pattern', () => {
      assert(!isMatch('abc', 'a[!b]c'));
      assert(isMatch('axc', 'a[!b]c'));
      assert(!isMatch('ad', '[!abc]d'));
      assert(isMatch('xd', '[!abc]d'));
    });

    it('should treat "!" as a literal when it is not leading', () => {
      assert(isMatch('!', '[a!]'));
      assert(isMatch('a', '[a!]'));
      assert(!isMatch('b', '[a!]'));
    });

    it('should negate a literal "!"', () => {
      assert(!isMatch('!', '[!!]'));
      assert(isMatch('a', '[!!]'));
    });
  });
});
