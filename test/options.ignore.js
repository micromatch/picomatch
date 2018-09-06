'use strict';

require('mocha');
const assert = require('assert');
const picomatch = require('..');
const { isMatch } = require('./support');

describe('options.ignore', () => {
  beforeEach(() => picomatch.clearCache());

  it('should not match ignored patterns', () => {
    assert(isMatch('a+b/src/glimini.js', 'a+b/src/*.js', { ignore: ['**/f*'] }));
    assert(!isMatch('a+b/src/glimini.js', 'a+b/src/*.js', { ignore: ['**/g*'] }));
    assert(isMatch('+b/src/glimini.md', '+b/src/*', { ignore: ['**/*.js'] }));
    assert(!isMatch('+b/src/glimini.js', '+b/src/*', { ignore: ['**/*.js'] }));
  });
});
