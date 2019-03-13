'use strict';

const path = require('path');
const assert = require('assert');
const format = str => str.replace(/^\.\//, '');
const { isMatch, makeRe } = require('..');

describe('minimatch parity:', () => {
  describe('minimatch issues (as of 12/7/2016)', () => {
    it('https://github.com/isaacs/minimatch/issues/29', () => {
      assert(isMatch('foo/bar.txt', 'foo/**/*.txt'));
      assert(makeRe('foo/**/*.txt').test('foo/bar.txt'));
      assert(!isMatch('n/!(axios)/**', 'n/axios/a.js'));
      assert(!makeRe('n/!(axios)/**').test('n/axios/a.js'));
    });

    it('https://github.com/isaacs/minimatch/issues/30', () => {
      assert(isMatch('foo/bar.js', '**/foo/**', { format }));
      assert(isMatch('./foo/bar.js', './**/foo/**', { format }));
      assert(isMatch('./foo/bar.js', '**/foo/**', { format }));
      assert(isMatch('./foo/bar.txt', 'foo/**/*.txt', { format }));
      assert(makeRe('./foo/**/*.txt').test('foo/bar.txt'));
      assert(!isMatch('./foo/!(bar)/**', 'foo/bar/a.js', { format }));
      assert(!makeRe('./foo/!(bar)/**').test('foo/bar/a.js'));
    });

    it('https://github.com/isaacs/minimatch/issues/50', () => {
      assert(isMatch('foo/bar-[ABC].txt', 'foo/**/*-\\[ABC\\].txt'));
      assert(!isMatch('foo/bar-[ABC].txt', 'foo/**/*-\\[abc\\].txt'));
      assert(isMatch('foo/bar-[ABC].txt', 'foo/**/*-\\[abc\\].txt', { nocase: true }));
    });

    it('https://github.com/isaacs/minimatch/issues/67 (should work consistently with `makeRe` and matcher functions)', () => {
      let re = makeRe('node_modules/foobar/**/*.bar');
      assert(re.test('node_modules/foobar/foo.bar'));
      assert(isMatch('node_modules/foobar/foo.bar', 'node_modules/foobar/**/*.bar'));
    });

    it('https://github.com/isaacs/minimatch/issues/75', () => {
      assert(isMatch('foo/baz.qux.js', 'foo/@(baz.qux).js'));
      assert(isMatch('foo/baz.qux.js', 'foo/+(baz.qux).js'));
      assert(isMatch('foo/baz.qux.js', 'foo/*(baz.qux).js'));
      assert(!isMatch('foo/baz.qux.js', 'foo/!(baz.qux).js'));
      assert(!isMatch('foo/bar/baz.qux.js', 'foo/*/!(baz.qux).js'));
      assert(!isMatch('foo/bar/bazqux.js', '**/!(bazqux).js'));
      assert(!isMatch('foo/bar/bazqux.js', '**/bar/!(bazqux).js'));
      assert(!isMatch('foo/bar/bazqux.js', 'foo/**/!(bazqux).js'));
      assert(!isMatch('foo/bar/bazqux.js', 'foo/**/!(bazqux)*.js'));
      assert(!isMatch('foo/bar/baz.qux.js', 'foo/**/!(baz.qux)*.js'));
      assert(!isMatch('foo/bar/baz.qux.js', 'foo/**/!(baz.qux).js'));
      assert(!isMatch('foobar.js', '!(foo)*.js'));
      assert(!isMatch('foo.js', '!(foo).js'));
      assert(!isMatch('foo.js', '!(foo)*.js'));
    });

    it('https://github.com/isaacs/minimatch/issues/78', () => {
      assert(isMatch('a\\b\\c.txt', 'a/**/*.txt', { posixSlashes: true }));
      assert(isMatch('a/b/c.txt', 'a/**/*.txt', { posixSlashes: true }));
    });

    it('https://github.com/isaacs/minimatch/issues/82', () => {
      assert(isMatch('./src/test/a.js', '**/test/**', { format }));
      assert(isMatch('src/test/a.js', '**/test/**'));
    });

    it('https://github.com/isaacs/minimatch/issues/83', () => {
      assert(!makeRe('foo/!(bar)/**').test('foo/bar/a.js'));
      assert(!isMatch('foo/!(bar)/**', 'foo/bar/a.js'));
    });
  });
});
