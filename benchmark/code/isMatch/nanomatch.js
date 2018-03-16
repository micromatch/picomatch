'use strict';

var nanomatch = require('nanomatch');

module.exports = function(file, pattern) {
  return nanomatch.isMatch(file, pattern);
};
