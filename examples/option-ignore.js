
const pm = require('../lib');

const isMatch = pm.matcher('*', { ignore: 'f*' });
console.log(isMatch('foo')); //=> false
console.log(isMatch('bar')); //=> true
console.log(isMatch('baz')); //=> true
