'use strict';

const assert = require('assert').strict;
const utils = require('../lib/utils');
const picomatch = require('..');

const capture = (glob, input, options) => {
  let match = picomatch.capture(glob, options)(input);
  if (match) {
    return match.slice(1).map(v => v === void 0 ? '' : v);
  }
  return null;
};

describe('.capture', () => {
  it('should return null if no match', () => {
    assert.equal(capture('test/*', 'hi/123'), null);
  });

  it('should return an empty array if there are no captures', () => {
    assert.deepEqual(capture('test/hi', 'test/hi'), []);
  });

  it('should capture stars', () => {
    assert.deepEqual(capture('test/*', 'test/foo'), ['foo']);
    assert.deepEqual(capture('test/*/bar', 'test/foo/bar'), ['foo']);
    assert.deepEqual(capture('test/*/bar/*', 'test/foo/bar/baz'), ['foo', 'baz']);
    assert.deepEqual(capture('test/*.js', 'test/foo.js'), ['foo']);
    assert.deepEqual(capture('test/*-controller.js', 'test/foo-controller.js'), ['foo']);
  });

  it('should capture globstars', () => {
    assert.deepEqual(capture('**/*.js', 'test/dir/a.js'), ['test/dir', 'a']);
    assert.deepEqual(capture('test/**/*.js', 'test/a.js'), ['', 'a']);
    assert.deepEqual(capture('test/**/*.js', 'test/dir/a.js'), ['dir', 'a']);
    assert.deepEqual(capture('test/**/*.js', 'test/dir/test/a.js'), ['dir/test', 'a']);
  });

  it('should capture extglobs', () => {
    assert.deepEqual(capture('test/+(a|b)/*.js', 'test/a/x.js'), ['a', 'x']);
    assert.deepEqual(capture('test/+(a|b)/*.js', 'test/b/x.js'), ['b', 'x']);
    assert.deepEqual(capture('test/+(a|b)/*.js', 'test/ab/x.js'), ['ab', 'x']);
  });

  it('should capture paren groups', () => {
    assert.deepEqual(capture('test/(a|b)/x.js', 'test/a/x.js'), ['a']);
    assert.deepEqual(capture('test/(a|b)/x.js', 'test/b/x.js'), ['b']);
  });

  it('should capture star groups', () => {
    assert.deepEqual(capture('test/a*(a|b)/x.js', 'test/a/x.js'), ['']);
    assert.deepEqual(capture('test/a*(a|b)/x.js', 'test/aa/x.js'), ['a']);
    assert.deepEqual(capture('test/a*(a|b)/x.js', 'test/ab/x.js'), ['b']);
    assert.deepEqual(capture('test/a*(a|b)/x.js', 'test/aba/x.js'), ['ba']);
  });

  it('should capture plus groups', () => {
    assert.deepEqual(capture('test/+(a|b)/x.js', 'test/a/x.js'), ['a']);
    assert.deepEqual(capture('test/+(a|b)/x.js', 'test/b/x.js'), ['b']);
    assert.deepEqual(capture('test/+(a|b)/x.js', 'test/ab/x.js'), ['ab']);
    assert.deepEqual(capture('test/+(a|b)/x.js', 'test/aba/x.js'), ['aba']);
  });

  it('should capture optional groups', () => {
    assert.deepEqual(capture('test/a?(a|b)/x.js', 'test/a/x.js'), ['']);
    assert.deepEqual(capture('test/a?(a|b)/x.js', 'test/ab/x.js'), ['b']);
    assert.deepEqual(capture('test/a?(a|b)/x.js', 'test/aa/x.js'), ['a']);
  });

  it('should capture @ groups', () => {
    assert.deepEqual(capture('test/@(a|b)/x.js', 'test/a/x.js'), ['a']);
    assert.deepEqual(capture('test/@(a|b)/x.js', 'test/b/x.js'), ['b']);
  });

  it('should capture negated groups', () => {
    assert.deepEqual(capture('test/!(a|b)/x.js', 'test/x/x.js'), ['x']);
    assert.deepEqual(capture('test/!(a|b)/x.js', 'test/y/x.js'), ['y']);
  });

  it('should be able to use the returned function any number of times', () => {
    let matches = picomatch.capture('test/*/*');
    assert.deepEqual(matches('test/a/b').slice(1), ['a', 'b']);
    assert.deepEqual(matches('test/c/d').slice(1), ['c', 'd']);
    assert.deepEqual(matches('test/e/f').slice(1), ['e', 'f']);
    assert.deepEqual(matches('test/g/h').slice(1), ['g', 'h']);
  });
});
