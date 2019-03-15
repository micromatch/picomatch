'use strict';

require('./support');
const assert = require('assert');
const { isMatch } = require('..');

describe('issue-related tests', () => {
  it('should match Japanese characters (see micromatch/issues#127)', () => {
    assert(isMatch('フォルダ/aaa.js', 'フ*/**/*'));
    assert(isMatch('フォルダ/aaa.js', 'フォ*/**/*'));
    assert(isMatch('フォルダ/aaa.js', 'フォル*/**/*'));
    assert(isMatch('フォルダ/aaa.js', 'フ*ル*/**/*'));
    assert(isMatch('フォルダ/aaa.js', 'フォルダ/**/*'));
  });

  it('micromatch issue#15', () => {
    assert(isMatch('a/b-c/d/e/z.js', 'a/b-*/**/z.js'));
    assert(isMatch('z.js', 'z*'));
    assert(isMatch('z.js', '**/z*'));
    assert(isMatch('z.js', '**/z*.js'));
    assert(isMatch('z.js', '**/*.js'));
    assert(isMatch('foo', '**/foo'));
  });

  it('micromatch issue#23', () => {
    assert(!isMatch('zzjs', 'z*.js'));
    assert(!isMatch('zzjs', '*z.js'));
  });

  it('micromatch issue#24', () => {
    assert(!isMatch('a/b/c/d/', 'a/b/**/f'));
    assert(!isMatch('a', 'a/**', { strictSlashes: true }));
    assert(isMatch('a', 'a/**'));
    assert(isMatch('a', '**'));
    assert(isMatch('a/', '**'));
    assert(isMatch('a/b/c/d', '**'));
    assert(isMatch('a/b/c/d/', '**'));
    assert(isMatch('a/b/c/d/', '**/**'));
    assert(isMatch('a/b/c/d/', '**/b/**'));
    assert(isMatch('a/b/c/d/', 'a/b/**'));
    assert(isMatch('a/b/c/d/', 'a/b/**/'));
    assert(isMatch('a/b/c/d/e.f', 'a/b/**/**/*.*'));
    assert(isMatch('a/b/c/d/e.f', 'a/b/**/*.*'));
    assert(isMatch('a/b/c/d/g/e.f', 'a/b/**/d/**/*.*'));
    assert(isMatch('a/b/c/d/g/g/e.f', 'a/b/**/d/**/*.*'));
  });

  it('micromatch issue#58 - only match nested dirs when `**` is the only thing in a segment', () => {
    assert(!isMatch('a/b/c', 'a/b**'));
    assert(!isMatch('a/c/b', 'a/**b'));
  });

  it('micromatch issue#79', () => {
    assert(isMatch('a/foo.js', '**/foo.js'));
    assert(isMatch('foo.js', '**/foo.js'));
    assert(isMatch('a/foo.js', '**/foo.js', { dot: true }));
    assert(isMatch('foo.js', '**/foo.js', { dot: true }));
  });
});
