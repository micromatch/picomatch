'use strict';

const assert = require('assert');
const { isMatch, makeRe } = require('..');

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

  it('should preserve groups after an unmatched closing paren', () => {
    assert(isMatch(')a', ')(a)'));
    assert(isMatch(')b', ')(a|b)'));
    assert(isMatch(')ab', ')a(b)'));
    assert(!isMatch(')c', ')(a|b)'));
  });

  it('should preserve extglobs after an unmatched closing paren', () => {
    assert(isMatch(')a', ')@(a|b)'));
    assert(isMatch(')b', ')@(a|b)'));
    assert(!isMatch(')c', ')@(a|b)'));
  });

  it('should escape each unmatched closing paren', () => {
    assert(makeRe('))a').test('))a'));
    assert(makeRe('a)b)').test('a)b)'));
    assert(isMatch('))a', '))(a)'));
  });

  it('should preserve escaped and strict paren handling', () => {
    assert(isMatch(')a', '\\)(a)'));
    assert(isMatch('a)', '(a))'));
    assert(isMatch('ab', '(a)(b)'));
    assert.throws(() => makeRe(')(a)', { strictBrackets: true }), SyntaxError);
    assert.throws(() => makeRe('a)', { strictBrackets: true }), SyntaxError);
    assert.throws(() => makeRe('(a', { strictBrackets: true }), SyntaxError);
  });

  it('should not match slashes with single stars', () => {
    assert(!isMatch('a/b', '(a)*'));
    assert(!isMatch('a/b', '(a|b)*'));
  });
});
