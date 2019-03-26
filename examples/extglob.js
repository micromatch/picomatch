const pm = require('..');

console.log(pm.makeRe('!(foo)'));
console.log('---');
console.log();

console.log(pm.makeRe('!(foo)', { noext: true }));
console.log('---');
console.log();

console.log(pm.makeRe('(foo)'));
console.log('---');
console.log();

console.log(pm.makeRe('(foo)', { noext: true }));

