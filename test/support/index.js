'use strict';

const path = require('path');

// Don't use "path.sep" here, as it's conceivable that it might have been
// modified somewhere by the user. Node.js only handles these two path separators
// with similar logic, and this is only for unit tests, so we should be fine.
const sep = process.platform === 'win32' ? '\\' : '/';

module.exports = {
  windowsPathSep() {
    path.sep = '\\';
  },
  resetPathSep() {
    path.sep = sep;
  }
};
