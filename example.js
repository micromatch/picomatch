'use strict';

var mu = require('multimatch');
var mm = require('micromatch');
var mi = require('minimatch');
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


// console.log(mi.match(['foo', 'bar'], '!baz'));
// //=> [ 'foo', 'bar' ]
// console.log(mm(['foo', 'bar'], '!baz'));
// //=> [ 'foo', 'bar' ]
// console.log(mu(['foo', 'bar'], '!baz'));
// //=> []

// console.log(mi.match(['foo', 'bar'], '!bar'));
// //=> [ 'foo', 'bar' ]
// console.log(mm(['foo', 'bar'], '!bar'));
// //=> [ 'foo', 'bar' ]
// console.log(mu(['foo', 'bar'], '!bar'));
// //=> []

// console.log(mi.match(['foo/bar', 'foo/baz'], ['!foo/*']));
// //=> [ 'foo', 'bar' ]

console.log(mm(['foo/bar', 'foo/baz'], ['!*/bar', 'foo/*', '*/bar'])); //=> [ 'foo/baz' ]
// console.log(mu(['foo/bar', 'foo/baz'], ['!*/bar', 'foo/*', '*/bar'])); //=> [ 'foo/bar', 'foo/baz' ]

// console.log(mm(['foo/bar', 'foo/baz'], ['foo/*', '!*/bar'])); //=> [ 'foo/baz' ]
// console.log(mu(['foo/bar', 'foo/baz'], ['foo/*', '!*/bar'])); //=> [ 'foo/baz' ]

// var mm = require('mm');
// var fixtures = ['bar/bar'];
// var result = mm(fixtures, ['foo/**', '!bar/bar']);
// console.log(result);
// //=> []

// console.log(pm(fixtures, '/**/*'));
// console.log(nm(fixtures, '/**/*'));

// console.log(nm.isMatch('foo/bar/', '*/*'));
// console.log(pm.isMatch('foo/bar/', '*/*'));
// console.log(mi('foo/bar/', '*/*'));

// console.log(nm.isMatch('a/', '*/*'));
// console.log(pm.isMatch('a/', '*/*'));
// console.log(mi('a/', '*/*'));
// console.log(nm.isMatch('a/b', '*/*'));
// console.log(pm.isMatch('a/b', '*/*'));
// console.log(mi('a/b', '*/*'));

// console.log(/^(?:[^/.]*?\/[^/.]*?)$/.test('a/'))

// console.log(pm.makeRe('**/fooc09.js'))
// /^(?:(?:^|\.\/)(?:(?!(?:\/|^)\.).)*?\/?fooc09\.js)$/
// /^(?:(^(?=.)|(?=.)(?!\.)(?:(?!(?:\/|^)\.).)*?\/)fooc09\.js(?:\/|$))$/
// console.log(nm.makeRe('**/fooc09.js'))
console.log(mi.makeRe('foo/*/bar.js'))
console.log(mm.makeRe('foo/*/bar.js'))
