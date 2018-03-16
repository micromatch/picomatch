var nanomatch = require('nanomatch');

module.exports = function(files, pattern) {
  return nanomatch.match(files, pattern);
};
