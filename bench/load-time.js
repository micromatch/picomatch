
console.log('# Load time');
console.time('picomatch');
exports.pm = require('../lib');
console.timeEnd('picomatch');
console.time('minimatch');
exports.mm = require('minimatch');
console.timeEnd('minimatch');
console.log();
