var picomatch = require('../../..');

module.exports = function(files, pattern) {
  return picomatch.match(files, pattern);
};
