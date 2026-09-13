'use strict';

const assert = require('assert');
const { isMatch } = require('..');

describe('options.noglobstar', () => {
  it('should disable extglob support when options.noglobstar is true', () => {
    assert(isMatch('a/b/c', '**', { noglobstar: false }));
    assert(!isMatch('a/b/c', '**', { noglobstar: true }));
    assert(isMatch('a/b/c', 'a/**', { noglobstar: false }));
    assert(!isMatch('a/b/c', 'a/**', { noglobstar: true }));
  });

  it('should treat a leading **/ as a single required segment', () => {
    assert(!isMatch('a', '**/*', { noglobstar: true }));
    assert(!isMatch('a', '**/*.js', { noglobstar: true }));
    assert(isMatch('a/b', '**/*', { noglobstar: true }));
    assert(!isMatch('a/b/c', '**/*', { noglobstar: true }));
    assert(isMatch('a', '**/*', { noglobstar: false }));
  });
});
