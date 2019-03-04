// 'use strict';

const pm = require('..');
const mm = require('../vendor/minimatch');
const mi = require('micromatch');
const colors = require('ansi-colors');
const color = val => val === true ? colors.green(val) : colors.red(val);
// const bash = require('bash-match');

console.log(pm('E*d')('Edward'));

// console.log('mm', 'pm');
// const match = (str, pattern) => {
//   let arr = [mm(str, pattern), pm(pattern)(str)];
//   arr.push(color(arr[0] === arr[1]));
//   if (arr[0] !== arr[1]) arr.push([str, pattern].join(', '));
//   arr = arr.map(v => String(v).padEnd(5, ' '));
//   console.log(arr.join(' '));
// };

// // console.log(pm.makeRe('*'));
// // console.log(bash.isMatch('foo/bar', '!(foo)'));
// // console.log(bash.isMatch('cc.d', '!(!(a|b)c.!(d|e))'));
// console.log(bash.isMatch('foo/bar/baz', '*'));
// // console.log(bash.isMatch('moo.cow', '!(*.*).!(*.*)'));
// // console.log(pm.isMatch('moo.cow', '!(*.*).!(*.*)'));
// // console.log(mm('moo.cow', '!(*.*).!(*.*)'));
// // console.log(pm.makeRe('[[:word:]]+', { posix: true }));
// // console.log(pm.scan('./!foo/bar/*.js'));
// // console.log(pm.scan('!./foo/bar/*.js'));
// // { isGlob: true, input: 'foo/bar/*.js', path: 'foo/bar', parts: [ 'foo', 'bar' ], glob: '*.js' }

// // console.log(pm.isMatch('.', ''));
// // console.log(pm.makeRe('c*3.txt', { base: 'foo/bar/baz' }));
// // console.log(pm.makeRe('c*3.txt', { strictSlashes: true }));

// // console.log(mm.makeRe('!**/a.js'))
// // console.log(pm.makeRe('!**/a.js'))
// // console.log(pm.makeRe('ab**(e|f)'))
// // console.log(pm.isMatch('ab', 'ab**(e|f)'))
// // console.log(pm.makeRe('@(foo|f|fo)*(f|of+(o))'))
// // console.log(pm.isMatch('.foofoofo', '@(foo|f|fo)*(f|of+(o))'))

// // console.log(mm.makeRe('!c*3.txt'))
// // console.log(pm.makeRe('!c*3.txt'))

// // console.log(mm.makeRe('foo.txt'));
// // console.log(pm.makeRe('foo.txt'));
// // console.log(pm.makeRe('*.js'));
// // console.log(mm.makeRe('*(foo)'));
// // console.log(pm.makeRe('*(foo)', { noextglob: true }));

// // console.log(pm.makeRe('**', { strict: true }));
// // console.log(mm.makeRe('**', { strict: true }));
// // console.log(nm.makeRe('**', { strict: true }));
// // /^(?!^(?:a\/(?:(?!(?:\/|^)\.).)*?)$).*$/

// // console.log(mm.match(['a/a/a/a/a'], 'a/*/*/*/*'));

// // const regex = pm.makeRe('ORDER NO. {0001..0025}', {
// //   toRange(a, b) {
// //     console.log(a, b)
// //     return `(${fill(a, b, { toRegex: true })})`;
// //   }
// // });

// // console.log(regex);
// // //=> /^(?:ORDER - /([1-9]|1[0-9]|2[0-5])(?:\/|$))$/

// // console.log(regex.test('ORDER - 000'))  // false
// // console.log(regex.test('ORDER - 001'))  // false
// // console.log(regex.test('ORDER - 0010')) // true
// // console.log(regex.test('ORDER - 0022')) // true
// // console.log(regex.test('ORDER - 0025')) // true
// // console.log(regex.test('ORDER - 0026')) // false

// // console.log(pm.isMatch('foo/bar/baz/qux', 'foo/bar/baz/*', { scan: true }));
// // console.log(/^(?=(?!\.)(?=.)[^\/]*?\/?)/.test('abc.txt'))

// const parent = require('glob-parent');

// console.log(parent('a/\\+\\(b c)/foo'))

// console.log(pm.base('foo/bar', 'one/two/*.js'));
// { base: 'foo/bar/one/two', glob: '*.js' }

// console.log(pm.base('foo\\bar\\', '*.js'));
// console.log(pm.join('foo\\bar\\', '\\*.js'));
// const [ base, pattern ] = pm.split('tests/*.js');

// console.log(glob.sync(pattern, { cwd: pm.join(__dirname, base) }))

// console.log(pm.join(__dirname, 'foo\\bar', 'baz\\qux', '\\*.js'));
// console.log(pm.join(__dirname, 'foo\\bar', 'baz\\qux', '\\*.js'));
// console.log(pm.join(__dirname, 'foo\\bar', 'baz\\qux', '*.js'));
// // console.log(pm.resolve('foo\\bar\\', '*.js'));
// // console.log(pm.resolve('foo\\bar', '\\*.js'));
// console.log(pm.resolve('foo\\bar\\', '\\*.js'));


// let isMatch = pm('**/foo/**/package.json');
// console.log(isMatch('packages/foo/package.json'));

// console.log(mm.makeRe('a/**'));
// console.log(pm.makeRe('a/**'));
// console.log('---')
// console.log(mm.makeRe('a/**/*.txt'));
// console.log(pm.makeRe('a/**/*.txt'));

// console.log(mm('/a', '*'));
// console.log(mm('a', 'a/**'));
// console.log(mi.isMatch('a', 'a/**'));
// console.log(pm('a/**', { relaxSlashes: true })('a'));
// console.log(pm('a/**')('a'));

// match('a', '*');
// match('a/', '*');
// match('/a', '*');
// match('/a/', '*');
// console.log('---');

// match('a', '/*');
// match('a/', '/*');
// match('/a', '/*');
// match('/a/', '/*');
// console.log('---');

// match('a', '*/*');
// match('a/', '*/*');
// match('/a', '*/*');
// match('/a/', '*/*');
// console.log('---');

// match('a', 'a/*');
// match('a/', 'a/*');
// match('/a', 'a/*');
// match('/a/', 'a/*');
// console.log('---');

// match('a', 'a/*');
// match('a/', 'a/*');
// match('/a', 'a/*');
// match('/a/', 'a/*');
// console.log('---');

// match('a', 'a/*/');
// match('a/', 'a/*/');
// match('/a', 'a/*/');
// match('/a/', 'a/*/');
// console.log('---');

// match('a', '/a/**');
// match('a/', '/a/**');
// match('/a', '/a/**');
// match('/a/', '/a/**');
// console.log('---');

// match('a', 'a/**');
// match('a/', 'a/**');
// match('/a', 'a/**');
// match('/a/', 'a/**');
// console.log('---');

// match('a/../a', 'a/**/*');
// match('a/', 'a/**/');
// match('/a/', '/*/**/*');
// match('..', '**/*');
// match('foo/bar/bazqux.js', '**/!(bazqux).js');
// match('foo/bars', '!(foo)');
// match('..', '**/*', { dot: true });
// console.log('---');

// console.log(mm.makeRe('a/**/*'))
// console.log(pm.makeRe('a/**/**/*'))
// console.log(pm.makeRe('**/a/**'))
// console.log(pm.makeRe('**/**/**'))
// console.log('pm', pm.makeRe('a/!(b*)'));
// console.log('mm', mm.makeRe('a/!(b*)'));
// console.log('---');
// console.log('pm', pm.makeRe('**/!(bazqux).js'));
// console.log('mm', mm.makeRe('**/!(bazqux).js'));
// console.log('---');
// console.log('pm', pm.makeRe('!(foo)'));
// console.log('mm', mm.makeRe('!(foo)'));

// console.log(mm('a', '**/a'));
// console.log(mm('/a', '*'));
// console.log(mm('a', 'a/**'));
// console.log(mm('a', '**/a'));
// console.log(mm('/a', '*'));

// console.log(pm('**/a')('a'));
// console.log(pm('a/**')('a'));
// console.log(pm('*')('/a'));
// console.log(mm('a/b.txt', 'a/**/*.txt'));
// let re = pm.makeRe('a/**/*.txt');
// console.log(re.test('a/b.txt'));
// [ 'packages/foo-foo/package.json' ]
//
// console.log(pm.parse('!(a|b|c)'));

// console.log(pm('*^⛄/')('^⛄/'));
