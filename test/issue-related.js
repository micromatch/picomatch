'use strict';

const assert = require('assert');
const pm = require('..');

describe('issue-related tests', () => {
  it('micromatch issue#15', () => {
    assert(pm.isMatch('a/b-c/d/e/z.js', 'a/b-*/**/z.js'));
    assert(pm.isMatch('z.js', 'z*'));
    assert(pm.isMatch('z.js', '**/z*'));
    assert(pm.isMatch('z.js', '**/z*.js'));
    assert(pm.isMatch('z.js', '**/*.js'));
    assert(pm.isMatch('foo', '**/foo'));
  });

  it('micromatch issue#23', () => {
    assert(!pm.isMatch('zzjs', 'z*.js'));
    assert(!pm.isMatch('zzjs', '*z.js'));
  });

  it('micromatch issue#24', () => {
    assert(!pm.isMatch('a/b/c/d/', 'a/b/**/f'));
    assert(!pm.isMatch('a', 'a/**'));
    assert(pm.isMatch('a', '**'));
    assert(pm.isMatch('a/', '**'));
    assert(pm.isMatch('a/b/c/d', '**'));
    assert(pm.isMatch('a/b/c/d/', '**'));
    assert(pm.isMatch('a/b/c/d/', '**/**'));
    assert(pm.isMatch('a/b/c/d/', '**/b/**'));
    assert(pm.isMatch('a/b/c/d/', 'a/b/**'));
    assert(pm.isMatch('a/b/c/d/', 'a/b/**/'));
    assert(pm.isMatch('a/b/c/d/e.f', 'a/b/**/**/*.*'));
    assert(pm.isMatch('a/b/c/d/e.f', 'a/b/**/*.*'));
    assert(pm.isMatch('a/b/c/d/g/e.f', 'a/b/**/d/**/*.*'));
    assert(pm.isMatch('a/b/c/d/g/g/e.f', 'a/b/**/d/**/*.*'));
  });

  it('micromatch issue#58 - only match nested dirs when `**` is the only thing in a segment', () => {
    assert(!pm.isMatch('a/b/c', 'a/b**'));
    assert(!pm.isMatch('a/c/b', 'a/**b'));
  });

  it('micromatch issue#63 (dots)', () => {
    assert(!pm.isMatch('/aaa/.git/foo', '/aaa/**/*'));
    assert(!pm.isMatch('/aaa/bbb/.git', '/aaa/bbb/*'));
    assert(!pm.isMatch('/aaa/bbb/.git', '/aaa/bbb/**'));
    assert(!pm.isMatch('/aaa/bbb/ccc/.git', '/aaa/bbb/**'));
    assert(!pm.isMatch('aaa/bbb/.git', 'aaa/bbb/**'));
    assert(pm.isMatch('/aaa/.git/foo', '/aaa/**/*', { dot: true }));
    assert(pm.isMatch('/aaa/bbb/', '/aaa/bbb/**'));
    assert(pm.isMatch('/aaa/bbb/.git', '/aaa/bbb/*', { dot: true }));
    assert(pm.isMatch('/aaa/bbb/.git', '/aaa/bbb/**', { dot: true }));
    assert(pm.isMatch('/aaa/bbb/ccc/.git', '/aaa/bbb/**', { dot: true }));
    assert(pm.isMatch('/aaa/bbb/foo', '/aaa/bbb/**'));
    assert(pm.isMatch('aaa/bbb/.git', 'aaa/bbb/**', { dot: true }));
  });

  it('micromatch issue#79', () => {
    assert(pm.isMatch('a/foo.js', '**/foo.js'));
    assert(pm.isMatch('foo.js', '**/foo.js'));
    assert(pm.isMatch('a/foo.js', '**/foo.js', { dot: true }));
    assert(pm.isMatch('foo.js', '**/foo.js', { dot: true }));
  });
});
