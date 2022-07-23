
import assert from 'assert';
import support from './support/index.js';
import picomatch from '../lib/index.js';
const { isMatch } = picomatch;

describe('non-globs', () => {
  before(() => support.resetPathSep());
  after(() => support.resetPathSep());
  afterEach(() => support.resetPathSep());

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
    support.windowsPathSep();
    assert(isMatch('aaa\\bbb', 'aaa/bbb'));
    assert(isMatch('aaa/bbb', 'aaa/bbb'));
    support.resetPathSep();
  });
});
