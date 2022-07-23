
import assert from 'assert';
import picomatch from '../lib/index.js';
const { isMatch } = picomatch;

describe('options.noglobstar', () => {
  it('should disable extglob support when options.noglobstar is true', () => {
    assert(isMatch('a/b/c', '**', { noglobstar: false }));
    assert(!isMatch('a/b/c', '**', { noglobstar: true }));
    assert(isMatch('a/b/c', 'a/**', { noglobstar: false }));
    assert(!isMatch('a/b/c', 'a/**', { noglobstar: true }));
  });
});
