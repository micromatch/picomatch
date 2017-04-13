var nm = require('nanomatch');
var pm = require('./');

// console.log(nm.makeRe('*.js'))
// console.log(pm.makeRe('*.js'))
// console.log();
// console.log(nm.makeRe('**/*.js'))
// console.log(pm.makeRe('**/*.js'))
// console.log();
// console.log(nm.makeRe('a/*.js'))
// console.log(pm.makeRe('a/*.js'))
// console.log();
// console.log(nm.makeRe('!a/b.txt'))
// console.log(pm.makeRe('!a/b.txt'))
console.log();
// console.log(nm.makeRe('**/bar/**'))
console.log(pm.makeRe('a/**'))
// /^(?:(?!^(?:a\/b\.txt)$).*)$/
// /(?!^(?:a\/b\.txt)$).*/i
// console.log(nm(['a/', 'a/b'], 'a/**/*'))

// // console.log(pm(['a', 'a/b', 'a/b/c', 'a/b/'], 'a/**'))
// console.log(pm(['a', 'a/b', 'a/b/c', 'a/b/'], 'a/**/'))
// console.log(pm(['a', 'a/b', 'a/b/c', 'a/b/'], 'a/**/**/'))
// // console.log(pm(['a', 'a/b', 'a/b/c', 'a/b/'], 'a/*******/'))
