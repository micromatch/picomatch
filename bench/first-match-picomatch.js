
const pm = require('../lib');

console.time('picomatch');
console.log(pm.makeRe('**/*').test('foo/bar/baz/qux.js'));
console.timeEnd('picomatch');
