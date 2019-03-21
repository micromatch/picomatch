const mi = require('micromatch');
const mm = require('minimatch');
const pm = require('..');

console.log(mm.makeRe('!(foo)'));
console.log(pm.makeRe('!(foo)'));
console.log(mi.makeRe('!(foo)'));
console.log('---');
console.log();

console.log(mm.makeRe('!(foo)', { noext: true }));
console.log(pm.makeRe('!(foo)', { noext: true }));
console.log(mi.makeRe('!(foo)', { noext: true }));
console.log('---');
console.log();

console.log(mm.makeRe('(foo)'));
console.log(pm.makeRe('(foo)'));
console.log(mi.makeRe('(foo)'));
console.log('---');
console.log();

console.log(mm.makeRe('(foo)', { noext: true }));
console.log(pm.makeRe('(foo)', { noext: true }));
console.log(mi.makeRe('(foo)', { noext: true }));

