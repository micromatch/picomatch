'use strict';

const path = require('path');
const pm = require('..');
const sep = path.sep;

console.log();
console.log('======= POSIX =======');
console.log();

console.log(pm.makeRe('*\\*'));
console.log(pm.makeRe('*\\*').test('foo/bar'));
console.log(pm.makeRe('*\\*').test('foo\\bar'));
console.log(pm.makeRe('*\\\\*'));
console.log(pm.makeRe('*\\\\*').test('foo/bar'));
console.log(pm.makeRe('*\\\\*').test('foo\\bar'));
console.log(pm.makeRe('*/*'));
console.log(pm.makeRe('*/*').test('foo/bar'));
console.log(pm.makeRe('*/*').test('foo\\bar'));

console.log();
console.log('======= WINDOWS =======');
console.log();

path.sep = '\\';
console.log(pm.makeRe('*\\*'));
console.log(pm.makeRe('*\\*').test('foo/bar'));
console.log(pm.makeRe('*\\*').test('foo\\bar'));
console.log(pm.makeRe('*\\\\*'));
console.log(pm.makeRe('*\\\\*').test('foo/bar'));
console.log(pm.makeRe('*\\\\*').test('foo\\bar'));
console.log(pm.makeRe('*/*'));
console.log(pm.makeRe('*/*').test('foo/bar'));
console.log(pm.makeRe('*/*').test('foo\\bar'));
path.sep = sep;
