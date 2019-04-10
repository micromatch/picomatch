'use strict';

const pm = require('..');

console.log(pm.test('foo/bar', /^(?:([^/]*?)\/([^/]*?))$/));
// { isMatch: true, match: [ 'foo/', 'foo', 'bar' ], output: 'foo/bar' }
