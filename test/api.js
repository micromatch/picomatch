'use strict';

require('mocha');
const assert = require('assert');

describe('api', () => {
  it('.isMatch', () => {
    it('should support an array of globs', () => {
      assert(pm.isMatch('foo', ['f*', 'b*']));
      assert(pm.isMatch('bar', ['f*', 'b*']));
      assert(!pm.isMatch('qux', ['f*', 'b*']));
    });

    it('should support a single glob', () => {
      assert(pm.isMatch('foo', 'f*'));
      assert(!pm.isMatch('foo', 'b*'));
      assert(!pm.isMatch('bar', 'f*'));
      assert(pm.isMatch('bar', 'b*'));
    });
  });
});
