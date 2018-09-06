'use strict';

require('mocha');
const assert = require('assert');
const picomatch = require('..');
const pm = require('./support');
picomatch.nocache = true;

describe('braces', () => {
  beforeEach(() => picomatch.clearCache());

  it('should match with brace patterns', () => {
    assert(pm.isMatch('a/a', 'a/{a,b}'));
    assert(pm.isMatch('a/b', 'a/{a,b}'));
    assert(!pm.isMatch('a/c', 'a/{a,b}'));
    assert(!pm.isMatch('b/b', 'a/{a,b}'));
    assert(!pm.isMatch('b/b', 'a/{a,b,c}'));
    assert(pm.isMatch('a/c', 'a/{a,b,c}'));
    assert(pm.isMatch('a/a', 'a/{a..c}'));
    assert(pm.isMatch('a/b', 'a/{a..c}'));
    assert(pm.isMatch('a/c', 'a/{a..c}'));
  });

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

  it('should not convert braces inside brackets', () => {
    assert(pm.isMatch('foo{}baz', 'foo[{a,b}]+baz'));
    assert(pm.isMatch('{a}{b}{c}', '[abc{}]+'));
  });

  it('should support braces with slashes and empty elements', () => {
    assert(pm.isMatch('a.txt', 'a{,/**/}*.txt'));
    assert(pm.isMatch('a/b.txt', 'a{,/**/,/}*.txt'));
    assert(pm.isMatch('a/x/y.txt', 'a{,/**/}*.txt'));
    assert(!pm.isMatch('a/x/y/z', 'a{,/**/}*.txt'));
  });

  it('should support braces with globstars and empty elements', () => {
    assert(pm.isMatch('a/b/foo/bar/baz.qux', 'a/b{,/**}/bar{,/**}/*.*'));
    assert(pm.isMatch('a/b/bar/baz.qux', 'a/b{,/**}/bar{,/**}/*.*'));
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
    assert(!pm.isMatch('a  ', '@(!(a) \\{1,2\\})*', { unescapeRegex: true }));
    assert(!pm.isMatch('a ', '@(!(a) \\{1,2\\})*', { unescapeRegex: true }));
    assert(!pm.isMatch('a', '@(!(a) \\{1,2\\})*', { unescapeRegex: true }));
    assert(!pm.isMatch('aa', '@(!(a) \\{1,2\\})*', { unescapeRegex: true }));
    assert(!pm.isMatch('aaa', '@(!(a) \\{1,2\\})*', { unescapeRegex: true }));
    assert(!pm.isMatch('b', '@(!(a) \\{1,2\\})*', { unescapeRegex: true }));
    assert(!pm.isMatch('bb', '@(!(a) \\{1,2\\})*', { unescapeRegex: true }));
    assert(!pm.isMatch('bbb', '@(!(a) \\{1,2\\})*', { unescapeRegex: true }));
    assert(pm.isMatch(' a ', '@(!(a) \\{1,2\\})*', { unescapeRegex: true }));
    assert(pm.isMatch('b  ', '@(!(a) \\{1,2\\})*', { unescapeRegex: true }));
    assert(pm.isMatch('b ', '@(!(a) \\{1,2\\})*', { unescapeRegex: true }));

    assert(pm.isMatch('a   ', '@(!(a \\{1,2\\}))*', { unescapeRegex: true }));
    assert(pm.isMatch('a   b', '@(!(a \\{1,2\\}))*', { unescapeRegex: true }));
    assert(pm.isMatch('a  b', '@(!(a \\{1,2\\}))*', { unescapeRegex: true }));
    assert(!pm.isMatch('a  ', '@(!(a \\{1,2\\}))*', { unescapeRegex: true }));
    assert(!pm.isMatch('a ', '@(!(a \\{1,2\\}))*', { unescapeRegex: true }));
    assert(pm.isMatch('a', '@(!(a \\{1,2\\}))*', { unescapeRegex: true }));
    assert(pm.isMatch('aa', '@(!(a \\{1,2\\}))*', { unescapeRegex: true }));
    assert(pm.isMatch('b', '@(!(a \\{1,2\\}))*', { unescapeRegex: true }));
    assert(pm.isMatch('bb', '@(!(a \\{1,2\\}))*', { unescapeRegex: true }));
    assert(pm.isMatch(' a ', '@(!(a \\{1,2\\}))*', { unescapeRegex: true }));
    assert(pm.isMatch('b  ', '@(!(a \\{1,2\\}))*', { unescapeRegex: true }));
    assert(pm.isMatch('b ', '@(!(a \\{1,2\\}))*', { unescapeRegex: true }));
  });
});
