'use strict';

require('mocha');
const assert = require('assert');
const pm = require('..');

describe('options.dot', () => {
  beforeEach(() => pm.clearCache());

  it('should match dotfiles when `options.dot` is true', () => {
    assert(pm.isMatch('/a/b/.dot', '**/*dot', { dot: true }));
    assert(pm.isMatch('/a/b/.dot', '**/.[d]ot', { dot: true }));
    assert(pm.isMatch('/a/b/.dot', '**/?dot', { dot: true }));
    assert(pm.isMatch('.dotfile.js', '.*.js', { dot: true }));
    assert(pm.isMatch('.dot', '*dot', { dot: true }));
    assert(pm.isMatch('.dot', '?dot', { dot: true }));
    assert(pm.isMatch('/a/b/.dot', '/**/*dot', { dot: true }));
    assert(pm.isMatch('/a/b/.dot', '/**/.[d]ot', { dot: true }));
    assert(pm.isMatch('/a/b/.dot', '/**/?dot', { dot: true }));
    assert(pm.isMatch('a/b/.dot', '**/*dot', { dot: true }));
    assert(pm.isMatch('a/b/.dot', '**/.[d]ot', { dot: true }));
    assert(pm.isMatch('a/b/.dot', '**/?dot', { dot: true }));
  });

  it('should not match dotfiles when `options.dot` is false', () => {
    assert(!pm.isMatch('a/b/.dot', '**/*dot', { dot: false }));
    assert(!pm.isMatch('a/b/.dot', '**/?dot', { dot: false }));
  });

  it('should not match dotfiles when `.dot` is not defined and a dot is not in the glob pattern', () => {
    assert(!pm.isMatch('a/b/.dot', '**/*dot'));
    assert(!pm.isMatch('a/b/.dot', '**/?dot'));
  });
});
