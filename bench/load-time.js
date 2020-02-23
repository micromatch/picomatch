'use strict';

const libs = {
  get pm() {
    return require('..');
  },
  get mm() {
    return require('minimatch');
  }
};

console.log('# Load time');
console.time('picomatch');
libs.pm;
console.timeEnd('picomatch');
console.time('minimatch');
libs.mm;
console.timeEnd('minimatch');
console.log();
