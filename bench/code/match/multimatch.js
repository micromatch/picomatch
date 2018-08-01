var multimatch = require('multimatch');

module.exports = function(files, patterns) {
  var isNegated = typeof patterns === 'string' && patterns.charAt(0) === '!';
  patterns = Array.isArray(patterns) ? patterns : [patterns];
  if (isNegated && patterns.length === 1) {
    patterns.unshift('**/*');
  }

  return multimatch(files, patterns);
};
