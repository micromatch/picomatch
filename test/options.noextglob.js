'use strict';

require('mocha');
const assert = require('assert');
const picomatch = require('..');
const pm = require('./support');

describe('options.noextglob', () => {
  beforeEach(() => picomatch.clearCache());

  it('should disable extglob support when options.noextglob is true', () => {
    assert(pm.isMatch('az', 'a+(z)', { noextglob: true }));
    assert(!pm.isMatch('azz', 'a+(z)', { noextglob: true }));
    assert(!pm.isMatch('azzz', 'a+(z)', { noextglob: true }));
  });
});
