'use strict';

const assert = require('assert');
const picomatch = require('../posix');

describe('picomatch/posix', () => {
  it('should use posix paths only by default', () => {
    const match = picomatch('a/**');
    assert(match('a/b'));
    assert(!match('a\\b'));
  });
  it('should still be manually configurable to accept non-posix paths', () => {
    const match = picomatch('a/**', { windows: true });
    assert(match('a\\b'));
    assert(match('a/b'));
  });
});
