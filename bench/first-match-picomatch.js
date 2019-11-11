'use strict';

const pm = require('..');

console.time('picomatch');
console.log(pm.makeRe('**/*').test('foo/bar/baz/qux.js'));
console.timeEnd('picomatch');
