'use strict';

const assert = require('assert');
const pm = require('..');
const generate = n => '\\'.repeat(n);

/**
 * These tests are based on minimatch unit tests
 */

describe('handling of potential regex exploits', () => {
  beforeEach(() => pm.clearCache());

  it('should support long escape sequences', () => {
    assert(pm.isMatch('A', `!(${generate(65500)}A)`), 'within the limits, and valid match');
    assert(!pm.isMatch('A', `[!(${generate(65500)}A`), 'within the limits, but invalid regex');
  });

  it('should throw an error when the pattern is too long', () => {
    assert.throws(() => {
      assert(!pm.isMatch('A', `!(${generate(65536)}A)`));
    }, /input string must not be longer than 65536 bytes/);
  });

  it('should allow max bytes to be customized', () => {
    assert.throws(() => {
      assert(!pm.isMatch('A', `!(${generate(500)}A)`, { maxLength: 499 }));
    }, /input string must not be longer than 499 bytes/);
  });
});
