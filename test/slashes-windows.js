'use strict';

require('mocha');
const path = require('path');
const assert = require('assert');
const support = require('./support');
const { isMatch, makeRe } = require('..');

describe('slash handling - windows', () => {
  beforeEach(() => support.windowsPathSep());
  afterEach(() => support.resetPathSep());

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

  it('should not match literal backslashes with literal forward slashes when windows is disabled', () => {
    assert(!isMatch('a\\a', 'a\\b', { windows: false }));
    assert(isMatch('a\\b', 'a\\b', { windows: false }));
    assert(!isMatch('a\\c', 'a\\b', { windows: false }));
    assert(!isMatch('b\\a', 'a\\b', { windows: false }));
    assert(!isMatch('b\\b', 'a\\b', { windows: false }));
    assert(!isMatch('b\\c', 'a\\b', { windows: false }));

    assert(!isMatch('a\\a', 'a/b', { windows: false }));
    assert(!isMatch('a\\b', 'a/b', { windows: false }));
    assert(!isMatch('a\\c', 'a/b', { windows: false }));
    assert(!isMatch('b\\a', 'a/b', { windows: false }));
    assert(!isMatch('b\\b', 'a/b', { windows: false }));
    assert(!isMatch('b\\c', 'a/b', { windows: false }));
  });

  it('should match an array of literal strings', () => {
    assert(!isMatch('a\\a', '(a/b)'));
    assert(isMatch('a\\b', '(a/b)'));
    assert(!isMatch('a\\c', '(a/b)'));
    assert(!isMatch('b\\a', '(a/b)'));
    assert(!isMatch('b\\b', '(a/b)'));
    assert(!isMatch('b\\c', '(a/b)'));
  });

  it('should not match backslashes with forward slashes when windows is disabled', () => {
    assert(!isMatch('a\\a', 'a/(a|c)', { windows: false }));
    assert(!isMatch('a\\b', 'a/(a|c)', { windows: false }));
    assert(!isMatch('a\\c', 'a/(a|c)', { windows: false }));
    assert(!isMatch('a\\a', 'a/(a|b|c)', { windows: false }));
    assert(!isMatch('a\\b', 'a/(a|b|c)', { windows: false }));
    assert(!isMatch('a\\c', 'a/(a|b|c)', { windows: false }));
    assert(!isMatch('a\\a', '(a\\b)', { windows: false }));
    assert(isMatch('a\\b', '(a\\\\b)', { windows: false }));
    assert(!isMatch('a\\c', '(a\\b)', { windows: false }));
    assert(!isMatch('b\\a', '(a\\b)', { windows: false }));
    assert(!isMatch('b\\b', '(a\\b)', { windows: false }));
    assert(!isMatch('b\\c', '(a\\b)', { windows: false }));
    assert(!isMatch('a\\a', '(a/b)', { windows: false }));
    assert(!isMatch('a\\b', '(a/b)', { windows: false }));
    assert(!isMatch('a\\c', '(a/b)', { windows: false }));
    assert(!isMatch('b\\a', '(a/b)', { windows: false }));
    assert(!isMatch('b\\b', '(a/b)', { windows: false }));
    assert(!isMatch('b\\c', '(a/b)', { windows: false }));

    assert(!isMatch('a\\a', 'a/c', { windows: false }));
    assert(!isMatch('a\\b', 'a/c', { windows: false }));
    assert(!isMatch('a\\c', 'a/c', { windows: false }));
    assert(!isMatch('b\\a', 'a/c', { windows: false }));
    assert(!isMatch('b\\b', 'a/c', { windows: false }));
    assert(!isMatch('b\\c', 'a/c', { windows: false }));
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

    assert(!isMatch('a\\a', 'a/[b-c]', { windows: false }));
    assert(!isMatch('a\\b', 'a/[b-c]', { windows: false }));
    assert(!isMatch('a\\c', 'a/[b-c]', { windows: false }));
    assert(!isMatch('a\\x\\y', 'a/[b-c]', { windows: false }));
    assert(!isMatch('a\\x', 'a/[b-c]', { windows: false }));

    assert(!isMatch('a\\a', 'a/[a-z]', { windows: false }));
    assert(!isMatch('a\\b', 'a/[a-z]', { windows: false }));
    assert(!isMatch('a\\c', 'a/[a-z]', { windows: false }));
    assert(!isMatch('a\\x\\y', 'a/[a-z]', { windows: false }));
    assert(!isMatch('a\\x', 'a/[a-z]', { windows: false }));
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

    assert(!isMatch('a', '*/*', { windows: false }));
    assert(!isMatch('b', '*/*', { windows: false }));
    assert(!isMatch('a\\a', '*/*', { windows: false }));
    assert(!isMatch('a\\b', '*/*', { windows: false }));
    assert(!isMatch('a\\c', '*/*', { windows: false }));
    assert(!isMatch('a\\x', '*/*', { windows: false }));
    assert(!isMatch('a\\a\\a', '*/*', { windows: false }));
    assert(!isMatch('a\\a\\b', '*/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a', '*/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a\\a', '*/*', { windows: false }));
    assert(!isMatch('x\\y', '*/*', { windows: false }));
    assert(!isMatch('z\\z', '*/*', { windows: false }));

    assert(!isMatch('a', '*/*/*', { windows: false }));
    assert(!isMatch('b', '*/*/*', { windows: false }));
    assert(!isMatch('a\\a', '*/*/*', { windows: false }));
    assert(!isMatch('a\\b', '*/*/*', { windows: false }));
    assert(!isMatch('a\\c', '*/*/*', { windows: false }));
    assert(!isMatch('a\\x', '*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a', '*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\b', '*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a', '*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a\\a', '*/*/*', { windows: false }));
    assert(!isMatch('x\\y', '*/*/*', { windows: false }));
    assert(!isMatch('z\\z', '*/*/*', { windows: false }));

    assert(!isMatch('a', '*/*/*/*', { windows: false }));
    assert(!isMatch('b', '*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a', '*/*/*/*', { windows: false }));
    assert(!isMatch('a\\b', '*/*/*/*', { windows: false }));
    assert(!isMatch('a\\c', '*/*/*/*', { windows: false }));
    assert(!isMatch('a\\x', '*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a', '*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\b', '*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a', '*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a\\a', '*/*/*/*', { windows: false }));
    assert(!isMatch('x\\y', '*/*/*/*', { windows: false }));
    assert(!isMatch('z\\z', '*/*/*/*', { windows: false }));

    assert(!isMatch('a', '*/*/*/*/*', { windows: false }));
    assert(!isMatch('b', '*/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a', '*/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\b', '*/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\c', '*/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\x', '*/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a', '*/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\b', '*/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a', '*/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a\\a', '*/*/*/*/*', { windows: false }));
    assert(!isMatch('x\\y', '*/*/*/*/*', { windows: false }));
    assert(!isMatch('z\\z', '*/*/*/*/*', { windows: false }));

    assert(!isMatch('a', 'a/*', { windows: false }));
    assert(!isMatch('b', 'a/*', { windows: false }));
    assert(!isMatch('a\\a', 'a/*', { windows: false }));
    assert(!isMatch('a\\b', 'a/*', { windows: false }));
    assert(!isMatch('a\\c', 'a/*', { windows: false }));
    assert(!isMatch('a\\x', 'a/*', { windows: false }));
    assert(!isMatch('a\\a\\a', 'a/*', { windows: false }));
    assert(!isMatch('a\\a\\b', 'a/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a', 'a/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*', { windows: false }));
    assert(!isMatch('x\\y', 'a/*', { windows: false }));
    assert(!isMatch('z\\z', 'a/*', { windows: false }));

    assert(!isMatch('a', 'a/*/*', { windows: false }));
    assert(!isMatch('b', 'a/*/*', { windows: false }));
    assert(!isMatch('a\\a', 'a/*/*', { windows: false }));
    assert(!isMatch('a\\b', 'a/*/*', { windows: false }));
    assert(!isMatch('a\\c', 'a/*/*', { windows: false }));
    assert(!isMatch('a\\x', 'a/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a', 'a/*/*', { windows: false }));
    assert(!isMatch('a\\a\\b', 'a/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a', 'a/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/*', { windows: false }));
    assert(!isMatch('x\\y', 'a/*/*', { windows: false }));
    assert(!isMatch('z\\z', 'a/*/*', { windows: false }));

    assert(!isMatch('a', 'a/*/*/*', { windows: false }));
    assert(!isMatch('b', 'a/*/*/*', { windows: false }));
    assert(!isMatch('a\\a', 'a/*/*/*', { windows: false }));
    assert(!isMatch('a\\b', 'a/*/*/*', { windows: false }));
    assert(!isMatch('a\\c', 'a/*/*/*', { windows: false }));
    assert(!isMatch('a\\x', 'a/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a', 'a/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\b', 'a/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a', 'a/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/*/*', { windows: false }));
    assert(!isMatch('x\\y', 'a/*/*/*', { windows: false }));
    assert(!isMatch('z\\z', 'a/*/*/*', { windows: false }));

    assert(!isMatch('a', 'a/*/*/*/*', { windows: false }));
    assert(!isMatch('b', 'a/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a', 'a/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\b', 'a/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\c', 'a/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\x', 'a/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a', 'a/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\b', 'a/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a', 'a/*/*/*/*', { windows: false }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/*/*/*', { windows: false }));
    assert(!isMatch('x\\y', 'a/*/*/*/*', { windows: false }));
    assert(!isMatch('z\\z', 'a/*/*/*/*', { windows: false }));

    assert(!isMatch('a', 'a/*/a', { windows: false }));
    assert(!isMatch('b', 'a/*/a', { windows: false }));
    assert(!isMatch('a\\a', 'a/*/a', { windows: false }));
    assert(!isMatch('a\\b', 'a/*/a', { windows: false }));
    assert(!isMatch('a\\c', 'a/*/a', { windows: false }));
    assert(!isMatch('a\\x', 'a/*/a', { windows: false }));
    assert(!isMatch('a\\a\\a', 'a/*/a', { windows: false }));
    assert(!isMatch('a\\a\\b', 'a/*/a', { windows: false }));
    assert(!isMatch('a\\a\\a\\a', 'a/*/a', { windows: false }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/a', { windows: false }));
    assert(!isMatch('x\\y', 'a/*/a', { windows: false }));
    assert(!isMatch('z\\z', 'a/*/a', { windows: false }));

    assert(!isMatch('a', 'a/*/b', { windows: false }));
    assert(!isMatch('b', 'a/*/b', { windows: false }));
    assert(!isMatch('a\\a', 'a/*/b', { windows: false }));
    assert(!isMatch('a\\b', 'a/*/b', { windows: false }));
    assert(!isMatch('a\\c', 'a/*/b', { windows: false }));
    assert(!isMatch('a\\x', 'a/*/b', { windows: false }));
    assert(!isMatch('a\\a\\a', 'a/*/b', { windows: false }));
    assert(!isMatch('a\\a\\b', 'a/*/b', { windows: false }));
    assert(!isMatch('a\\a\\a\\a', 'a/*/b', { windows: false }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/b', { windows: false }));
    assert(!isMatch('x\\y', 'a/*/b', { windows: false }));
    assert(!isMatch('z\\z', 'a/*/b', { windows: false }));
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

  it('should not match backslashes with globstars when disabled', () => {
    assert(!isMatch('a\\a', 'a/**', { windows: false }));
    assert(!isMatch('a\\b', 'a/**', { windows: false }));
    assert(!isMatch('a\\c', 'a/**', { windows: false }));
    assert(!isMatch('a\\x', 'a/**', { windows: false }));
    assert(!isMatch('a\\x\\y', 'a/**', { windows: false }));
    assert(!isMatch('a\\x\\y\\z', 'a/**', { windows: false }));

    assert(!isMatch('a\\a', 'a/**/*', { windows: false }));
    assert(!isMatch('a\\b', 'a/**/*', { windows: false }));
    assert(!isMatch('a\\c', 'a/**/*', { windows: false }));
    assert(!isMatch('a\\x', 'a/**/*', { windows: false }));
    assert(!isMatch('a\\x\\y', 'a/**/*', { windows: false }));
    assert(!isMatch('a\\x\\y\\z', 'a/**/*', { windows: false }));

    assert(!isMatch('a\\a', 'a/**/**/*', { windows: false }));
    assert(!isMatch('a\\b', 'a/**/**/*', { windows: false }));
    assert(!isMatch('a\\c', 'a/**/**/*', { windows: false }));
    assert(!isMatch('a\\x', 'a/**/**/*', { windows: false }));
    assert(!isMatch('a\\x\\y', 'a/**/**/*', { windows: false }));
    assert(!isMatch('a\\x\\y\\z', 'a/**/**/*', { windows: false }));
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

    assert(!isMatch('a.txt', 'a/**/*.txt', { windows: false }));
    assert(!isMatch('a\\b.txt', 'a/**/*.txt', { windows: false }));
    assert(!isMatch('a\\x\\y.txt', 'a/**/*.txt', { windows: false }));
    assert(!isMatch('a\\x\\y\\z', 'a/**/*.txt', { windows: false }));

    assert(!isMatch('a.txt', 'a/*.txt'));
    assert(isMatch('a\\b.txt', 'a/*.txt'));
    assert(!isMatch('a\\x\\y.txt', 'a/*.txt'));
    assert(!isMatch('a\\x\\y\\z', 'a/*.txt'));

    assert(!isMatch('a.txt', 'a/*.txt', { windows: false }));
    assert(!isMatch('a\\b.txt', 'a/*.txt', { windows: false }));
    assert(!isMatch('a\\x\\y.txt', 'a/*.txt', { windows: false }));
    assert(!isMatch('a\\x\\y\\z', 'a/*.txt', { windows: false }));

    assert(!isMatch('a.txt', 'a/*/*.txt'));
    assert(!isMatch('a\\b.txt', 'a/*/*.txt'));
    assert(isMatch('a\\x\\y.txt', 'a/*/*.txt'));
    assert(!isMatch('a\\x\\y\\z', 'a/*/*.txt'));

    assert(!isMatch('a.txt', 'a/*/*.txt', { windows: false }));
    assert(!isMatch('a\\b.txt', 'a/*/*.txt', { windows: false }));
    assert(!isMatch('a\\x\\y.txt', 'a/*/*.txt', { windows: false }));
    assert(!isMatch('a\\x\\y\\z', 'a/*/*.txt', { windows: false }));
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
