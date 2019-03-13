console.time('picomatch');
console.log(require('..').makeRe('**/*').test('foo/bar/baz/qux.js'));
console.timeEnd('picomatch');
// picomatch: 7.429ms
