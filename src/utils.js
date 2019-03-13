'use strict';

const path = require('path');
const win32 = process.platform === 'win32';
const SPECIAL_CHAR_REGEX = /[-[$*+?.#^\s{}(|)\]]/;

exports.hasRegexChars = str => SPECIAL_CHAR_REGEX.test(str);
exports.isRegexChar = str => str.length === 1 && exports.hasRegexChars(str);
exports.escapeRegex = str => str.replace(/([-[$*+?.#^\s{}(|)\]])/g, '\\$1');

exports.findLastIndex = (arr, fn, limit = arr.length) => {
  for (let i = arr.length - 1; i >= arr.length - limit; i--) {
    if (fn(arr[i], i, arr) === true) {
      return i;
    }
  }
};

exports.escapeLast = (input, char, lastIdx) => {
  let idx = input.lastIndexOf(char, lastIdx);
  if (idx === -1) return input;
  if (input[idx - 1] === '\\') return exports.escapeLast(input, char, idx - 1);
  return input.slice(0, idx) + '\\' + input.slice(idx);
};

exports.isWindows = options => {
  if (options && (options.unixify === false || options.posixSlashes === false)) {
    return false;
  }
  if (win32 === true || path.sep === '\\') {
    return true;
  }
  return options && (options.unixify === true || options.posixSlashes === true);
};
