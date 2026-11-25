'use strict';

const { globRegExp } = require('./glob-regexp');
const { UnsupportedRegex } = require('./regex-reader');

/**
 * Create a RegExp from `source` whose `test()` and `exec()` cannot be stalled by
 * backtracking: the regex itself runs where its backtracking is bounded, and a DFA
 * built from the source decides past that. Everything else about the returned object,
 * its source, flags and capture groups, is that of `new RegExp(source, flags)`.
 *
 * @param {String} `source` Regular expression source string.
 * @param {String} `flags` Regular expression flags; only `''` and `'i'` are handled.
 * @return {RegExp|null} `null` when the flags or the syntax of the source are not handled.
 */

module.exports = (source, flags) => {
  try {
    return globRegExp(source, flags);
  } catch (err) {
    if (err instanceof UnsupportedRegex) return null;
    throw err;
  }
};
