console.log('# Load time');
console.time('minimatch');
exports.mm = require('minimatch');
console.timeEnd('minimatch');
console.time('picomatch');
exports.pm = require('../split');
console.timeEnd('picomatch');
console.log();
