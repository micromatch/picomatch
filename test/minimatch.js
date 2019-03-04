'use strict';

const path = require('path');
const assert = require('assert');
const isWindows = () => process.platform === 'win32' || path.sep === '\\';
const pm = require('..');
let sep = path.sep;

describe('minimatch parity:', () => {
  describe('minimatch issues (as of 12/7/2016)', () => {
    it('https://github.com/isaacs/minimatch/issues/29', () => {
      assert(pm.isMatch('foo/bar.txt', 'foo/**/*.txt'));
      assert(pm.makeRe('foo/**/*.txt').test('foo/bar.txt'));
      assert(!pm.isMatch('n/!(axios)/**', 'n/axios/a.js'));
      assert(!pm.makeRe('n/!(axios)/**').test('n/axios/a.js'));
    });

    it('https://github.com/isaacs/minimatch/issues/30', () => {
      assert(pm.isMatch('foo/bar.js', '**/foo/**'));
      assert(pm.isMatch('./foo/bar.js', './**/foo/**'));
      assert(pm.isMatch('./foo/bar.js', '**/foo/**'));
      assert(pm.isMatch('./foo/bar.txt', 'foo/**/*.txt'));
      assert(pm.makeRe('./foo/**/*.txt').test('foo/bar.txt'));
      assert(!pm.isMatch('./foo/!(bar)/**', 'foo/bar/a.js'));
      assert(!pm.makeRe('./foo/!(bar)/**').test('foo/bar/a.js'));
    });

    it('https://github.com/isaacs/minimatch/issues/50', () => {
      assert(pm.isMatch('foo/bar-[ABC].txt', 'foo/**/*-\\[ABC\\].txt'));
      assert(!pm.isMatch('foo/bar-[ABC].txt', 'foo/**/*-\\[abc\\].txt'));
      assert(pm.isMatch('foo/bar-[ABC].txt', 'foo/**/*-\\[abc\\].txt', { nocase: true }));
    });

    it('https://github.com/isaacs/minimatch/issues/67 (should work consistently with `makeRe` and matcher functions)', () => {
      let re = pm.makeRe('node_modules/foobar/**/*.bar');
      assert(re.test('node_modules/foobar/foo.bar'));
      assert(pm.isMatch('node_modules/foobar/foo.bar', 'node_modules/foobar/**/*.bar'));
    });

    it('https://github.com/isaacs/minimatch/issues/75', () => {
      assert(pm.isMatch('foo/baz.qux.js', 'foo/@(baz.qux).js'));
      assert(pm.isMatch('foo/baz.qux.js', 'foo/+(baz.qux).js'));
      assert(pm.isMatch('foo/baz.qux.js', 'foo/*(baz.qux).js'));
      assert(!pm.isMatch('foo/baz.qux.js', 'foo/!(baz.qux).js'));
      assert(!pm.isMatch('foo/bar/baz.qux.js', 'foo/*/!(baz.qux).js'));
      assert(!pm.isMatch('foo/bar/bazqux.js', '**/!(bazqux).js'));
      assert(!pm.isMatch('foo/bar/bazqux.js', '**/bar/!(bazqux).js'));
      assert(!pm.isMatch('foo/bar/bazqux.js', 'foo/**/!(bazqux).js'));
      assert(!pm.isMatch('foo/bar/bazqux.js', 'foo/**/!(bazqux)*.js'));
      assert(!pm.isMatch('foo/bar/baz.qux.js', 'foo/**/!(baz.qux)*.js'));
      assert(!pm.isMatch('foo/bar/baz.qux.js', 'foo/**/!(baz.qux).js'));
      assert(!pm.isMatch('foobar.js', '!(foo)*.js'));
      assert(!pm.isMatch('foo.js', '!(foo).js'));
      assert(!pm.isMatch('foo.js', '!(foo)*.js'));
    });

    it('https://github.com/isaacs/minimatch/issues/78', () => {
      assert(pm.isMatch('a\\b\\c.txt', 'a/**/*.txt', { unixify: true }));
      assert(pm.isMatch('a/b/c.txt', 'a/**/*.txt', { unixify: true }));
    });

    it('https://github.com/isaacs/minimatch/issues/82', () => {
      assert(pm.isMatch('./src/test/a.js', '**/test/**'));
      assert(pm.isMatch('src/test/a.js', '**/test/**'));
    });

    it('https://github.com/isaacs/minimatch/issues/83', () => {
      assert(!pm.makeRe('foo/!(bar)/**').test('foo/bar/a.js'));
      assert(!pm.isMatch('foo/!(bar)/**', 'foo/bar/a.js'));
    });
  });
});
