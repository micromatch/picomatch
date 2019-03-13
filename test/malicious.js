'use strict';

const assert = require('assert');
const { clearCache, isMatch } = require('..');
const repeat = n => '\\'.repeat(n);

/**
 * These tests are based on minimatch unit tests
 */

describe('handling of potential regex exploits', () => {
  beforeEach(() => clearCache());

  it('should support long escape sequences', () => {
    assert(isMatch('A', `!(${repeat(65500)}A)`), 'within the limits, and valid match');
    assert(!isMatch('A', `[!(${repeat(65500)}A`), 'within the limits, but invalid regex');
  });

  it('should throw an error when the pattern is too long', () => {
    assert.throws(() => isMatch('foo', '*'.repeat(65537)), /exceeds maximum allowed/);
    assert.throws(() => {
      assert(!isMatch('A', `!(${repeat(65536)}A)`));
    }, /Input length: 65540, exceeds maximum allowed length: 65536/);
  });

  it('should allow max bytes to be customized', () => {
    assert.throws(() => {
      assert(!isMatch('A', `!(${repeat(500)}A)`, { maxLength: 499 }));
    }, /Input length: 504, exceeds maximum allowed length: 499/);
  });
});
