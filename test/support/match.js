'use strict';

const picomatch = require('../..');

module.exports = (list, pattern, options = {}) => {
  const isMatch = picomatch(pattern, options, true);
  const matches = options.matches || new Set();

  for (const item of [].concat(list)) {
    const match = isMatch(item, true);
    if (match && match.output && match.isMatch === true) {
      matches.add(match.output);
    }
  }

  return [...matches];
};
