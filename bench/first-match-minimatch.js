require('./package') // noop require to prime the cache

console.time('minimatch');
console.log(require('minimatch').makeRe('*'));
console.timeEnd('minimatch');
