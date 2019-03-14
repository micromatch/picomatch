'use strict';

require('mocha');
const path = require('path');
const assert = require('assert');
const { clearCache, isMatch } = require('..');

if (!process.env.ORIGINAL_PATH_SEP) {
  process.env.ORIGINAL_PATH_SEP = path.sep
}

describe('slash handling - windows', () => {
  beforeEach(() => clearCache());
  beforeEach(() => (path.sep = '\\'));
  afterEach(() => (path.sep = process.env.ORIGINAL_PATH_SEP));

  it('should match windows path separators with a string literal', () => {
    assert(!isMatch('a\\a', '(a/b)'));
    assert(isMatch('a\\b', '(a/b)'));
    assert(!isMatch('a\\c', '(a/b)'));
    assert(!isMatch('b\\a', '(a/b)'));
    assert(!isMatch('b\\b', '(a/b)'));
    assert(!isMatch('b\\c', '(a/b)'));

    assert(!isMatch('a\\a', 'a/b'));
    assert(isMatch('a\\b', 'a/b'));
    assert(!isMatch('a\\c', 'a/b'));
    assert(!isMatch('b\\a', 'a/b'));
    assert(!isMatch('b\\b', 'a/b'));
    assert(!isMatch('b\\c', 'a/b'));
  });

  it('should not match literal backslashes with literal forward slashes when unixify is disabled', () => {
    assert(!isMatch('a\\a', 'a\\b', { unixify: false }));
    assert(isMatch('a\\b', 'a\\b', { unixify: false }));
    assert(!isMatch('a\\c', 'a\\b', { unixify: false }));
    assert(!isMatch('b\\a', 'a\\b', { unixify: false }));
    assert(!isMatch('b\\b', 'a\\b', { unixify: false }));
    assert(!isMatch('b\\c', 'a\\b', { unixify: false }));

    assert(!isMatch('a\\a', 'a/b', { unixify: false }));
    assert(!isMatch('a\\b', 'a/b', { unixify: false }));
    assert(!isMatch('a\\c', 'a/b', { unixify: false }));
    assert(!isMatch('b\\a', 'a/b', { unixify: false }));
    assert(!isMatch('b\\b', 'a/b', { unixify: false }));
    assert(!isMatch('b\\c', 'a/b', { unixify: false }));
  });

  it('should match an array of literal strings', () => {
    assert(!isMatch('a\\a', '(a/b)'));
    assert(isMatch('a\\b', '(a/b)'));
    assert(!isMatch('a\\c', '(a/b)'));
    assert(!isMatch('b\\a', '(a/b)'));
    assert(!isMatch('b\\b', '(a/b)'));
    assert(!isMatch('b\\c', '(a/b)'));
  });

  it('should not match backslashes with forward slashes when unixify is disabled', () => {
    assert(!isMatch('a\\a', 'a/(a|c)', { unixify: false }));
    assert(!isMatch('a\\b', 'a/(a|c)', { unixify: false }));
    assert(!isMatch('a\\c', 'a/(a|c)', { unixify: false }));
    assert(!isMatch('a\\a', 'a/(a|b|c)', { unixify: false }));
    assert(!isMatch('a\\b', 'a/(a|b|c)', { unixify: false }));
    assert(!isMatch('a\\c', 'a/(a|b|c)', { unixify: false }));
    assert(!isMatch('a\\a', '(a\\b)', { unixify: false }));
    assert(isMatch('a\\b', '(a\\\\b)', { unixify: false }));
    assert(!isMatch('a\\c', '(a\\b)', { unixify: false }));
    assert(!isMatch('b\\a', '(a\\b)', { unixify: false }));
    assert(!isMatch('b\\b', '(a\\b)', { unixify: false }));
    assert(!isMatch('b\\c', '(a\\b)', { unixify: false }));
    assert(!isMatch('a\\a', '(a/b)', { unixify: false }));
    assert(!isMatch('a\\b', '(a/b)', { unixify: false }));
    assert(!isMatch('a\\c', '(a/b)', { unixify: false }));
    assert(!isMatch('b\\a', '(a/b)', { unixify: false }));
    assert(!isMatch('b\\b', '(a/b)', { unixify: false }));
    assert(!isMatch('b\\c', '(a/b)', { unixify: false }));

    assert(!isMatch('a\\a', 'a/c', { unixify: false }));
    assert(!isMatch('a\\b', 'a/c', { unixify: false }));
    assert(!isMatch('a\\c', 'a/c', { unixify: false }));
    assert(!isMatch('b\\a', 'a/c', { unixify: false }));
    assert(!isMatch('b\\b', 'a/c', { unixify: false }));
    assert(!isMatch('b\\c', 'a/c', { unixify: false }));
  });

  it('should match backslashes when followed by regex logical "or"', () => {
    assert(isMatch('a\\a', 'a/(a|c)'));
    assert(!isMatch('a\\b', 'a/(a|c)'));
    assert(isMatch('a\\c', 'a/(a|c)'));

    assert(isMatch('a\\a', 'a/(a|b|c)'));
    assert(isMatch('a\\b', 'a/(a|b|c)'));
    assert(isMatch('a\\c', 'a/(a|b|c)'));
  });

  it('should support matching backslashes with regex ranges', () => {
    assert(!isMatch('a\\a', 'a/[b-c]'));
    assert(isMatch('a\\b', 'a/[b-c]'));
    assert(isMatch('a\\c', 'a/[b-c]'));
    assert(!isMatch('a\\x\\y', 'a/[b-c]'));
    assert(!isMatch('a\\x', 'a/[b-c]'));

    assert(isMatch('a\\a', 'a/[a-z]'));
    assert(isMatch('a\\b', 'a/[a-z]'));
    assert(isMatch('a\\c', 'a/[a-z]'));
    assert(!isMatch('a\\x\\y', 'a/[a-z]'));
    assert(isMatch('a\\x\\y', 'a/[a-z]/y'));
    assert(isMatch('a\\x', 'a/[a-z]'));

    assert(!isMatch('a\\a', 'a/[b-c]', { unixify: false }));
    assert(!isMatch('a\\b', 'a/[b-c]', { unixify: false }));
    assert(!isMatch('a\\c', 'a/[b-c]', { unixify: false }));
    assert(!isMatch('a\\x\\y', 'a/[b-c]', { unixify: false }));
    assert(!isMatch('a\\x', 'a/[b-c]', { unixify: false }));

    assert(!isMatch('a\\a', 'a/[a-z]', { unixify: false }));
    assert(!isMatch('a\\b', 'a/[a-z]', { unixify: false }));
    assert(!isMatch('a\\c', 'a/[a-z]', { unixify: false }));
    assert(!isMatch('a\\x\\y', 'a/[a-z]', { unixify: false }));
    assert(!isMatch('a\\x', 'a/[a-z]', { unixify: false }));
  });

  it('should not match slashes with single stars', () => {
    assert(isMatch('a', '*'));
    assert(isMatch('b', '*'));
    assert(!isMatch('a\\a', '*'));
    assert(!isMatch('a\\b', '*'));
    assert(!isMatch('a\\c', '*'));
    assert(!isMatch('a\\x', '*'));
    assert(!isMatch('a\\a\\a', '*'));
    assert(!isMatch('a\\a\\b', '*'));
    assert(!isMatch('a\\a\\a\\a', '*'));
    assert(!isMatch('a\\a\\a\\a\\a', '*'));
    assert(!isMatch('x\\y', '*'));
    assert(!isMatch('z\\z', '*'));

    assert(!isMatch('a', '*/*'));
    assert(!isMatch('b', '*/*'));
    assert(isMatch('a\\a', '*/*'));
    assert(isMatch('a\\b', '*/*'));
    assert(isMatch('a\\c', '*/*'));
    assert(isMatch('a\\x', '*/*'));
    assert(!isMatch('a\\a\\a', '*/*'));
    assert(!isMatch('a\\a\\b', '*/*'));
    assert(!isMatch('a\\a\\a\\a', '*/*'));
    assert(!isMatch('a\\a\\a\\a\\a', '*/*'));
    assert(isMatch('x\\y', '*/*'));
    assert(isMatch('z\\z', '*/*'));

    assert(!isMatch('a', '*/*/*'));
    assert(!isMatch('b', '*/*/*'));
    assert(!isMatch('a\\a', '*/*/*'));
    assert(!isMatch('a\\b', '*/*/*'));
    assert(!isMatch('a\\c', '*/*/*'));
    assert(!isMatch('a\\x', '*/*/*'));
    assert(isMatch('a\\a\\a', '*/*/*'));
    assert(isMatch('a\\a\\b', '*/*/*'));
    assert(!isMatch('a\\a\\a\\a', '*/*/*'));
    assert(!isMatch('a\\a\\a\\a\\a', '*/*/*'));
    assert(!isMatch('x\\y', '*/*/*'));
    assert(!isMatch('z\\z', '*/*/*'));

    assert(!isMatch('a', '*/*/*/*'));
    assert(!isMatch('b', '*/*/*/*'));
    assert(!isMatch('a\\a', '*/*/*/*'));
    assert(!isMatch('a\\b', '*/*/*/*'));
    assert(!isMatch('a\\c', '*/*/*/*'));
    assert(!isMatch('a\\x', '*/*/*/*'));
    assert(!isMatch('a\\a\\a', '*/*/*/*'));
    assert(!isMatch('a\\a\\b', '*/*/*/*'));
    assert(isMatch('a\\a\\a\\a', '*/*/*/*'));
    assert(!isMatch('a\\a\\a\\a\\a', '*/*/*/*'));
    assert(!isMatch('x\\y', '*/*/*/*'));
    assert(!isMatch('z\\z', '*/*/*/*'));

    assert(!isMatch('a', '*/*/*/*/*'));
    assert(!isMatch('b', '*/*/*/*/*'));
    assert(!isMatch('a\\a', '*/*/*/*/*'));
    assert(!isMatch('a\\b', '*/*/*/*/*'));
    assert(!isMatch('a\\c', '*/*/*/*/*'));
    assert(!isMatch('a\\x', '*/*/*/*/*'));
    assert(!isMatch('a\\a\\a', '*/*/*/*/*'));
    assert(!isMatch('a\\a\\b', '*/*/*/*/*'));
    assert(!isMatch('a\\a\\a\\a', '*/*/*/*/*'));
    assert(isMatch('a\\a\\a\\a\\a', '*/*/*/*/*'));
    assert(!isMatch('x\\y', '*/*/*/*/*'));
    assert(!isMatch('z\\z', '*/*/*/*/*'));

    assert(!isMatch('a', 'a/*'));
    assert(!isMatch('b', 'a/*'));
    assert(isMatch('a\\a', 'a/*'));
    assert(isMatch('a\\b', 'a/*'));
    assert(isMatch('a\\c', 'a/*'));
    assert(isMatch('a\\x', 'a/*'));
    assert(!isMatch('a\\a\\a', 'a/*'));
    assert(!isMatch('a\\a\\b', 'a/*'));
    assert(!isMatch('a\\a\\a\\a', 'a/*'));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*'));
    assert(!isMatch('x\\y', 'a/*'));
    assert(!isMatch('z\\z', 'a/*'));

    assert(!isMatch('a', 'a/*/*'));
    assert(!isMatch('b', 'a/*/*'));
    assert(!isMatch('a\\a', 'a/*/*'));
    assert(!isMatch('a\\b', 'a/*/*'));
    assert(!isMatch('a\\c', 'a/*/*'));
    assert(!isMatch('a\\x', 'a/*/*'));
    assert(isMatch('a\\a\\a', 'a/*/*'));
    assert(isMatch('a\\a\\b', 'a/*/*'));
    assert(!isMatch('a\\a\\a\\a', 'a/*/*'));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/*'));
    assert(!isMatch('x\\y', 'a/*/*'));
    assert(!isMatch('z\\z', 'a/*/*'));

    assert(!isMatch('a', 'a/*/*/*'));
    assert(!isMatch('b', 'a/*/*/*'));
    assert(!isMatch('a\\a', 'a/*/*/*'));
    assert(!isMatch('a\\b', 'a/*/*/*'));
    assert(!isMatch('a\\c', 'a/*/*/*'));
    assert(!isMatch('a\\x', 'a/*/*/*'));
    assert(!isMatch('a\\a\\a', 'a/*/*/*'));
    assert(!isMatch('a\\a\\b', 'a/*/*/*'));
    assert(isMatch('a\\a\\a\\a', 'a/*/*/*'));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/*/*'));
    assert(!isMatch('x\\y', 'a/*/*/*'));
    assert(!isMatch('z\\z', 'a/*/*/*'));

    assert(!isMatch('a', 'a/*/*/*/*'));
    assert(!isMatch('b', 'a/*/*/*/*'));
    assert(!isMatch('a\\a', 'a/*/*/*/*'));
    assert(!isMatch('a\\b', 'a/*/*/*/*'));
    assert(!isMatch('a\\c', 'a/*/*/*/*'));
    assert(!isMatch('a\\x', 'a/*/*/*/*'));
    assert(!isMatch('a\\a\\a', 'a/*/*/*/*'));
    assert(!isMatch('a\\a\\b', 'a/*/*/*/*'));
    assert(!isMatch('a\\a\\a\\a', 'a/*/*/*/*'));
    assert(isMatch('a\\a\\a\\a\\a', 'a/*/*/*/*'));
    assert(!isMatch('x\\y', 'a/*/*/*/*'));
    assert(!isMatch('z\\z', 'a/*/*/*/*'));

    assert(!isMatch('a', 'a/*/a'));
    assert(!isMatch('b', 'a/*/a'));
    assert(!isMatch('a\\a', 'a/*/a'));
    assert(!isMatch('a\\b', 'a/*/a'));
    assert(!isMatch('a\\c', 'a/*/a'));
    assert(!isMatch('a\\x', 'a/*/a'));
    assert(isMatch('a\\a\\a', 'a/*/a'));
    assert(!isMatch('a\\a\\b', 'a/*/a'));
    assert(!isMatch('a\\a\\a\\a', 'a/*/a'));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/a'));
    assert(!isMatch('x\\y', 'a/*/a'));
    assert(!isMatch('z\\z', 'a/*/a'));

    assert(!isMatch('a', 'a/*/b'));
    assert(!isMatch('b', 'a/*/b'));
    assert(!isMatch('a\\a', 'a/*/b'));
    assert(!isMatch('a\\b', 'a/*/b'));
    assert(!isMatch('a\\c', 'a/*/b'));
    assert(!isMatch('a\\x', 'a/*/b'));
    assert(!isMatch('a\\a\\a', 'a/*/b'));
    assert(isMatch('a\\a\\b', 'a/*/b'));
    assert(!isMatch('a\\a\\a\\a', 'a/*/b'));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/b'));
    assert(!isMatch('x\\y', 'a/*/b'));
    assert(!isMatch('z\\z', 'a/*/b'));

    assert(!isMatch('a', '*/*', { unixify: false }));
    assert(!isMatch('b', '*/*', { unixify: false }));
    assert(!isMatch('a\\a', '*/*', { unixify: false }));
    assert(!isMatch('a\\b', '*/*', { unixify: false }));
    assert(!isMatch('a\\c', '*/*', { unixify: false }));
    assert(!isMatch('a\\x', '*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a', '*/*', { unixify: false }));
    assert(!isMatch('a\\a\\b', '*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a', '*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a\\a', '*/*', { unixify: false }));
    assert(!isMatch('x\\y', '*/*', { unixify: false }));
    assert(!isMatch('z\\z', '*/*', { unixify: false }));

    assert(!isMatch('a', '*/*/*', { unixify: false }));
    assert(!isMatch('b', '*/*/*', { unixify: false }));
    assert(!isMatch('a\\a', '*/*/*', { unixify: false }));
    assert(!isMatch('a\\b', '*/*/*', { unixify: false }));
    assert(!isMatch('a\\c', '*/*/*', { unixify: false }));
    assert(!isMatch('a\\x', '*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a', '*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\b', '*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a', '*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a\\a', '*/*/*', { unixify: false }));
    assert(!isMatch('x\\y', '*/*/*', { unixify: false }));
    assert(!isMatch('z\\z', '*/*/*', { unixify: false }));

    assert(!isMatch('a', '*/*/*/*', { unixify: false }));
    assert(!isMatch('b', '*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a', '*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\b', '*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\c', '*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\x', '*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a', '*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\b', '*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a', '*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a\\a', '*/*/*/*', { unixify: false }));
    assert(!isMatch('x\\y', '*/*/*/*', { unixify: false }));
    assert(!isMatch('z\\z', '*/*/*/*', { unixify: false }));

    assert(!isMatch('a', '*/*/*/*/*', { unixify: false }));
    assert(!isMatch('b', '*/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a', '*/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\b', '*/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\c', '*/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\x', '*/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a', '*/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\b', '*/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a', '*/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a\\a', '*/*/*/*/*', { unixify: false }));
    assert(!isMatch('x\\y', '*/*/*/*/*', { unixify: false }));
    assert(!isMatch('z\\z', '*/*/*/*/*', { unixify: false }));

    assert(!isMatch('a', 'a/*', { unixify: false }));
    assert(!isMatch('b', 'a/*', { unixify: false }));
    assert(!isMatch('a\\a', 'a/*', { unixify: false }));
    assert(!isMatch('a\\b', 'a/*', { unixify: false }));
    assert(!isMatch('a\\c', 'a/*', { unixify: false }));
    assert(!isMatch('a\\x', 'a/*', { unixify: false }));
    assert(!isMatch('a\\a\\a', 'a/*', { unixify: false }));
    assert(!isMatch('a\\a\\b', 'a/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a', 'a/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*', { unixify: false }));
    assert(!isMatch('x\\y', 'a/*', { unixify: false }));
    assert(!isMatch('z\\z', 'a/*', { unixify: false }));

    assert(!isMatch('a', 'a/*/*', { unixify: false }));
    assert(!isMatch('b', 'a/*/*', { unixify: false }));
    assert(!isMatch('a\\a', 'a/*/*', { unixify: false }));
    assert(!isMatch('a\\b', 'a/*/*', { unixify: false }));
    assert(!isMatch('a\\c', 'a/*/*', { unixify: false }));
    assert(!isMatch('a\\x', 'a/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a', 'a/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\b', 'a/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a', 'a/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/*', { unixify: false }));
    assert(!isMatch('x\\y', 'a/*/*', { unixify: false }));
    assert(!isMatch('z\\z', 'a/*/*', { unixify: false }));

    assert(!isMatch('a', 'a/*/*/*', { unixify: false }));
    assert(!isMatch('b', 'a/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a', 'a/*/*/*', { unixify: false }));
    assert(!isMatch('a\\b', 'a/*/*/*', { unixify: false }));
    assert(!isMatch('a\\c', 'a/*/*/*', { unixify: false }));
    assert(!isMatch('a\\x', 'a/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a', 'a/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\b', 'a/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a', 'a/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/*/*', { unixify: false }));
    assert(!isMatch('x\\y', 'a/*/*/*', { unixify: false }));
    assert(!isMatch('z\\z', 'a/*/*/*', { unixify: false }));

    assert(!isMatch('a', 'a/*/*/*/*', { unixify: false }));
    assert(!isMatch('b', 'a/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a', 'a/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\b', 'a/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\c', 'a/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\x', 'a/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a', 'a/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\b', 'a/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a', 'a/*/*/*/*', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/*/*/*', { unixify: false }));
    assert(!isMatch('x\\y', 'a/*/*/*/*', { unixify: false }));
    assert(!isMatch('z\\z', 'a/*/*/*/*', { unixify: false }));

    assert(!isMatch('a', 'a/*/a', { unixify: false }));
    assert(!isMatch('b', 'a/*/a', { unixify: false }));
    assert(!isMatch('a\\a', 'a/*/a', { unixify: false }));
    assert(!isMatch('a\\b', 'a/*/a', { unixify: false }));
    assert(!isMatch('a\\c', 'a/*/a', { unixify: false }));
    assert(!isMatch('a\\x', 'a/*/a', { unixify: false }));
    assert(!isMatch('a\\a\\a', 'a/*/a', { unixify: false }));
    assert(!isMatch('a\\a\\b', 'a/*/a', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a', 'a/*/a', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/a', { unixify: false }));
    assert(!isMatch('x\\y', 'a/*/a', { unixify: false }));
    assert(!isMatch('z\\z', 'a/*/a', { unixify: false }));

    assert(!isMatch('a', 'a/*/b', { unixify: false }));
    assert(!isMatch('b', 'a/*/b', { unixify: false }));
    assert(!isMatch('a\\a', 'a/*/b', { unixify: false }));
    assert(!isMatch('a\\b', 'a/*/b', { unixify: false }));
    assert(!isMatch('a\\c', 'a/*/b', { unixify: false }));
    assert(!isMatch('a\\x', 'a/*/b', { unixify: false }));
    assert(!isMatch('a\\a\\a', 'a/*/b', { unixify: false }));
    assert(!isMatch('a\\a\\b', 'a/*/b', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a', 'a/*/b', { unixify: false }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/b', { unixify: false }));
    assert(!isMatch('x\\y', 'a/*/b', { unixify: false }));
    assert(!isMatch('z\\z', 'a/*/b', { unixify: false }));
  });

  it('should support globstars (**)', () => {
    assert(isMatch('a\\a', 'a/**'));
    assert(isMatch('a\\b', 'a/**'));
    assert(isMatch('a\\c', 'a/**'));
    assert(isMatch('a\\x', 'a/**'));
    assert(isMatch('a\\x\\y', 'a/**'));
    assert(isMatch('a\\x\\y\\z', 'a/**'));

    assert(isMatch('a\\a', 'a/**/*'));
    assert(isMatch('a\\b', 'a/**/*'));
    assert(isMatch('a\\c', 'a/**/*'));
    assert(isMatch('a\\x', 'a/**/*'));
    assert(isMatch('a\\x\\y', 'a/**/*'));
    assert(isMatch('a\\x\\y\\z', 'a/**/*'));

    assert(isMatch('a\\a', 'a/**/**/*'));
    assert(isMatch('a\\b', 'a/**/**/*'));
    assert(isMatch('a\\c', 'a/**/**/*'));
    assert(isMatch('a\\x', 'a/**/**/*'));
    assert(isMatch('a\\x\\y', 'a/**/**/*'));
    assert(isMatch('a\\x\\y\\z', 'a/**/**/*'));
  });

  it('should match backslashes with globstars with posix slashes disabled', () => {
    // these should match, since '**' should match anything, even backslashes
    assert(isMatch('a\\a', 'a/**', { unixify: false }));
    assert(isMatch('a\\b', 'a/**', { unixify: false }));
    assert(isMatch('a\\c', 'a/**', { unixify: false }));
    assert(isMatch('a\\x', 'a/**', { unixify: false }));
    assert(isMatch('a\\x\\y', 'a/**', { unixify: false }));
    assert(isMatch('a\\x\\y\\z', 'a/**', { unixify: false }));

    // these should NOT match, because the given strings do not have "/"
    assert(!isMatch('a\\a', 'a/**/*', { unixify: false }));
    assert(!isMatch('a\\b', 'a/**/*', { unixify: false }));
    assert(!isMatch('a\\c', 'a/**/*', { unixify: false }));
    assert(!isMatch('a\\x', 'a/**/*', { unixify: false }));
    assert(!isMatch('a\\x\\y', 'a/**/*', { unixify: false }));
    assert(!isMatch('a\\x\\y\\z', 'a/**/*', { unixify: false }));

    assert(!isMatch('a\\a', 'a/**/**/*', { unixify: false }));
    assert(!isMatch('a\\b', 'a/**/**/*', { unixify: false }));
    assert(!isMatch('a\\c', 'a/**/**/*', { unixify: false }));
    assert(!isMatch('a\\x', 'a/**/**/*', { unixify: false }));
    assert(!isMatch('a\\x\\y', 'a/**/**/*', { unixify: false }));
    assert(!isMatch('a\\x\\y\\z', 'a/**/**/*', { unixify: false }));
  });

  it('should work with file extensions', () => {
    assert(isMatch('a.txt', 'a*.txt'));
    assert(!isMatch('a\\b.txt', 'a*.txt'));
    assert(!isMatch('a\\x\\y.txt', 'a*.txt'));
    assert(!isMatch('a\\x\\y\\z', 'a*.txt'));

    assert(isMatch('a.txt', 'a.txt'));
    assert(!isMatch('a\\b.txt', 'a.txt'));
    assert(!isMatch('a\\x\\y.txt', 'a.txt'));
    assert(!isMatch('a\\x\\y\\z', 'a.txt'));

    assert(!isMatch('a.txt', 'a/**/*.txt'));
    assert(isMatch('a\\b.txt', 'a/**/*.txt'));
    assert(isMatch('a\\x\\y.txt', 'a/**/*.txt'));
    assert(!isMatch('a\\x\\y\\z', 'a/**/*.txt'));

    assert(!isMatch('a.txt', 'a/**/*.txt', { unixify: false }));
    assert(!isMatch('a\\b.txt', 'a/**/*.txt', { unixify: false }));
    assert(!isMatch('a\\x\\y.txt', 'a/**/*.txt', { unixify: false }));
    assert(!isMatch('a\\x\\y\\z', 'a/**/*.txt', { unixify: false }));

    assert(!isMatch('a.txt', 'a/*.txt'));
    assert(isMatch('a\\b.txt', 'a/*.txt'));
    assert(!isMatch('a\\x\\y.txt', 'a/*.txt'));
    assert(!isMatch('a\\x\\y\\z', 'a/*.txt'));

    assert(!isMatch('a.txt', 'a/*.txt', { unixify: false }));
    assert(!isMatch('a\\b.txt', 'a/*.txt', { unixify: false }));
    assert(!isMatch('a\\x\\y.txt', 'a/*.txt', { unixify: false }));
    assert(!isMatch('a\\x\\y\\z', 'a/*.txt', { unixify: false }));

    assert(!isMatch('a.txt', 'a/*/*.txt'));
    assert(!isMatch('a\\b.txt', 'a/*/*.txt'));
    assert(isMatch('a\\x\\y.txt', 'a/*/*.txt'));
    assert(!isMatch('a\\x\\y\\z', 'a/*/*.txt'));

    assert(!isMatch('a.txt', 'a/*/*.txt', { unixify: false }));
    assert(!isMatch('a\\b.txt', 'a/*/*.txt', { unixify: false }));
    assert(!isMatch('a\\x\\y.txt', 'a/*/*.txt', { unixify: false }));
    assert(!isMatch('a\\x\\y\\z', 'a/*/*.txt', { unixify: false }));
  });

  it('should support negation patterns', () => {
    assert(isMatch('a', '!a/b'));
    assert(isMatch('a\\a', '!a/b'));
    assert(!isMatch('a\\b', '!a/b'));
    assert(isMatch('a\\c', '!a/b'));
    assert(isMatch('b\\a', '!a/b'));
    assert(isMatch('b\\b', '!a/b'));
    assert(isMatch('b\\c', '!a/b'));

    assert(isMatch('a', '!*/c'));
    assert(isMatch('a\\a', '!*/c'));
    assert(isMatch('a\\b', '!*/c'));
    assert(!isMatch('a\\c', '!*/c'));
    assert(isMatch('b\\a', '!*/c'));
    assert(isMatch('b\\b', '!*/c'));
    assert(!isMatch('b\\c', '!*/c'));

    assert(isMatch('a', '!a/b'));
    assert(isMatch('a\\a', '!a/b'));
    assert(!isMatch('a\\b', '!a/b'));
    assert(isMatch('a\\c', '!a/b'));
    assert(isMatch('b\\a', '!a/b'));
    assert(isMatch('b\\b', '!a/b'));
    assert(isMatch('b\\c', '!a/b'));

    assert(isMatch('a', '!*/c'));
    assert(isMatch('a\\a', '!*/c'));
    assert(isMatch('a\\b', '!*/c'));
    assert(!isMatch('a\\c', '!*/c'));
    assert(isMatch('b\\a', '!*/c'));
    assert(isMatch('b\\b', '!*/c'));
    assert(!isMatch('b\\c', '!*/c'));

    assert(isMatch('a', '!a/(b)'));
    assert(isMatch('a\\a', '!a/(b)'));
    assert(!isMatch('a\\b', '!a/(b)'));
    assert(isMatch('a\\c', '!a/(b)'));
    assert(isMatch('b\\a', '!a/(b)'));
    assert(isMatch('b\\b', '!a/(b)'));
    assert(isMatch('b\\c', '!a/(b)'));

    assert(isMatch('a', '!(a/b)'));
    assert(isMatch('a\\a', '!(a/b)'));
    assert(!isMatch('a\\b', '!(a/b)'));
    assert(isMatch('a\\c', '!(a/b)'));
    assert(isMatch('b\\a', '!(a/b)'));
    assert(isMatch('b\\b', '!(a/b)'));
    assert(isMatch('b\\c', '!(a/b)'));
  });
});
