console.time('picomatch');
console.log(require('../split').makeRe('**/*').test('foo/bar/baz/qux.js'));
console.timeEnd('picomatch');
// picomatch: 7.429ms
