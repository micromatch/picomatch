'use strict';

require('mocha');
const assert = require('assert');
const picomatch = require('..');
const pm = require('./support');

describe('dotfiles', () => {
  beforeEach(() => pm.clearCache());
  afterEach(() => pm.clearCache());

  it('should not match dotfiles with single star by default', () => {
    assert(pm.isMatch('foo', '*'));
    assert(!pm.isMatch('.foo', '*'));
    assert(pm.isMatch('foo/bar', '*/*'));
    assert(!pm.isMatch('foo/.bar', '*/*'));
    assert(!pm.isMatch('foo/.bar/baz', '*/*/*'));
  });

  it('should not match dotfiles with globstars by default', () => {
    assert(pm.isMatch('foo', '**/*'));
    assert(!pm.isMatch('.foo', '**'));
    assert(!pm.isMatch('.foo', '**/*'));
    assert(!pm.isMatch('bar/.foo', '**/*'));
    assert(!pm.isMatch('.bar', '**/*'));
    assert(!pm.isMatch('foo/.bar', '**/*'));
    assert(!pm.isMatch('foo/.bar', '**/*a*'));
  });

  it('should match dotfiles when a leading dot is in the pattern', () => {
    assert(!pm.isMatch('foo', '**/.*a*'));
    assert(pm.isMatch('.bar', '**/.*a*'));
    assert(pm.isMatch('foo/.bar', '**/.*a*'));

    assert(!pm.isMatch('foo', '.*a*'));
    assert(pm.isMatch('.bar', '.*a*'));
    assert(!pm.isMatch('bar', '.*a*'));

    assert(!pm.isMatch('foo', '.b*'));
    assert(pm.isMatch('.bar', '.b*'));
    assert(!pm.isMatch('bar', '.b*'));

    assert(!pm.isMatch('foo', '.*r'));
    assert(pm.isMatch('.bar', '.*r'));
    assert(!pm.isMatch('bar', '.*r'));
  });

  it('should not match a dot when the dot is not explicitly defined', () => {
    assert(!pm.isMatch('.dot', '*dot'));
    assert(!pm.isMatch('a/.dot', 'a/*dot'));
    assert(!pm.isMatch('.dot', '**/*dot'));
    assert(!pm.isMatch('.dot', '**/?dot'));
    assert(!pm.isMatch('.dot', '*/*dot'));
    assert(!pm.isMatch('.dot', '*/?dot'));
    assert(!pm.isMatch('.dot', '/*dot'));
    assert(!pm.isMatch('.dot', '/?dot'));
    assert(!pm.isMatch('/.dot', '**/*dot'));
    assert(!pm.isMatch('/.dot', '**/?dot'));
    assert(!pm.isMatch('/.dot', '*/*dot'));
    assert(!pm.isMatch('/.dot', '*/?dot'));
    assert(!pm.isMatch('/.dot', '/*dot'));
    assert(!pm.isMatch('/.dot', '/?dot'));
    assert(!pm.isMatch('a/.dot', '*/*dot'));
    assert(!pm.isMatch('a/.dot', '*/?dot'));
    assert(!pm.isMatch('a/b/.dot', '**/*dot'));
    assert(!pm.isMatch('a/b/.dot', '**/?dot'));

    // related https://github.com/jonschlinkert/micromatch/issues/63
    assert(!pm.isMatch('/aaa/bbb/.git', '/aaa/bbb/**'));
    assert(!pm.isMatch('aaa/bbb/.git', 'aaa/bbb/**'));
    assert(!pm.isMatch('/aaa/bbb/ccc/.git', '/aaa/bbb/**'));
  });

  it('should not match leading dots with question marks', () => {
    assert(!pm.isMatch('.dot', '?dot'));
    assert(!pm.isMatch('/.dot', '/?dot'));
    assert(!pm.isMatch('a/.dot', 'a/?dot'));
  });

  it('should match with double dots', () => {
    assert(!pm.isMatch('a/../a', '../*'));
    assert(!pm.isMatch('ab/../ac', '../*'));
    assert(pm.isMatch('../a', '../*'));
    assert(!pm.isMatch('a', '../*'));
    assert(!pm.isMatch('../../b', '../*'));
    assert(pm.isMatch('../c', '../*'));
    assert(!pm.isMatch('../c/d', '../*'));

    assert(pm.isMatch('a/../a', '*/../*'));
    assert(pm.isMatch('ab/../ac', '*/../*'));
    assert(!pm.isMatch('../a', '*/../*'));
    assert(!pm.isMatch('a', '*/../*'));
    assert(!pm.isMatch('../../b', '*/../*'));
    assert(!pm.isMatch('../c', '*/../*'));
    assert(!pm.isMatch('../c/d', '*/../*'));

    assert(pm.isMatch('a/../a', '**/../*'));
    assert(pm.isMatch('ab/../ac', '**/../*'));
    assert(pm.isMatch('../a', '**/../*'));
    assert(!pm.isMatch('a', '**/../*'));
    assert(!pm.isMatch('../../b', '**/../*'));
    assert(pm.isMatch('../c', '**/../*'));
    assert(!pm.isMatch('../c/d', '**/../*'));
  });

  it('should match dots in root path when glob is prefixed with **/', () => {
    assert(pm.isMatch('.x/', '**/.x/**'));
    assert(pm.isMatch('.x/.x', '**/.x/**'));
    assert(pm.isMatch('.x/a', '**/.x/**'));
    assert(pm.isMatch('.x/a/b', '**/.x/**'));
    assert(pm.isMatch('a/.x/b', '**/.x/**'));
    assert(pm.isMatch('a/b/.x/', '**/.x/**'));
    assert(pm.isMatch('a/b/.x/c', '**/.x/**'));
    assert(pm.isMatch('a/b/.x/c/d', '**/.x/**'));
    assert(pm.isMatch('a/b/.x/c/d/e', '**/.x/**'));
    assert(!pm.isMatch('.x', '**/.x/**'));
    assert(!pm.isMatch('a/b/.x', '**/.x/**'));
  });

  it('should match a dot when the dot is explicitly defined', () => {
    assert(pm.isMatch('.bar.baz', '.*.*'));
    assert(pm.isMatch('.bar.baz', '.*.*'));
    assert(!pm.isMatch('.bar.baz', '.*.*/'));
    assert(pm.isMatch('.bar.baz', '.*.baz'));
    assert(pm.isMatch('.bar.baz/', '.*.*'));
    assert(pm.isMatch('.bar.baz/', '.*.*/'));
    assert(pm.isMatch('.dot', '.*ot'));
    assert(pm.isMatch('.dot', '.[d]ot'));
    assert(pm.isMatch('.dot.foo.bar', '.*ot.*.*'));
    assert(pm.isMatch('.dotfile.js', '.*.js'));
    assert(pm.isMatch('/.dot', '**/.[d]ot'));
    assert(pm.isMatch('/.dot', '**/.dot*'));
    assert(pm.isMatch('/.dot', '/.[d]ot'));
    assert(pm.isMatch('/.dot', '/.dot*'));
    assert(pm.isMatch('a/.dot', '**/.[d]ot'));
    assert(pm.isMatch('a/.dot', '*/.[d]ot'));
    assert(pm.isMatch('a/.dot', '*/.dot*'));
    assert(pm.isMatch('a/b/.dot', '**/.[d]ot'));
    assert(pm.isMatch('a/b/.dot', '**/.dot*'));
    assert(pm.isMatch('.dot', '.[d]ot'));
    assert(pm.isMatch('.dot', '.d?t'));
    assert(pm.isMatch('.dot', '.dot*'));
  });
});
