'use strict';

const path = require('path');
const win32 = process.platform === 'win32';
const SPECIAL_CHAR_REGEX = /[-[$*+?.^{}(|)\]]/;

exports.isObject = val => val !== null && typeof val === 'object' && !Array.isArray(val);
exports.hasRegexChars = str => SPECIAL_CHAR_REGEX.test(str);
exports.isRegexChar = str => str.length === 1 && exports.hasRegexChars(str);
exports.escapeRegex = str => str.replace(/([-[$*+?.^{}(|)\]])/g, '\\$1');
exports.toPosixSlashes = str => str.replace(/\\/g, '/');

exports.isWindows = options => {
  if (options && typeof options.windows === 'boolean') {
    return options.windows;
  }
  return win32 === true || path.sep === '\\';
};

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
