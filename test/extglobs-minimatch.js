'use strict';

const assert = require('assert');
const { isMatch } = require('..');

/**
 * Some of tests were converted from bash 4.3, 4.4, and minimatch unit tests.
 */

describe('extglobs (minimatch)', () => {
  it('should not match empty string with "*(0|1|3|5|7|9)"', () => {
    assert(!isMatch('', '*(0|1|3|5|7|9)', { windows: true }));
  });

  it('"*(a|b[)" should not match "*(a|b\\[)"', () => {
    assert(!isMatch('*(a|b[)', '*(a|b\\[)', { windows: true }));
  });

  it('"*(a|b[)" should match "\\*\\(a\\|b\\[\\)"', () => {
    assert(isMatch('*(a|b[)', '\\*\\(a\\|b\\[\\)', { windows: true }));
  });

  it('"***" should match "\\*\\*\\*"', () => {
    assert(isMatch('***', '\\*\\*\\*', { windows: true }));
  });

  it('"-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1" should not match "-*-*-*-*-*-*-12-*-*-*-m-*-*-*"', () => {
    assert(!isMatch('-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*', { windows: true }));
  });

  it('"-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1" should match "-*-*-*-*-*-*-12-*-*-*-m-*-*-*"', () => {
    assert(isMatch('-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*', { windows: true }));
  });

  it('"-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1" should not match "-*-*-*-*-*-*-12-*-*-*-m-*-*-*"', () => {
    assert(!isMatch('-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*', { windows: true }));
  });

  it('"/dev/udp/129.22.8.102/45" should match "/dev\\/@(tcp|udp)\\/*\\/*"', () => {
    assert(isMatch('/dev/udp/129.22.8.102/45', '/dev\\/@(tcp|udp)\\/*\\/*', { windows: true }));
  });

  it('"/x/y/z" should match "/x/y/z"', () => {
    assert(isMatch('/x/y/z', '/x/y/z', { windows: true }));
  });

  it('"0377" should match "+([0-7])"', () => {
    assert(isMatch('0377', '+([0-7])', { windows: true }));
  });

  it('"07" should match "+([0-7])"', () => {
    assert(isMatch('07', '+([0-7])', { windows: true }));
  });

  it('"09" should not match "+([0-7])"', () => {
    assert(!isMatch('09', '+([0-7])', { windows: true }));
  });

  it('"1" should match "0|[1-9]*([0-9])"', () => {
    assert(isMatch('1', '0|[1-9]*([0-9])', { windows: true }));
  });

  it('"12" should match "0|[1-9]*([0-9])"', () => {
    assert(isMatch('12', '0|[1-9]*([0-9])', { windows: true }));
  });

  it('"123abc" should not match "(a+|b)*"', () => {
    assert(!isMatch('123abc', '(a+|b)*', { windows: true }));
  });

  it('"123abc" should not match "(a+|b)+"', () => {
    assert(!isMatch('123abc', '(a+|b)+', { windows: true }));
  });

  it('"123abc" should match "*?(a)bc"', () => {
    assert(isMatch('123abc', '*?(a)bc', { windows: true }));
  });

  it('"123abc" should not match "a(b*(foo|bar))d"', () => {
    assert(!isMatch('123abc', 'a(b*(foo|bar))d', { windows: true }));
  });

  it('"123abc" should not match "ab*(e|f)"', () => {
    assert(!isMatch('123abc', 'ab*(e|f)', { windows: true }));
  });

  it('"123abc" should not match "ab**"', () => {
    assert(!isMatch('123abc', 'ab**', { windows: true }));
  });

  it('"123abc" should not match "ab**(e|f)"', () => {
    assert(!isMatch('123abc', 'ab**(e|f)', { windows: true }));
  });

  it('"123abc" should not match "ab**(e|f)g"', () => {
    assert(!isMatch('123abc', 'ab**(e|f)g', { windows: true }));
  });

  it('"123abc" should not match "ab***ef"', () => {
    assert(!isMatch('123abc', 'ab***ef', { windows: true }));
  });

  it('"123abc" should not match "ab*+(e|f)"', () => {
    assert(!isMatch('123abc', 'ab*+(e|f)', { windows: true }));
  });

  it('"123abc" should not match "ab*d+(e|f)"', () => {
    assert(!isMatch('123abc', 'ab*d+(e|f)', { windows: true }));
  });

  it('"123abc" should not match "ab?*(e|f)"', () => {
    assert(!isMatch('123abc', 'ab?*(e|f)', { windows: true }));
  });

  it('"12abc" should not match "0|[1-9]*([0-9])"', () => {
    assert(!isMatch('12abc', '0|[1-9]*([0-9])', { windows: true }));
  });

  it('"137577991" should match "*(0|1|3|5|7|9)"', () => {
    assert(isMatch('137577991', '*(0|1|3|5|7|9)', { windows: true }));
  });

  it('"2468" should not match "*(0|1|3|5|7|9)"', () => {
    assert(!isMatch('2468', '*(0|1|3|5|7|9)', { windows: true }));
  });

  it('"?a?b" should match "\\??\\?b"', () => {
    assert(isMatch('?a?b', '\\??\\?b', { windows: true }));
  });

  it('"\\a\\b\\c" should not match "abc"', () => {
    assert(!isMatch('\\a\\b\\c', 'abc', { windows: true }));
  });

  it('"a" should match "!(*.a|*.b|*.c)"', () => {
    assert(isMatch('a', '!(*.a|*.b|*.c)', { windows: true }));
  });

  it('"a" should not match "!(a)"', () => {
    assert(!isMatch('a', '!(a)', { windows: true }));
  });

  it('"a" should not match "!(a)*"', () => {
    assert(!isMatch('a', '!(a)*', { windows: true }));
  });

  it('"a" should match "(a)"', () => {
    assert(isMatch('a', '(a)', { windows: true }));
  });

  it('"a" should not match "(b)"', () => {
    assert(!isMatch('a', '(b)', { windows: true }));
  });

  it('"a" should match "*(a)"', () => {
    assert(isMatch('a', '*(a)', { windows: true }));
  });

  it('"a" should match "+(a)"', () => {
    assert(isMatch('a', '+(a)', { windows: true }));
  });

  it('"a" should match "?"', () => {
    assert(isMatch('a', '?', { windows: true }));
  });

  it('"a" should match "?(a|b)"', () => {
    assert(isMatch('a', '?(a|b)', { windows: true }));
  });

  it('"a" should not match "??"', () => {
    assert(!isMatch('a', '??', { windows: true }));
  });

  it('"a" should match "a!(b)*"', () => {
    assert(isMatch('a', 'a!(b)*', { windows: true }));
  });

  it('"a" should match "a?(a|b)"', () => {
    assert(isMatch('a', 'a?(a|b)', { windows: true }));
  });

  it('"a" should match "a?(x)"', () => {
    assert(isMatch('a', 'a?(x)', { windows: true }));
  });

  it('"a" should not match "a??b"', () => {
    assert(!isMatch('a', 'a??b', { windows: true }));
  });

  it('"a" should not match "b?(a|b)"', () => {
    assert(!isMatch('a', 'b?(a|b)', { windows: true }));
  });

  it('"a((((b" should match "a(*b"', () => {
    assert(isMatch('a((((b', 'a(*b', { windows: true }));
  });

  it('"a((((b" should not match "a(b"', () => {
    assert(!isMatch('a((((b', 'a(b', { windows: true }));
  });

  it('"a((((b" should not match "a\\(b"', () => {
    assert(!isMatch('a((((b', 'a\\(b', { windows: true }));
  });

  it('"a((b" should match "a(*b"', () => {
    assert(isMatch('a((b', 'a(*b', { windows: true }));
  });

  it('"a((b" should not match "a(b"', () => {
    assert(!isMatch('a((b', 'a(b', { windows: true }));
  });

  it('"a((b" should not match "a\\(b"', () => {
    assert(!isMatch('a((b', 'a\\(b', { windows: true }));
  });

  it('"a(b" should match "a(*b"', () => {
    assert(isMatch('a(b', 'a(*b', { windows: true }));
  });

  it('"a(b" should match "a(b"', () => {
    assert(isMatch('a(b', 'a(b', { windows: true }));
  });

  it('"a(b" should match "a\\(b"', () => {
    assert(isMatch('a(b', 'a\\(b', { windows: true }));
  });

  it('"a." should match "!(*.a|*.b|*.c)"', () => {
    assert(isMatch('a.', '!(*.a|*.b|*.c)', { windows: true }));
  });

  it('"a." should match "*!(.a|.b|.c)"', () => {
    assert(isMatch('a.', '*!(.a|.b|.c)', { windows: true }));
  });

  it('"a." should match "*.!(a)"', () => {
    assert(isMatch('a.', '*.!(a)', { windows: true }));
  });

  it('"a." should match "*.!(a|b|c)"', () => {
    assert(isMatch('a.', '*.!(a|b|c)', { windows: true }));
  });

  it('"a." should not match "*.(a|b|@(ab|a*@(b))*(c)d)"', () => {
    assert(!isMatch('a.', '*.(a|b|@(ab|a*@(b))*(c)d)', { windows: true }));
  });

  it('"a." should not match "*.+(b|d)"', () => {
    assert(!isMatch('a.', '*.+(b|d)', { windows: true }));
  });

  it('"a.a" should not match "!(*.[a-b]*)"', () => {
    assert(!isMatch('a.a', '!(*.[a-b]*)', { windows: true }));
  });

  it('"a.a" should not match "!(*.a|*.b|*.c)"', () => {
    assert(!isMatch('a.a', '!(*.a|*.b|*.c)', { windows: true }));
  });

  it('"a.a" should not match "!(*[a-b].[a-b]*)"', () => {
    assert(!isMatch('a.a', '!(*[a-b].[a-b]*)', { windows: true }));
  });

  it('"a.a" should not match "!*.(a|b)"', () => {
    assert(!isMatch('a.a', '!*.(a|b)', { windows: true }));
  });

  it('"a.a" should not match "!*.(a|b)*"', () => {
    assert(!isMatch('a.a', '!*.(a|b)*', { windows: true }));
  });

  it('"a.a" should match "(a|d).(a|b)*"', () => {
    assert(isMatch('a.a', '(a|d).(a|b)*', { windows: true }));
  });

  it('"a.a" should match "(b|a).(a)"', () => {
    assert(isMatch('a.a', '(b|a).(a)', { windows: true }));
  });

  it('"a.a" should match "*!(.a|.b|.c)"', () => {
    assert(isMatch('a.a', '*!(.a|.b|.c)', { windows: true }));
  });

  it('"a.a" should not match "*.!(a)"', () => {
    assert(!isMatch('a.a', '*.!(a)', { windows: true }));
  });

  it('"a.a" should not match "*.!(a|b|c)"', () => {
    assert(!isMatch('a.a', '*.!(a|b|c)', { windows: true }));
  });

  it('"a.a" should match "*.(a|b|@(ab|a*@(b))*(c)d)"', () => {
    assert(isMatch('a.a', '*.(a|b|@(ab|a*@(b))*(c)d)', { windows: true }));
  });

  it('"a.a" should not match "*.+(b|d)"', () => {
    assert(!isMatch('a.a', '*.+(b|d)', { windows: true }));
  });

  it('"a.a" should match "@(b|a).@(a)"', () => {
    assert(isMatch('a.a', '@(b|a).@(a)', { windows: true }));
  });

  it('"a.a.a" should not match "!(*.[a-b]*)"', () => {
    assert(!isMatch('a.a.a', '!(*.[a-b]*)', { windows: true }));
  });

  it('"a.a.a" should not match "!(*[a-b].[a-b]*)"', () => {
    assert(!isMatch('a.a.a', '!(*[a-b].[a-b]*)', { windows: true }));
  });

  it('"a.a.a" should not match "!*.(a|b)"', () => {
    assert(!isMatch('a.a.a', '!*.(a|b)', { windows: true }));
  });

  it('"a.a.a" should not match "!*.(a|b)*"', () => {
    assert(!isMatch('a.a.a', '!*.(a|b)*', { windows: true }));
  });

  it('"a.a.a" should match "*.!(a)"', () => {
    assert(isMatch('a.a.a', '*.!(a)', { windows: true }));
  });

  it('"a.a.a" should not match "*.+(b|d)"', () => {
    assert(!isMatch('a.a.a', '*.+(b|d)', { windows: true }));
  });

  it('"a.aa.a" should not match "(b|a).(a)"', () => {
    assert(!isMatch('a.aa.a', '(b|a).(a)', { windows: true }));
  });

  it('"a.aa.a" should not match "@(b|a).@(a)"', () => {
    assert(!isMatch('a.aa.a', '@(b|a).@(a)', { windows: true }));
  });

  it('"a.abcd" should match "!(*.a|*.b|*.c)"', () => {
    assert(isMatch('a.abcd', '!(*.a|*.b|*.c)', { windows: true }));
  });

  it('"a.abcd" should not match "!(*.a|*.b|*.c)*"', () => {
    assert(!isMatch('a.abcd', '!(*.a|*.b|*.c)*', { windows: true }));
  });

  it('"a.abcd" should match "*!(*.a|*.b|*.c)*"', () => {
    assert(isMatch('a.abcd', '*!(*.a|*.b|*.c)*', { windows: true }));
  });

  it('"a.abcd" should match "*!(.a|.b|.c)"', () => {
    assert(isMatch('a.abcd', '*!(.a|.b|.c)', { windows: true }));
  });

  it('"a.abcd" should match "*.!(a|b|c)"', () => {
    assert(isMatch('a.abcd', '*.!(a|b|c)', { windows: true }));
  });

  it('"a.abcd" should not match "*.!(a|b|c)*"', () => {
    assert(!isMatch('a.abcd', '*.!(a|b|c)*', { windows: true }));
  });

  it('"a.abcd" should match "*.(a|b|@(ab|a*@(b))*(c)d)"', () => {
    assert(isMatch('a.abcd', '*.(a|b|@(ab|a*@(b))*(c)d)', { windows: true }));
  });

  it('"a.b" should not match "!(*.*)"', () => {
    assert(!isMatch('a.b', '!(*.*)', { windows: true }));
  });

  it('"a.b" should not match "!(*.[a-b]*)"', () => {
    assert(!isMatch('a.b', '!(*.[a-b]*)', { windows: true }));
  });

  it('"a.b" should not match "!(*.a|*.b|*.c)"', () => {
    assert(!isMatch('a.b', '!(*.a|*.b|*.c)', { windows: true }));
  });

  it('"a.b" should not match "!(*[a-b].[a-b]*)"', () => {
    assert(!isMatch('a.b', '!(*[a-b].[a-b]*)', { windows: true }));
  });

  it('"a.b" should not match "!*.(a|b)"', () => {
    assert(!isMatch('a.b', '!*.(a|b)', { windows: true }));
  });

  it('"a.b" should not match "!*.(a|b)*"', () => {
    assert(!isMatch('a.b', '!*.(a|b)*', { windows: true }));
  });

  it('"a.b" should match "(a|d).(a|b)*"', () => {
    assert(isMatch('a.b', '(a|d).(a|b)*', { windows: true }));
  });

  it('"a.b" should match "*!(.a|.b|.c)"', () => {
    assert(isMatch('a.b', '*!(.a|.b|.c)', { windows: true }));
  });

  it('"a.b" should match "*.!(a)"', () => {
    assert(isMatch('a.b', '*.!(a)', { windows: true }));
  });

  it('"a.b" should not match "*.!(a|b|c)"', () => {
    assert(!isMatch('a.b', '*.!(a|b|c)', { windows: true }));
  });

  it('"a.b" should match "*.(a|b|@(ab|a*@(b))*(c)d)"', () => {
    assert(isMatch('a.b', '*.(a|b|@(ab|a*@(b))*(c)d)', { windows: true }));
  });

  it('"a.b" should match "*.+(b|d)"', () => {
    assert(isMatch('a.b', '*.+(b|d)', { windows: true }));
  });

  it('"a.bb" should not match "!(*.[a-b]*)"', () => {
    assert(!isMatch('a.bb', '!(*.[a-b]*)', { windows: true }));
  });

  it('"a.bb" should not match "!(*[a-b].[a-b]*)"', () => {
    assert(!isMatch('a.bb', '!(*[a-b].[a-b]*)', { windows: true }));
  });

  it('"a.bb" should match "!*.(a|b)"', () => {
    assert(isMatch('a.bb', '!*.(a|b)', { windows: true }));
  });

  it('"a.bb" should not match "!*.(a|b)*"', () => {
    assert(!isMatch('a.bb', '!*.(a|b)*', { windows: true }));
  });

  it('"a.bb" should not match "!*.*(a|b)"', () => {
    assert(!isMatch('a.bb', '!*.*(a|b)', { windows: true }));
  });

  it('"a.bb" should match "(a|d).(a|b)*"', () => {
    assert(isMatch('a.bb', '(a|d).(a|b)*', { windows: true }));
  });

  it('"a.bb" should not match "(b|a).(a)"', () => {
    assert(!isMatch('a.bb', '(b|a).(a)', { windows: true }));
  });

  it('"a.bb" should match "*.+(b|d)"', () => {
    assert(isMatch('a.bb', '*.+(b|d)', { windows: true }));
  });

  it('"a.bb" should not match "@(b|a).@(a)"', () => {
    assert(!isMatch('a.bb', '@(b|a).@(a)', { windows: true }));
  });

  it('"a.c" should not match "!(*.a|*.b|*.c)"', () => {
    assert(!isMatch('a.c', '!(*.a|*.b|*.c)', { windows: true }));
  });

  it('"a.c" should match "*!(.a|.b|.c)"', () => {
    assert(isMatch('a.c', '*!(.a|.b|.c)', { windows: true }));
  });

  it('"a.c" should not match "*.!(a|b|c)"', () => {
    assert(!isMatch('a.c', '*.!(a|b|c)', { windows: true }));
  });

  it('"a.c" should not match "*.(a|b|@(ab|a*@(b))*(c)d)"', () => {
    assert(!isMatch('a.c', '*.(a|b|@(ab|a*@(b))*(c)d)', { windows: true }));
  });

  it('"a.c.d" should match "!(*.a|*.b|*.c)"', () => {
    assert(isMatch('a.c.d', '!(*.a|*.b|*.c)', { windows: true }));
  });

  it('"a.c.d" should match "*!(.a|.b|.c)"', () => {
    assert(isMatch('a.c.d', '*!(.a|.b|.c)', { windows: true }));
  });

  it('"a.c.d" should match "*.!(a|b|c)"', () => {
    assert(isMatch('a.c.d', '*.!(a|b|c)', { windows: true }));
  });

  it('"a.c.d" should not match "*.(a|b|@(ab|a*@(b))*(c)d)"', () => {
    assert(!isMatch('a.c.d', '*.(a|b|@(ab|a*@(b))*(c)d)', { windows: true }));
  });

  it('"a.ccc" should match "!(*.[a-b]*)"', () => {
    assert(isMatch('a.ccc', '!(*.[a-b]*)', { windows: true }));
  });

  it('"a.ccc" should match "!(*[a-b].[a-b]*)"', () => {
    assert(isMatch('a.ccc', '!(*[a-b].[a-b]*)', { windows: true }));
  });

  it('"a.ccc" should match "!*.(a|b)"', () => {
    assert(isMatch('a.ccc', '!*.(a|b)', { windows: true }));
  });

  it('"a.ccc" should match "!*.(a|b)*"', () => {
    assert(isMatch('a.ccc', '!*.(a|b)*', { windows: true }));
  });

  it('"a.ccc" should not match "*.+(b|d)"', () => {
    assert(!isMatch('a.ccc', '*.+(b|d)', { windows: true }));
  });

  it('"a.js" should not match "!(*.js)"', () => {
    assert(!isMatch('a.js', '!(*.js)', { windows: true }));
  });

  it('"a.js" should match "*!(.js)"', () => {
    assert(isMatch('a.js', '*!(.js)', { windows: true }));
  });

  it('"a.js" should not match "*.!(js)"', () => {
    assert(!isMatch('a.js', '*.!(js)', { windows: true }));
  });

  it('"a.js" should not match "a.!(js)"', () => {
    assert(!isMatch('a.js', 'a.!(js)', { windows: true }));
  });

  it('"a.js" should not match "a.!(js)*"', () => {
    assert(!isMatch('a.js', 'a.!(js)*', { windows: true }));
  });

  it('"a.js.js" should not match "!(*.js)"', () => {
    assert(!isMatch('a.js.js', '!(*.js)', { windows: true }));
  });

  it('"a.js.js" should match "*!(.js)"', () => {
    assert(isMatch('a.js.js', '*!(.js)', { windows: true }));
  });

  it('"a.js.js" should match "*.!(js)"', () => {
    assert(isMatch('a.js.js', '*.!(js)', { windows: true }));
  });

  it('"a.js.js" should match "*.*(js).js"', () => {
    assert(isMatch('a.js.js', '*.*(js).js', { windows: true }));
  });

  it('"a.md" should match "!(*.js)"', () => {
    assert(isMatch('a.md', '!(*.js)', { windows: true }));
  });

  it('"a.md" should match "*!(.js)"', () => {
    assert(isMatch('a.md', '*!(.js)', { windows: true }));
  });

  it('"a.md" should match "*.!(js)"', () => {
    assert(isMatch('a.md', '*.!(js)', { windows: true }));
  });

  it('"a.md" should match "a.!(js)"', () => {
    assert(isMatch('a.md', 'a.!(js)', { windows: true }));
  });

  it('"a.md" should match "a.!(js)*"', () => {
    assert(isMatch('a.md', 'a.!(js)*', { windows: true }));
  });

  it('"a.md.js" should not match "*.*(js).js"', () => {
    assert(!isMatch('a.md.js', '*.*(js).js', { windows: true }));
  });

  it('"a.txt" should match "a.!(js)"', () => {
    assert(isMatch('a.txt', 'a.!(js)', { windows: true }));
  });

  it('"a.txt" should match "a.!(js)*"', () => {
    assert(isMatch('a.txt', 'a.!(js)*', { windows: true }));
  });

  it('"a/!(z)" should match "a/!(z)"', () => {
    assert(isMatch('a/!(z)', 'a/!(z)', { windows: true }));
  });

  it('"a/b" should match "a/!(z)"', () => {
    assert(isMatch('a/b', 'a/!(z)', { windows: true }));
  });

  it('"a/b/c.txt" should not match "*/b/!(*).txt"', () => {
    assert(!isMatch('a/b/c.txt', '*/b/!(*).txt', { windows: true }));
  });

  it('"a/b/c.txt" should not match "*/b/!(c).txt"', () => {
    assert(!isMatch('a/b/c.txt', '*/b/!(c).txt', { windows: true }));
  });

  it('"a/b/c.txt" should match "*/b/!(cc).txt"', () => {
    assert(isMatch('a/b/c.txt', '*/b/!(cc).txt', { windows: true }));
  });

  it('"a/b/cc.txt" should not match "*/b/!(*).txt"', () => {
    assert(!isMatch('a/b/cc.txt', '*/b/!(*).txt', { windows: true }));
  });

  it('"a/b/cc.txt" should not match "*/b/!(c).txt"', () => {
    assert(!isMatch('a/b/cc.txt', '*/b/!(c).txt', { windows: true }));
  });

  it('"a/b/cc.txt" should not match "*/b/!(cc).txt"', () => {
    assert(!isMatch('a/b/cc.txt', '*/b/!(cc).txt', { windows: true }));
  });

  it('"a/dir/foo.txt" should match "*/dir/**/!(bar).txt"', () => {
    assert(isMatch('a/dir/foo.txt', '*/dir/**/!(bar).txt', { windows: true }));
  });

  it('"a/z" should not match "a/!(z)"', () => {
    assert(!isMatch('a/z', 'a/!(z)', { windows: true }));
  });

  it('"a\\(b" should not match "a(*b"', () => {
    assert(!isMatch('a\\(b', 'a(*b', { windows: true }));
  });

  it('"a\\(b" should not match "a(b"', () => {
    assert(!isMatch('a\\(b', 'a(b', { windows: true }));
  });

  it('"a\\z" should match "a\\z"', () => {
    assert(isMatch('a\\\\z', 'a\\\\z', { windows: false }));
  });

  it('"a\\z" should match "a\\z"', () => {
    assert(isMatch('a\\\\z', 'a\\\\z', { windows: true }));
  });

  it('"a\\b" should match "a/b"', () => {
    assert(isMatch('a\\b', 'a/b', { windows: true }));
  });

  it('"a\\z" should match "a\\z"', () => {
    assert(isMatch('a\\z', 'a\\\\z', { windows: false }));
  });

  it('"a\\z" should not match "a\\z"', () => {
    assert(isMatch('a\\z', 'a\\z', { windows: true }));
  });

  it('"aa" should not match "!(a!(b))"', () => {
    assert(!isMatch('aa', '!(a!(b))', { windows: true }));
  });

  it('"aa" should match "!(a)"', () => {
    assert(isMatch('aa', '!(a)', { windows: true }));
  });

  it('"aa" should not match "!(a)*"', () => {
    assert(!isMatch('aa', '!(a)*', { windows: true }));
  });

  it('"aa" should not match "?"', () => {
    assert(!isMatch('aa', '?', { windows: true }));
  });

  it('"aa" should not match "@(a)b"', () => {
    assert(!isMatch('aa', '@(a)b', { windows: true }));
  });

  it('"aa" should match "a!(b)*"', () => {
    assert(isMatch('aa', 'a!(b)*', { windows: true }));
  });

  it('"aa" should not match "a??b"', () => {
    assert(!isMatch('aa', 'a??b', { windows: true }));
  });

  it('"aa.aa" should not match "(b|a).(a)"', () => {
    assert(!isMatch('aa.aa', '(b|a).(a)', { windows: true }));
  });

  it('"aa.aa" should not match "@(b|a).@(a)"', () => {
    assert(!isMatch('aa.aa', '@(b|a).@(a)', { windows: true }));
  });

  it('"aaa" should not match "!(a)*"', () => {
    assert(!isMatch('aaa', '!(a)*', { windows: true }));
  });

  it('"aaa" should match "a!(b)*"', () => {
    assert(isMatch('aaa', 'a!(b)*', { windows: true }));
  });

  it('"aaaaaaabababab" should match "*ab"', () => {
    assert(isMatch('aaaaaaabababab', '*ab', { windows: true }));
  });

  it('"aaac" should match "*(@(a))a@(c)"', () => {
    assert(isMatch('aaac', '*(@(a))a@(c)', { windows: true }));
  });

  it('"aaaz" should match "[a*(]*z"', () => {
    assert(isMatch('aaaz', '[a*(]*z', { windows: true }));
  });

  it('"aab" should not match "!(a)*"', () => {
    assert(!isMatch('aab', '!(a)*', { windows: true }));
  });

  it('"aab" should not match "?"', () => {
    assert(!isMatch('aab', '?', { windows: true }));
  });

  it('"aab" should not match "??"', () => {
    assert(!isMatch('aab', '??', { windows: true }));
  });

  it('"aab" should not match "@(c)b"', () => {
    assert(!isMatch('aab', '@(c)b', { windows: true }));
  });

  it('"aab" should match "a!(b)*"', () => {
    assert(isMatch('aab', 'a!(b)*', { windows: true }));
  });

  it('"aab" should not match "a??b"', () => {
    assert(!isMatch('aab', 'a??b', { windows: true }));
  });

  it('"aac" should match "*(@(a))a@(c)"', () => {
    assert(isMatch('aac', '*(@(a))a@(c)', { windows: true }));
  });

  it('"aac" should not match "*(@(a))b@(c)"', () => {
    assert(!isMatch('aac', '*(@(a))b@(c)', { windows: true }));
  });

  it('"aax" should not match "a!(a*|b)"', () => {
    assert(!isMatch('aax', 'a!(a*|b)', { windows: true }));
  });

  it('"aax" should match "a!(x*|b)"', () => {
    assert(isMatch('aax', 'a!(x*|b)', { windows: true }));
  });

  it('"aax" should match "a?(a*|b)"', () => {
    assert(isMatch('aax', 'a?(a*|b)', { windows: true }));
  });

  it('"aaz" should match "[a*(]*z"', () => {
    assert(isMatch('aaz', '[a*(]*z', { windows: true }));
  });

  it('"ab" should match "!(*.*)"', () => {
    assert(isMatch('ab', '!(*.*)', { windows: true }));
  });

  it('"ab" should match "!(a!(b))"', () => {
    assert(isMatch('ab', '!(a!(b))', { windows: true }));
  });

  it('"ab" should not match "!(a)*"', () => {
    assert(!isMatch('ab', '!(a)*', { windows: true }));
  });

  it('"ab" should match "(a+|b)*"', () => {
    assert(isMatch('ab', '(a+|b)*', { windows: true }));
  });

  it('"ab" should match "(a+|b)+"', () => {
    assert(isMatch('ab', '(a+|b)+', { windows: true }));
  });

  it('"ab" should not match "*?(a)bc"', () => {
    assert(!isMatch('ab', '*?(a)bc', { windows: true }));
  });

  it('"ab" should not match "a!(*(b|B))"', () => {
    assert(!isMatch('ab', 'a!(*(b|B))', { windows: true }));
  });

  it('"ab" should not match "a!(@(b|B))"', () => {
    assert(!isMatch('ab', 'a!(@(b|B))', { windows: true }));
  });

  it('"aB" should not match "a!(@(b|B))"', () => {
    assert(!isMatch('aB', 'a!(@(b|B))', { windows: true }));
  });

  it('"ab" should not match "a!(b)*"', () => {
    assert(!isMatch('ab', 'a!(b)*', { windows: true }));
  });

  it('"ab" should not match "a(*b"', () => {
    assert(!isMatch('ab', 'a(*b', { windows: true }));
  });

  it('"ab" should not match "a(b"', () => {
    assert(!isMatch('ab', 'a(b', { windows: true }));
  });

  it('"ab" should not match "a(b*(foo|bar))d"', () => {
    assert(!isMatch('ab', 'a(b*(foo|bar))d', { windows: true }));
  });

  it('"ab" should not match "a/b"', () => {
    assert(!isMatch('ab', 'a/b', { windows: true }));
  });

  it('"ab" should not match "a\\(b"', () => {
    assert(!isMatch('ab', 'a\\(b', { windows: true }));
  });

  it('"ab" should match "ab*(e|f)"', () => {
    assert(isMatch('ab', 'ab*(e|f)', { windows: true }));
  });

  it('"ab" should match "ab**"', () => {
    assert(isMatch('ab', 'ab**', { windows: true }));
  });

  it('"ab" should match "ab**(e|f)"', () => {
    assert(isMatch('ab', 'ab**(e|f)', { windows: true }));
  });

  it('"ab" should not match "ab**(e|f)g"', () => {
    assert(!isMatch('ab', 'ab**(e|f)g', { windows: true }));
  });

  it('"ab" should not match "ab***ef"', () => {
    assert(!isMatch('ab', 'ab***ef', { windows: true }));
  });

  it('"ab" should not match "ab*+(e|f)"', () => {
    assert(!isMatch('ab', 'ab*+(e|f)', { windows: true }));
  });

  it('"ab" should not match "ab*d+(e|f)"', () => {
    assert(!isMatch('ab', 'ab*d+(e|f)', { windows: true }));
  });

  it('"ab" should not match "ab?*(e|f)"', () => {
    assert(!isMatch('ab', 'ab?*(e|f)', { windows: true }));
  });

  it('"ab/cXd/efXg/hi" should match "**/*X*/**/*i"', () => {
    assert(isMatch('ab/cXd/efXg/hi', '**/*X*/**/*i', { windows: true }));
  });

  it('"ab/cXd/efXg/hi" should match "*/*X*/*/*i"', () => {
    assert(isMatch('ab/cXd/efXg/hi', '*/*X*/*/*i', { windows: true }));
  });

  it('"ab/cXd/efXg/hi" should not match "*X*i"', () => {
    assert(!isMatch('ab/cXd/efXg/hi', '*X*i', { windows: true }));
  });

  it('"ab/cXd/efXg/hi" should not match "*Xg*i"', () => {
    assert(!isMatch('ab/cXd/efXg/hi', '*Xg*i', { windows: true }));
  });

  it('"ab]" should match "a!(@(b|B))"', () => {
    assert(isMatch('ab]', 'a!(@(b|B))', { windows: true }));
  });

  it('"abab" should match "(a+|b)*"', () => {
    assert(isMatch('abab', '(a+|b)*', { windows: true }));
  });

  it('"abab" should match "(a+|b)+"', () => {
    assert(isMatch('abab', '(a+|b)+', { windows: true }));
  });

  it('"abab" should not match "*?(a)bc"', () => {
    assert(!isMatch('abab', '*?(a)bc', { windows: true }));
  });

  it('"abab" should not match "a(b*(foo|bar))d"', () => {
    assert(!isMatch('abab', 'a(b*(foo|bar))d', { windows: true }));
  });

  it('"abab" should not match "ab*(e|f)"', () => {
    assert(!isMatch('abab', 'ab*(e|f)', { windows: true }));
  });

  it('"abab" should match "ab**"', () => {
    assert(isMatch('abab', 'ab**', { windows: true }));
  });

  it('"abab" should match "ab**(e|f)"', () => {
    assert(isMatch('abab', 'ab**(e|f)', { windows: true }));
  });

  it('"abab" should not match "ab**(e|f)g"', () => {
    assert(!isMatch('abab', 'ab**(e|f)g', { windows: true }));
  });

  it('"abab" should not match "ab***ef"', () => {
    assert(!isMatch('abab', 'ab***ef', { windows: true }));
  });

  it('"abab" should not match "ab*+(e|f)"', () => {
    assert(!isMatch('abab', 'ab*+(e|f)', { windows: true }));
  });

  it('"abab" should not match "ab*d+(e|f)"', () => {
    assert(!isMatch('abab', 'ab*d+(e|f)', { windows: true }));
  });

  it('"abab" should not match "ab?*(e|f)"', () => {
    assert(!isMatch('abab', 'ab?*(e|f)', { windows: true }));
  });

  it('"abb" should match "!(*.*)"', () => {
    assert(isMatch('abb', '!(*.*)', { windows: true }));
  });

  it('"abb" should not match "!(a)*"', () => {
    assert(!isMatch('abb', '!(a)*', { windows: true }));
  });

  it('"abb" should not match "a!(b)*"', () => {
    assert(!isMatch('abb', 'a!(b)*', { windows: true }));
  });

  it('"abbcd" should match "@(ab|a*(b))*(c)d"', () => {
    assert(isMatch('abbcd', '@(ab|a*(b))*(c)d', { windows: true }));
  });

  it('"abc" should not match "\\a\\b\\c"', () => {
    assert(!isMatch('abc', '\\a\\b\\c', { windows: true }));
  });

  it('"aBc" should match "a!(@(b|B))"', () => {
    assert(isMatch('aBc', 'a!(@(b|B))', { windows: true }));
  });

  it('"abcd" should match "?@(a|b)*@(c)d"', () => {
    assert(isMatch('abcd', '?@(a|b)*@(c)d', { windows: true }));
  });

  it('"abcd" should match "@(ab|a*@(b))*(c)d"', () => {
    assert(isMatch('abcd', '@(ab|a*@(b))*(c)d', { windows: true }));
  });

  it('"abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt" should match "**/*a*b*g*n*t"', () => {
    assert(isMatch('abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt', '**/*a*b*g*n*t', { windows: true }));
  });

  it('"abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz" should not match "**/*a*b*g*n*t"', () => {
    assert(!isMatch('abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz', '**/*a*b*g*n*t', { windows: true }));
  });

  it('"abcdef" should match "(a+|b)*"', () => {
    assert(isMatch('abcdef', '(a+|b)*', { windows: true }));
  });

  it('"abcdef" should not match "(a+|b)+"', () => {
    assert(!isMatch('abcdef', '(a+|b)+', { windows: true }));
  });

  it('"abcdef" should not match "*?(a)bc"', () => {
    assert(!isMatch('abcdef', '*?(a)bc', { windows: true }));
  });

  it('"abcdef" should not match "a(b*(foo|bar))d"', () => {
    assert(!isMatch('abcdef', 'a(b*(foo|bar))d', { windows: true }));
  });

  it('"abcdef" should not match "ab*(e|f)"', () => {
    assert(!isMatch('abcdef', 'ab*(e|f)', { windows: true }));
  });

  it('"abcdef" should match "ab**"', () => {
    assert(isMatch('abcdef', 'ab**', { windows: true }));
  });

  it('"abcdef" should match "ab**(e|f)"', () => {
    assert(isMatch('abcdef', 'ab**(e|f)', { windows: true }));
  });

  it('"abcdef" should not match "ab**(e|f)g"', () => {
    assert(!isMatch('abcdef', 'ab**(e|f)g', { windows: true }));
  });

  it('"abcdef" should match "ab***ef"', () => {
    assert(isMatch('abcdef', 'ab***ef', { windows: true }));
  });

  it('"abcdef" should match "ab*+(e|f)"', () => {
    assert(isMatch('abcdef', 'ab*+(e|f)', { windows: true }));
  });

  it('"abcdef" should match "ab*d+(e|f)"', () => {
    assert(isMatch('abcdef', 'ab*d+(e|f)', { windows: true }));
  });

  it('"abcdef" should not match "ab?*(e|f)"', () => {
    assert(!isMatch('abcdef', 'ab?*(e|f)', { windows: true }));
  });

  it('"abcfef" should match "(a+|b)*"', () => {
    assert(isMatch('abcfef', '(a+|b)*', { windows: true }));
  });

  it('"abcfef" should not match "(a+|b)+"', () => {
    assert(!isMatch('abcfef', '(a+|b)+', { windows: true }));
  });

  it('"abcfef" should not match "*?(a)bc"', () => {
    assert(!isMatch('abcfef', '*?(a)bc', { windows: true }));
  });

  it('"abcfef" should not match "a(b*(foo|bar))d"', () => {
    assert(!isMatch('abcfef', 'a(b*(foo|bar))d', { windows: true }));
  });

  it('"abcfef" should not match "ab*(e|f)"', () => {
    assert(!isMatch('abcfef', 'ab*(e|f)', { windows: true }));
  });

  it('"abcfef" should match "ab**"', () => {
    assert(isMatch('abcfef', 'ab**', { windows: true }));
  });

  it('"abcfef" should match "ab**(e|f)"', () => {
    assert(isMatch('abcfef', 'ab**(e|f)', { windows: true }));
  });

  it('"abcfef" should not match "ab**(e|f)g"', () => {
    assert(!isMatch('abcfef', 'ab**(e|f)g', { windows: true }));
  });

  it('"abcfef" should match "ab***ef"', () => {
    assert(isMatch('abcfef', 'ab***ef', { windows: true }));
  });

  it('"abcfef" should match "ab*+(e|f)"', () => {
    assert(isMatch('abcfef', 'ab*+(e|f)', { windows: true }));
  });

  it('"abcfef" should not match "ab*d+(e|f)"', () => {
    assert(!isMatch('abcfef', 'ab*d+(e|f)', { windows: true }));
  });

  it('"abcfef" should match "ab?*(e|f)"', () => {
    assert(isMatch('abcfef', 'ab?*(e|f)', { windows: true }));
  });

  it('"abcfefg" should match "(a+|b)*"', () => {
    assert(isMatch('abcfefg', '(a+|b)*', { windows: true }));
  });

  it('"abcfefg" should not match "(a+|b)+"', () => {
    assert(!isMatch('abcfefg', '(a+|b)+', { windows: true }));
  });

  it('"abcfefg" should not match "*?(a)bc"', () => {
    assert(!isMatch('abcfefg', '*?(a)bc', { windows: true }));
  });

  it('"abcfefg" should not match "a(b*(foo|bar))d"', () => {
    assert(!isMatch('abcfefg', 'a(b*(foo|bar))d', { windows: true }));
  });

  it('"abcfefg" should not match "ab*(e|f)"', () => {
    assert(!isMatch('abcfefg', 'ab*(e|f)', { windows: true }));
  });

  it('"abcfefg" should match "ab**"', () => {
    assert(isMatch('abcfefg', 'ab**', { windows: true }));
  });

  it('"abcfefg" should match "ab**(e|f)"', () => {
    assert(isMatch('abcfefg', 'ab**(e|f)', { windows: true }));
  });

  it('"abcfefg" should match "ab**(e|f)g"', () => {
    assert(isMatch('abcfefg', 'ab**(e|f)g', { windows: true }));
  });

  it('"abcfefg" should not match "ab***ef"', () => {
    assert(!isMatch('abcfefg', 'ab***ef', { windows: true }));
  });

  it('"abcfefg" should not match "ab*+(e|f)"', () => {
    assert(!isMatch('abcfefg', 'ab*+(e|f)', { windows: true }));
  });

  it('"abcfefg" should not match "ab*d+(e|f)"', () => {
    assert(!isMatch('abcfefg', 'ab*d+(e|f)', { windows: true }));
  });

  it('"abcfefg" should not match "ab?*(e|f)"', () => {
    assert(!isMatch('abcfefg', 'ab?*(e|f)', { windows: true }));
  });

  it('"abcx" should match "!([[*])*"', () => {
    assert(isMatch('abcx', '!([[*])*', { windows: true }));
  });

  it('"abcx" should match "+(a|b\\[)*"', () => {
    assert(isMatch('abcx', '+(a|b\\[)*', { windows: true }));
  });

  it('"abcx" should not match "[a*(]*z"', () => {
    assert(!isMatch('abcx', '[a*(]*z', { windows: true }));
  });

  it('"abcXdefXghi" should match "*X*i"', () => {
    assert(isMatch('abcXdefXghi', '*X*i', { windows: true }));
  });

  it('"abcz" should match "!([[*])*"', () => {
    assert(isMatch('abcz', '!([[*])*', { windows: true }));
  });

  it('"abcz" should match "+(a|b\\[)*"', () => {
    assert(isMatch('abcz', '+(a|b\\[)*', { windows: true }));
  });

  it('"abcz" should match "[a*(]*z"', () => {
    assert(isMatch('abcz', '[a*(]*z', { windows: true }));
  });

  it('"abd" should match "(a+|b)*"', () => {
    assert(isMatch('abd', '(a+|b)*', { windows: true }));
  });

  it('"abd" should not match "(a+|b)+"', () => {
    assert(!isMatch('abd', '(a+|b)+', { windows: true }));
  });

  it('"abd" should not match "*?(a)bc"', () => {
    assert(!isMatch('abd', '*?(a)bc', { windows: true }));
  });

  it('"abd" should match "a!(*(b|B))"', () => {
    assert(isMatch('abd', 'a!(*(b|B))', { windows: true }));
  });

  it('"abd" should match "a!(@(b|B))"', () => {
    assert(isMatch('abd', 'a!(@(b|B))', { windows: true }));
  });

  it('"abd" should not match "a!(@(b|B))d"', () => {
    assert(!isMatch('abd', 'a!(@(b|B))d', { windows: true }));
  });

  it('"abd" should match "a(b*(foo|bar))d"', () => {
    assert(isMatch('abd', 'a(b*(foo|bar))d', { windows: true }));
  });

  it('"abd" should match "a+(b|c)d"', () => {
    assert(isMatch('abd', 'a+(b|c)d', { windows: true }));
  });

  it('"abd" should match "a[b*(foo|bar)]d"', () => {
    assert(isMatch('abd', 'a[b*(foo|bar)]d', { windows: true }));
  });

  it('"abd" should not match "ab*(e|f)"', () => {
    assert(!isMatch('abd', 'ab*(e|f)', { windows: true }));
  });

  it('"abd" should match "ab**"', () => {
    assert(isMatch('abd', 'ab**', { windows: true }));
  });

  it('"abd" should match "ab**(e|f)"', () => {
    assert(isMatch('abd', 'ab**(e|f)', { windows: true }));
  });

  it('"abd" should not match "ab**(e|f)g"', () => {
    assert(!isMatch('abd', 'ab**(e|f)g', { windows: true }));
  });

  it('"abd" should not match "ab***ef"', () => {
    assert(!isMatch('abd', 'ab***ef', { windows: true }));
  });

  it('"abd" should not match "ab*+(e|f)"', () => {
    assert(!isMatch('abd', 'ab*+(e|f)', { windows: true }));
  });

  it('"abd" should not match "ab*d+(e|f)"', () => {
    assert(!isMatch('abd', 'ab*d+(e|f)', { windows: true }));
  });

  it('"abd" should match "ab?*(e|f)"', () => {
    assert(isMatch('abd', 'ab?*(e|f)', { windows: true }));
  });

  it('"abef" should match "(a+|b)*"', () => {
    assert(isMatch('abef', '(a+|b)*', { windows: true }));
  });

  it('"abef" should not match "(a+|b)+"', () => {
    assert(!isMatch('abef', '(a+|b)+', { windows: true }));
  });

  it('"abef" should not match "*(a+|b)"', () => {
    assert(!isMatch('abef', '*(a+|b)', { windows: true }));
  });

  it('"abef" should not match "*?(a)bc"', () => {
    assert(!isMatch('abef', '*?(a)bc', { windows: true }));
  });

  it('"abef" should not match "a(b*(foo|bar))d"', () => {
    assert(!isMatch('abef', 'a(b*(foo|bar))d', { windows: true }));
  });

  it('"abef" should match "ab*(e|f)"', () => {
    assert(isMatch('abef', 'ab*(e|f)', { windows: true }));
  });

  it('"abef" should match "ab**"', () => {
    assert(isMatch('abef', 'ab**', { windows: true }));
  });

  it('"abef" should match "ab**(e|f)"', () => {
    assert(isMatch('abef', 'ab**(e|f)', { windows: true }));
  });

  it('"abef" should not match "ab**(e|f)g"', () => {
    assert(!isMatch('abef', 'ab**(e|f)g', { windows: true }));
  });

  it('"abef" should match "ab***ef"', () => {
    assert(isMatch('abef', 'ab***ef', { windows: true }));
  });

  it('"abef" should match "ab*+(e|f)"', () => {
    assert(isMatch('abef', 'ab*+(e|f)', { windows: true }));
  });

  it('"abef" should not match "ab*d+(e|f)"', () => {
    assert(!isMatch('abef', 'ab*d+(e|f)', { windows: true }));
  });

  it('"abef" should match "ab?*(e|f)"', () => {
    assert(isMatch('abef', 'ab?*(e|f)', { windows: true }));
  });

  it('"abz" should not match "a!(*)"', () => {
    assert(!isMatch('abz', 'a!(*)', { windows: true }));
  });

  it('"abz" should match "a!(z)"', () => {
    assert(isMatch('abz', 'a!(z)', { windows: true }));
  });

  it('"abz" should match "a*!(z)"', () => {
    assert(isMatch('abz', 'a*!(z)', { windows: true }));
  });

  it('"abz" should not match "a*(z)"', () => {
    assert(!isMatch('abz', 'a*(z)', { windows: true }));
  });

  it('"abz" should match "a**(z)"', () => {
    assert(isMatch('abz', 'a**(z)', { windows: true }));
  });

  it('"abz" should match "a*@(z)"', () => {
    assert(isMatch('abz', 'a*@(z)', { windows: true }));
  });

  it('"abz" should not match "a+(z)"', () => {
    assert(!isMatch('abz', 'a+(z)', { windows: true }));
  });

  it('"abz" should not match "a?(z)"', () => {
    assert(!isMatch('abz', 'a?(z)', { windows: true }));
  });

  it('"abz" should not match "a@(z)"', () => {
    assert(!isMatch('abz', 'a@(z)', { windows: true }));
  });

  it('"ac" should not match "!(a)*"', () => {
    assert(!isMatch('ac', '!(a)*', { windows: true }));
  });

  it('"ac" should match "*(@(a))a@(c)"', () => {
    assert(isMatch('ac', '*(@(a))a@(c)', { windows: true }));
  });

  it('"ac" should match "a!(*(b|B))"', () => {
    assert(isMatch('ac', 'a!(*(b|B))', { windows: true }));
  });

  it('"ac" should match "a!(@(b|B))"', () => {
    assert(isMatch('ac', 'a!(@(b|B))', { windows: true }));
  });

  it('"ac" should match "a!(b)*"', () => {
    assert(isMatch('ac', 'a!(b)*', { windows: true }));
  });

  it('"accdef" should match "(a+|b)*"', () => {
    assert(isMatch('accdef', '(a+|b)*', { windows: true }));
  });

  it('"accdef" should not match "(a+|b)+"', () => {
    assert(!isMatch('accdef', '(a+|b)+', { windows: true }));
  });

  it('"accdef" should not match "*?(a)bc"', () => {
    assert(!isMatch('accdef', '*?(a)bc', { windows: true }));
  });

  it('"accdef" should not match "a(b*(foo|bar))d"', () => {
    assert(!isMatch('accdef', 'a(b*(foo|bar))d', { windows: true }));
  });

  it('"accdef" should not match "ab*(e|f)"', () => {
    assert(!isMatch('accdef', 'ab*(e|f)', { windows: true }));
  });

  it('"accdef" should not match "ab**"', () => {
    assert(!isMatch('accdef', 'ab**', { windows: true }));
  });

  it('"accdef" should not match "ab**(e|f)"', () => {
    assert(!isMatch('accdef', 'ab**(e|f)', { windows: true }));
  });

  it('"accdef" should not match "ab**(e|f)g"', () => {
    assert(!isMatch('accdef', 'ab**(e|f)g', { windows: true }));
  });

  it('"accdef" should not match "ab***ef"', () => {
    assert(!isMatch('accdef', 'ab***ef', { windows: true }));
  });

  it('"accdef" should not match "ab*+(e|f)"', () => {
    assert(!isMatch('accdef', 'ab*+(e|f)', { windows: true }));
  });

  it('"accdef" should not match "ab*d+(e|f)"', () => {
    assert(!isMatch('accdef', 'ab*d+(e|f)', { windows: true }));
  });

  it('"accdef" should not match "ab?*(e|f)"', () => {
    assert(!isMatch('accdef', 'ab?*(e|f)', { windows: true }));
  });

  it('"acd" should match "(a+|b)*"', () => {
    assert(isMatch('acd', '(a+|b)*', { windows: true }));
  });

  it('"acd" should not match "(a+|b)+"', () => {
    assert(!isMatch('acd', '(a+|b)+', { windows: true }));
  });

  it('"acd" should not match "*?(a)bc"', () => {
    assert(!isMatch('acd', '*?(a)bc', { windows: true }));
  });

  it('"acd" should match "@(ab|a*(b))*(c)d"', () => {
    assert(isMatch('acd', '@(ab|a*(b))*(c)d', { windows: true }));
  });

  it('"acd" should match "a!(*(b|B))"', () => {
    assert(isMatch('acd', 'a!(*(b|B))', { windows: true }));
  });

  it('"acd" should match "a!(@(b|B))"', () => {
    assert(isMatch('acd', 'a!(@(b|B))', { windows: true }));
  });

  it('"acd" should match "a!(@(b|B))d"', () => {
    assert(isMatch('acd', 'a!(@(b|B))d', { windows: true }));
  });

  it('"acd" should not match "a(b*(foo|bar))d"', () => {
    assert(!isMatch('acd', 'a(b*(foo|bar))d', { windows: true }));
  });

  it('"acd" should match "a+(b|c)d"', () => {
    assert(isMatch('acd', 'a+(b|c)d', { windows: true }));
  });

  it('"acd" should not match "a[b*(foo|bar)]d"', () => {
    assert(!isMatch('acd', 'a[b*(foo|bar)]d', { windows: true }));
  });

  it('"acd" should not match "ab*(e|f)"', () => {
    assert(!isMatch('acd', 'ab*(e|f)', { windows: true }));
  });

  it('"acd" should not match "ab**"', () => {
    assert(!isMatch('acd', 'ab**', { windows: true }));
  });

  it('"acd" should not match "ab**(e|f)"', () => {
    assert(!isMatch('acd', 'ab**(e|f)', { windows: true }));
  });

  it('"acd" should not match "ab**(e|f)g"', () => {
    assert(!isMatch('acd', 'ab**(e|f)g', { windows: true }));
  });

  it('"acd" should not match "ab***ef"', () => {
    assert(!isMatch('acd', 'ab***ef', { windows: true }));
  });

  it('"acd" should not match "ab*+(e|f)"', () => {
    assert(!isMatch('acd', 'ab*+(e|f)', { windows: true }));
  });

  it('"acd" should not match "ab*d+(e|f)"', () => {
    assert(!isMatch('acd', 'ab*d+(e|f)', { windows: true }));
  });

  it('"acd" should not match "ab?*(e|f)"', () => {
    assert(!isMatch('acd', 'ab?*(e|f)', { windows: true }));
  });

  it('"axz" should not match "a+(z)"', () => {
    assert(!isMatch('axz', 'a+(z)', { windows: true }));
  });

  it('"az" should not match "a!(*)"', () => {
    assert(!isMatch('az', 'a!(*)', { windows: true }));
  });

  it('"az" should not match "a!(z)"', () => {
    assert(!isMatch('az', 'a!(z)', { windows: true }));
  });

  it('"az" should match "a*!(z)"', () => {
    assert(isMatch('az', 'a*!(z)', { windows: true }));
  });

  it('"az" should match "a*(z)"', () => {
    assert(isMatch('az', 'a*(z)', { windows: true }));
  });

  it('"az" should match "a**(z)"', () => {
    assert(isMatch('az', 'a**(z)', { windows: true }));
  });

  it('"az" should match "a*@(z)"', () => {
    assert(isMatch('az', 'a*@(z)', { windows: true }));
  });

  it('"az" should match "a+(z)"', () => {
    assert(isMatch('az', 'a+(z)', { windows: true }));
  });

  it('"az" should match "a?(z)"', () => {
    assert(isMatch('az', 'a?(z)', { windows: true }));
  });

  it('"az" should match "a@(z)"', () => {
    assert(isMatch('az', 'a@(z)', { windows: true }));
  });

  it('"az" should not match "a\\z"', () => {
    assert(!isMatch('az', 'a\\\\z', { windows: false }));
  });

  it('"az" should not match "a\\z"', () => {
    assert(!isMatch('az', 'a\\\\z', { windows: true }));
  });

  it('"b" should match "!(a)*"', () => {
    assert(isMatch('b', '!(a)*', { windows: true }));
  });

  it('"b" should match "(a+|b)*"', () => {
    assert(isMatch('b', '(a+|b)*', { windows: true }));
  });

  it('"b" should not match "a!(b)*"', () => {
    assert(!isMatch('b', 'a!(b)*', { windows: true }));
  });

  it('"b.a" should match "(b|a).(a)"', () => {
    assert(isMatch('b.a', '(b|a).(a)', { windows: true }));
  });

  it('"b.a" should match "@(b|a).@(a)"', () => {
    assert(isMatch('b.a', '@(b|a).@(a)', { windows: true }));
  });

  it('"b/a" should not match "!(b/a)"', () => {
    assert(!isMatch('b/a', '!(b/a)', { windows: true }));
  });

  it('"b/b" should match "!(b/a)"', () => {
    assert(isMatch('b/b', '!(b/a)', { windows: true }));
  });

  it('"b/c" should match "!(b/a)"', () => {
    assert(isMatch('b/c', '!(b/a)', { windows: true }));
  });

  it('"b/c" should not match "b/!(c)"', () => {
    assert(!isMatch('b/c', 'b/!(c)', { windows: true }));
  });

  it('"b/c" should match "b/!(cc)"', () => {
    assert(isMatch('b/c', 'b/!(cc)', { windows: true }));
  });

  it('"b/c.txt" should not match "b/!(c).txt"', () => {
    assert(!isMatch('b/c.txt', 'b/!(c).txt', { windows: true }));
  });

  it('"b/c.txt" should match "b/!(cc).txt"', () => {
    assert(isMatch('b/c.txt', 'b/!(cc).txt', { windows: true }));
  });

  it('"b/cc" should match "b/!(c)"', () => {
    assert(isMatch('b/cc', 'b/!(c)', { windows: true }));
  });

  it('"b/cc" should not match "b/!(cc)"', () => {
    assert(!isMatch('b/cc', 'b/!(cc)', { windows: true }));
  });

  it('"b/cc.txt" should not match "b/!(c).txt"', () => {
    assert(!isMatch('b/cc.txt', 'b/!(c).txt', { windows: true }));
  });

  it('"b/cc.txt" should not match "b/!(cc).txt"', () => {
    assert(!isMatch('b/cc.txt', 'b/!(cc).txt', { windows: true }));
  });

  it('"b/ccc" should match "b/!(c)"', () => {
    assert(isMatch('b/ccc', 'b/!(c)', { windows: true }));
  });

  it('"ba" should match "!(a!(b))"', () => {
    assert(isMatch('ba', '!(a!(b))', { windows: true }));
  });

  it('"ba" should match "b?(a|b)"', () => {
    assert(isMatch('ba', 'b?(a|b)', { windows: true }));
  });

  it('"baaac" should not match "*(@(a))a@(c)"', () => {
    assert(!isMatch('baaac', '*(@(a))a@(c)', { windows: true }));
  });

  it('"bar" should match "!(foo)"', () => {
    assert(isMatch('bar', '!(foo)', { windows: true }));
  });

  it('"bar" should match "!(foo)*"', () => {
    assert(isMatch('bar', '!(foo)*', { windows: true }));
  });

  it('"bar" should match "!(foo)b*"', () => {
    assert(isMatch('bar', '!(foo)b*', { windows: true }));
  });

  it('"bar" should match "*(!(foo))"', () => {
    assert(isMatch('bar', '*(!(foo))', { windows: true }));
  });

  it('"baz" should match "!(foo)*"', () => {
    assert(isMatch('baz', '!(foo)*', { windows: true }));
  });

  it('"baz" should match "!(foo)b*"', () => {
    assert(isMatch('baz', '!(foo)b*', { windows: true }));
  });

  it('"baz" should match "*(!(foo))"', () => {
    assert(isMatch('baz', '*(!(foo))', { windows: true }));
  });

  it('"bb" should match "!(a!(b))"', () => {
    assert(isMatch('bb', '!(a!(b))', { windows: true }));
  });

  it('"bb" should match "!(a)*"', () => {
    assert(isMatch('bb', '!(a)*', { windows: true }));
  });

  it('"bb" should not match "a!(b)*"', () => {
    assert(!isMatch('bb', 'a!(b)*', { windows: true }));
  });

  it('"bb" should not match "a?(a|b)"', () => {
    assert(!isMatch('bb', 'a?(a|b)', { windows: true }));
  });

  it('"bbc" should match "!([[*])*"', () => {
    assert(isMatch('bbc', '!([[*])*', { windows: true }));
  });

  it('"bbc" should not match "+(a|b\\[)*"', () => {
    assert(!isMatch('bbc', '+(a|b\\[)*', { windows: true }));
  });

  it('"bbc" should not match "[a*(]*z"', () => {
    assert(!isMatch('bbc', '[a*(]*z', { windows: true }));
  });

  it('"bz" should not match "a+(z)"', () => {
    assert(!isMatch('bz', 'a+(z)', { windows: true }));
  });

  it('"c" should not match "*(@(a))a@(c)"', () => {
    assert(!isMatch('c', '*(@(a))a@(c)', { windows: true }));
  });

  it('"c.a" should not match "!(*.[a-b]*)"', () => {
    assert(!isMatch('c.a', '!(*.[a-b]*)', { windows: true }));
  });

  it('"c.a" should match "!(*[a-b].[a-b]*)"', () => {
    assert(isMatch('c.a', '!(*[a-b].[a-b]*)', { windows: true }));
  });

  it('"c.a" should not match "!*.(a|b)"', () => {
    assert(!isMatch('c.a', '!*.(a|b)', { windows: true }));
  });

  it('"c.a" should not match "!*.(a|b)*"', () => {
    assert(!isMatch('c.a', '!*.(a|b)*', { windows: true }));
  });

  it('"c.a" should not match "(b|a).(a)"', () => {
    assert(!isMatch('c.a', '(b|a).(a)', { windows: true }));
  });

  it('"c.a" should not match "*.!(a)"', () => {
    assert(!isMatch('c.a', '*.!(a)', { windows: true }));
  });

  it('"c.a" should not match "*.+(b|d)"', () => {
    assert(!isMatch('c.a', '*.+(b|d)', { windows: true }));
  });

  it('"c.a" should not match "@(b|a).@(a)"', () => {
    assert(!isMatch('c.a', '@(b|a).@(a)', { windows: true }));
  });

  it('"c.c" should not match "!(*.a|*.b|*.c)"', () => {
    assert(!isMatch('c.c', '!(*.a|*.b|*.c)', { windows: true }));
  });

  it('"c.c" should match "*!(.a|.b|.c)"', () => {
    assert(isMatch('c.c', '*!(.a|.b|.c)', { windows: true }));
  });

  it('"c.c" should not match "*.!(a|b|c)"', () => {
    assert(!isMatch('c.c', '*.!(a|b|c)', { windows: true }));
  });

  it('"c.c" should not match "*.(a|b|@(ab|a*@(b))*(c)d)"', () => {
    assert(!isMatch('c.c', '*.(a|b|@(ab|a*@(b))*(c)d)', { windows: true }));
  });

  it('"c.ccc" should match "!(*.[a-b]*)"', () => {
    assert(isMatch('c.ccc', '!(*.[a-b]*)', { windows: true }));
  });

  it('"c.ccc" should match "!(*[a-b].[a-b]*)"', () => {
    assert(isMatch('c.ccc', '!(*[a-b].[a-b]*)', { windows: true }));
  });

  it('"c.js" should not match "!(*.js)"', () => {
    assert(!isMatch('c.js', '!(*.js)', { windows: true }));
  });

  it('"c.js" should match "*!(.js)"', () => {
    assert(isMatch('c.js', '*!(.js)', { windows: true }));
  });

  it('"c.js" should not match "*.!(js)"', () => {
    assert(!isMatch('c.js', '*.!(js)', { windows: true }));
  });

  it('"c/a/v" should match "c/!(z)/v"', () => {
    assert(isMatch('c/a/v', 'c/!(z)/v', { windows: true }));
  });

  it('"c/a/v" should not match "c/*(z)/v"', () => {
    assert(!isMatch('c/a/v', 'c/*(z)/v', { windows: true }));
  });

  it('"c/a/v" should not match "c/+(z)/v"', () => {
    assert(!isMatch('c/a/v', 'c/+(z)/v', { windows: true }));
  });

  it('"c/a/v" should not match "c/@(z)/v"', () => {
    assert(!isMatch('c/a/v', 'c/@(z)/v', { windows: true }));
  });

  it('"c/z/v" should not match "*(z)"', () => {
    assert(!isMatch('c/z/v', '*(z)', { windows: true }));
  });

  it('"c/z/v" should not match "+(z)"', () => {
    assert(!isMatch('c/z/v', '+(z)', { windows: true }));
  });

  it('"c/z/v" should not match "?(z)"', () => {
    assert(!isMatch('c/z/v', '?(z)', { windows: true }));
  });

  it('"c/z/v" should not match "c/!(z)/v"', () => {
    assert(!isMatch('c/z/v', 'c/!(z)/v', { windows: true }));
  });

  it('"c/z/v" should match "c/*(z)/v"', () => {
    assert(isMatch('c/z/v', 'c/*(z)/v', { windows: true }));
  });

  it('"c/z/v" should match "c/+(z)/v"', () => {
    assert(isMatch('c/z/v', 'c/+(z)/v', { windows: true }));
  });

  it('"c/z/v" should match "c/@(z)/v"', () => {
    assert(isMatch('c/z/v', 'c/@(z)/v', { windows: true }));
  });

  it('"c/z/v" should match "c/z/v"', () => {
    assert(isMatch('c/z/v', 'c/z/v', { windows: true }));
  });

  it('"cc.a" should not match "(b|a).(a)"', () => {
    assert(!isMatch('cc.a', '(b|a).(a)', { windows: true }));
  });

  it('"cc.a" should not match "@(b|a).@(a)"', () => {
    assert(!isMatch('cc.a', '@(b|a).@(a)', { windows: true }));
  });

  it('"ccc" should match "!(a)*"', () => {
    assert(isMatch('ccc', '!(a)*', { windows: true }));
  });

  it('"ccc" should not match "a!(b)*"', () => {
    assert(!isMatch('ccc', 'a!(b)*', { windows: true }));
  });

  it('"cow" should match "!(*.*)"', () => {
    assert(isMatch('cow', '!(*.*)', { windows: true }));
  });

  it('"cow" should not match "!(*.*)."', () => {
    assert(!isMatch('cow', '!(*.*).', { windows: true }));
  });

  it('"cow" should not match ".!(*.*)"', () => {
    assert(!isMatch('cow', '.!(*.*)', { windows: true }));
  });

  it('"cz" should not match "a!(*)"', () => {
    assert(!isMatch('cz', 'a!(*)', { windows: true }));
  });

  it('"cz" should not match "a!(z)"', () => {
    assert(!isMatch('cz', 'a!(z)', { windows: true }));
  });

  it('"cz" should not match "a*!(z)"', () => {
    assert(!isMatch('cz', 'a*!(z)', { windows: true }));
  });

  it('"cz" should not match "a*(z)"', () => {
    assert(!isMatch('cz', 'a*(z)', { windows: true }));
  });

  it('"cz" should not match "a**(z)"', () => {
    assert(!isMatch('cz', 'a**(z)', { windows: true }));
  });

  it('"cz" should not match "a*@(z)"', () => {
    assert(!isMatch('cz', 'a*@(z)', { windows: true }));
  });

  it('"cz" should not match "a+(z)"', () => {
    assert(!isMatch('cz', 'a+(z)', { windows: true }));
  });

  it('"cz" should not match "a?(z)"', () => {
    assert(!isMatch('cz', 'a?(z)', { windows: true }));
  });

  it('"cz" should not match "a@(z)"', () => {
    assert(!isMatch('cz', 'a@(z)', { windows: true }));
  });

  it('"d.a.d" should not match "!(*.[a-b]*)"', () => {
    assert(!isMatch('d.a.d', '!(*.[a-b]*)', { windows: true }));
  });

  it('"d.a.d" should match "!(*[a-b].[a-b]*)"', () => {
    assert(isMatch('d.a.d', '!(*[a-b].[a-b]*)', { windows: true }));
  });

  it('"d.a.d" should not match "!*.(a|b)*"', () => {
    assert(!isMatch('d.a.d', '!*.(a|b)*', { windows: true }));
  });

  it('"d.a.d" should match "!*.*(a|b)"', () => {
    assert(isMatch('d.a.d', '!*.*(a|b)', { windows: true }));
  });

  it('"d.a.d" should not match "!*.{a,b}*"', () => {
    assert(!isMatch('d.a.d', '!*.{a,b}*', { windows: true }));
  });

  it('"d.a.d" should match "*.!(a)"', () => {
    assert(isMatch('d.a.d', '*.!(a)', { windows: true }));
  });

  it('"d.a.d" should match "*.+(b|d)"', () => {
    assert(isMatch('d.a.d', '*.+(b|d)', { windows: true }));
  });

  it('"d.d" should match "!(*.a|*.b|*.c)"', () => {
    assert(isMatch('d.d', '!(*.a|*.b|*.c)', { windows: true }));
  });

  it('"d.d" should match "*!(.a|.b|.c)"', () => {
    assert(isMatch('d.d', '*!(.a|.b|.c)', { windows: true }));
  });

  it('"d.d" should match "*.!(a|b|c)"', () => {
    assert(isMatch('d.d', '*.!(a|b|c)', { windows: true }));
  });

  it('"d.d" should not match "*.(a|b|@(ab|a*@(b))*(c)d)"', () => {
    assert(!isMatch('d.d', '*.(a|b|@(ab|a*@(b))*(c)d)', { windows: true }));
  });

  it('"d.js.d" should match "!(*.js)"', () => {
    assert(isMatch('d.js.d', '!(*.js)', { windows: true }));
  });

  it('"d.js.d" should match "*!(.js)"', () => {
    assert(isMatch('d.js.d', '*!(.js)', { windows: true }));
  });

  it('"d.js.d" should match "*.!(js)"', () => {
    assert(isMatch('d.js.d', '*.!(js)', { windows: true }));
  });

  it('"dd.aa.d" should not match "(b|a).(a)"', () => {
    assert(!isMatch('dd.aa.d', '(b|a).(a)', { windows: true }));
  });

  it('"dd.aa.d" should not match "@(b|a).@(a)"', () => {
    assert(!isMatch('dd.aa.d', '@(b|a).@(a)', { windows: true }));
  });

  it('"def" should not match "()ef"', () => {
    assert(!isMatch('def', '()ef', { windows: true }));
  });

  it('"e.e" should match "!(*.a|*.b|*.c)"', () => {
    assert(isMatch('e.e', '!(*.a|*.b|*.c)', { windows: true }));
  });

  it('"e.e" should match "*!(.a|.b|.c)"', () => {
    assert(isMatch('e.e', '*!(.a|.b|.c)', { windows: true }));
  });

  it('"e.e" should match "*.!(a|b|c)"', () => {
    assert(isMatch('e.e', '*.!(a|b|c)', { windows: true }));
  });

  it('"e.e" should not match "*.(a|b|@(ab|a*@(b))*(c)d)"', () => {
    assert(!isMatch('e.e', '*.(a|b|@(ab|a*@(b))*(c)d)', { windows: true }));
  });

  it('"ef" should match "()ef"', () => {
    assert(isMatch('ef', '()ef', { windows: true }));
  });

  it('"effgz" should match "@(b+(c)d|e*(f)g?|?(h)i@(j|k))"', () => {
    assert(isMatch('effgz', '@(b+(c)d|e*(f)g?|?(h)i@(j|k))', { windows: true }));
  });

  it('"efgz" should match "@(b+(c)d|e*(f)g?|?(h)i@(j|k))"', () => {
    assert(isMatch('efgz', '@(b+(c)d|e*(f)g?|?(h)i@(j|k))', { windows: true }));
  });

  it('"egz" should match "@(b+(c)d|e*(f)g?|?(h)i@(j|k))"', () => {
    assert(isMatch('egz', '@(b+(c)d|e*(f)g?|?(h)i@(j|k))', { windows: true }));
  });

  it('"egz" should not match "@(b+(c)d|e+(f)g?|?(h)i@(j|k))"', () => {
    assert(!isMatch('egz', '@(b+(c)d|e+(f)g?|?(h)i@(j|k))', { windows: true }));
  });

  it('"egzefffgzbcdij" should match "*(b+(c)d|e*(f)g?|?(h)i@(j|k))"', () => {
    assert(isMatch('egzefffgzbcdij', '*(b+(c)d|e*(f)g?|?(h)i@(j|k))', { windows: true }));
  });

  it('"f" should not match "!(f!(o))"', () => {
    assert(!isMatch('f', '!(f!(o))', { windows: true }));
  });

  it('"f" should match "!(f(o))"', () => {
    assert(isMatch('f', '!(f(o))', { windows: true }));
  });

  it('"f" should not match "!(f)"', () => {
    assert(!isMatch('f', '!(f)', { windows: true }));
  });

  it('"f" should not match "*(!(f))"', () => {
    assert(!isMatch('f', '*(!(f))', { windows: true }));
  });

  it('"f" should not match "+(!(f))"', () => {
    assert(!isMatch('f', '+(!(f))', { windows: true }));
  });

  it('"f.a" should not match "!(*.a|*.b|*.c)"', () => {
    assert(!isMatch('f.a', '!(*.a|*.b|*.c)', { windows: true }));
  });

  it('"f.a" should match "*!(.a|.b|.c)"', () => {
    assert(isMatch('f.a', '*!(.a|.b|.c)', { windows: true }));
  });

  it('"f.a" should not match "*.!(a|b|c)"', () => {
    assert(!isMatch('f.a', '*.!(a|b|c)', { windows: true }));
  });

  it('"f.f" should match "!(*.a|*.b|*.c)"', () => {
    assert(isMatch('f.f', '!(*.a|*.b|*.c)', { windows: true }));
  });

  it('"f.f" should match "*!(.a|.b|.c)"', () => {
    assert(isMatch('f.f', '*!(.a|.b|.c)', { windows: true }));
  });

  it('"f.f" should match "*.!(a|b|c)"', () => {
    assert(isMatch('f.f', '*.!(a|b|c)', { windows: true }));
  });

  it('"f.f" should not match "*.(a|b|@(ab|a*@(b))*(c)d)"', () => {
    assert(!isMatch('f.f', '*.(a|b|@(ab|a*@(b))*(c)d)', { windows: true }));
  });

  it('"fa" should not match "!(f!(o))"', () => {
    assert(!isMatch('fa', '!(f!(o))', { windows: true }));
  });

  it('"fa" should match "!(f(o))"', () => {
    assert(isMatch('fa', '!(f(o))', { windows: true }));
  });

  it('"fb" should not match "!(f!(o))"', () => {
    assert(!isMatch('fb', '!(f!(o))', { windows: true }));
  });

  it('"fb" should match "!(f(o))"', () => {
    assert(isMatch('fb', '!(f(o))', { windows: true }));
  });

  it('"fff" should match "!(f)"', () => {
    assert(isMatch('fff', '!(f)', { windows: true }));
  });

  it('"fff" should match "*(!(f))"', () => {
    assert(isMatch('fff', '*(!(f))', { windows: true }));
  });

  it('"fff" should match "+(!(f))"', () => {
    assert(isMatch('fff', '+(!(f))', { windows: true }));
  });

  it('"fffooofoooooffoofffooofff" should match "*(*(f)*(o))"', () => {
    assert(isMatch('fffooofoooooffoofffooofff', '*(*(f)*(o))', { windows: true }));
  });

  it('"ffo" should match "*(f*(o))"', () => {
    assert(isMatch('ffo', '*(f*(o))', { windows: true }));
  });

  it('"file.C" should not match "*.c?(c)"', () => {
    assert(!isMatch('file.C', '*.c?(c)', { windows: true }));
  });

  it('"file.c" should match "*.c?(c)"', () => {
    assert(isMatch('file.c', '*.c?(c)', { windows: true }));
  });

  it('"file.cc" should match "*.c?(c)"', () => {
    assert(isMatch('file.cc', '*.c?(c)', { windows: true }));
  });

  it('"file.ccc" should not match "*.c?(c)"', () => {
    assert(!isMatch('file.ccc', '*.c?(c)', { windows: true }));
  });

  it('"fo" should match "!(f!(o))"', () => {
    assert(isMatch('fo', '!(f!(o))', { windows: true }));
  });

  it('"fo" should not match "!(f(o))"', () => {
    assert(!isMatch('fo', '!(f(o))', { windows: true }));
  });

  it('"fofo" should match "*(f*(o))"', () => {
    assert(isMatch('fofo', '*(f*(o))', { windows: true }));
  });

  it('"fofoofoofofoo" should match "*(fo|foo)"', () => {
    assert(isMatch('fofoofoofofoo', '*(fo|foo)', { windows: true }));
  });

  it('"fofoofoofofoo" should match "*(fo|foo)"', () => {
    assert(isMatch('fofoofoofofoo', '*(fo|foo)', { windows: true }));
  });

  it('"foo" should match "!(!(foo))"', () => {
    assert(isMatch('foo', '!(!(foo))', { windows: true }));
  });

  it('"foo" should match "!(f)"', () => {
    assert(isMatch('foo', '!(f)', { windows: true }));
  });

  it('"foo" should not match "!(foo)"', () => {
    assert(!isMatch('foo', '!(foo)', { windows: true }));
  });

  it('"foo" should not match "!(foo)*"', () => {
    assert(!isMatch('foo', '!(foo)*', { windows: true }));
  });

  it('"foo" should not match "!(foo)*"', () => {
    assert(!isMatch('foo', '!(foo)*', { windows: true }));
  });

  it('"foo" should not match "!(foo)+"', () => {
    assert(!isMatch('foo', '!(foo)+', { windows: true }));
  });

  it('"foo" should not match "!(foo)b*"', () => {
    assert(!isMatch('foo', '!(foo)b*', { windows: true }));
  });

  it('"foo" should match "!(x)"', () => {
    assert(isMatch('foo', '!(x)', { windows: true }));
  });

  it('"foo" should match "!(x)*"', () => {
    assert(isMatch('foo', '!(x)*', { windows: true }));
  });

  it('"foo" should match "*"', () => {
    assert(isMatch('foo', '*', { windows: true }));
  });

  it('"foo" should match "*(!(f))"', () => {
    assert(isMatch('foo', '*(!(f))', { windows: true }));
  });

  it('"foo" should not match "*(!(foo))"', () => {
    assert(!isMatch('foo', '*(!(foo))', { windows: true }));
  });

  it('"foo" should not match "*(@(a))a@(c)"', () => {
    assert(!isMatch('foo', '*(@(a))a@(c)', { windows: true }));
  });

  it('"foo" should match "*(@(foo))"', () => {
    assert(isMatch('foo', '*(@(foo))', { windows: true }));
  });

  it('"foo" should not match "*(a|b\\[)"', () => {
    assert(!isMatch('foo', '*(a|b\\[)', { windows: true }));
  });

  it('"foo" should match "*(a|b\\[)|f*"', () => {
    assert(isMatch('foo', '*(a|b\\[)|f*', { windows: true }));
  });

  it('"foo" should match "@(*(a|b\\[)|f*)"', () => {
    assert(isMatch('foo', '@(*(a|b\\[)|f*)', { windows: true }));
  });

  it('"foo" should not match "*/*/*"', () => {
    assert(!isMatch('foo', '*/*/*', { windows: true }));
  });

  it('"foo" should not match "*f"', () => {
    assert(!isMatch('foo', '*f', { windows: true }));
  });

  it('"foo" should match "*foo*"', () => {
    assert(isMatch('foo', '*foo*', { windows: true }));
  });

  it('"foo" should match "+(!(f))"', () => {
    assert(isMatch('foo', '+(!(f))', { windows: true }));
  });

  it('"foo" should not match "??"', () => {
    assert(!isMatch('foo', '??', { windows: true }));
  });

  it('"foo" should match "???"', () => {
    assert(isMatch('foo', '???', { windows: true }));
  });

  it('"foo" should not match "bar"', () => {
    assert(!isMatch('foo', 'bar', { windows: true }));
  });

  it('"foo" should match "f*"', () => {
    assert(isMatch('foo', 'f*', { windows: true }));
  });

  it('"foo" should not match "fo"', () => {
    assert(!isMatch('foo', 'fo', { windows: true }));
  });

  it('"foo" should match "foo"', () => {
    assert(isMatch('foo', 'foo', { windows: true }));
  });

  it('"foo" should match "{*(a|b\\[),f*}"', () => {
    assert(isMatch('foo', '{*(a|b\\[),f*}', { windows: true }));
  });

  it('"foo*" should match "foo\\*"', () => {
    assert(isMatch('foo*', 'foo\\*', { windows: false }));
  });

  it('"foo*bar" should match "foo\\*bar"', () => {
    assert(isMatch('foo*bar', 'foo\\*bar', { windows: true }));
  });

  it('"foo.js" should not match "!(foo).js"', () => {
    assert(!isMatch('foo.js', '!(foo).js', { windows: true }));
  });

  it('"foo.js.js" should match "*.!(js)"', () => {
    assert(isMatch('foo.js.js', '*.!(js)', { windows: true }));
  });

  it('"foo.js.js" should not match "*.!(js)*"', () => {
    assert(!isMatch('foo.js.js', '*.!(js)*', { windows: true }));
  });

  it('"foo.js.js" should not match "*.!(js)*.!(js)"', () => {
    assert(!isMatch('foo.js.js', '*.!(js)*.!(js)', { windows: true }));
  });

  it('"foo.js.js" should not match "*.!(js)+"', () => {
    assert(!isMatch('foo.js.js', '*.!(js)+', { windows: true }));
  });

  it('"foo.txt" should match "**/!(bar).txt"', () => {
    assert(isMatch('foo.txt', '**/!(bar).txt', { windows: true }));
  });

  it('"foo/bar" should not match "*/*/*"', () => {
    assert(!isMatch('foo/bar', '*/*/*', { windows: true }));
  });

  it('"foo/bar" should match "foo/!(foo)"', () => {
    assert(isMatch('foo/bar', 'foo/!(foo)', { windows: true }));
  });

  it('"foo/bar" should match "foo/*"', () => {
    assert(isMatch('foo/bar', 'foo/*', { windows: true }));
  });

  it('"foo/bar" should match "foo/bar"', () => {
    assert(isMatch('foo/bar', 'foo/bar', { windows: true }));
  });

  it('"foo/bar" should not match "foo?bar"', () => {
    assert(!isMatch('foo/bar', 'foo?bar', { windows: true }));
  });

  it('"foo/bar" should match "foo[/]bar"', () => {
    assert(isMatch('foo/bar', 'foo[/]bar', { windows: true }));
  });

  it('"foo/bar/baz.jsx" should match "foo/bar/**/*.+(js|jsx)"', () => {
    assert(isMatch('foo/bar/baz.jsx', 'foo/bar/**/*.+(js|jsx)', { windows: true }));
  });

  it('"foo/bar/baz.jsx" should match "foo/bar/*.+(js|jsx)"', () => {
    assert(isMatch('foo/bar/baz.jsx', 'foo/bar/*.+(js|jsx)', { windows: true }));
  });

  it('"foo/bb/aa/rr" should match "**/**/**"', () => {
    assert(isMatch('foo/bb/aa/rr', '**/**/**', { windows: true }));
  });

  it('"foo/bb/aa/rr" should not match "*/*/*"', () => {
    assert(!isMatch('foo/bb/aa/rr', '*/*/*', { windows: true }));
  });

  it('"foo/bba/arr" should match "*/*/*"', () => {
    assert(isMatch('foo/bba/arr', '*/*/*', { windows: true }));
  });

  it('"foo/bba/arr" should not match "foo*"', () => {
    assert(!isMatch('foo/bba/arr', 'foo*', { windows: true }));
  });

  it('"foo/bba/arr" should not match "foo**"', () => {
    assert(!isMatch('foo/bba/arr', 'foo**', { windows: true }));
  });

  it('"foo/bba/arr" should not match "foo/*"', () => {
    assert(!isMatch('foo/bba/arr', 'foo/*', { windows: true }));
  });

  it('"foo/bba/arr" should match "foo/**"', () => {
    assert(isMatch('foo/bba/arr', 'foo/**', { windows: true }));
  });

  it('"foo/bba/arr" should not match "foo/**arr"', () => {
    assert(!isMatch('foo/bba/arr', 'foo/**arr', { windows: true }));
  });

  it('"foo/bba/arr" should not match "foo/**z"', () => {
    assert(!isMatch('foo/bba/arr', 'foo/**z', { windows: true }));
  });

  it('"foo/bba/arr" should not match "foo/*arr"', () => {
    assert(!isMatch('foo/bba/arr', 'foo/*arr', { windows: true }));
  });

  it('"foo/bba/arr" should not match "foo/*z"', () => {
    assert(!isMatch('foo/bba/arr', 'foo/*z', { windows: true }));
  });

  it('"foob" should not match "!(foo)b*"', () => {
    assert(!isMatch('foob', '!(foo)b*', { windows: true }));
  });

  it('"foob" should not match "(foo)bb"', () => {
    assert(!isMatch('foob', '(foo)bb', { windows: true }));
  });

  it('"foobar" should match "!(foo)"', () => {
    assert(isMatch('foobar', '!(foo)', { windows: true }));
  });

  it('"foobar" should not match "!(foo)*"', () => {
    assert(!isMatch('foobar', '!(foo)*', { windows: true }));
  });

  it('"foobar" should not match "!(foo)b*"', () => {
    assert(!isMatch('foobar', '!(foo)b*', { windows: true }));
  });

  it('"foobar" should match "*(!(foo))"', () => {
    assert(isMatch('foobar', '*(!(foo))', { windows: true }));
  });

  it('"foobar" should match "*ob*a*r*"', () => {
    assert(isMatch('foobar', '*ob*a*r*', { windows: true }));
  });

  it('"foobar" should not match "foo\\*bar"', () => {
    assert(!isMatch('foobar', 'foo\\*bar', { windows: true }));
  });

  it('"foobb" should not match "!(foo)b*"', () => {
    assert(!isMatch('foobb', '!(foo)b*', { windows: true }));
  });

  it('"foobb" should match "(foo)bb"', () => {
    assert(isMatch('foobb', '(foo)bb', { windows: true }));
  });

  it('"(foo)bb" should match "\\(foo\\)bb"', () => {
    assert(isMatch('(foo)bb', '\\(foo\\)bb', { windows: true }));
  });

  it('"foofoofo" should match "@(foo|f|fo)*(f|of+(o))"', () => {
    assert(isMatch('foofoofo', '@(foo|f|fo)*(f|of+(o))', { windows: true }));
  });

  it('"foofoofo" should match "@(foo|f|fo)*(f|of+(o))"', () => {
    assert(isMatch('foofoofo', '@(foo|f|fo)*(f|of+(o))', { windows: true }));
  });

  it('"fooofoofofooo" should match "*(f*(o))"', () => {
    assert(isMatch('fooofoofofooo', '*(f*(o))', { windows: true }));
  });

  it('"foooofo" should match "*(f*(o))"', () => {
    assert(isMatch('foooofo', '*(f*(o))', { windows: true }));
  });

  it('"foooofof" should match "*(f*(o))"', () => {
    assert(isMatch('foooofof', '*(f*(o))', { windows: true }));
  });

  it('"foooofof" should not match "*(f+(o))"', () => {
    assert(!isMatch('foooofof', '*(f+(o))', { windows: true }));
  });

  it('"foooofofx" should not match "*(f*(o))"', () => {
    assert(!isMatch('foooofofx', '*(f*(o))', { windows: true }));
  });

  it('"foooxfooxfoxfooox" should match "*(f*(o)x)"', () => {
    assert(isMatch('foooxfooxfoxfooox', '*(f*(o)x)', { windows: true }));
  });

  it('"foooxfooxfxfooox" should match "*(f*(o)x)"', () => {
    assert(isMatch('foooxfooxfxfooox', '*(f*(o)x)', { windows: true }));
  });

  it('"foooxfooxofoxfooox" should not match "*(f*(o)x)"', () => {
    assert(!isMatch('foooxfooxofoxfooox', '*(f*(o)x)', { windows: true }));
  });

  it('"foot" should match "@(!(z*)|*x)"', () => {
    assert(isMatch('foot', '@(!(z*)|*x)', { windows: true }));
  });

  it('"foox" should match "@(!(z*)|*x)"', () => {
    assert(isMatch('foox', '@(!(z*)|*x)', { windows: true }));
  });

  it('"fz" should not match "*(z)"', () => {
    assert(!isMatch('fz', '*(z)', { windows: true }));
  });

  it('"fz" should not match "+(z)"', () => {
    assert(!isMatch('fz', '+(z)', { windows: true }));
  });

  it('"fz" should not match "?(z)"', () => {
    assert(!isMatch('fz', '?(z)', { windows: true }));
  });

  it('"moo.cow" should not match "!(moo).!(cow)"', () => {
    assert(!isMatch('moo.cow', '!(moo).!(cow)', { windows: true }));
  });

  it('"moo.cow" should not match "!(*).!(*)"', () => {
    assert(!isMatch('moo.cow', '!(*).!(*)', { windows: true }));
  });

  it('"mad.moo.cow" should not match "!(*.*).!(*.*)"', () => {
    assert(!isMatch('mad.moo.cow', '!(*.*).!(*.*)', { windows: true }));
  });

  it('"mad.moo.cow" should not match ".!(*.*)"', () => {
    assert(!isMatch('mad.moo.cow', '.!(*.*)', { windows: true }));
  });

  it('"Makefile" should match "!(*.c|*.h|Makefile.in|config*|README)"', () => {
    assert(isMatch('Makefile', '!(*.c|*.h|Makefile.in|config*|README)', { windows: true }));
  });

  it('"Makefile.in" should not match "!(*.c|*.h|Makefile.in|config*|README)"', () => {
    assert(!isMatch('Makefile.in', '!(*.c|*.h|Makefile.in|config*|README)', { windows: true }));
  });

  it('"moo" should match "!(*.*)"', () => {
    assert(isMatch('moo', '!(*.*)', { windows: true }));
  });

  it('"moo" should not match "!(*.*)."', () => {
    assert(!isMatch('moo', '!(*.*).', { windows: true }));
  });

  it('"moo" should not match ".!(*.*)"', () => {
    assert(!isMatch('moo', '.!(*.*)', { windows: true }));
  });

  it('"moo.cow" should not match "!(*.*)"', () => {
    assert(!isMatch('moo.cow', '!(*.*)', { windows: true }));
  });

  it('"moo.cow" should not match "!(*.*)."', () => {
    assert(!isMatch('moo.cow', '!(*.*).', { windows: true }));
  });

  it('"moo.cow" should not match ".!(*.*)"', () => {
    assert(!isMatch('moo.cow', '.!(*.*)', { windows: true }));
  });

  it('"mucca.pazza" should not match "mu!(*(c))?.pa!(*(z))?"', () => {
    assert(!isMatch('mucca.pazza', 'mu!(*(c))?.pa!(*(z))?', { windows: true }));
  });

  it('"ofoofo" should match "*(of+(o))"', () => {
    assert(isMatch('ofoofo', '*(of+(o))', { windows: true }));
  });

  it('"ofoofo" should match "*(of+(o)|f)"', () => {
    assert(isMatch('ofoofo', '*(of+(o)|f)', { windows: true }));
  });

  it('"ofooofoofofooo" should not match "*(f*(o))"', () => {
    assert(!isMatch('ofooofoofofooo', '*(f*(o))', { windows: true }));
  });

  it('"ofoooxoofxo" should match "*(*(of*(o)x)o)"', () => {
    assert(isMatch('ofoooxoofxo', '*(*(of*(o)x)o)', { windows: true }));
  });

  it('"ofoooxoofxoofoooxoofxo" should match "*(*(of*(o)x)o)"', () => {
    assert(isMatch('ofoooxoofxoofoooxoofxo', '*(*(of*(o)x)o)', { windows: true }));
  });

  it('"ofoooxoofxoofoooxoofxofo" should not match "*(*(of*(o)x)o)"', () => {
    assert(!isMatch('ofoooxoofxoofoooxoofxofo', '*(*(of*(o)x)o)', { windows: true }));
  });

  it('"ofoooxoofxoofoooxoofxoo" should match "*(*(of*(o)x)o)"', () => {
    assert(isMatch('ofoooxoofxoofoooxoofxoo', '*(*(of*(o)x)o)', { windows: true }));
  });

  it('"ofoooxoofxoofoooxoofxooofxofxo" should match "*(*(of*(o)x)o)"', () => {
    assert(isMatch('ofoooxoofxoofoooxoofxooofxofxo', '*(*(of*(o)x)o)', { windows: true }));
  });

  it('"ofxoofxo" should match "*(*(of*(o)x)o)"', () => {
    assert(isMatch('ofxoofxo', '*(*(of*(o)x)o)', { windows: true }));
  });

  it('"oofooofo" should match "*(of|oof+(o))"', () => {
    assert(isMatch('oofooofo', '*(of|oof+(o))', { windows: true }));
  });

  it('"ooo" should match "!(f)"', () => {
    assert(isMatch('ooo', '!(f)', { windows: true }));
  });

  it('"ooo" should match "*(!(f))"', () => {
    assert(isMatch('ooo', '*(!(f))', { windows: true }));
  });

  it('"ooo" should match "+(!(f))"', () => {
    assert(isMatch('ooo', '+(!(f))', { windows: true }));
  });

  it('"oxfoxfox" should not match "*(oxf+(ox))"', () => {
    assert(!isMatch('oxfoxfox', '*(oxf+(ox))', { windows: true }));
  });

  it('"oxfoxoxfox" should match "*(oxf+(ox))"', () => {
    assert(isMatch('oxfoxoxfox', '*(oxf+(ox))', { windows: true }));
  });

  it('"para" should match "para*([0-9])"', () => {
    assert(isMatch('para', 'para*([0-9])', { windows: true }));
  });

  it('"para" should not match "para+([0-9])"', () => {
    assert(!isMatch('para', 'para+([0-9])', { windows: true }));
  });

  it('"para.38" should match "para!(*.[00-09])"', () => {
    assert(isMatch('para.38', 'para!(*.[00-09])', { windows: true }));
  });

  it('"para.graph" should match "para!(*.[0-9])"', () => {
    assert(isMatch('para.graph', 'para!(*.[0-9])', { windows: true }));
  });

  it('"para13829383746592" should match "para*([0-9])"', () => {
    assert(isMatch('para13829383746592', 'para*([0-9])', { windows: true }));
  });

  it('"para381" should not match "para?([345]|99)1"', () => {
    assert(!isMatch('para381', 'para?([345]|99)1', { windows: true }));
  });

  it('"para39" should match "para!(*.[0-9])"', () => {
    assert(isMatch('para39', 'para!(*.[0-9])', { windows: true }));
  });

  it('"para987346523" should match "para+([0-9])"', () => {
    assert(isMatch('para987346523', 'para+([0-9])', { windows: true }));
  });

  it('"para991" should match "para?([345]|99)1"', () => {
    assert(isMatch('para991', 'para?([345]|99)1', { windows: true }));
  });

  it('"paragraph" should match "para!(*.[0-9])"', () => {
    assert(isMatch('paragraph', 'para!(*.[0-9])', { windows: true }));
  });

  it('"paragraph" should not match "para*([0-9])"', () => {
    assert(!isMatch('paragraph', 'para*([0-9])', { windows: true }));
  });

  it('"paragraph" should match "para@(chute|graph)"', () => {
    assert(isMatch('paragraph', 'para@(chute|graph)', { windows: true }));
  });

  it('"paramour" should not match "para@(chute|graph)"', () => {
    assert(!isMatch('paramour', 'para@(chute|graph)', { windows: true }));
  });

  it('"parse.y" should match "!(*.c|*.h|Makefile.in|config*|README)"', () => {
    assert(isMatch('parse.y', '!(*.c|*.h|Makefile.in|config*|README)', { windows: true }));
  });

  it('"shell.c" should not match "!(*.c|*.h|Makefile.in|config*|README)"', () => {
    assert(!isMatch('shell.c', '!(*.c|*.h|Makefile.in|config*|README)', { windows: true }));
  });

  it('"VMS.FILE;" should not match "*\\;[1-9]*([0-9])"', () => {
    assert(!isMatch('VMS.FILE;', '*\\;[1-9]*([0-9])', { windows: true }));
  });

  it('"VMS.FILE;0" should not match "*\\;[1-9]*([0-9])"', () => {
    assert(!isMatch('VMS.FILE;0', '*\\;[1-9]*([0-9])', { windows: true }));
  });

  it('"VMS.FILE;1" should match "*\\;[1-9]*([0-9])"', () => {
    assert(isMatch('VMS.FILE;1', '*\\;[1-9]*([0-9])', { windows: true }));
  });

  it('"VMS.FILE;1" should match "*;[1-9]*([0-9])"', () => {
    assert(isMatch('VMS.FILE;1', '*;[1-9]*([0-9])', { windows: true }));
  });

  it('"VMS.FILE;139" should match "*\\;[1-9]*([0-9])"', () => {
    assert(isMatch('VMS.FILE;139', '*\\;[1-9]*([0-9])', { windows: true }));
  });

  it('"VMS.FILE;1N" should not match "*\\;[1-9]*([0-9])"', () => {
    assert(!isMatch('VMS.FILE;1N', '*\\;[1-9]*([0-9])', { windows: true }));
  });

  it('"xfoooofof" should not match "*(f*(o))"', () => {
    assert(!isMatch('xfoooofof', '*(f*(o))', { windows: true }));
  });

  it('"XXX/adobe/courier/bold/o/normal//12/120/75/75/m/70/iso8859/1" should match "XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*"', () => {
    assert(isMatch('XXX/adobe/courier/bold/o/normal//12/120/75/75/m/70/iso8859/1', 'XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*', { windows: false }));
  });

  it('"XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1" should not match "XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*"', () => {
    assert(!isMatch('XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1', 'XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*', { windows: true }));
  });

  it('"z" should match "*(z)"', () => {
    assert(isMatch('z', '*(z)', { windows: true }));
  });

  it('"z" should match "+(z)"', () => {
    assert(isMatch('z', '+(z)', { windows: true }));
  });

  it('"z" should match "?(z)"', () => {
    assert(isMatch('z', '?(z)', { windows: true }));
  });

  it('"zf" should not match "*(z)"', () => {
    assert(!isMatch('zf', '*(z)', { windows: true }));
  });

  it('"zf" should not match "+(z)"', () => {
    assert(!isMatch('zf', '+(z)', { windows: true }));
  });

  it('"zf" should not match "?(z)"', () => {
    assert(!isMatch('zf', '?(z)', { windows: true }));
  });

  it('"zoot" should not match "@(!(z*)|*x)"', () => {
    assert(!isMatch('zoot', '@(!(z*)|*x)', { windows: true }));
  });

  it('"zoox" should match "@(!(z*)|*x)"', () => {
    assert(isMatch('zoox', '@(!(z*)|*x)', { windows: true }));
  });

  it('"zz" should not match "(a+|b)*"', () => {
    assert(!isMatch('zz', '(a+|b)*', { windows: true }));
  });
});
