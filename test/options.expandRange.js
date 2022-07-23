
import assert from 'assert';
const fill = require('fill-range');
const { isMatch } = require('../lib');

describe('options.expandRange', () => {
  it('should support a custom function for expanding ranges in brace patterns', () => {
    assert(isMatch('a/c', 'a/{a..c}', { expandRange: (a, b) => `([${a}-${b}])` }));
    assert(!isMatch('a/z', 'a/{a..c}', { expandRange: (a, b) => `([${a}-${b}])` }));
    assert(isMatch('a/99', 'a/{1..100}', {
      expandRange(a, b) {
        return `(${fill(a, b, { toRegex: true })})`;
      }
    }));
  });
});
