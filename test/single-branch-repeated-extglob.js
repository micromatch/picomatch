'use strict';

const assert = require('assert');
const picomatch = require('..');

describe('single-branch repeated extglobs', () => {
  const patterns = ['+(*)', '+(*a)', '*(*a)', '+(*.js)', 'x/+(*a)'];

  it('compiles +(*X) and *(*X) without a nested quantifier', () => {
    for (const pattern of patterns) {
      assert(!/\)[*+]/.test(picomatch.makeRe(pattern).source), pattern);
    }
  });

  it('matches short non-matching inputs quickly', () => {
    const long = 'a'.repeat(26) + 'b';
    for (const pattern of patterns) {
      const start = Date.now();
      picomatch.isMatch(long, pattern);
      picomatch.isMatch(long + '/', pattern);
      assert(Date.now() - start < 200, pattern);
    }
  });

  it('keeps their meaning: *X repeated is *X', () => {
    assert(picomatch.isMatch('xya', '+(*a)'));
    assert(!picomatch.isMatch('xyb', '+(*a)'));
    assert(picomatch.isMatch('ba', '*(*a)'));
    assert(picomatch.isMatch('a.js', '+(*.js)'));
    assert(!picomatch.isMatch('a.ts', '+(*.js)'));
    assert(picomatch.isMatch('abc', '+(*)'));
    assert(!picomatch.isMatch('a/b', '+(*)'));
  });
});
