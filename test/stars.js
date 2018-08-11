'use strict';

require('mocha');
const assert = require('assert');
const { isMatch } = require('./support');
const pm = require('..');

describe('stars', () => {
  beforeEach(() => pm.clearCache());

  it('should match non-slash characters with a single *', () => {
    assert(isMatch('foo', 'f*'));
    assert(!isMatch('foo', 'b*'));
    assert(!isMatch('bar', 'f*'));
    assert(isMatch('bar', 'b*'));
  });
});
