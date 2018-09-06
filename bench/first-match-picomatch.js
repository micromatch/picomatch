require('ansi-colors') // noop require to prime the cache

console.time('picomatch');
console.log(require('..').makeRe('*', { strictSlashes: true }));
console.timeEnd('picomatch');
