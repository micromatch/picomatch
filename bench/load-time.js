console.log('# Load time');
console.time('minimatch');
exports.mini = require('minimatch');
console.timeEnd('minimatch');
console.time('picomatch');
exports.pico = require('..');
console.timeEnd('picomatch');
console.log();
