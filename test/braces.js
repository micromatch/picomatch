'use strict';

require('mocha');
const fill = require('fill-range');
const assert = require('assert');
const picomatch = require('..');
const pm = require('./support');

describe('qmarks and stars', () => {
  beforeEach(() => picomatch.clearCache());

  it('should support braces', () => {

  });

  it('should support regex quantifiers by escaping braces', () => {
    assert(!pm.isMatch('a  ', '@(!(a) \\{1,2\\})*', { unescape: true }));
    assert(!pm.isMatch('a ', '@(!(a) \\{1,2\\})*', { unescape: true }));
    assert(!pm.isMatch('a', '@(!(a) \\{1,2\\})*', { unescape: true }));
    assert(!pm.isMatch('aa', '@(!(a) \\{1,2\\})*', { unescape: true }));
    assert(!pm.isMatch('aaa', '@(!(a) \\{1,2\\})*', { unescape: true }));
    assert(!pm.isMatch('b', '@(!(a) \\{1,2\\})*', { unescape: true }));
    assert(!pm.isMatch('bb', '@(!(a) \\{1,2\\})*', { unescape: true }));
    assert(!pm.isMatch('bbb', '@(!(a) \\{1,2\\})*', { unescape: true }));
    assert(pm.isMatch(' a ', '@(!(a) \\{1,2\\})*', { unescape: true }));
    assert(pm.isMatch('b  ', '@(!(a) \\{1,2\\})*', { unescape: true }));
    assert(pm.isMatch('b ', '@(!(a) \\{1,2\\})*', { unescape: true }));

    assert(pm.isMatch('a   ', '@(!(a \\{1,2\\}))*', { unescape: true }));
    assert(pm.isMatch('a   b', '@(!(a \\{1,2\\}))*', { unescape: true }));
    assert(pm.isMatch('a  b', '@(!(a \\{1,2\\}))*', { unescape: true }));
    assert(!pm.isMatch('a  ', '@(!(a \\{1,2\\}))*', { unescape: true }));
    assert(!pm.isMatch('a ', '@(!(a \\{1,2\\}))*', { unescape: true }));
    assert(pm.isMatch('a', '@(!(a \\{1,2\\}))*', { unescape: true }));
    assert(pm.isMatch('aa', '@(!(a \\{1,2\\}))*', { unescape: true }));
    assert(pm.isMatch('b', '@(!(a \\{1,2\\}))*', { unescape: true }));
    assert(pm.isMatch('bb', '@(!(a \\{1,2\\}))*', { unescape: true }));
    assert(pm.isMatch(' a ', '@(!(a \\{1,2\\}))*', { unescape: true }));
    assert(pm.isMatch('b  ', '@(!(a \\{1,2\\}))*', { unescape: true }));
    assert(pm.isMatch('b ', '@(!(a \\{1,2\\}))*', { unescape: true }));
  });
});
