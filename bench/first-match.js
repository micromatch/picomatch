console.time('minimatch');
const minimatch = require('minimatch');
console.log(minimatch('foo/bar', '**/b*'));
console.log(minimatch('foo/bar', '!**/b*'));
console.log(minimatch('foo/bar', '!**/{c,d}*'));
console.timeEnd('minimatch');

console.time('picomatch');
const picomatch = require('..');
console.log(picomatch.isMatch('foo/bar', '**/b*', { nocache: true }));
console.log(picomatch.isMatch('foo/bar', '!**/b*', { nocache: true }));
console.log(picomatch.isMatch('foo/bar', '!**/{c,d}*', { nocache: true }));
console.timeEnd('picomatch');
// picomatch: 2.556ms
