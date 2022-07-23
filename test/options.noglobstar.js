
import assert from 'assert';
import { isMatch } from '../lib/index.js';

describe('options.noglobstar', () => {
  it('should disable extglob support when options.noglobstar is true', () => {
    assert(isMatch('a/b/c', '**', { noglobstar: false }));
    assert(!isMatch('a/b/c', '**', { noglobstar: true }));
    assert(isMatch('a/b/c', 'a/**', { noglobstar: false }));
    assert(!isMatch('a/b/c', 'a/**', { noglobstar: true }));
  });
});
