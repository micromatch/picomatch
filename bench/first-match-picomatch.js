require('./package') // noop require to prime the cache

console.time('picomatch');
console.log(require('..').makeRe('*'));
console.timeEnd('picomatch');
