'use strict';

const path = require('path');
const assert = require('assert');
const utils = require('../lib/utils');

/**
 * isObject, isWindows, and toPosixSlashes are used by micromatch.
 */

describe('utils', () => {
  it('.isRegexChar', () => {
    assert.equal(utils.isRegexChar('*'), true);
    assert.equal(utils.isRegexChar('?'), true);
    assert.equal(utils.isRegexChar('a'), false);
  });

  it('.isWindows', () => {
    assert.equal(utils.isWindows(), process.platform === 'win32');
    // this hack is only used to allow us to do better unit tests on windows paths
    const sep = path.sep;
    path.sep = '\\';
    assert.equal(utils.isWindows(), true);
    path.sep = sep;
  });

  it('.isRegexChar', () => {
    assert.equal(utils.isRegexChar('*'), true);
    assert.equal(utils.isRegexChar('?'), true);
    assert.equal(utils.isRegexChar('a'), false);
  });

  it('.isObject', () => {
    assert.equal(utils.isObject('*'), false);
    assert.equal(utils.isObject({}), true);
  });

  it('.wrapOutput', () => {
    assert.equal(utils.wrapOutput('foo'), '^(?:foo)$');
    assert.equal(utils.wrapOutput('foo', {}, { contains: true }), '(?:foo)');
    assert.equal(utils.wrapOutput('foo', { negated: true }), '(?:^(?!^(?:foo)$).*$)');
  });

  it('.toPosixSlashes', () => {
    assert.equal(utils.toPosixSlashes('a\\b\\c'), 'a/b/c');
  });

  it('.supportsLookbehinds', () => {
    assert.equal(utils.supportsLookbehinds('8.9.0'), false);
    assert.equal(utils.supportsLookbehinds('8.10.0'), true);
    assert.equal(utils.supportsLookbehinds('9.0.0'), true);
  });
});
