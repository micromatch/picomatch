'use strict';

process.env.PICOMATCH_NO_CACHE = 'true';

require('mocha');
const assert = require('assert');
const fill = require('fill-range');
const match = require('./support/match');
const { isMatch, makeRe } = require('..');

describe('braces', () => {
  it('should not match with brace patterns when disabled', () => {
    assert.deepEqual(match(['a', 'b', 'c'], '{a,b,c,d}'), ['a', 'b', 'c']);
    assert.deepEqual(match(['a', 'b', 'c'], '{a,b,c,d}', { nobrace: true }), []);
    assert.deepEqual(match(['1', '2', '3'], '{1..2}', { nobrace: true }), []);
    assert(!isMatch('a/a', 'a/{a,b}', { nobrace: true }));
    assert(!isMatch('a/b', 'a/{a,b}', { nobrace: true }));
    assert(!isMatch('a/c', 'a/{a,b}', { nobrace: true }));
    assert(!isMatch('b/b', 'a/{a,b}', { nobrace: true }));
    assert(!isMatch('b/b', 'a/{a,b,c}', { nobrace: true }));
    assert(!isMatch('a/c', 'a/{a,b,c}', { nobrace: true }));
    assert(!isMatch('a/a', 'a/{a..c}', { nobrace: true }));
    assert(!isMatch('a/b', 'a/{a..c}', { nobrace: true }));
    assert(!isMatch('a/c', 'a/{a..c}', { nobrace: true }));
  });

  it('should match literal braces when escaped', () => {
    assert(isMatch('a {1,2}', 'a \\{1,2\\}'));
    assert(isMatch('a {a..b}', 'a \\{a..b\\}'));
  });

  it('should match using brace patterns', () => {
    assert(!isMatch('a/c', 'a/{a,b}'));
    assert(!isMatch('b/b', 'a/{a,b,c}'));
    assert(!isMatch('b/b', 'a/{a,b}'));
    assert(isMatch('a/a', 'a/{a,b}'));
    assert(isMatch('a/b', 'a/{a,b}'));
    assert(isMatch('a/c', 'a/{a,b,c}'));
  });

  it('should support brace ranges', () => {
    assert(isMatch('a/a', 'a/{a..c}'));
    assert(isMatch('a/b', 'a/{a..c}'));
    assert(isMatch('a/c', 'a/{a..c}'));
  });

  it('should support Kleene stars', () => {
    assert(isMatch('ab', '{ab,c}*'));
    assert(isMatch('abab', '{ab,c}*'));
    assert(isMatch('abc', '{ab,c}*'));
    assert(isMatch('c', '{ab,c}*'));
    assert(isMatch('cab', '{ab,c}*'));
    assert(isMatch('cc', '{ab,c}*'));
    assert(isMatch('ababab', '{ab,c}*'));
    assert(isMatch('ababc', '{ab,c}*'));
    assert(isMatch('abcab', '{ab,c}*'));
    assert(isMatch('abcc', '{ab,c}*'));
    assert(isMatch('cabab', '{ab,c}*'));
    assert(isMatch('cabc', '{ab,c}*'));
    assert(isMatch('ccab', '{ab,c}*'));
    assert(isMatch('ccc', '{ab,c}*'));
  });

  it('should not convert braces inside brackets', () => {
    assert(isMatch('foo{}baz', 'foo[{a,b}]+baz'));
    assert(isMatch('{a}{b}{c}', '[abc{}]+'));
  });

  it('should support braces containing slashes', () => {
    assert(!isMatch('a', '{/,}a/**', { strictSlashes: true }));
    assert(isMatch('a', '{/,}a/**'));
    assert(isMatch('aa.txt', 'a{a,b/}*.txt'));
    assert(isMatch('ab/.txt', 'a{a,b/}*.txt'));
    assert(isMatch('ab/a.txt', 'a{a,b/}*.txt'));
    assert(isMatch('a/', 'a/**{/,}'));
    assert(isMatch('a/a', 'a/**{/,}'));
    assert(isMatch('a/a/', 'a/**{/,}'));
  });

  it('should support braces with empty elements', () => {
    assert(!isMatch('abc.txt', 'a{,b}.txt'));
    assert(!isMatch('abc.txt', 'a{a,b,}.txt'));
    assert(!isMatch('abc.txt', 'a{b,}.txt'));
    assert(isMatch('a.txt', 'a{,b}.txt'));
    assert(isMatch('a.txt', 'a{b,}.txt'));
    assert(isMatch('aa.txt', 'a{a,b,}.txt'));
    assert(isMatch('aa.txt', 'a{a,b,}.txt'));
    assert(isMatch('ab.txt', 'a{,b}.txt'));
    assert(isMatch('ab.txt', 'a{b,}.txt'));
  });

  it('should support braces with slashes and empty elements', () => {
    assert(isMatch('a.txt', 'a{,/}*.txt'));
    assert(isMatch('ab.txt', 'a{,/}*.txt'));
    assert(isMatch('a/b.txt', 'a{,/}*.txt'));
    assert(isMatch('a/ab.txt', 'a{,/}*.txt'));
  });

  it('should support braces with stars', () => {
    assert(isMatch('a.txt', 'a{,.*{foo,db},\\(bar\\)}.txt'));
    assert(!isMatch('adb.txt', 'a{,.*{foo,db},\\(bar\\)}.txt'));
    assert(isMatch('a.db.txt', 'a{,.*{foo,db},\\(bar\\)}.txt'));

    assert(isMatch('a.txt', 'a{,*.{foo,db},\\(bar\\)}.txt'));
    assert(!isMatch('adb.txt', 'a{,*.{foo,db},\\(bar\\)}.txt'));
    assert(isMatch('a.db.txt', 'a{,*.{foo,db},\\(bar\\)}.txt'));

    assert(isMatch('a', 'a{,.*{foo,db},\\(bar\\)}'));
    assert(!isMatch('adb', 'a{,.*{foo,db},\\(bar\\)}'));
    assert(isMatch('a.db', 'a{,.*{foo,db},\\(bar\\)}'));

    assert(isMatch('a', 'a{,*.{foo,db},\\(bar\\)}'));
    assert(!isMatch('adb', 'a{,*.{foo,db},\\(bar\\)}'));
    assert(isMatch('a.db', 'a{,*.{foo,db},\\(bar\\)}'));

    assert(!isMatch('a', '{,.*{foo,db},\\(bar\\)}'));
    assert(!isMatch('adb', '{,.*{foo,db},\\(bar\\)}'));
    assert(!isMatch('a.db', '{,.*{foo,db},\\(bar\\)}'));
    assert(isMatch('.db', '{,.*{foo,db},\\(bar\\)}'));

    assert(!isMatch('a', '{,*.{foo,db},\\(bar\\)}'));
    assert(isMatch('a', '{*,*.{foo,db},\\(bar\\)}'));
    assert(!isMatch('adb', '{,*.{foo,db},\\(bar\\)}'));
    assert(isMatch('a.db', '{,*.{foo,db},\\(bar\\)}'));
  });

  it('should support braces in patterns with globstars', () => {
    assert(!isMatch('a/b/c/xyz.md', 'a/b/**/c{d,e}/**/xyz.md'));
    assert(!isMatch('a/b/d/xyz.md', 'a/b/**/c{d,e}/**/xyz.md'));
    assert(isMatch('a/b/cd/xyz.md', 'a/b/**/c{d,e}/**/xyz.md'));
    assert(isMatch('a/b/c/xyz.md', 'a/b/**/{c,d,e}/**/xyz.md'));
    assert(isMatch('a/b/d/xyz.md', 'a/b/**/{c,d,e}/**/xyz.md'));
  });

  it('should support braces with globstars, slashes and empty elements', () => {
    assert(isMatch('a.txt', 'a{,/**/}*.txt'));
    assert(isMatch('a/b.txt', 'a{,/**/,/}*.txt'));
    assert(isMatch('a/x/y.txt', 'a{,/**/}*.txt'));
    assert(!isMatch('a/x/y/z', 'a{,/**/}*.txt'));
  });

  it('should support braces with globstars and empty elements', () => {
    assert(isMatch('a/b/foo/bar/baz.qux', 'a/b{,/**}/bar{,/**}/*.*'));
    assert(isMatch('a/b/bar/baz.qux', 'a/b{,/**}/bar{,/**}/*.*'));
  });

  it('should support Kleene plus', () => {
    assert(isMatch('ab', '{ab,c}+'));
    assert(isMatch('abab', '{ab,c}+'));
    assert(isMatch('abc', '{ab,c}+'));
    assert(isMatch('c', '{ab,c}+'));
    assert(isMatch('cab', '{ab,c}+'));
    assert(isMatch('cc', '{ab,c}+'));
    assert(isMatch('ababab', '{ab,c}+'));
    assert(isMatch('ababc', '{ab,c}+'));
    assert(isMatch('abcab', '{ab,c}+'));
    assert(isMatch('abcc', '{ab,c}+'));
    assert(isMatch('cabab', '{ab,c}+'));
    assert(isMatch('cabc', '{ab,c}+'));
    assert(isMatch('ccab', '{ab,c}+'));
    assert(isMatch('ccc', '{ab,c}+'));
    assert(isMatch('ccc', '{a,b,c}+'));

    assert(isMatch('a', '{a,b,c}+'));
    assert(isMatch('b', '{a,b,c}+'));
    assert(isMatch('c', '{a,b,c}+'));
    assert(isMatch('aa', '{a,b,c}+'));
    assert(isMatch('ab', '{a,b,c}+'));
    assert(isMatch('ac', '{a,b,c}+'));
    assert(isMatch('ba', '{a,b,c}+'));
    assert(isMatch('bb', '{a,b,c}+'));
    assert(isMatch('bc', '{a,b,c}+'));
    assert(isMatch('ca', '{a,b,c}+'));
    assert(isMatch('cb', '{a,b,c}+'));
    assert(isMatch('cc', '{a,b,c}+'));
    assert(isMatch('aaa', '{a,b,c}+'));
    assert(isMatch('aab', '{a,b,c}+'));
    assert(isMatch('abc', '{a,b,c}+'));
  });

  it('should support braces', () => {
    assert(isMatch('a', '{a,b,c}'));
    assert(isMatch('b', '{a,b,c}'));
    assert(isMatch('c', '{a,b,c}'));
    assert(!isMatch('aa', '{a,b,c}'));
    assert(!isMatch('bb', '{a,b,c}'));
    assert(!isMatch('cc', '{a,b,c}'));
  });

  it('should match special chars and expand ranges in parentheses', () => {
    const expandRange = (a, b) => `(${fill(a, b, { toRegex: true })})`;

    assert(!isMatch('foo/bar - 1', '*/* {4..10}', { expandRange }));
    assert(!isMatch('foo/bar - copy (1)', '*/* - * \\({4..10}\\)', { expandRange }));
    assert(!isMatch('foo/bar (1)', '*/* \\({4..10}\\)', { expandRange }));
    assert(isMatch('foo/bar (4)', '*/* \\({4..10}\\)', { expandRange }));
    assert(isMatch('foo/bar (7)', '*/* \\({4..10}\\)', { expandRange }));
    assert(!isMatch('foo/bar (42)', '*/* \\({4..10}\\)', { expandRange }));
    assert(isMatch('foo/bar (42)', '*/* \\({4..43}\\)', { expandRange }));
    assert(isMatch('foo/bar - copy [1]', '*/* \\[{0..5}\\]', { expandRange }));
    assert(isMatch('foo/bar - foo + bar - copy [1]', '*/* \\[{0..5}\\]', { expandRange }));
    assert(!isMatch('foo/bar - 1', '*/* \\({4..10}\\)', { expandRange }));
    assert(!isMatch('foo/bar - copy (1)', '*/* \\({4..10}\\)', { expandRange }));
    assert(!isMatch('foo/bar (1)', '*/* \\({4..10}\\)', { expandRange }));
    assert(isMatch('foo/bar (4)', '*/* \\({4..10}\\)', { expandRange }));
    assert(isMatch('foo/bar (7)', '*/* \\({4..10}\\)', { expandRange }));
    assert(!isMatch('foo/bar (42)', '*/* \\({4..10}\\)', { expandRange }));
    assert(!isMatch('foo/bar - copy [1]', '*/* \\({4..10}\\)', { expandRange }));
    assert(!isMatch('foo/bar - foo + bar - copy [1]', '*/* \\({4..10}\\)', { expandRange }));
  });
});
