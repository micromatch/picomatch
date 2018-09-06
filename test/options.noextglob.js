'use strict';

require('mocha');
const assert = require('assert');
const pm = require('..');

describe('options.noextglob', () => {
  beforeEach(() => pm.clearCache());

  it('should disable extglob support when options.noextglob is true', () => {
    assert(pm.isMatch('a+z', 'a+(z)', { noextglob: true }));
    assert(!pm.isMatch('az', 'a+(z)', { noextglob: true }));
    assert(!pm.isMatch('azz', 'a+(z)', { noextglob: true }));
    assert(!pm.isMatch('azzz', 'a+(z)', { noextglob: true }));
  });
});
