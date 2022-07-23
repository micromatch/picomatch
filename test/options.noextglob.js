
import assert from 'assert';
import picomatch from '../lib/index.js';
const { isMatch } = picomatch;

describe('options.noextglob', () => {
  it('should disable extglob support when options.noextglob is true', () => {
    assert(isMatch('a+z', 'a+(z)', { noextglob: true }));
    assert(!isMatch('az', 'a+(z)', { noextglob: true }));
    assert(!isMatch('azz', 'a+(z)', { noextglob: true }));
    assert(!isMatch('azzz', 'a+(z)', { noextglob: true }));
  });

  it('should work with noext alias to support minimatch', () => {
    assert(isMatch('a+z', 'a+(z)', { noext: true }));
    assert(!isMatch('az', 'a+(z)', { noext: true }));
    assert(!isMatch('azz', 'a+(z)', { noext: true }));
    assert(!isMatch('azzz', 'a+(z)', { noext: true }));
  });
});
