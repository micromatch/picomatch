console.time('minimatch');
const minimatch = require('minimatch');
console.log(minimatch.makeRe('*'));
console.timeEnd('minimatch');

console.time('picomatch');
const picomatch = require('..');
console.log(picomatch.makeRe('*'));
// picomatch.makeRe('!(*.[a-b]*)');
// picomatch.makeRe('!**/b*');
// picomatch.makeRe('!*.(a|b)');
// picomatch.makeRe('!*.(a|b)*');
// picomatch.makeRe('*');
// picomatch.makeRe('**');
// picomatch.makeRe('**/**');
// picomatch.makeRe('**/*.js');
// picomatch.makeRe('**/{c,d}/*');
// picomatch.makeRe('**/{c,d}/*');
// picomatch.makeRe('*.!(a)');
// picomatch.makeRe('*.+(b|d)');
// picomatch.makeRe('*.+(b|d);');
// picomatch.makeRe('*/');
// picomatch.makeRe('*/*/');
// picomatch.makeRe('*/*/*/');
// picomatch.makeRe('*/*/*/*/');
// picomatch.makeRe('*/*/*/*/*/');
// picomatch.makeRe('@(b|a).@(a)');
// picomatch.makeRe('a/*/');
// picomatch.makeRe('a/*/*/');
// picomatch.makeRe('a/*/*/*/');
// picomatch.makeRe('a/*/*/*/*/');
// picomatch.makeRe('a/*/a/');
// picomatch.makeRe('a/*/b/');
// picomatch.makeRe('a/{a,b,c}');
// picomatch.makeRe('a/{a,b,c}');
// picomatch.makeRe('a/{a,b}');
// picomatch.makeRe('a/{a,b}');
// picomatch.makeRe('a/{a,b}');
// picomatch.makeRe('a/{a..c}');
// picomatch.makeRe('a/{a..c}');
// picomatch.makeRe('a/{a..c}');
// picomatch.makeRe('foo/*/*.js');
// picomatch.makeRe('foo/*/bar');
console.timeEnd('picomatch');

// minimatch: 11.708ms
// picomatch: 2.487ms

// minimatch: 5.153ms
// picomatch: 5.092ms

// /^(?:(?!\.)(?=.)[^\/]*?)$/
// minimatch: 9.974ms
// /^(?=.)(?!\.)(?=.)[^\/]*?\/?$/
// picomatch: 4.545ms
