'use strict';

const path = require('path');
const assert = require('assert');
const match = require('./support/match');
const { isMatch } = require('..');

describe('qmarks and stars', () => {
  it('should match question marks with question marks', () => {
    assert.deepEqual(match(['?', '??', '???'], '?'), ['?']);
    assert.deepEqual(match(['?', '??', '???'], '??'), ['??']);
    assert.deepEqual(match(['?', '??', '???'], '???'), ['???']);
  });

  it('should match question marks and stars with question marks and stars', () => {
    assert.deepEqual(match(['?', '??', '???'], '?*'), ['?', '??', '???']);
    assert.deepEqual(match(['?', '??', '???'], '*?'), ['?', '??', '???']);
    assert.deepEqual(match(['?', '??', '???'], '?*?'), ['??', '???']);
    assert.deepEqual(match(['?*', '?*?', '?*?*?'], '?*'), ['?*', '?*?', '?*?*?']);
    assert.deepEqual(match(['?*', '?*?', '?*?*?'], '*?'), ['?*', '?*?', '?*?*?']);
    assert.deepEqual(match(['?*', '?*?', '?*?*?'], '?*?'), ['?*', '?*?', '?*?*?']);
  });

  it('should support consecutive stars and question marks', () => {
    assert.deepEqual(match(['aaa', 'aac', 'abc'], 'a*?c'), ['aac', 'abc']);
    assert.deepEqual(match(['abc', 'abb', 'acc'], 'a**?c'), ['abc', 'acc']);
    assert.deepEqual(match(['abc', 'aaaabbbbbbccccc'], 'a*****?c'), ['abc', 'aaaabbbbbbccccc']);
    assert.deepEqual(match(['a', 'ab', 'abc', 'abcd'], '*****?'), ['a', 'ab', 'abc', 'abcd']);
    assert.deepEqual(match(['a', 'ab', 'abc', 'abcd'], '*****??'), ['ab', 'abc', 'abcd']);
    assert.deepEqual(match(['a', 'ab', 'abc', 'abcd'], '?*****??'), ['abc', 'abcd']);
    assert.deepEqual(match(['abc', 'abb', 'zzz'], '?*****?c'), ['abc']);
    assert.deepEqual(match(['abc', 'bbb', 'zzz'], '?***?****?'), ['abc', 'bbb', 'zzz']);
    assert.deepEqual(match(['abc', 'bbb', 'zzz'], '?***?****c'), ['abc']);
    assert.deepEqual(match(['abc'], '*******?'), ['abc']);
    assert.deepEqual(match(['abc'], '*******c'), ['abc']);
    assert.deepEqual(match(['abc'], '?***?****'), ['abc']);
    assert.deepEqual(match(['abcdecdhjk'], 'a****c**?**??*****'), ['abcdecdhjk']);
    assert.deepEqual(match(['abcdecdhjk'], 'a**?**cd**?**??***k'), ['abcdecdhjk']);
    assert.deepEqual(match(['abcdecdhjk'], 'a**?**cd**?**??***k**'), ['abcdecdhjk']);
    assert.deepEqual(match(['abcdecdhjk'], 'a**?**cd**?**??k'), ['abcdecdhjk']);
    assert.deepEqual(match(['abcdecdhjk'], 'a**?**cd**?**??k***'), ['abcdecdhjk']);
    assert.deepEqual(match(['abcdecdhjk'], 'a*cd**?**??k'), ['abcdecdhjk']);
  });

  it('should match backslashes with question marks when not on windows', () => {
    if (process.platform !== 'win32') {
      assert(!isMatch('aaa\\\\bbb', 'aaa?bbb'));
      assert(isMatch('aaa\\\\bbb', 'aaa??bbb'));
      assert(isMatch('aaa\\bbb', 'aaa?bbb'));
    }
  });

  it('should match one character per question mark', () => {
    let fixtures = ['a', 'aa', 'ab', 'aaa', 'abcdefg'];
    assert.deepEqual(match(fixtures, '?'), ['a']);
    assert.deepEqual(match(fixtures, '??'), ['aa', 'ab']);
    assert.deepEqual(match(fixtures, '???'), ['aaa']);
    assert.deepEqual(match(['a/', '/a/', '/a/b/', '/a/b/c/', '/a/b/c/d/'], '??'), []);
    assert.deepEqual(match(['a/b/c.md'], 'a/?/c.md'), ['a/b/c.md']);
    assert.deepEqual(match(['a/bb/c.md'], 'a/?/c.md'), []);
    assert.deepEqual(match(['a/bb/c.md'], 'a/??/c.md'), ['a/bb/c.md']);
    assert.deepEqual(match(['a/bbb/c.md'], 'a/??/c.md'), []);
    assert.deepEqual(match(['a/bbb/c.md'], 'a/???/c.md'), ['a/bbb/c.md']);
    assert.deepEqual(match(['a/bbbb/c.md'], 'a/????/c.md'), ['a/bbbb/c.md']);
  });

  it('should not match slashes question marks', () => {
    let fixtures = ['//', 'a/', '/a', '/a/', 'aa', '/aa', 'a/a', 'aaa', '/aaa'];
    assert.deepEqual(match(fixtures, '/?'), ['/a']);
    assert.deepEqual(match(fixtures, '/??'), ['/aa']);
    assert.deepEqual(match(fixtures, '/???'), ['/aaa']);
    assert.deepEqual(match(fixtures, '/?/'), ['/a/']);
    assert.deepEqual(match(fixtures, '??'), ['aa']);
    assert.deepEqual(match(fixtures, '?/?'), ['a/a']);
    assert.deepEqual(match(fixtures, '???'), ['aaa']);
    assert.deepEqual(match(fixtures, 'a?a'), ['aaa']);
    assert.deepEqual(match(fixtures, 'aa?'), ['aaa']);
    assert.deepEqual(match(fixtures, '?aa'), ['aaa']);
  });

  it('should support question marks and stars between slashes', () => {
    assert.deepEqual(match(['a/b.bb/c/d/efgh.ijk/e'], 'a/*/?/**/e'), ['a/b.bb/c/d/efgh.ijk/e']);
    assert.deepEqual(match(['a/b/c/d/e'], 'a/?/c/?/*/e'), []);
    assert.deepEqual(match(['a/b/c/d/e/e'], 'a/?/c/?/*/e'), ['a/b/c/d/e/e']);
    assert.deepEqual(match(['a/b/c/d/efgh.ijk/e'], 'a/*/?/**/e'), ['a/b/c/d/efgh.ijk/e']);
    assert.deepEqual(match(['a/b/c/d/efghijk/e'], 'a/*/?/**/e'), ['a/b/c/d/efghijk/e']);
    assert.deepEqual(match(['a/b/c/d/efghijk/e'], 'a/?/**/e'), ['a/b/c/d/efghijk/e']);
    assert.deepEqual(match(['a/b/c/d/efghijk/e'], 'a/?/c/?/*/e'), ['a/b/c/d/efghijk/e']);
    assert.deepEqual(match(['a/bb/e'], 'a/?/**/e'), []);
    assert.deepEqual(match(['a/bb/e'], 'a/?/e'), []);
    assert.deepEqual(match(['a/bbb/c/d/efgh.ijk/e'], 'a/*/?/**/e'), ['a/bbb/c/d/efgh.ijk/e']);
  });

  it('should match no more than one character between slashes', () => {
    let fixtures = ['a/a', 'a/a/a', 'a/aa/a', 'a/aaa/a', 'a/aaaa/a', 'a/aaaaa/a'];
    assert.deepEqual(match(fixtures, '?/?'), ['a/a']);
    assert.deepEqual(match(fixtures, '?/???/?'), ['a/aaa/a']);
    assert.deepEqual(match(fixtures, '?/????/?'), ['a/aaaa/a']);
    assert.deepEqual(match(fixtures, '?/?????/?'), ['a/aaaaa/a']);;
    assert.deepEqual(match(fixtures, 'a/?'), ['a/a']);
    assert.deepEqual(match(fixtures, 'a/?/a'), ['a/a/a']);
    assert.deepEqual(match(fixtures, 'a/??/a'), ['a/aa/a']);
    assert.deepEqual(match(fixtures, 'a/???/a'), ['a/aaa/a']);
    assert.deepEqual(match(fixtures, 'a/????/a'), ['a/aaaa/a']);
    assert.deepEqual(match(fixtures, 'a/????a/a'), ['a/aaaaa/a']);
  });

  it('should not match non-leading dots with question marks', () => {
    let fixtures = ['.', '.a', 'a', 'aa', 'a.a', 'aa.a', 'aaa', 'aaa.a', 'aaaa.a', 'aaaaa'];
    assert.deepEqual(match(fixtures, '?'), ['a']);
    assert.deepEqual(match(fixtures, '.?'), ['.a']);
    assert.deepEqual(match(fixtures, '?a'), ['aa']);
    assert.deepEqual(match(fixtures, '??'), ['aa']);
    assert.deepEqual(match(fixtures, '?a?'), ['aaa']);
    assert.deepEqual(match(fixtures, 'aaa?a'), ['aaa.a', 'aaaaa']);
    assert.deepEqual(match(fixtures, 'a?a?a'), ['aaa.a', 'aaaaa']);
    assert.deepEqual(match(fixtures, 'a???a'), ['aaa.a', 'aaaaa']);
    assert.deepEqual(match(fixtures, 'a?????'), ['aaaa.a']);
  });

  it('should match non-leading dots with question marks when options.dot is true', () => {
    let fixtures = ['.', '.a', 'a', 'aa', 'a.a', 'aa.a', '.aa', 'aaa.a', 'aaaa.a', 'aaaaa'];
    let opts = { dot: true };
    assert.deepEqual(match(fixtures, '?', opts), ['.', 'a']);
    assert.deepEqual(match(fixtures, '.?', opts), ['.a']);
    assert.deepEqual(match(fixtures, '?a', opts), ['.a', 'aa']);
    assert.deepEqual(match(fixtures, '??', opts), ['.a', 'aa']);
    assert.deepEqual(match(fixtures, '?a?', opts), ['.aa']);
  });
});
