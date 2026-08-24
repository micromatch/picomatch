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

  describe('bracket negation', () => {
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

    it('should support "^" as an alternative to "!"', () => {
      assert(!isMatch('a', '[^abc]'));
      assert(isMatch('d', '[^abc]'));
      assert(!isMatch('a', '[^a-c]'));
      assert(isMatch('d', '[^a-c]'));
    });

    it('should support negated brackets in larger patterns', () => {
      assert(!isMatch('abc', 'a[!b]c'));
      assert(isMatch('axc', 'a[!b]c'));
      assert(!isMatch('ad', '[!abc]d'));
      assert(isMatch('xd', '[!abc]d'));
    });

    it('should not match slashes with negated brackets', () => {
      assert(!isMatch('/', '[!a]'));
      assert(!isMatch('a/b', 'a[!x]b'));
    });

    it('should treat escaped "!" as a literal character', () => {
      assert(isMatch('!', '[\\!a]'));
      assert(isMatch('a', '[\\!a]'));
      assert(!isMatch('b', '[\\!a]'));
    });

    it('should treat non-leading "!" as literal characters', () => {
      assert(isMatch('!', '[a!]'));
      assert(isMatch('a', '[a!]'));
      assert(!isMatch('b', '[a!]'));
    });

    it('should negate a literal "!"', () => {
      assert(!isMatch('!', '[!!]'));
      assert(isMatch('a', '[!!]'));
    });

    it('should preserve incomplete bracket expressions', () => {
      assert(isMatch('zx[!]y', '*x[!]y'));
      assert(isMatch('zx!y', '*x[!]y'));
    });

    it('should negate a closing bracket when it is first in the class', () => {
      assert(!isMatch(']', '[!]]'));
      assert(isMatch('a', '[!]]'));
    });

    it('should negate brackets when `options.posix` is false', () => {
      assert(!isMatch('a', '[!abc]', { posix: false }));
      assert(isMatch('d', '[!abc]', { posix: false }));
    });

    it('should respect `options.literalBrackets`', () => {
      const options = { literalBrackets: true };
      assert(isMatch('zx[!a]y', '*x[!a]y', options));
      assert(!isMatch('xby', 'x[!a]y', options));
    });

    it('should respect `options.nobracket`', () => {
      const options = { nobracket: true };
      assert(isMatch('zx[!a]y', '*x[!a]y', options));
      assert(!isMatch('xby', 'x[!a]y', options));
    });
  });
});
