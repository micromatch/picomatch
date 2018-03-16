var multimatch = require('multimatch');

module.exports = function(file, pattern) {
  return multimatch(file, pattern).length > 0;
};
