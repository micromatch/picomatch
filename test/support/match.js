'use strict';

const picomatch = require('../..');

module.exports = (list, pattern, options = {}) => {
  let matches = options.matches || new Set();
  let matcher = options.onMatch || (state => matches.add(state.value));
  let onMatch = state => matcher(state, matches);
  let isMatch = picomatch(pattern, { ...options, onMatch });
  [].concat(list).forEach(item => isMatch(item));
  return [...matches];
};
