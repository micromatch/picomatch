'use strict';

const picomatch = require('../..');

module.exports = (list, pattern, options = {}) => {
  let isMatch = picomatch(pattern, options, true);
  let matches = options.matches || new Set();

  for (let item of [].concat(list)) {
    let match = isMatch(item, true);
    if (match && match.output && match.isMatch === true) {
      matches.add(match.output);
    }
  }

  return [...matches];
};
