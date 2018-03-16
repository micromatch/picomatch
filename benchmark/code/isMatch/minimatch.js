var minimatch = require('minimatch');

module.exports = function(files, pattern) {
  files = Array.isArray(files) ? files : [files];
  return minimatch.match(files, pattern).length > 0;
};
