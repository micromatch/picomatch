'use strict';

const assert = require('assert');
const support = require('./support');
const match = require('./support/match');
const { isMatch } = require('..');

describe('options', () => {
  beforeEach(() => support.windowsPathSep());
  afterEach(() => support.resetPathSep());

  describe('options.matchBase', () => {
    it('should match the basename of file paths when `options.matchBase` is true', () => {
      assert.deepStrictEqual(match(['a/b/c/d.md'], '*.md'), [], 'should not match multiple levels');
      assert.deepStrictEqual(match(['a/b/c/foo.md'], '*.md'), [], 'should not match multiple levels');
      assert.deepStrictEqual(match(['ab', 'acb', 'acb/', 'acb/d/e', 'x/y/acb', 'x/y/acb/d'], 'a?b'), ['acb'], 'should not match multiple levels');
      assert.deepStrictEqual(match(['a/b/c/d.md'], '*.md', { matchBase: true }), ['a/b/c/d.md']);
      assert.deepStrictEqual(match(['a/b/c/foo.md'], '*.md', { matchBase: true }), ['a/b/c/foo.md']);
      assert.deepStrictEqual(match(['x/y/acb', 'acb/', 'acb/d/e', 'x/y/acb/d'], 'a?b', { matchBase: true }), ['x/y/acb', 'acb/']);
    });

    it('should work with negation patterns', () => {
      assert(isMatch('./x/y.js', '*.js', { matchBase: true }));
      assert(!isMatch('./x/y.js', '!*.js', { matchBase: true }));
    });

    it('should not affect patterns with slashes', () => {
      assert(isMatch('x/y.js', 'x/**'));
      assert(isMatch('x/y.js', 'x/**', { matchBase: true }));
      assert(isMatch('x/y.js', '**/*.js'));
      assert(isMatch('x/y.js', '**/*.js', { matchBase: true }));
      assert(!isMatch('x/y.js', '!**/*.js'));
      assert(!isMatch('x/y.js', '!**/*.js', { matchBase: true }));
    });
  });

  describe('options.flags', () => {
    it('should be case-sensitive by default', () => {
      assert.deepStrictEqual(match(['a/b/d/e.md'], 'a/b/D/*.md'), [], 'should not match a dirname');
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/*/E.md'), [], 'should not match a basename');
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/C/*.MD'), [], 'should not match a file extension');
    });

    it('should not be case-sensitive when `i` is set on `options.flags`', () => {
      assert.deepStrictEqual(match(['a/b/d/e.md'], 'a/b/D/*.md', { flags: 'i' }), ['a/b/d/e.md']);
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/*/E.md', { flags: 'i' }), ['a/b/c/e.md']);
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/C/*.MD', { flags: 'i' }), ['a/b/c/e.md']);
    });
  });

  describe('options.nocase', () => {
    it('should not be case-sensitive when `options.nocase` is true', () => {
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/*/E.md', { nocase: true }), ['a/b/c/e.md']);
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/C/*.MD', { nocase: true }), ['a/b/c/e.md']);
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/C/*.md', { nocase: true }), ['a/b/c/e.md']);
      assert.deepStrictEqual(match(['a/b/d/e.md'], 'a/b/D/*.md', { nocase: true }), ['a/b/d/e.md']);
    });

    it('should not double-set `i` when both `nocase` and the `i` flag are set', () => {
      const opts = { nocase: true, flags: 'i' };
      assert.deepStrictEqual(match(['a/b/d/e.md'], 'a/b/D/*.md', opts), ['a/b/d/e.md']);
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/*/E.md', opts), ['a/b/c/e.md']);
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/C/*.MD', opts), ['a/b/c/e.md']);
    });
  });

  describe('options.noextglob', () => {
    it('should match literal parens when noextglob is true (issue #116)', () => {
      assert(isMatch('a/(dir)', 'a/(dir)', { noextglob: true }));
    });

    it('should not match extglobs when noextglob is true', () => {
      assert(!isMatch('ax', '?(a*|b)', { noextglob: true }));
      assert.deepStrictEqual(match(['a.j.js', 'a.md.js'], '*.*(j).js', { noextglob: true }), ['a.j.js']);
      assert.deepStrictEqual(match(['a/z', 'a/b', 'a/!(z)'], 'a/!(z)', { noextglob: true }), ['a/!(z)']);
      assert.deepStrictEqual(match(['a/z', 'a/b'], 'a/!(z)', { noextglob: true }), []);
      assert.deepStrictEqual(match(['c/a/v'], 'c/!(z)/v', { noextglob: true }), []);
      assert.deepStrictEqual(match(['c/z/v', 'c/a/v'], 'c/!(z)/v', { noextglob: true }), []);
      assert.deepStrictEqual(match(['c/z/v', 'c/a/v'], 'c/@(z)/v', { noextglob: true }), []);
      assert.deepStrictEqual(match(['c/z/v', 'c/a/v'], 'c/+(z)/v', { noextglob: true }), []);
      assert.deepStrictEqual(match(['c/z/v', 'c/a/v'], 'c/*(z)/v', { noextglob: true }), ['c/z/v']);
      assert.deepStrictEqual(match(['c/z/v', 'z', 'zf', 'fz'], '?(z)', { noextglob: true }), ['fz']);
      assert.deepStrictEqual(match(['c/z/v', 'z', 'zf', 'fz'], '+(z)', { noextglob: true }), []);
      assert.deepStrictEqual(match(['c/z/v', 'z', 'zf', 'fz'], '*(z)', { noextglob: true }), ['z', 'fz']);
      assert.deepStrictEqual(match(['cz', 'abz', 'az'], 'a@(z)', { noextglob: true }), []);
      assert.deepStrictEqual(match(['cz', 'abz', 'az'], 'a*@(z)', { noextglob: true }), []);
      assert.deepStrictEqual(match(['cz', 'abz', 'az'], 'a!(z)', { noextglob: true }), []);
      assert.deepStrictEqual(match(['cz', 'abz', 'az', 'azz'], 'a?(z)', { noextglob: true }), ['abz', 'azz']);
      assert.deepStrictEqual(match(['cz', 'abz', 'az', 'azz', 'a+z'], 'a+(z)', { noextglob: true }), ['a+z']);
      assert.deepStrictEqual(match(['cz', 'abz', 'az'], 'a*(z)', { noextglob: true }), ['abz', 'az']);
      assert.deepStrictEqual(match(['cz', 'abz', 'az'], 'a**(z)', { noextglob: true }), ['abz', 'az']);
      assert.deepStrictEqual(match(['cz', 'abz', 'az'], 'a*!(z)', { noextglob: true }), []);
    });
  });

  describe('options.unescape', () => {
    it('should remove backslashes in glob patterns:', () => {
      const fixtures = ['abc', '/a/b/c', '\\a\\b\\c'];
      assert.deepStrictEqual(match(fixtures, '\\a\\b\\c'), ['/a/b/c']);
      assert.deepStrictEqual(match(fixtures, '\\a\\b\\c', { unescape: true }), ['abc', '/a/b/c']);
      assert.deepStrictEqual(match(fixtures, '\\a\\b\\c', { unescape: false }), ['/a/b/c']);
    });
  });

  describe('options.nonegate', () => {
    it('should support the `nonegate` option:', () => {
      assert.deepStrictEqual(match(['a/a/a', 'a/b/a', 'b/b/a', 'c/c/a', 'c/c/b'], '!**/a'), ['c/c/b']);
      assert.deepStrictEqual(match(['a.md', '!a.md', 'a.txt'], '!*.md', { nonegate: true }), ['!a.md']);
      assert.deepStrictEqual(match(['!a/a/a', '!a/a', 'a/b/a', 'b/b/a', '!c/c/a', '!c/a'], '!**/a', { nonegate: true }), ['!a/a', '!c/a']);
      assert.deepStrictEqual(match(['!*.md', '.dotfile.txt', 'a/b/.dotfile'], '!*.md', { nonegate: true }), ['!*.md']);
    });
  });

  describe('options.windows', () => {
    it('should windows file paths by default', () => {
      assert.deepStrictEqual(match(['a\\b\\c.md'], '**/*.md'), ['a/b/c.md']);
      assert.deepStrictEqual(match(['a\\b\\c.md'], '**/*.md', { windows: false }), ['a\\b\\c.md']);
    });

    it('should windows absolute paths', () => {
      assert.deepStrictEqual(match(['E:\\a\\b\\c.md'], 'E:/**/*.md'), ['E:/a/b/c.md']);
      assert.deepStrictEqual(match(['E:\\a\\b\\c.md'], 'E:/**/*.md', { windows: false }), []);
    });

    it('should strip leading `./`', () => {
      const fixtures = ['./a', './a/a/a', './a/a/a/a', './a/a/a/a/a', './a/b', './a/x', './z/z', 'a', 'a/a', 'a/a/b', 'a/c', 'b', 'x/y'].sort();
      const format = str => str.replace(/^\.\//, '');
      const opts = { format };
      assert.deepStrictEqual(match(fixtures, '*', opts), ['a', 'b']);
      assert.deepStrictEqual(match(fixtures, '**/a/**', opts), ['a', 'a/a/a', 'a/a/a/a', 'a/a/a/a/a', 'a/b', 'a/x', 'a/a', 'a/a/b', 'a/c']);
      assert.deepStrictEqual(match(fixtures, '*/*', opts), ['a/b', 'a/x', 'z/z', 'a/a', 'a/c', 'x/y']);
      assert.deepStrictEqual(match(fixtures, '*/*/*', opts), ['a/a/a', 'a/a/b']);
      assert.deepStrictEqual(match(fixtures, '*/*/*/*', opts), ['a/a/a/a']);
      assert.deepStrictEqual(match(fixtures, '*/*/*/*/*', opts), ['a/a/a/a/a']);
      assert.deepStrictEqual(match(fixtures, './*', opts), ['a', 'b']);
      assert.deepStrictEqual(match(fixtures, './**/a/**', opts), ['a', 'a/a/a', 'a/a/a/a', 'a/a/a/a/a', 'a/b', 'a/x', 'a/a', 'a/a/b', 'a/c']);
      assert.deepStrictEqual(match(fixtures, './a/*/a', opts), ['a/a/a']);
      assert.deepStrictEqual(match(fixtures, 'a/*', opts), ['a/b', 'a/x', 'a/a', 'a/c']);
      assert.deepStrictEqual(match(fixtures, 'a/*/*', opts), ['a/a/a', 'a/a/b']);
      assert.deepStrictEqual(match(fixtures, 'a/*/*/*', opts), ['a/a/a/a']);
      assert.deepStrictEqual(match(fixtures, 'a/*/*/*/*', opts), ['a/a/a/a/a']);
      assert.deepStrictEqual(match(fixtures, 'a/*/a', opts), ['a/a/a']);

      assert.deepStrictEqual(match(fixtures, '*', { ...opts, windows: false }), ['a', 'b']);
      assert.deepStrictEqual(match(fixtures, '**/a/**', { ...opts, windows: false }), ['a', 'a/a/a', 'a/a/a/a', 'a/a/a/a/a', 'a/b', 'a/x', 'a/a', 'a/a/b', 'a/c']);
      assert.deepStrictEqual(match(fixtures, '*/*', { ...opts, windows: false }), ['a/b', 'a/x', 'z/z', 'a/a', 'a/c', 'x/y']);
      assert.deepStrictEqual(match(fixtures, '*/*/*', { ...opts, windows: false }), ['a/a/a', 'a/a/b']);
      assert.deepStrictEqual(match(fixtures, '*/*/*/*', { ...opts, windows: false }), ['a/a/a/a']);
      assert.deepStrictEqual(match(fixtures, '*/*/*/*/*', { ...opts, windows: false }), ['a/a/a/a/a']);
      assert.deepStrictEqual(match(fixtures, './*', { ...opts, windows: false }), ['a', 'b']);
      assert.deepStrictEqual(match(fixtures, './**/a/**', { ...opts, windows: false }), ['a', 'a/a/a', 'a/a/a/a', 'a/a/a/a/a', 'a/b', 'a/x', 'a/a', 'a/a/b', 'a/c']);
      assert.deepStrictEqual(match(fixtures, './a/*/a', { ...opts, windows: false }), ['a/a/a']);
      assert.deepStrictEqual(match(fixtures, 'a/*', { ...opts, windows: false }), ['a/b', 'a/x', 'a/a', 'a/c']);
      assert.deepStrictEqual(match(fixtures, 'a/*/*', { ...opts, windows: false }), ['a/a/a', 'a/a/b']);
      assert.deepStrictEqual(match(fixtures, 'a/*/*/*', { ...opts, windows: false }), ['a/a/a/a']);
      assert.deepStrictEqual(match(fixtures, 'a/*/*/*/*', { ...opts, windows: false }), ['a/a/a/a/a']);
      assert.deepStrictEqual(match(fixtures, 'a/*/a', { ...opts, windows: false }), ['a/a/a']);
    });
  });

  describe('windows', () => {
    it('should convert file paths to posix slashes', () => {
      assert.deepStrictEqual(match(['a\\b\\c.md'], '**/*.md'), ['a/b/c.md']);
      assert.deepStrictEqual(match(['a\\b\\c.md'], '**/*.md', { windows: false }), ['a\\b\\c.md']);
    });

    it('should convert absolute paths to posix slashes', () => {
      assert.deepStrictEqual(match(['E:\\a\\b\\c.md'], 'E:/**/*.md'), ['E:/a/b/c.md']);
      assert.deepStrictEqual(match(['E:\\a\\b\\c.md'], 'E:/**/*.md', { windows: false }), []);
    });
  });
});
