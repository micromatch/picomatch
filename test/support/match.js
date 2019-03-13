'use strict';

const picomatch = require('../..');

module.exports = (list, pattern, options = {}) => {
  let matches = options.matches || new Set();
  let onMatch = state => matches.add(state.value);
  let isMatch = picomatch(pattern, { onMatch, ...options, matches });
  [].concat(list).forEach(item => isMatch(item));
  return [...matches];
};

// module.exports = (list, pattern, options) => {
//   let isMatch = picomatch(pattern, options);
//   let format = (options && options.format) || (str => str);
//   let matches = new Set();
//   for (let str of list) {
//     if (isMatch(format(str))) {
//       matches.add(str);
//     }
//   }
//   return [...matches];
// };
