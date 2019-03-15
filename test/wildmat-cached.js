'use strict';

const support = require('./support');
const assert = require('assert');
const { isMatch } = require('..');

describe('Wildmat (git) tests - cached', () => {
  before(() => support.enableCache());
  after(() => support.disableCache());

  it('Basic wildmat features', () => {
    assert(!isMatch('foo', '*f'));
    assert(!isMatch('foo', '??'));
    assert(!isMatch('foo', 'bar'));
    assert(!isMatch('foobar', 'foo\\*bar'));
    assert(isMatch('?a?b', '\\??\\?b'));
    assert(isMatch('aaaaaaabababab', '*ab'));
    assert(isMatch('foo', '*'));
    assert(isMatch('foo', '*foo*'));
    assert(isMatch('foo', '???'));
    assert(isMatch('foo', 'f*'));
    assert(isMatch('foo', 'foo'));
    assert(isMatch('foobar', '*ob*a*r*'));
  });

  it('should support recursion', () => {
    assert(isMatch('foo/bb/aa/rr', '**/**/**'));
    assert(!isMatch('abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz', '**/*a*b*g*n*t'));
    assert(isMatch('abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt', '**/*a*b*g*n*t'));
    assert(isMatch('ab/cXd/efXg/hi', '**/*X*/**/*i'));
    assert(!isMatch('foo', '*/*/*'));
    assert(!isMatch('foo/bar', '*/*/*'));
    assert(!isMatch('foo/bb/aa/rr', '*/*/*'));
    assert(isMatch('foo/bba/arr', '*/*/*'));
    assert(isMatch('ab/cXd/efXg/hi', '*/*X*/*/*i'));
    assert(!isMatch('ab/cXd/efXg/hi', '*X*i'));
    assert(isMatch('abcXdefXghi', '*X*i'));
    assert(!isMatch('ab/cXd/efXg/hi', '*Xg*i'));
    assert(!isMatch('-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'));
    assert(!isMatch('-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'));
    assert(isMatch('-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'));
    assert(!isMatch('foo', 'fo'));
    assert(isMatch('foo', 'foo'));
    assert(!isMatch('foo/bba/arr', 'foo*'));
    assert(!isMatch('foo/bba/arr', 'foo**'));
    assert(!isMatch('foo/bba/arr', 'foo/*'));
    assert(isMatch('foo/bar', 'foo/*'));
    assert(isMatch('foo/bba/arr', 'foo/**'));
    assert(!isMatch('foo/bba/arr', 'foo/**arr'));
    assert(!isMatch('foo/bba/arr', 'foo/**z'));
    assert(!isMatch('foo/bba/arr', 'foo/*arr'));
    assert(!isMatch('foo/bba/arr', 'foo/*z'));
    assert(isMatch('foo/bar', 'foo/bar'));
    assert(!isMatch('foo/bar', 'foo?bar'));
    assert(isMatch('foo/bar', 'foo[/]bar'));
    assert(!isMatch('XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1', 'XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*'));
  });
});
