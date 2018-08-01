const assert = require('assert');
const pm = require('./');
const gr = require('./tmp/globrex');
const mm = require('./vendor/minimatch');

console.log(mm.match(['a/bb/e.md'], 'a/??/e.md'))
// console.log(pm.toRegex('a/?/c.md'));
// console.log(gr('a/?/c.md'));
// const isMatch = (str, pattern) => gr(pattern).regex.test(str);
// const isMatch = (str, pattern) => {
//   console.log(mm.makeRe(pattern))
//   return mm.makeRe(pattern).test(str);
// }
const isMatch = (str, pattern) => {
  console.log(pm.makeRe(pattern))
  return pm.makeRe(pattern).test(str);
}

// assert(!isMatch('a/.b', 'a/**/z/*.md'));
// assert(!isMatch('a/b/c/j/e/z/c.txt', 'a/**/j/**/z/*.md'));
// assert(isMatch('a', 'a/**'));
// assert(!isMatch('a/b/z/.a', 'a/**/z/*.a'));
// assert(!isMatch('a/b/z/.a', 'a/*/z/*.a'));
// assert(isMatch('a/.b', 'a/.*'));
// assert(isMatch('a/b/c/d/e/j/n/p/o/z/c.md', 'a/**/j/**/z/*.md'));
// assert(isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md'));
// assert(isMatch('a/b/z/.a', 'a/*/z/.a'));

// /^(?:a\/?(?:(?!(?:\/|^)\.).)*?\/z\/[^\/]*?\.a)$/
// /^(?:a\/?(?:(?!(?:\/|^)\.).)*?\/z\/(?!\.)(?=.)[^\/]*?\.a)$/
