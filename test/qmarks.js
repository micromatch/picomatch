'use strict';

require('mocha');
const fill = require('fill-range');
const assert = require('assert');
const picomatch = require('..');
const pm = require('./support');

describe('qmarks and stars', () => {
  beforeEach(() => picomatch.clearCache());

  it('should correctly handle question marks in globs', () => {
    assert.deepEqual(pm(['?', '??', '???'], '?'), ['?']);
    assert.deepEqual(pm(['?', '??', '???'], '??'), ['??']);
    assert.deepEqual(pm(['?', '??', '???'], '???'), ['???']);
    assert.deepEqual(pm(['/a/', '/a/b/', '/a/b/c/', '/a/b/c/d/'], '??'), []);
    assert.deepEqual(pm(['x/y/acb', 'acb', 'acb/', 'acb/d/e'], 'a?b'), ['acb', 'acb/']);
    assert.deepEqual(pm(['aaa', 'aac', 'abc'], 'a?c'), ['aac', 'abc']);
    assert.deepEqual(pm(['aaa', 'aac', 'abc'], 'a*?c'), ['aac', 'abc']);
    assert.deepEqual(pm(['a', 'aa', 'ab', 'ab?', 'ac', 'ac?', 'abcd', 'abbb'], 'ab?'), ['ab?']);
    assert.deepEqual(pm(['abc', 'abb', 'acc'], 'a**?c'), ['abc', 'acc']);
    assert.deepEqual(pm(['abc'], 'a*****?c'), ['abc']);
    assert.deepEqual(pm(['a', 'aa', 'abc', 'zzz', 'bbb', 'aaaa'], '*****?'), ['a', 'aa', 'abc', 'zzz', 'bbb', 'aaaa']);
    assert.deepEqual(pm(['a', 'aa', 'abc', 'zzz', 'bbb', 'aaaa'], '*****??'), ['aa', 'abc', 'zzz', 'bbb', 'aaaa']);
    assert.deepEqual(pm(['a', 'aa', 'abc', 'zzz', 'bbb', 'aaaa'], '?*****??'), ['abc', 'zzz', 'bbb', 'aaaa']);
    assert.deepEqual(pm(['abc', 'abb', 'zzz'], '?*****?c'), ['abc']);
    assert.deepEqual(pm(['abc', 'bbb', 'zzz'], '?***?****c'), ['abc']);
    assert.deepEqual(pm(['abc', 'bbb', 'zzz'], '?***?****?'), ['abc', 'bbb', 'zzz']);
    assert.deepEqual(pm(['abc'], '?***?****'), ['abc']);
    assert.deepEqual(pm(['abc'], '*******c'), ['abc']);
    assert.deepEqual(pm(['abc'], '*******?'), ['abc']);
    assert.deepEqual(pm(['abcdecdhjk'], 'a*cd**?**??k'), ['abcdecdhjk']);
    assert.deepEqual(pm(['abcdecdhjk'], 'a**?**cd**?**??k'), ['abcdecdhjk']);
    assert.deepEqual(pm(['abcdecdhjk'], 'a**?**cd**?**??k***'), ['abcdecdhjk']);
    assert.deepEqual(pm(['abcdecdhjk'], 'a**?**cd**?**??***k'), ['abcdecdhjk']);
    assert.deepEqual(pm(['abcdecdhjk'], 'a**?**cd**?**??***k**'), ['abcdecdhjk']);
    assert.deepEqual(pm(['abcdecdhjk'], 'a****c**?**??*****'), ['abcdecdhjk']);
  });

  it('should match one character per question mark', () => {
    assert.deepEqual(pm(['a/b/c.md'], 'a/?/c.md'), ['a/b/c.md']);
    assert.deepEqual(pm(['a/bb/c.md'], 'a/?/c.md'), []);
    assert.deepEqual(pm(['a/bb/c.md'], 'a/??/c.md'), ['a/bb/c.md']);
    assert.deepEqual(pm(['a/bbb/c.md'], 'a/??/c.md'), []);
    assert.deepEqual(pm(['a/bbb/c.md'], 'a/???/c.md'), ['a/bbb/c.md']);
    assert.deepEqual(pm(['a/bbbb/c.md'], 'a/????/c.md'), ['a/bbbb/c.md']);
  });

  it('should match multiple groups of question marks', () => {
    assert.deepEqual(pm(['a/bb/c/dd/e.md'], 'a/?/c/?/e.md'), []);
    assert.deepEqual(pm(['a/b/c/d/e.md'], 'a/?/c/?/e.md'), ['a/b/c/d/e.md']);
    assert.deepEqual(pm(['a/b/c/d/e.md'], 'a/?/c/???/e.md'), []);
    assert.deepEqual(pm(['a/b/c/zzz/e.md'], 'a/?/c/???/e.md'), ['a/b/c/zzz/e.md']);
  });

  it('should support regex capture groups', () => {
    assert.deepEqual(pm(['a/bb/c/dd/e.md'], 'a/**/(?:dd)/e.md'), ['a/bb/c/dd/e.md']);
    assert.deepEqual(pm(['a/b/c/d/e.md', 'a/b/c/d/f.md'], 'a/?/c/?/(?:e|f).md'), ['a/b/c/d/e.md', 'a/b/c/d/f.md']);
  });

  it('should use qmarks with other special characters', () => {
    assert.deepEqual(pm(['a/b/c/d/e.md'], 'a/?/c/?/*/e.md'), []);
    assert.deepEqual(pm(['a/b/c/d/e/e.md'], 'a/?/c/?/*/e.md'), ['a/b/c/d/e/e.md']);
    assert.deepEqual(pm(['a/b/c/d/efghijk/e.md'], 'a/?/c/?/*/e.md'), ['a/b/c/d/efghijk/e.md']);
    assert.deepEqual(pm(['a/b/c/d/efghijk/e.md'], 'a/?/**/e.md'), ['a/b/c/d/efghijk/e.md']);
    assert.deepEqual(pm(['a/bb/e.md'], 'a/?/e.md'), []);
    assert.deepEqual(pm(['a/bb/e.md'], 'a/??/e.md'), ['a/bb/e.md']);
    assert.deepEqual(pm(['a/bb/e.md'], 'a/?/**/e.md'), []);
    assert.deepEqual(pm(['a/b/ccc/e.md'], 'a/?/**/e.md'), ['a/b/ccc/e.md']);
    assert.deepEqual(pm(['a/b/c/d/efghijk/e.md'], 'a/*/?/**/e.md'), ['a/b/c/d/efghijk/e.md']);
    assert.deepEqual(pm(['a/b/c/d/efgh.ijk/e.md'], 'a/*/?/**/e.md'), ['a/b/c/d/efgh.ijk/e.md']);
    assert.deepEqual(pm(['a/b.bb/c/d/efgh.ijk/e.md'], 'a/*/?/**/e.md'), ['a/b.bb/c/d/efgh.ijk/e.md']);
    assert.deepEqual(pm(['a/bbb/c/d/efgh.ijk/e.md'], 'a/*/?/**/e.md'), ['a/bbb/c/d/efgh.ijk/e.md']);
  });

  it('question marks should not match slashes', () => {
    assert(!pm.isMatch('aaa/bbb', 'aaa?bbb'));
    assert(!pm.isMatch('aaa//bbb', 'aaa?bbb'));
    assert(!pm.isMatch('aaa\\\\bbb', 'aaa?bbb'));
  });

  it('question marks should match arbitrary dots', () => {
    assert(pm.isMatch('aaa.bbb', 'aaa?bbb'));
  });

  it('question marks should not match leading dots', () => {
    assert(!pm.isMatch('.aaa/bbb', '?aaa/bbb'));
    assert(!pm.isMatch('aaa/.bbb', 'aaa/?bbb'));
  });

  it('question marks should match characters preceding a dot', () => {
    assert(pm.isMatch('a/bbb/abcd.md', 'a/*/ab??.md'));
    assert(pm.isMatch('a/bbb/abcd.md', 'a/bbb/ab??.md'));
    assert(pm.isMatch('a/bbb/abcd.md', 'a/bbb/ab???md'));
  });
});
