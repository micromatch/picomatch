'use strict';

require('mocha');
const path = require('path');
const assert = require('assert');
const picomatch = require('..');
const pm = require('./support');
let sep = path.sep;

describe('windows paths', () => {
  beforeEach(() => picomatch.clearCache());
  beforeEach(() => (path.sep = '\\'));
  afterEach(() => (path.sep = sep));

  it('should return an array of matches for a literal string', () => {
    const fixtures = ['a\\a', 'a\\b', 'a\\c', 'b\\a', 'b\\b', 'b\\c'];
    assert.deepEqual(pm(fixtures, '(a/b)'), ['a/b']);
    assert.deepEqual(pm(fixtures, 'a/b'), ['a/b']);
    assert.deepEqual(pm(fixtures, '(a\\\\b)', { unixify: false }), ['a\\b']);
    assert.deepEqual(pm(fixtures, 'a\\\\b', { unixify: false }), ['a\\b']);
    assert.deepEqual(pm(fixtures, '(a/b)', { unixify: false }), []);
    assert.deepEqual(pm(fixtures, 'a/b', { unixify: false }), []);
  });

  it('should return an array of matches for an array of literal strings', () => {
    const fixtures = ['a\\a', 'a\\b', 'a\\c', 'b\\a', 'b\\b', 'b\\c'];
    assert.deepEqual(pm(fixtures, ['(a/b)', 'a/c']), ['a/b', 'a/c']);
    assert.deepEqual(pm(fixtures, ['a/b', 'b/b']), ['a/b', 'b/b']);
    assert.deepEqual(pm(fixtures, ['(a/b)', 'a/c'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['a/b', 'b/b'], { unixify: false }), []);
  });

  it('should support regex logical or', () => {
    const fixtures = ['a\\a', 'a\\b', 'a\\c'];
    assert.deepEqual(pm(fixtures, ['a/(a|c)']), ['a/a', 'a/c']);
    assert.deepEqual(pm(fixtures, ['a/(a|b|c)', 'a/b']), ['a/a', 'a/b', 'a/c']);
    assert.deepEqual(pm(fixtures, ['a/(a|c)'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['a/(a|b|c)', 'a/b'], { unixify: false }), []);
  });

  it('should support regex ranges', () => {
    const fixtures = ['a\\a', 'a\\b', 'a\\c', 'a\\x\\y', 'a\\x'];
    assert.deepEqual(pm(fixtures, 'a/[b-c]'), ['a/b', 'a/c']);
    assert.deepEqual(pm(fixtures, 'a/[a-z]'), ['a/a', 'a/b', 'a/c', 'a/x']);
    assert.deepEqual(pm(fixtures, 'a/[b-c]', { unixify: false }), []);
    assert.deepEqual(pm(fixtures, 'a/[a-z]', { unixify: false }), []);
  });

  it('should support single globs (*)', () => {
    const fixtures = ['a', 'b', 'a\\a', 'a\\b', 'a\\c', 'a\\x', 'a\\a\\a', 'a\\a\\b', 'a\\a\\a\\a', 'a\\a\\a\\a\\a', 'x\\y', 'z\\z'];

    assert.deepEqual(pm(fixtures, ['*']), ['a', 'b']);
    assert.deepEqual(pm(fixtures, ['*/*']), ['a/a', 'a/b', 'a/c', 'a/x', 'x/y', 'z/z']);
    assert.deepEqual(pm(fixtures, ['*/*/*']), ['a/a/a', 'a/a/b']);
    assert.deepEqual(pm(fixtures, ['*/*/*/*']), ['a/a/a/a']);
    assert.deepEqual(pm(fixtures, ['*/*/*/*/*']), ['a/a/a/a/a']);
    assert.deepEqual(pm(fixtures, ['a/*']), ['a/a', 'a/b', 'a/c', 'a/x']);
    assert.deepEqual(pm(fixtures, ['a/*/*']), ['a/a/a', 'a/a/b']);
    assert.deepEqual(pm(fixtures, ['a/*/*/*']), ['a/a/a/a']);
    assert.deepEqual(pm(fixtures, ['a/*/*/*/*']), ['a/a/a/a/a']);
    assert.deepEqual(pm(fixtures, ['a/*/a']), ['a/a/a']);
    assert.deepEqual(pm(fixtures, ['a/*/b']), ['a/a/b']);

    assert.deepEqual(pm(fixtures, ['*/*'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['*/*/*'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['*/*/*/*'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['*/*/*/*/*'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['a/*'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['a/*/*'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['a/*/*/*'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['a/*/*/*/*'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['a/*/a'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['a/*/b'], { unixify: false }), []);
  });

  it('should support globstars (**)', () => {
    const fixtures = ['a\\a', 'a\\b', 'a\\c', 'a\\x', 'a\\x\\y', 'a\\x\\y\\z'];
    const expected = ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z'];
    assert.deepEqual(pm(fixtures, ['a/**']), expected);
    assert.deepEqual(pm(fixtures, ['a/**/*']), expected);
    assert.deepEqual(pm(fixtures, ['a/**/**/*']), expected);

    assert.deepEqual(pm(fixtures, ['a/**'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['a/**/*'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['a/**/**/*'], { unixify: false }), []);
  });

  it('should work with file extensions', () => {
    const fixtures = ['a.txt', 'a\\b.txt', 'a\\x\\y.txt', 'a\\x\\y\\z'];
    assert.deepEqual(pm(fixtures, ['a*.txt']), ['a.txt']);
    assert.deepEqual(pm(fixtures, ['a.txt']), ['a.txt']);
    assert.deepEqual(pm(fixtures, ['a/**/*.txt']), ['a/b.txt', 'a/x/y.txt']);
    assert.deepEqual(pm(fixtures, ['a/**/*.txt'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['a/*.txt']), ['a/b.txt']);
    assert.deepEqual(pm(fixtures, ['a/*.txt'], { unixify: false }), []);
    assert.deepEqual(pm(fixtures, ['a/*/*.txt']), ['a/x/y.txt']);
    assert.deepEqual(pm(fixtures, ['a/*/*.txt'], { unixify: false }), []);
  });

  it('should support negation patterns', () => {
    const fixtures = ['a', 'a\\a', 'a\\b', 'a\\c', 'b\\a', 'b\\b', 'b\\c'];
    assert.deepEqual(pm(fixtures, ['!a/b']), ['a', 'a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
    assert.deepEqual(pm(fixtures, ['*/*', '!a/b', '!*/c']), ['a/a', 'b/a', 'b/b']);
    assert.deepEqual(pm(fixtures, ['!*/c']), ['a', 'a/a', 'a/b', 'b/a', 'b/b']);
    assert.deepEqual(pm(fixtures, ['!a/b', '!*/c']), ['a', 'a/a', 'b/a', 'b/b']);
    assert.deepEqual(pm(fixtures, ['!a/b', '!a/c']), ['a', 'a/a', 'b/a', 'b/b', 'b/c']);
    assert.deepEqual(pm(fixtures, ['!a/(b)']), ['a', 'a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
    assert.deepEqual(pm(fixtures, ['!(a/b)']), ['a', 'a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
  });
});
