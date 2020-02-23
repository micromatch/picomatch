'use strict';

const libs = {
  pm() {
    return require('..');
  },
  mm() {
    return require('minimatch');
  }
};

console.log('# Load time');
console.time('picomatch');
libs.pm();
console.timeEnd('picomatch');
console.time('minimatch');
libs.mm();
console.timeEnd('minimatch');
console.log();
