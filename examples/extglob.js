const mm = require('minimatch');
const pm = require('..');

console.log(mm.makeRe('!(foo)'));
console.log(pm.makeRe('!(foo)'));
