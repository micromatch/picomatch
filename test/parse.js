'use strict';

const assert = require('assert');
const { parse } = require('..');

describe('parse', () => {
  it('should ignore \u0000', () => {
    assert.equal(parse('\u0000*').consumed, '*');
  });

  it('should parse ./ from string', () => {
    assert.equal(parse('./*', { fastpaths: false }).consumed, '*');
  });

  it('should parse a glob', () => {
    assert.equal(parse('*').consumed, '*');
    assert.equal(parse('*').output, '(?!\\.)(?=.)[^/]*?\\/?');
  });

  it('should support capture', () => {
    assert.equal(parse('*', { capture: true }).output, '(?!\\.)(?=.)([^/]*?)\\/?');
  });

  it('should throw an error when value is not a string', () => {
    assert.throws(() => parse({}), /expected a string/i);
  });
});
