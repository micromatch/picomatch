'use strict';

require('mocha');
const path = require('path');
const assert = require('assert');
const { isMatch } = require('..');

if (!process.env.ORIGINAL_PATH_SEP) {
  process.env.ORIGINAL_PATH_SEP = path.sep
}

describe('non-globs', () => {
  it('should match non-globs', () => {
    assert(!isMatch('/ab', '/a'));
    assert(!isMatch('a/a', 'a/b'));
    assert(!isMatch('a/a', 'a/c'));
    assert(!isMatch('a/b', 'a/c'));
    assert(!isMatch('a/c', 'a/b'));
    assert(!isMatch('aaa', 'aa'));
    assert(!isMatch('ab', '/a'));
    assert(!isMatch('ab', 'a'));

    assert(isMatch('/a', '/a'));
    assert(isMatch('/a/', '/a/'));
    assert(isMatch('/a/a', '/a/a'));
    assert(isMatch('/a/a/', '/a/a/'));
    assert(isMatch('/a/a/a', '/a/a/a'));
    assert(isMatch('/a/a/a/', '/a/a/a/'));
    assert(isMatch('/a/a/a/a', '/a/a/a/a'));
    assert(isMatch('/a/a/a/a/a', '/a/a/a/a/a'));

    assert(isMatch('a', 'a'));
    assert(isMatch('a/', 'a/'));
    assert(isMatch('a/a', 'a/a'));
    assert(isMatch('a/a/', 'a/a/'));
    assert(isMatch('a/a/a', 'a/a/a'));
    assert(isMatch('a/a/a/', 'a/a/a/'));
    assert(isMatch('a/a/a/a', 'a/a/a/a'));
    assert(isMatch('a/a/a/a/a', 'a/a/a/a/a'));
  });

  it('should match literal dots', () => {
    assert(isMatch('.', '.'));
    assert(isMatch('..', '..'));
    assert(!isMatch('...', '..'));
    assert(isMatch('...', '...'));
    assert(isMatch('....', '....'));
    assert(!isMatch('....', '...'));
  });

  it('should handle escaped characters as literals', () => {
    assert(!isMatch('abc', 'abc\\*'));
    assert(isMatch('abc*', 'abc\\*'));
  });

  it('should match windows paths', () => {
    path.sep = '\\';
    assert(isMatch('aaa\\bbb', 'aaa/bbb'));
    assert(isMatch('aaa/bbb', 'aaa/bbb'));
    path.sep = process.env.ORIGINAL_PATH_SEP;
  });
});
