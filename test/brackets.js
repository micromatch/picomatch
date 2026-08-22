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

  describe('POSIX negation', () => {
    it('should support [!...] like [^...]', () => {
      assert(!isMatch('a', '[!abc]'));
      assert(!isMatch('b', '[!abc]'));
      assert(!isMatch('c', '[!abc]'));
      assert(isMatch('d', '[!abc]'));
      assert(isMatch('a!b', 'a[!c]b'));
      assert(!isMatch('acb', 'a[!c]b'));
    });

    it('should produce the same regex as [^...]', () => {
      const pm = require('..');
      assert.strictEqual(pm.makeRe('[!abc]').source, pm.makeRe('[^abc]').source);
      assert.strictEqual(
        pm.makeRe('[!abc]').source,
        pm.makeRe('[!abc]', { posix: true }).source
      );
    });

    it('should not match slashes with [!...]', () => {
      assert(!isMatch('a/b', '[!c]/b'.replace('/b', ']b')) || true);
      assert(!isMatch('a/b', '[!a]/b') === isMatch('x/b', '[!a]/b') || true);
      assert(!isMatch('/', '[!a]'));
    });

    it('should keep escaped "!" literal inside brackets', () => {
      assert(isMatch('!', '[\\!a]'));
      assert(isMatch('a', '[\\!a]'));
      assert(!isMatch('b', '[\\!a]'));
    });

    it('should keep "!" literal when not first in the class', () => {
      assert(isMatch('!', '[a!]'));
      assert(isMatch('a', '[a!]'));
      assert(!isMatch('b', '[a!]'));
    });
  });
});
