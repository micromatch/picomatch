'use strict';

const fill = require('fill-range');
const mm = require('minimatch');
const bash = require('bash-match');
const pm = require('./');

// console.log(pm.isMatch('.', ''))
// console.log(mm.makeRe('c*3.txt'))
// console.log(pm.makeRe('c*3.txt', { strictSlashes: true }))

// console.log(mm.makeRe('!**/a.js'))
// console.log(pm.makeRe('!**/a.js'))
// console.log(pm.makeRe('ab**(e|f)'))
// console.log(pm.isMatch('ab', 'ab**(e|f)'))
console.log(pm.makeRe('@(foo|f|fo)*(f|of+(o))'))
console.log(pm.isMatch('.foofoofo', '@(foo|f|fo)*(f|of+(o))'))

// console.log(mm.makeRe('!c*3.txt'))
// console.log(pm.makeRe('!c*3.txt'))

// console.log(mm.makeRe('foo.txt'));
// console.log(pm.makeRe('foo.txt'));
// console.log(pm.makeRe('*.js'));
// console.log(mm.makeRe('*(foo)'));
// console.log(pm.makeRe('*(foo)', { noextglob: true }));

// console.log(pm.makeRe('**', { strict: true }));
// console.log(mm.makeRe('**', { strict: true }));
// console.log(nm.makeRe('**', { strict: true }));
// /^(?!^(?:a\/(?:(?!(?:\/|^)\.).)*?)$).*$/

// console.log(mm.match(['a/a/a/a/a'], 'a/*/*/*/*'));

// const regex = pm.makeRe('ORDER NO. {0001..0025}', {
//   toRange(a, b) {
//     console.log(a, b)
//     return `(${fill(a, b, { toRegex: true })})`;
//   }
// });

// console.log(regex);
// //=> /^(?:ORDER - /([1-9]|1[0-9]|2[0-5])(?:\/|$))$/

// console.log(regex.test('ORDER - 000'))  // false
// console.log(regex.test('ORDER - 001'))  // false
// console.log(regex.test('ORDER - 0010')) // true
// console.log(regex.test('ORDER - 0022')) // true
// console.log(regex.test('ORDER - 0025')) // true
// console.log(regex.test('ORDER - 0026')) // false

