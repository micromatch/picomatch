
const pico = require('../lib');

/**
 * See: https://github.com/gulpjs/glob-parent/issues/39#issuecomment-794075641
 */

const files = [
  'data/100-123a_files/0/',
  'data/100-123a_files/1/',
  'data/100-123a_files/2/',
  'data/100-123a_files/3/',
  'data/100-123b_files/0/',
  'data/100-123b_files/1/',
  'data/100-123b_files/2/',
  'data/100-123b_files/3/',
  'data/100-123a_files/4/',
  'data/100-123ax_files/0/',
  'data/100-123A_files/0/',
  'data/100-123A_files/1/',
  'data/100-123A_files/2/',
  'data/100-123A_files/3/',
  'data/100-123B_files/0/',
  'data/100-123B_files/1/',
  'data/100-123B_files/2/',
  'data/100-123B_files/3/',
  'data/100-123A_files/4/',
  'data/100-123AX_files/0/'
];

// ? is a wildcard for matching one character
// by escaping \\{0,3}, and then using `{ unescape: true }, we tell
// picomatch to treat those characters as a regex quantifier, versus
// a brace pattern.

const isMatch = pico('data/100-123?\\{0,3}_files/{0..3}/', { unescape: true });
console.log(files.filter(name => isMatch(name)));

// Alternatively, we can use a regex character class to be more specific
// In the following example, we'll only match uppercase alpha characters
const isMatch2 = pico('data/100-123[A-Z]*_files/{0..3}/', { unescape: true });
console.log(files.filter(name => isMatch2(name)));
