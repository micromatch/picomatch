'use strict';

const picomatch = require('../..');
let cache;

Reflect.defineProperty(picomatch, 'cache', {
  set(value) {
    cache = value;
  },
  get() {
    if (process.env.PICOMATCH_NO_CACHE === 'true') {
      cache = null;
    } else {
      cache = cache || {};
    }
    return cache;
  }
});

if (process.env.PICOMATCH_NO_CACHE === 'true') {
  picomatch.cache = null;
}

module.exports = (list, pattern, options = {}) => {
  let matches = options.matches || new Set();
  let matcher = options.onMatch || (state => matches.add(state.output));
  let onMatch = state => matcher(state, matches);
  let isMatch = picomatch(pattern, { ...options, onMatch });
  [].concat(list).forEach(item => isMatch(item));
  return [...matches];
};
