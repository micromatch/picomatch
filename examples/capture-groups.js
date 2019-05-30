'use strict';

const pm = require('..');
const re = pm.makeRe('foo/bar/(?<folder>*)/*.js');
console.log(re.exec('foo/bar/baz/qux.js'));
