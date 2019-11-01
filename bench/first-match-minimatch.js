'use strict';

const mm = require('minimatch');

console.time('minimatch');
console.log(mm.makeRe('**/*').test('foo/bar/baz/qux.js'));
console.timeEnd('minimatch');
