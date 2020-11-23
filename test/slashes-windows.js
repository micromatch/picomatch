'use strict';

const assert = require('assert');
const { isMatch, makeRe } = require('..');

describe('slash handling - windows', () => {
  it('should match absolute windows paths with regex from makeRe', () => {
    const regex = makeRe('**/path/**', { windows: true });
    assert(regex.test('C:\\Users\\user\\Projects\\project\\path\\image.jpg', { windows: true }));
  });

  it('should match windows path separators with a string literal', () => {
    assert(!isMatch('a\\a', '(a/b)', { windows: true }));
    assert(isMatch('a\\b', '(a/b)', { windows: true }));
    assert(!isMatch('a\\c', '(a/b)', { windows: true }));
    assert(!isMatch('b\\a', '(a/b)', { windows: true }));
    assert(!isMatch('b\\b', '(a/b)', { windows: true }));
    assert(!isMatch('b\\c', '(a/b)', { windows: true }));

    assert(!isMatch('a\\a', 'a/b', { windows: true }));
    assert(isMatch('a\\b', 'a/b', { windows: true }));
    assert(!isMatch('a\\c', 'a/b', { windows: true }));
    assert(!isMatch('b\\a', 'a/b', { windows: true }));
    assert(!isMatch('b\\b', 'a/b', { windows: true }));
    assert(!isMatch('b\\c', 'a/b', { windows: true }));
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
    assert(!isMatch('a\\a', '(a/b)', { windows: true }));
    assert(isMatch('a\\b', '(a/b)', { windows: true }));
    assert(!isMatch('a\\c', '(a/b)', { windows: true }));
    assert(!isMatch('b\\a', '(a/b)', { windows: true }));
    assert(!isMatch('b\\b', '(a/b)', { windows: true }));
    assert(!isMatch('b\\c', '(a/b)', { windows: true }));
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
    assert(isMatch('a\\a', 'a/(a|c)', { windows: true }));
    assert(!isMatch('a\\b', 'a/(a|c)', { windows: true }));
    assert(isMatch('a\\c', 'a/(a|c)', { windows: true }));

    assert(isMatch('a\\a', 'a/(a|b|c)', { windows: true }));
    assert(isMatch('a\\b', 'a/(a|b|c)', { windows: true }));
    assert(isMatch('a\\c', 'a/(a|b|c)', { windows: true }));
  });

  it('should support matching backslashes with regex ranges', () => {
    assert(!isMatch('a\\a', 'a/[b-c]', { windows: true }));
    assert(isMatch('a\\b', 'a/[b-c]', { windows: true }));
    assert(isMatch('a\\c', 'a/[b-c]', { windows: true }));
    assert(!isMatch('a\\x\\y', 'a/[b-c]', { windows: true }));
    assert(!isMatch('a\\x', 'a/[b-c]', { windows: true }));

    assert(isMatch('a\\a', 'a/[a-z]', { windows: true }));
    assert(isMatch('a\\b', 'a/[a-z]', { windows: true }));
    assert(isMatch('a\\c', 'a/[a-z]', { windows: true }));
    assert(!isMatch('a\\x\\y', 'a/[a-z]', { windows: true }));
    assert(isMatch('a\\x\\y', 'a/[a-z]/y', { windows: true }));
    assert(isMatch('a\\x', 'a/[a-z]', { windows: true }));

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
    assert(isMatch('a', '*', { windows: true }));
    assert(isMatch('b', '*', { windows: true }));
    assert(!isMatch('a\\a', '*', { windows: true }));
    assert(!isMatch('a\\b', '*', { windows: true }));
    assert(!isMatch('a\\c', '*', { windows: true }));
    assert(!isMatch('a\\x', '*', { windows: true }));
    assert(!isMatch('a\\a\\a', '*', { windows: true }));
    assert(!isMatch('a\\a\\b', '*', { windows: true }));
    assert(!isMatch('a\\a\\a\\a', '*', { windows: true }));
    assert(!isMatch('a\\a\\a\\a\\a', '*', { windows: true }));
    assert(!isMatch('x\\y', '*', { windows: true }));
    assert(!isMatch('z\\z', '*', { windows: true }));

    assert(!isMatch('a', '*/*', { windows: true }));
    assert(!isMatch('b', '*/*', { windows: true }));
    assert(isMatch('a\\a', '*/*', { windows: true }));
    assert(isMatch('a\\b', '*/*', { windows: true }));
    assert(isMatch('a\\c', '*/*', { windows: true }));
    assert(isMatch('a\\x', '*/*', { windows: true }));
    assert(!isMatch('a\\a\\a', '*/*', { windows: true }));
    assert(!isMatch('a\\a\\b', '*/*', { windows: true }));
    assert(!isMatch('a\\a\\a\\a', '*/*', { windows: true }));
    assert(!isMatch('a\\a\\a\\a\\a', '*/*', { windows: true }));
    assert(isMatch('x\\y', '*/*', { windows: true }));
    assert(isMatch('z\\z', '*/*', { windows: true }));

    assert(!isMatch('a', '*/*/*', { windows: true }));
    assert(!isMatch('b', '*/*/*', { windows: true }));
    assert(!isMatch('a\\a', '*/*/*', { windows: true }));
    assert(!isMatch('a\\b', '*/*/*', { windows: true }));
    assert(!isMatch('a\\c', '*/*/*', { windows: true }));
    assert(!isMatch('a\\x', '*/*/*', { windows: true }));
    assert(isMatch('a\\a\\a', '*/*/*', { windows: true }));
    assert(isMatch('a\\a\\b', '*/*/*', { windows: true }));
    assert(!isMatch('a\\a\\a\\a', '*/*/*', { windows: true }));
    assert(!isMatch('a\\a\\a\\a\\a', '*/*/*', { windows: true }));
    assert(!isMatch('x\\y', '*/*/*', { windows: true }));
    assert(!isMatch('z\\z', '*/*/*', { windows: true }));

    assert(!isMatch('a', '*/*/*/*', { windows: true }));
    assert(!isMatch('b', '*/*/*/*', { windows: true }));
    assert(!isMatch('a\\a', '*/*/*/*', { windows: true }));
    assert(!isMatch('a\\b', '*/*/*/*', { windows: true }));
    assert(!isMatch('a\\c', '*/*/*/*', { windows: true }));
    assert(!isMatch('a\\x', '*/*/*/*', { windows: true }));
    assert(!isMatch('a\\a\\a', '*/*/*/*', { windows: true }));
    assert(!isMatch('a\\a\\b', '*/*/*/*', { windows: true }));
    assert(isMatch('a\\a\\a\\a', '*/*/*/*', { windows: true }));
    assert(!isMatch('a\\a\\a\\a\\a', '*/*/*/*', { windows: true }));
    assert(!isMatch('x\\y', '*/*/*/*', { windows: true }));
    assert(!isMatch('z\\z', '*/*/*/*', { windows: true }));

    assert(!isMatch('a', '*/*/*/*/*', { windows: true }));
    assert(!isMatch('b', '*/*/*/*/*', { windows: true }));
    assert(!isMatch('a\\a', '*/*/*/*/*', { windows: true }));
    assert(!isMatch('a\\b', '*/*/*/*/*', { windows: true }));
    assert(!isMatch('a\\c', '*/*/*/*/*', { windows: true }));
    assert(!isMatch('a\\x', '*/*/*/*/*', { windows: true }));
    assert(!isMatch('a\\a\\a', '*/*/*/*/*', { windows: true }));
    assert(!isMatch('a\\a\\b', '*/*/*/*/*', { windows: true }));
    assert(!isMatch('a\\a\\a\\a', '*/*/*/*/*', { windows: true }));
    assert(isMatch('a\\a\\a\\a\\a', '*/*/*/*/*', { windows: true }));
    assert(!isMatch('x\\y', '*/*/*/*/*', { windows: true }));
    assert(!isMatch('z\\z', '*/*/*/*/*', { windows: true }));

    assert(!isMatch('a', 'a/*', { windows: true }));
    assert(!isMatch('b', 'a/*', { windows: true }));
    assert(isMatch('a\\a', 'a/*', { windows: true }));
    assert(isMatch('a\\b', 'a/*', { windows: true }));
    assert(isMatch('a\\c', 'a/*', { windows: true }));
    assert(isMatch('a\\x', 'a/*', { windows: true }));
    assert(!isMatch('a\\a\\a', 'a/*', { windows: true }));
    assert(!isMatch('a\\a\\b', 'a/*', { windows: true }));
    assert(!isMatch('a\\a\\a\\a', 'a/*', { windows: true }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*', { windows: true }));
    assert(!isMatch('x\\y', 'a/*', { windows: true }));
    assert(!isMatch('z\\z', 'a/*', { windows: true }));

    assert(!isMatch('a', 'a/*/*', { windows: true }));
    assert(!isMatch('b', 'a/*/*', { windows: true }));
    assert(!isMatch('a\\a', 'a/*/*', { windows: true }));
    assert(!isMatch('a\\b', 'a/*/*', { windows: true }));
    assert(!isMatch('a\\c', 'a/*/*', { windows: true }));
    assert(!isMatch('a\\x', 'a/*/*', { windows: true }));
    assert(isMatch('a\\a\\a', 'a/*/*', { windows: true }));
    assert(isMatch('a\\a\\b', 'a/*/*', { windows: true }));
    assert(!isMatch('a\\a\\a\\a', 'a/*/*', { windows: true }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/*', { windows: true }));
    assert(!isMatch('x\\y', 'a/*/*', { windows: true }));
    assert(!isMatch('z\\z', 'a/*/*', { windows: true }));

    assert(!isMatch('a', 'a/*/*/*', { windows: true }));
    assert(!isMatch('b', 'a/*/*/*', { windows: true }));
    assert(!isMatch('a\\a', 'a/*/*/*', { windows: true }));
    assert(!isMatch('a\\b', 'a/*/*/*', { windows: true }));
    assert(!isMatch('a\\c', 'a/*/*/*', { windows: true }));
    assert(!isMatch('a\\x', 'a/*/*/*', { windows: true }));
    assert(!isMatch('a\\a\\a', 'a/*/*/*', { windows: true }));
    assert(!isMatch('a\\a\\b', 'a/*/*/*', { windows: true }));
    assert(isMatch('a\\a\\a\\a', 'a/*/*/*', { windows: true }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/*/*', { windows: true }));
    assert(!isMatch('x\\y', 'a/*/*/*', { windows: true }));
    assert(!isMatch('z\\z', 'a/*/*/*', { windows: true }));

    assert(!isMatch('a', 'a/*/*/*/*', { windows: true }));
    assert(!isMatch('b', 'a/*/*/*/*', { windows: true }));
    assert(!isMatch('a\\a', 'a/*/*/*/*', { windows: true }));
    assert(!isMatch('a\\b', 'a/*/*/*/*', { windows: true }));
    assert(!isMatch('a\\c', 'a/*/*/*/*', { windows: true }));
    assert(!isMatch('a\\x', 'a/*/*/*/*', { windows: true }));
    assert(!isMatch('a\\a\\a', 'a/*/*/*/*', { windows: true }));
    assert(!isMatch('a\\a\\b', 'a/*/*/*/*', { windows: true }));
    assert(!isMatch('a\\a\\a\\a', 'a/*/*/*/*', { windows: true }));
    assert(isMatch('a\\a\\a\\a\\a', 'a/*/*/*/*', { windows: true }));
    assert(!isMatch('x\\y', 'a/*/*/*/*', { windows: true }));
    assert(!isMatch('z\\z', 'a/*/*/*/*', { windows: true }));

    assert(!isMatch('a', 'a/*/a', { windows: true }));
    assert(!isMatch('b', 'a/*/a', { windows: true }));
    assert(!isMatch('a\\a', 'a/*/a', { windows: true }));
    assert(!isMatch('a\\b', 'a/*/a', { windows: true }));
    assert(!isMatch('a\\c', 'a/*/a', { windows: true }));
    assert(!isMatch('a\\x', 'a/*/a', { windows: true }));
    assert(isMatch('a\\a\\a', 'a/*/a', { windows: true }));
    assert(!isMatch('a\\a\\b', 'a/*/a', { windows: true }));
    assert(!isMatch('a\\a\\a\\a', 'a/*/a', { windows: true }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/a', { windows: true }));
    assert(!isMatch('x\\y', 'a/*/a', { windows: true }));
    assert(!isMatch('z\\z', 'a/*/a', { windows: true }));

    assert(!isMatch('a', 'a/*/b', { windows: true }));
    assert(!isMatch('b', 'a/*/b', { windows: true }));
    assert(!isMatch('a\\a', 'a/*/b', { windows: true }));
    assert(!isMatch('a\\b', 'a/*/b', { windows: true }));
    assert(!isMatch('a\\c', 'a/*/b', { windows: true }));
    assert(!isMatch('a\\x', 'a/*/b', { windows: true }));
    assert(!isMatch('a\\a\\a', 'a/*/b', { windows: true }));
    assert(isMatch('a\\a\\b', 'a/*/b', { windows: true }));
    assert(!isMatch('a\\a\\a\\a', 'a/*/b', { windows: true }));
    assert(!isMatch('a\\a\\a\\a\\a', 'a/*/b', { windows: true }));
    assert(!isMatch('x\\y', 'a/*/b', { windows: true }));
    assert(!isMatch('z\\z', 'a/*/b', { windows: true }));

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
    assert(isMatch('a\\a', 'a/**', { windows: true }));
    assert(isMatch('a\\b', 'a/**', { windows: true }));
    assert(isMatch('a\\c', 'a/**', { windows: true }));
    assert(isMatch('a\\x', 'a/**', { windows: true }));
    assert(isMatch('a\\x\\y', 'a/**', { windows: true }));
    assert(isMatch('a\\x\\y\\z', 'a/**', { windows: true }));

    assert(isMatch('a\\a', 'a/**/*', { windows: true }));
    assert(isMatch('a\\b', 'a/**/*', { windows: true }));
    assert(isMatch('a\\c', 'a/**/*', { windows: true }));
    assert(isMatch('a\\x', 'a/**/*', { windows: true }));
    assert(isMatch('a\\x\\y', 'a/**/*', { windows: true }));
    assert(isMatch('a\\x\\y\\z', 'a/**/*', { windows: true }));

    assert(isMatch('a\\a', 'a/**/**/*', { windows: true }));
    assert(isMatch('a\\b', 'a/**/**/*', { windows: true }));
    assert(isMatch('a\\c', 'a/**/**/*', { windows: true }));
    assert(isMatch('a\\x', 'a/**/**/*', { windows: true }));
    assert(isMatch('a\\x\\y', 'a/**/**/*', { windows: true }));
    assert(isMatch('a\\x\\y\\z', 'a/**/**/*', { windows: true }));
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
    assert(isMatch('a.txt', 'a*.txt', { windows: true }));
    assert(!isMatch('a\\b.txt', 'a*.txt', { windows: true }));
    assert(!isMatch('a\\x\\y.txt', 'a*.txt', { windows: true }));
    assert(!isMatch('a\\x\\y\\z', 'a*.txt', { windows: true }));

    assert(isMatch('a.txt', 'a.txt', { windows: true }));
    assert(!isMatch('a\\b.txt', 'a.txt', { windows: true }));
    assert(!isMatch('a\\x\\y.txt', 'a.txt', { windows: true }));
    assert(!isMatch('a\\x\\y\\z', 'a.txt', { windows: true }));

    assert(!isMatch('a.txt', 'a/**/*.txt', { windows: true }));
    assert(isMatch('a\\b.txt', 'a/**/*.txt', { windows: true }));
    assert(isMatch('a\\x\\y.txt', 'a/**/*.txt', { windows: true }));
    assert(!isMatch('a\\x\\y\\z', 'a/**/*.txt', { windows: true }));

    assert(!isMatch('a.txt', 'a/**/*.txt', { windows: false }));
    assert(!isMatch('a\\b.txt', 'a/**/*.txt', { windows: false }));
    assert(!isMatch('a\\x\\y.txt', 'a/**/*.txt', { windows: false }));
    assert(!isMatch('a\\x\\y\\z', 'a/**/*.txt', { windows: false }));

    assert(!isMatch('a.txt', 'a/*.txt', { windows: true }));
    assert(isMatch('a\\b.txt', 'a/*.txt', { windows: true }));
    assert(!isMatch('a\\x\\y.txt', 'a/*.txt', { windows: true }));
    assert(!isMatch('a\\x\\y\\z', 'a/*.txt', { windows: true }));

    assert(!isMatch('a.txt', 'a/*.txt', { windows: false }));
    assert(!isMatch('a\\b.txt', 'a/*.txt', { windows: false }));
    assert(!isMatch('a\\x\\y.txt', 'a/*.txt', { windows: false }));
    assert(!isMatch('a\\x\\y\\z', 'a/*.txt', { windows: false }));

    assert(!isMatch('a.txt', 'a/*/*.txt', { windows: true }));
    assert(!isMatch('a\\b.txt', 'a/*/*.txt', { windows: true }));
    assert(isMatch('a\\x\\y.txt', 'a/*/*.txt', { windows: true }));
    assert(!isMatch('a\\x\\y\\z', 'a/*/*.txt', { windows: true }));

    assert(!isMatch('a.txt', 'a/*/*.txt', { windows: false }));
    assert(!isMatch('a\\b.txt', 'a/*/*.txt', { windows: false }));
    assert(!isMatch('a\\x\\y.txt', 'a/*/*.txt', { windows: false }));
    assert(!isMatch('a\\x\\y\\z', 'a/*/*.txt', { windows: false }));
  });

  it('should support negation patterns', () => {
    assert(isMatch('a', '!a/b', { windows: true }));
    assert(isMatch('a\\a', '!a/b', { windows: true }));
    assert(!isMatch('a\\b', '!a/b', { windows: true }));
    assert(isMatch('a\\c', '!a/b', { windows: true }));
    assert(isMatch('b\\a', '!a/b', { windows: true }));
    assert(isMatch('b\\b', '!a/b', { windows: true }));
    assert(isMatch('b\\c', '!a/b', { windows: true }));

    assert(isMatch('a', '!*/c', { windows: true }));
    assert(isMatch('a\\a', '!*/c', { windows: true }));
    assert(isMatch('a\\b', '!*/c', { windows: true }));
    assert(!isMatch('a\\c', '!*/c', { windows: true }));
    assert(isMatch('b\\a', '!*/c', { windows: true }));
    assert(isMatch('b\\b', '!*/c', { windows: true }));
    assert(!isMatch('b\\c', '!*/c', { windows: true }));

    assert(isMatch('a', '!a/b', { windows: true }));
    assert(isMatch('a\\a', '!a/b', { windows: true }));
    assert(!isMatch('a\\b', '!a/b', { windows: true }));
    assert(isMatch('a\\c', '!a/b', { windows: true }));
    assert(isMatch('b\\a', '!a/b', { windows: true }));
    assert(isMatch('b\\b', '!a/b', { windows: true }));
    assert(isMatch('b\\c', '!a/b', { windows: true }));

    assert(isMatch('a', '!*/c', { windows: true }));
    assert(isMatch('a\\a', '!*/c', { windows: true }));
    assert(isMatch('a\\b', '!*/c', { windows: true }));
    assert(!isMatch('a\\c', '!*/c', { windows: true }));
    assert(isMatch('b\\a', '!*/c', { windows: true }));
    assert(isMatch('b\\b', '!*/c', { windows: true }));
    assert(!isMatch('b\\c', '!*/c', { windows: true }));

    assert(isMatch('a', '!a/(b)', { windows: true }));
    assert(isMatch('a\\a', '!a/(b)', { windows: true }));
    assert(!isMatch('a\\b', '!a/(b)', { windows: true }));
    assert(isMatch('a\\c', '!a/(b)', { windows: true }));
    assert(isMatch('b\\a', '!a/(b)', { windows: true }));
    assert(isMatch('b\\b', '!a/(b)', { windows: true }));
    assert(isMatch('b\\c', '!a/(b)', { windows: true }));

    assert(isMatch('a', '!(a/b)', { windows: true }));
    assert(isMatch('a\\a', '!(a/b)', { windows: true }));
    assert(!isMatch('a\\b', '!(a/b)', { windows: true }));
    assert(isMatch('a\\c', '!(a/b)', { windows: true }));
    assert(isMatch('b\\a', '!(a/b)', { windows: true }));
    assert(isMatch('b\\b', '!(a/b)', { windows: true }));
    assert(isMatch('b\\c', '!(a/b)', { windows: true }));
  });
});
