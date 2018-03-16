'use strict';

var picomatch = require('../../..');

module.exports = function(file, pattern) {
  return picomatch.isMatch(file, pattern);
};
