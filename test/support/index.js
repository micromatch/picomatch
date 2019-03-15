'use strict';

const path = require('path');

// Don't use "path.sep" here, as it's conceivable that it might have been
// modified somewhere by the user. Node.js only handles these two path separators
// with similar logic, and this is only for unit tests, so we should be fine.
const sep = process.platform === 'win32' ? '\\' : '/';
const origSep = process.env.ORIGINAL_PATH_SEP || (process.env.ORIGINAL_PATH_SEP = sep);

module.exports = {
  disableCache(picomatch = {}) {
    picomatch.cache = null;
  },
  enableCache(picomatch = {}) {
    picomatch.cache = {};
  },
  windowsPathSep() {
    path.sep = '\\';
  },
  resetPathSep() {
    process.env.ORIGINAL_PATH_SEP = sep;
  }
};
