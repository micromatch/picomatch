const mm = require('minimatch');
const pm = require('..');

console.log(mm.makeRe('*\\\\*'));
console.log(pm.makeRe('*\\\\*'));
