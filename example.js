'use strict';

var mm = require('minimatch');
var nm = require('nanomatch');
var pm = require('./');

// console.log(nm.isMatch('a/', 'a/**'));
// console.log(pm.isMatch('a/', 'a/**'));

// console.log(nm.makeRe('**/[a-k]*'));
// console.log(nm.makeRe('**/[a-k]*'));
// console.log(nm.makeRe('**/[a-i]*'));
// console.log(nm.makeRe('**/[a-i]ar'));
// console.log();
// console.log(pm.makeRe('**/[a-k]*'));
// console.log(pm.makeRe('**/[a-k]*'));
// console.log(pm.makeRe('**/[a-i]*'));
// console.log(pm.makeRe('**/[a-i]ar'));
// console.log(pm.makeRe('[foo*]'));
// console.log('---');
// console.log(nm.isMatch('foo/bar', '**/[a-k]*'));
// console.log(nm.isMatch('foo/jar', '**/[a-k]*'));
// console.log(nm.isMatch('foo/jar', '**/[a-i]*'));
// console.log(nm.isMatch('foo/jar', '**/[a-i]ar'));
// console.log();
// console.log(pm.isMatch('foo/bar', '**/[a-k]*'));
// console.log(pm.isMatch('foo/jar', '**/[a-k]*'));
// console.log(pm.isMatch('foo/jar', '**/[a-i]*'));
// console.log(pm.isMatch('foo/jar', '**/[a-i]ar'));

// var fixtures = ['../../b', '../a', '../c', '../c/d', '.a/a', '/a', '/a/', 'a', 'a/', 'a/../a', 'a/.a', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z', 'aa/a', 'aaa/a', 'aab/a', 'ab/../ac'];

// console.log(pm(fixtures, '/**/*'));
// console.log(nm(fixtures, '/**/*'));

console.log(nm.isMatch('foo/bar/', '*/*'));
console.log(pm.isMatch('foo/bar/', '*/*'));
console.log(mm('foo/bar/', '*/*'));
