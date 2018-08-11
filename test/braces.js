'use strict';

require('mocha');
const assert = require('assert');
const picomatch = require('..');
const pm = require('./support');

describe('qmarks and stars', () => {
  beforeEach(() => picomatch.clearCache());

  it('should support Kleene stars', () => {
    assert(pm.isMatch('ab', '{ab,c}*'));
    assert(pm.isMatch('abab', '{ab,c}*'));
    assert(pm.isMatch('abc', '{ab,c}*'));
    assert(pm.isMatch('c', '{ab,c}*'));
    assert(pm.isMatch('cab', '{ab,c}*'));
    assert(pm.isMatch('cc', '{ab,c}*'));
    assert(pm.isMatch('ababab', '{ab,c}*'));
    assert(pm.isMatch('ababc', '{ab,c}*'));
    assert(pm.isMatch('abcab', '{ab,c}*'));
    assert(pm.isMatch('abcc', '{ab,c}*'));
    assert(pm.isMatch('cabab', '{ab,c}*'));
    assert(pm.isMatch('cabc', '{ab,c}*'));
    assert(pm.isMatch('ccab', '{ab,c}*'));
    assert(pm.isMatch('ccc', '{ab,c}*'));
  });

  it('should support Kleene plus', () => {
    assert(pm.isMatch('ab', '{ab,c}+'));
    assert(pm.isMatch('abab', '{ab,c}+'));
    assert(pm.isMatch('abc', '{ab,c}+'));
    assert(pm.isMatch('c', '{ab,c}+'));
    assert(pm.isMatch('cab', '{ab,c}+'));
    assert(pm.isMatch('cc', '{ab,c}+'));
    assert(pm.isMatch('ababab', '{ab,c}+'));
    assert(pm.isMatch('ababc', '{ab,c}+'));
    assert(pm.isMatch('abcab', '{ab,c}+'));
    assert(pm.isMatch('abcc', '{ab,c}+'));
    assert(pm.isMatch('cabab', '{ab,c}+'));
    assert(pm.isMatch('cabc', '{ab,c}+'));
    assert(pm.isMatch('ccab', '{ab,c}+'));
    assert(pm.isMatch('ccc', '{ab,c}+'));
    assert(pm.isMatch('ccc', '{a,b,c}+'));

    assert(pm.isMatch('a', '{a,b,c}+'));
    assert(pm.isMatch('b', '{a,b,c}+'));
    assert(pm.isMatch('c', '{a,b,c}+'));
    assert(pm.isMatch('aa', '{a,b,c}+'));
    assert(pm.isMatch('ab', '{a,b,c}+'));
    assert(pm.isMatch('ac', '{a,b,c}+'));
    assert(pm.isMatch('ba', '{a,b,c}+'));
    assert(pm.isMatch('bb', '{a,b,c}+'));
    assert(pm.isMatch('bc', '{a,b,c}+'));
    assert(pm.isMatch('ca', '{a,b,c}+'));
    assert(pm.isMatch('cb', '{a,b,c}+'));
    assert(pm.isMatch('cc', '{a,b,c}+'));
    assert(pm.isMatch('aaa', '{a,b,c}+'));
    assert(pm.isMatch('aab', '{a,b,c}+'));
    assert(pm.isMatch('abc', '{a,b,c}+'));
  });

  it('should support braces', () => {
    assert(pm.isMatch('a', '{a,b,c}'));
    assert(pm.isMatch('b', '{a,b,c}'));
    assert(pm.isMatch('c', '{a,b,c}'));
    assert(!pm.isMatch('aa', '{a,b,c}'));
    assert(!pm.isMatch('bb', '{a,b,c}'));
    assert(!pm.isMatch('cc', '{a,b,c}'));
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
