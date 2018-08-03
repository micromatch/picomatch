'use strict';

require('mocha');
const fill = require('fill-range');
const assert = require('assert');
const picomatch = require('..');
const { isMatch } = require('./support');

describe('qmarks and stars', () => {
  beforeEach(() => picomatch.clearCache());

  it('should correctly handle question marks in globs', () => {
    assert(isMatch('?', '?'));
    assert(!isMatch('??', '?'));
    assert(!isMatch('???', '?'));

    assert(!isMatch('?', '??'));
    assert(isMatch('??', '??'));
    assert(!isMatch('???', '??'));

    assert(!isMatch('?', '???'));
    assert(!isMatch('??', '???'));
    assert(isMatch('???', '???'));

    assert(!isMatch('/a/', '??'));
    assert(!isMatch('/a/b/', '??'));
    assert(!isMatch('/a/b/c/', '??'));
    assert(!isMatch('/a/b/c/d/', '??'));

    assert(!isMatch('x/y/acb', 'a?b'));
    assert(isMatch('acb', 'a?b'));
    assert(isMatch('acb/', 'a?b'));
    assert(!isMatch('acb/d/e', 'a?b'));

    assert(!isMatch('aaa', 'a?c'));
    assert(isMatch('aac', 'a?c'));
    assert(isMatch('abc', 'a?c'));

    assert(!isMatch('aaa', 'a*?c'));
    assert(isMatch('aac', 'a*?c'));
    assert(isMatch('abc', 'a*?c'));

    assert(!isMatch('a', 'ab?'));
    assert(!isMatch('aa', 'ab?'));
    assert(!isMatch('ab', 'ab?'));
    assert(isMatch('ab?', 'ab?'));
    assert(!isMatch('ac', 'ab?'));
    assert(!isMatch('ac?', 'ab?'));
    assert(!isMatch('abcd', 'ab?'));
    assert(!isMatch('abbb', 'ab?'));

    assert(isMatch('abc', 'a**?c'));
    assert(!isMatch('abb', 'a**?c'));
    assert(isMatch('acc', 'a**?c'));
    assert(isMatch('abc', 'a*****?c'));

    assert(isMatch('a', '*****?'));
    assert(isMatch('aa', '*****?'));
    assert(isMatch('abc', '*****?'));
    assert(isMatch('zzz', '*****?'));
    assert(isMatch('bbb', '*****?'));
    assert(isMatch('aaaa', '*****?'));

    assert(!isMatch('a', '*****??'));
    assert(isMatch('aa', '*****??'));
    assert(isMatch('abc', '*****??'));
    assert(isMatch('zzz', '*****??'));
    assert(isMatch('bbb', '*****??'));
    assert(isMatch('aaaa', '*****??'));

    assert(!isMatch('a', '?*****??'));
    assert(!isMatch('aa', '?*****??'));
    assert(isMatch('abc', '?*****??'));
    assert(isMatch('zzz', '?*****??'));
    assert(isMatch('bbb', '?*****??'));
    assert(isMatch('aaaa', '?*****??'));

    assert(isMatch('abc', '?*****?c'));
    assert(!isMatch('abb', '?*****?c'));
    assert(!isMatch('zzz', '?*****?c'));

    assert(isMatch('abc', '?***?****c'));
    assert(!isMatch('bbb', '?***?****c'));
    assert(!isMatch('zzz', '?***?****c'));

    assert(isMatch('abc', '?***?****?'));
    assert(isMatch('bbb', '?***?****?'));
    assert(isMatch('zzz', '?***?****?'));

    assert(isMatch('abc', '?***?****'));
    assert(isMatch('abc', '*******c'));
    assert(isMatch('abc', '*******?'));
    assert(isMatch('abcdecdhjk', 'a*cd**?**??k'));
    assert(isMatch('abcdecdhjk', 'a**?**cd**?**??k'));
    assert(isMatch('abcdecdhjk', 'a**?**cd**?**??k***'));
    assert(isMatch('abcdecdhjk', 'a**?**cd**?**??***k'));
    assert(isMatch('abcdecdhjk', 'a**?**cd**?**??***k**'));
    assert(isMatch('abcdecdhjk', 'a****c**?**??*****'));
  });

  it('should match one character per question mark', () => {
    assert(isMatch('a/b/c.md', 'a/?/c.md'));
    assert(!isMatch('a/bb/c.md', 'a/?/c.md'));
    assert(isMatch('a/bb/c.md', 'a/??/c.md'));
    assert(!isMatch('a/bbb/c.md', 'a/??/c.md'));
    assert(isMatch('a/bbb/c.md', 'a/???/c.md'));
    assert(isMatch('a/bbbb/c.md', 'a/????/c.md'));
  });

  it('should match multiple groups of question marks', () => {
    assert(!isMatch('a/bb/c/dd/e.md', 'a/?/c/?/e.md'));
    assert(isMatch('a/b/c/d/e.md', 'a/?/c/?/e.md'));
    assert(!isMatch('a/b/c/d/e.md', 'a/?/c/???/e.md'));
    assert(isMatch('a/b/c/zzz/e.md', 'a/?/c/???/e.md'));
  });

  it('should support regex capture groups', () => {
    assert(isMatch('a/bb/c/dd/e.md', 'a/**/(?:dd)/e.md'));
    assert(isMatch('a/b/c/d/e.md', 'a/?/c/?/(?:e|f).md'));
    assert(isMatch('a/b/c/d/f.md', 'a/?/c/?/(?:e|f).md'));
  });

  it('should use qmarks with other special characters', () => {
    assert(!isMatch('a/b/c/d/e.md', 'a/?/c/?/*/e.md'));
    assert(isMatch('a/b/c/d/e/e.md', 'a/?/c/?/*/e.md'));
    assert(isMatch('a/b/c/d/efghijk/e.md', 'a/?/c/?/*/e.md'));
    assert(isMatch('a/b/c/d/efghijk/e.md', 'a/?/**/e.md'));
    assert(!isMatch('a/bb/e.md', 'a/?/e.md'));
    assert(isMatch('a/bb/e.md', 'a/??/e.md'));
    assert(!isMatch('a/bb/e.md', 'a/?/**/e.md'));
    assert(isMatch('a/b/ccc/e.md', 'a/?/**/e.md'));
    assert(isMatch('a/b/c/d/efghijk/e.md', 'a/*/?/**/e.md'));
    assert(isMatch('a/b/c/d/efgh.ijk/e.md', 'a/*/?/**/e.md'));
    assert(isMatch('a/b.bb/c/d/efgh.ijk/e.md', 'a/*/?/**/e.md'));
    assert(isMatch('a/bbb/c/d/efgh.ijk/e.md', 'a/*/?/**/e.md'));
  });

  it('question marks should not match slashes', () => {
    assert(!isMatch('aaa/bbb', 'aaa?bbb'));
    assert(!isMatch('aaa//bbb', 'aaa?bbb'));
    assert(!isMatch('aaa\\\\bbb', 'aaa?bbb'));
  });

  it('question marks should match arbitrary dots', () => {
    assert(isMatch('aaa.bbb', 'aaa?bbb'));
  });

  it('question marks should not match leading dots', () => {
    assert(!isMatch('.aaa/bbb', '?aaa/bbb'));
    assert(!isMatch('aaa/.bbb', 'aaa/?bbb'));
  });

  it('question marks should match characters preceding a dot', () => {
    assert(isMatch('a/bbb/abcd.md', 'a/*/ab??.md'));
    assert(isMatch('a/bbb/abcd.md', 'a/bbb/ab??.md'));
    assert(isMatch('a/bbb/abcd.md', 'a/bbb/ab???md'));
  });
});
