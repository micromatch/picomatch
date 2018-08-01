var micromatch = require('micromatch');

module.exports = function(files, pattern) {
  return micromatch.match(files, pattern);
};
