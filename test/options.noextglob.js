'use strict';

require('mocha');
const assert = require('assert');
const { clearCache, isMatch } = require('..');

describe('options.noextglob', () => {
  beforeEach(() => clearCache());

  it('should disable extglob support when options.noextglob is true', () => {
    assert(isMatch('a+z', 'a+(z)', { noextglob: true }));
    assert(!isMatch('az', 'a+(z)', { noextglob: true }));
    assert(!isMatch('azz', 'a+(z)', { noextglob: true }));
    assert(!isMatch('azzz', 'a+(z)', { noextglob: true }));
  });
});
