'use strict';

require('mocha');
const assert = require('assert');
const pm = require('..');

describe('parsing', () => {
  beforeEach(() => pm.clearCache());

  it('should parse a glob pattern', () => {
    console.log(pm.parse('*', { base: 'foo\\bar\\baz' }))
  });
});
