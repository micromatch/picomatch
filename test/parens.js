'use strict';

const assert = require('assert');
const { isMatch } = require('..');

describe('parens (non-extglobs)', () => {
  it('should support stars following parens', () => {
    assert(isMatch('a', '(a)*'));
    assert(isMatch('az', '(a)*'));
    assert(!isMatch('zz', '(a)*'));
    assert(isMatch('ab', '(a|b)*'));
    assert(isMatch('abc', '(a|b)*'));
    assert(isMatch('aa', '(a)*'));
    assert(isMatch('aaab', '(a|b)*'));
    assert(isMatch('aaabbb', '(a|b)*'));
  });

  it('should not match slashes with single stars', () => {
    assert(!isMatch('a/b', '(a)*'));
    assert(!isMatch('a/b', '(a|b)*'));
  });
});
