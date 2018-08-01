'use strict';

var micromatch = require('micromatch');

module.exports = function(file, pattern) {
  return micromatch.isMatch(file, pattern);
};
