'use strict';

const assert = require('assert').strict;
const utils = require('../lib/utils');
const { toPosixSlashes } = require('..');

describe('.toPosixSlashes', () => {
  it('should convert windows backslashes to slashes', () => {
    assert.equal(toPosixSlashes('a\\b\\c\\d\\e'), 'a/b/c/d/e');
  });

  it('should escape special characters', () => {
    assert.equal(toPosixSlashes('C:\\Program files (x86)\\+dir'), 'C:/Program files \\(x86\\)/\\+dir');
  });
});
