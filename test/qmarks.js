'use strict';

const assert = require('assert');
const match = require('./support/match');
const { isMatch } = require('..');

describe('qmarks and stars', () => {
  it('should match question marks with question marks', () => {
    assert.deepStrictEqual(match(['?', '??', '???'], '?'), ['?']);
    assert.deepStrictEqual(match(['?', '??', '???'], '??'), ['??']);
    assert.deepStrictEqual(match(['?', '??', '???'], '???'), ['???']);
  });

  it('should match question marks and stars with question marks and stars', () => {
    assert.deepStrictEqual(match(['?', '??', '???'], '?*'), ['?', '??', '???']);
    assert.deepStrictEqual(match(['?', '??', '???'], '*?'), ['?', '??', '???']);
    assert.deepStrictEqual(match(['?', '??', '???'], '?*?'), ['??', '???']);
    assert.deepStrictEqual(match(['?*', '?*?', '?*?*?'], '?*'), ['?*', '?*?', '?*?*?']);
    assert.deepStrictEqual(match(['?*', '?*?', '?*?*?'], '*?'), ['?*', '?*?', '?*?*?']);
    assert.deepStrictEqual(match(['?*', '?*?', '?*?*?'], '?*?'), ['?*', '?*?', '?*?*?']);
  });

  it('should support consecutive stars and question marks', () => {
    assert.deepStrictEqual(match(['aaa', 'aac', 'abc'], 'a*?c'), ['aac', 'abc']);
    assert.deepStrictEqual(match(['abc', 'abb', 'acc'], 'a**?c'), ['abc', 'acc']);
    assert.deepStrictEqual(match(['abc', 'aaaabbbbbbccccc'], 'a*****?c'), ['abc', 'aaaabbbbbbccccc']);
    assert.deepStrictEqual(match(['a', 'ab', 'abc', 'abcd'], '*****?'), ['a', 'ab', 'abc', 'abcd']);
    assert.deepStrictEqual(match(['a', 'ab', 'abc', 'abcd'], '*****??'), ['ab', 'abc', 'abcd']);
    assert.deepStrictEqual(match(['a', 'ab', 'abc', 'abcd'], '?*****??'), ['abc', 'abcd']);
    assert.deepStrictEqual(match(['abc', 'abb', 'zzz'], '?*****?c'), ['abc']);
    assert.deepStrictEqual(match(['abc', 'bbb', 'zzz'], '?***?****?'), ['abc', 'bbb', 'zzz']);
    assert.deepStrictEqual(match(['abc', 'bbb', 'zzz'], '?***?****c'), ['abc']);
    assert.deepStrictEqual(match(['abc'], '*******?'), ['abc']);
    assert.deepStrictEqual(match(['abc'], '*******c'), ['abc']);
    assert.deepStrictEqual(match(['abc'], '?***?****'), ['abc']);
    assert.deepStrictEqual(match(['abcdecdhjk'], 'a****c**?**??*****'), ['abcdecdhjk']);
    assert.deepStrictEqual(match(['abcdecdhjk'], 'a**?**cd**?**??***k'), ['abcdecdhjk']);
    assert.deepStrictEqual(match(['abcdecdhjk'], 'a**?**cd**?**??***k**'), ['abcdecdhjk']);
    assert.deepStrictEqual(match(['abcdecdhjk'], 'a**?**cd**?**??k'), ['abcdecdhjk']);
    assert.deepStrictEqual(match(['abcdecdhjk'], 'a**?**cd**?**??k***'), ['abcdecdhjk']);
    assert.deepStrictEqual(match(['abcdecdhjk'], 'a*cd**?**??k'), ['abcdecdhjk']);
  });

  it('should match backslashes with question marks when not on windows', () => {
    if (process.platform !== 'win32') {
      assert(!isMatch('aaa\\\\bbb', 'aaa?bbb'));
      assert(isMatch('aaa\\\\bbb', 'aaa??bbb'));
      assert(isMatch('aaa\\bbb', 'aaa?bbb'));
    }
  });

  it('should match one character per question mark', () => {
    const fixtures = ['a', 'aa', 'ab', 'aaa', 'abcdefg'];
    assert.deepStrictEqual(match(fixtures, '?'), ['a']);
    assert.deepStrictEqual(match(fixtures, '??'), ['aa', 'ab']);
    assert.deepStrictEqual(match(fixtures, '???'), ['aaa']);
    assert.deepStrictEqual(match(['a/', '/a/', '/a/b/', '/a/b/c/', '/a/b/c/d/'], '??'), []);
    assert.deepStrictEqual(match(['a/b/c.md'], 'a/?/c.md'), ['a/b/c.md']);
    assert.deepStrictEqual(match(['a/bb/c.md'], 'a/?/c.md'), []);
    assert.deepStrictEqual(match(['a/bb/c.md'], 'a/??/c.md'), ['a/bb/c.md']);
    assert.deepStrictEqual(match(['a/bbb/c.md'], 'a/??/c.md'), []);
    assert.deepStrictEqual(match(['a/bbb/c.md'], 'a/???/c.md'), ['a/bbb/c.md']);
    assert.deepStrictEqual(match(['a/bbbb/c.md'], 'a/????/c.md'), ['a/bbbb/c.md']);
  });

  it('should not match slashes question marks', () => {
    const fixtures = ['//', 'a/', '/a', '/a/', 'aa', '/aa', 'a/a', 'aaa', '/aaa'];
    assert.deepStrictEqual(match(fixtures, '/?'), ['/a']);
    assert.deepStrictEqual(match(fixtures, '/??'), ['/aa']);
    assert.deepStrictEqual(match(fixtures, '/???'), ['/aaa']);
    assert.deepStrictEqual(match(fixtures, '/?/'), ['/a/']);
    assert.deepStrictEqual(match(fixtures, '??'), ['aa']);
    assert.deepStrictEqual(match(fixtures, '?/?'), ['a/a']);
    assert.deepStrictEqual(match(fixtures, '???'), ['aaa']);
    assert.deepStrictEqual(match(fixtures, 'a?a'), ['aaa']);
    assert.deepStrictEqual(match(fixtures, 'aa?'), ['aaa']);
    assert.deepStrictEqual(match(fixtures, '?aa'), ['aaa']);
  });

  it('should support question marks and stars between slashes', () => {
    assert.deepStrictEqual(match(['a/b.bb/c/d/efgh.ijk/e'], 'a/*/?/**/e'), ['a/b.bb/c/d/efgh.ijk/e']);
    assert.deepStrictEqual(match(['a/b/c/d/e'], 'a/?/c/?/*/e'), []);
    assert.deepStrictEqual(match(['a/b/c/d/e/e'], 'a/?/c/?/*/e'), ['a/b/c/d/e/e']);
    assert.deepStrictEqual(match(['a/b/c/d/efgh.ijk/e'], 'a/*/?/**/e'), ['a/b/c/d/efgh.ijk/e']);
    assert.deepStrictEqual(match(['a/b/c/d/efghijk/e'], 'a/*/?/**/e'), ['a/b/c/d/efghijk/e']);
    assert.deepStrictEqual(match(['a/b/c/d/efghijk/e'], 'a/?/**/e'), ['a/b/c/d/efghijk/e']);
    assert.deepStrictEqual(match(['a/b/c/d/efghijk/e'], 'a/?/c/?/*/e'), ['a/b/c/d/efghijk/e']);
    assert.deepStrictEqual(match(['a/bb/e'], 'a/?/**/e'), []);
    assert.deepStrictEqual(match(['a/bb/e'], 'a/?/e'), []);
    assert.deepStrictEqual(match(['a/bbb/c/d/efgh.ijk/e'], 'a/*/?/**/e'), ['a/bbb/c/d/efgh.ijk/e']);
  });

  it('should match no more than one character between slashes', () => {
    const fixtures = ['a/a', 'a/a/a', 'a/aa/a', 'a/aaa/a', 'a/aaaa/a', 'a/aaaaa/a'];
    assert.deepStrictEqual(match(fixtures, '?/?'), ['a/a']);
    assert.deepStrictEqual(match(fixtures, '?/???/?'), ['a/aaa/a']);
    assert.deepStrictEqual(match(fixtures, '?/????/?'), ['a/aaaa/a']);
    assert.deepStrictEqual(match(fixtures, '?/?????/?'), ['a/aaaaa/a']);
    assert.deepStrictEqual(match(fixtures, 'a/?'), ['a/a']);
    assert.deepStrictEqual(match(fixtures, 'a/?/a'), ['a/a/a']);
    assert.deepStrictEqual(match(fixtures, 'a/??/a'), ['a/aa/a']);
    assert.deepStrictEqual(match(fixtures, 'a/???/a'), ['a/aaa/a']);
    assert.deepStrictEqual(match(fixtures, 'a/????/a'), ['a/aaaa/a']);
    assert.deepStrictEqual(match(fixtures, 'a/????a/a'), ['a/aaaaa/a']);
  });

  it('should not match non-leading dots with question marks', () => {
    const fixtures = ['.', '.a', 'a', 'aa', 'a.a', 'aa.a', 'aaa', 'aaa.a', 'aaaa.a', 'aaaaa'];
    assert.deepStrictEqual(match(fixtures, '?'), ['a']);
    assert.deepStrictEqual(match(fixtures, '.?'), ['.a']);
    assert.deepStrictEqual(match(fixtures, '?a'), ['aa']);
    assert.deepStrictEqual(match(fixtures, '??'), ['aa']);
    assert.deepStrictEqual(match(fixtures, '?a?'), ['aaa']);
    assert.deepStrictEqual(match(fixtures, 'aaa?a'), ['aaa.a', 'aaaaa']);
    assert.deepStrictEqual(match(fixtures, 'a?a?a'), ['aaa.a', 'aaaaa']);
    assert.deepStrictEqual(match(fixtures, 'a???a'), ['aaa.a', 'aaaaa']);
    assert.deepStrictEqual(match(fixtures, 'a?????'), ['aaaa.a']);
  });

  it('should match non-leading dots with question marks when options.dot is true', () => {
    const fixtures = ['.', '.a', 'a', 'aa', 'a.a', 'aa.a', '.aa', 'aaa.a', 'aaaa.a', 'aaaaa'];
    const opts = { dot: true };
    assert.deepStrictEqual(match(fixtures, '?', opts), ['.', 'a']);
    assert.deepStrictEqual(match(fixtures, '.?', opts), ['.a']);
    assert.deepStrictEqual(match(fixtures, '?a', opts), ['.a', 'aa']);
    assert.deepStrictEqual(match(fixtures, '??', opts), ['.a', 'aa']);
    assert.deepStrictEqual(match(fixtures, '?a?', opts), ['.aa']);
  });
});
