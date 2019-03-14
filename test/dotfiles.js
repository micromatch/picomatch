'use strict';

require('mocha');
const assert = require('assert');
const mm = require('minimatch');
const { isMatch, makeRe } = require('..');

describe('dotfiles', () => {
  it('micromatch issue#63 (dots)', () => {
    assert(!isMatch('/aaa/.git/foo', '/aaa/**/*'));
    assert(!isMatch('/aaa/bbb/.git', '/aaa/bbb/*'));
    assert(!isMatch('/aaa/bbb/.git', '/aaa/bbb/**'));
    assert(!isMatch('/aaa/bbb/ccc/.git', '/aaa/bbb/**'));
    assert(!isMatch('aaa/bbb/.git', 'aaa/bbb/**'));
    assert(isMatch('/aaa/.git/foo', '/aaa/**/*', { dot: true }));
    assert(isMatch('/aaa/bbb/', '/aaa/bbb/**'));
    assert(isMatch('/aaa/bbb/.git', '/aaa/bbb/*', { dot: true }));
    assert(isMatch('/aaa/bbb/.git', '/aaa/bbb/**', { dot: true }));
    assert(isMatch('/aaa/bbb/ccc/.git', '/aaa/bbb/**', { dot: true }));
    assert(isMatch('/aaa/bbb/foo', '/aaa/bbb/**'));
    assert(isMatch('aaa/bbb/.git', 'aaa/bbb/**', { dot: true }));
  });

  it('should not match dotfiles with single stars by default', () => {
    assert(isMatch('foo', '*'));
    assert(isMatch('foo/bar', '*/*'));
    assert(!isMatch('.foo', '*'));
    assert(!isMatch('.foo/bar', '*/*'));
    assert(!isMatch('.foo/.bar', '*/*'));
    assert(!isMatch('foo/.bar', '*/*'));
    assert(!isMatch('foo/.bar/baz', '*/*/*'));
  });

  it('should work with dots in the path', () => {
    assert(isMatch('../test.js', '../*.js'));
    assert(!isMatch('../.test.js', '../*.js'));
  });

  it('should not match dotfiles with globstars by default', () => {
    assert(!isMatch('.foo', '**/**'));
    assert(!isMatch('.foo', '**'));
    assert(!isMatch('.foo', '**/*'));
    assert(!isMatch('bar/.foo', '**/*'));
    assert(!isMatch('.bar', '**/*'));
    assert(!isMatch('foo/.bar', '**/*'));
    assert(!isMatch('foo/.bar', '**/*a*'));
  });

  it('should match dotfiles when a leading dot is in the pattern', () => {
    assert(!isMatch('foo', '**/.*a*'));
    assert(isMatch('.bar', '**/.*a*'));
    assert(isMatch('foo/.bar', '**/.*a*'));
    assert(isMatch('.foo', '**/.*'));

    assert(!isMatch('foo', '.*a*'));
    assert(isMatch('.bar', '.*a*'));
    assert(!isMatch('bar', '.*a*'));

    assert(!isMatch('foo', '.b*'));
    assert(isMatch('.bar', '.b*'));
    assert(!isMatch('bar', '.b*'));

    assert(!isMatch('foo', '.*r'));
    assert(isMatch('.bar', '.*r'));
    assert(!isMatch('bar', '.*r'));
  });

  it('should not match a dot when the dot is not explicitly defined', () => {
    assert(!isMatch('.dot', '**/*dot'));
    assert(!isMatch('.dot', '**/?dot'));
    assert(!isMatch('.dot', '*/*dot'));
    assert(!isMatch('.dot', '*/?dot'));
    assert(!isMatch('.dot', '*dot'));
    assert(!isMatch('.dot', '/*dot'));
    assert(!isMatch('.dot', '/?dot'));
    assert(!isMatch('/.dot', '**/*dot'));
    assert(!isMatch('/.dot', '**/?dot'));
    assert(!isMatch('/.dot', '*/*dot'));
    assert(!isMatch('/.dot', '*/?dot'));
    assert(!isMatch('/.dot', '/*dot'));
    assert(!isMatch('/.dot', '/?dot'));
    assert(!isMatch('a/.dot', '*/*dot'));
    assert(!isMatch('a/.dot', '*/?dot'));
    assert(!isMatch('a/.dot', 'a/*dot'));
    assert(!isMatch('a/b/.dot', '**/*dot'));
    assert(!isMatch('a/b/.dot', '**/?dot'));
  });

  it('should not match leading dots with question marks', () => {
    assert(!isMatch('.dot', '?dot'));
    assert(!isMatch('/.dot', '/?dot'));
    assert(!isMatch('a/.dot', 'a/?dot'));
  });

  it('should match double dots when defined in pattern', () => {
    assert(!isMatch('../../b', '**/../*'));
    assert(!isMatch('../../b', '*/../*'));
    assert(!isMatch('../../b', '../*'));
    assert(!isMatch('../a', '*/../*'));
    assert(!isMatch('../c', '*/../*'));
    assert(!isMatch('../c/d', '**/../*'));
    assert(!isMatch('../c/d', '*/../*'));
    assert(!isMatch('../c/d', '../*'));
    assert(!isMatch('a', '**/../*'));
    assert(!isMatch('a', '*/../*'));
    assert(!isMatch('a', '../*'));
    assert(!isMatch('a/../a', '../*'));
    assert(!isMatch('ab/../ac', '../*'));
    assert(!isMatch('a/../', '**/../*'));

    assert(isMatch('../a', '**/../*'));
    assert(isMatch('../a', '../*'));
    assert(isMatch('a/../a', '**/../*'));
    assert(isMatch('a/../a', '*/../*'));
    assert(isMatch('ab/../ac', '**/../*'));
    assert(isMatch('ab/../ac', '*/../*'));
  });

  it('should not match double dots when not defined in pattern', async() => {
    assert(!isMatch('../a', '**/*/*'));
    assert(!isMatch('../a', '*/*'));
    assert(!isMatch('a/../a', '**/*/*'));
    assert(!isMatch('a/../a', '*/*/*'));
    assert(!isMatch('ab/../ac', '**/*/*'));
    assert(!isMatch('ab/../ac', '*/*/*'));

    assert(!isMatch('../c', '**/**/**', { dot: true }));
    assert(!isMatch('../c', '**/**/**'));

    assert(!isMatch('../a', '**/*/*', { dot: true }));
    assert(!isMatch('../a', '*/*', { dot: true }));
    assert(!isMatch('a/../a', '**/*/*', { dot: true }));
    assert(!isMatch('a/../a', '*/*/*', { dot: true }));
    assert(!isMatch('ab/../ac', '**/*/*', { dot: true }));
    assert(!isMatch('ab/../ac', '*/*/*', { dot: true }));
    assert(!isMatch('ab/..', '**/*', { dot: true }));
    assert(!isMatch('ab/..', '*/*', { dot: true }));
    assert(!isMatch('ab/a/..', '*/**/*', { dot: true }));
  });

  it('should not match single exclusive dots when not defined in pattern', async() => {
    assert(!isMatch('.', '**', { dot: true }));
    assert(!isMatch('a/./a', '**', { dot: true }));
    assert(!isMatch('a/a/.', '**', { dot: true }));
    assert(!isMatch('a/b/./c', '**', { dot: true }));

    assert(!isMatch('.', '**'));
    assert(!isMatch('a/./a', '**'));
    assert(!isMatch('a/a/.', '**'));
    assert(!isMatch('a/b/./c', '**'));
  });

  it('should match dots in root path when glob is prefixed with **/', () => {
    assert(isMatch('.x', '**/.x/**'));
    assert(!isMatch('.x', '**/.x/**', { strictSlashes: true }));
    assert(!isMatch('.x/.x', '**/.x/**'));
    assert(!isMatch('a/b/.x', '**/.x/**', { strictSlashes: true }));
    assert(isMatch('a/b/.x', '**/.x/**'));
    assert(isMatch('.x/', '**/.x/**'));
    assert(isMatch('.x/a', '**/.x/**'));
    assert(isMatch('.x/a/b', '**/.x/**'));
    assert(isMatch('a/.x/b', '**/.x/**'));
    assert(isMatch('a/b/.x', '**/.x'));
    assert(isMatch('a/b/.x/', '**/.x/**'));
    assert(isMatch('a/b/.x/c', '**/.x/**'));
    assert(isMatch('a/b/.x/c/d', '**/.x/**'));
    assert(isMatch('a/b/.x/c/d/e', '**/.x/**'));
  });

  it('should match a dot when the dot is explicitly defined', () => {
    assert(!isMatch('.bar.baz', '.*.*/'));
    assert(!isMatch('.bar.baz/', '.*.*', { strictSlashes: true }));
    assert(isMatch('.bar.baz', '.*.*'));
    assert(isMatch('.bar.baz', '.*.*'));
    assert(isMatch('.bar.baz', '.*.baz'));
    assert(isMatch('.bar.baz/', '.*.*/'));
    assert(isMatch('.bar.baz/', '.*.*{,/}'));
    assert(isMatch('.dot', '.*ot'));
    assert(isMatch('.dot', '.[d]ot'));
    assert(isMatch('.dot', '.[d]ot'));
    assert(isMatch('.dot', '.d?t'));
    assert(isMatch('.dot', '.dot*'));
    assert(isMatch('.dot.foo.bar', '.*ot.*.*'));
    assert(isMatch('.dotfile.js', '.*.js'));
    assert(isMatch('/.dot', '**/.[d]ot'));
    assert(isMatch('/.dot', '**/.dot*'));
    assert(isMatch('/.dot', '/.[d]ot'));
    assert(isMatch('/.dot', '/.dot*'));
    assert(isMatch('a/.dot', '**/.[d]ot'));
    assert(isMatch('a/.dot', '*/.[d]ot'));
    assert(isMatch('a/.dot', '*/.dot*'));
    assert(isMatch('a/b/.dot', '**/.[d]ot'));
    assert(isMatch('a/b/.dot', '**/.dot*'));
  });
});
