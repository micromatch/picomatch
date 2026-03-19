'use strict';

const assert = require('assert');
const match = require('./support/match');
const { isMatch } = require('..');

describe('options', () => {
  describe('options.matchBase', () => {
    it('should match the basename of file paths when `options.matchBase` is true', () => {
      assert.deepStrictEqual(match(['a/b/c/d.md'], '*.md', { windows: true }), [], 'should not match multiple levels');
      assert.deepStrictEqual(match(['a/b/c/foo.md'], '*.md', { windows: true }), [], 'should not match multiple levels');
      assert.deepStrictEqual(match(['ab', 'acb', 'acb/', 'acb/d/e', 'x/y/acb', 'x/y/acb/d'], 'a?b', { windows: true }), ['acb'], 'should not match multiple levels');
      assert.deepStrictEqual(match(['a/b/c/d.md'], '*.md', { matchBase: true, windows: true }), ['a/b/c/d.md']);
      assert.deepStrictEqual(match(['a/b/c/foo.md'], '*.md', { matchBase: true, windows: true }), ['a/b/c/foo.md']);
      assert.deepStrictEqual(match(['x/y/acb', 'acb/', 'acb/d/e', 'x/y/acb/d'], 'a?b', { matchBase: true, windows: true }), ['x/y/acb', 'acb/']);
    });

    it('should work with negation patterns', () => {
      assert(isMatch('./x/y.js', '*.js', { matchBase: true, windows: true }));
      assert(!isMatch('./x/y.js', '!*.js', { matchBase: true, windows: true }));
      assert(isMatch('./x/y.js', '**/*.js', { matchBase: true, windows: true }));
      assert(!isMatch('./x/y.js', '!**/*.js', { matchBase: true, windows: true }));
    });
  });

  describe('options.flags', () => {
    it('should be case-sensitive by default', () => {
      assert.deepStrictEqual(match(['a/b/d/e.md'], 'a/b/D/*.md', { windows: true }), [], 'should not match a dirname');
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/*/E.md', { windows: true }), [], 'should not match a basename');
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/C/*.MD', { windows: true }), [], 'should not match a file extension');
    });

    it('should not be case-sensitive when `i` is set on `options.flags`', () => {
      assert.deepStrictEqual(match(['a/b/d/e.md'], 'a/b/D/*.md', { flags: 'i', windows: true }), ['a/b/d/e.md']);
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/*/E.md', { flags: 'i', windows: true }), ['a/b/c/e.md']);
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/C/*.MD', { flags: 'i', windows: true }), ['a/b/c/e.md']);
    });
  });

  describe('options.nocase', () => {
    it('should not be case-sensitive when `options.nocase` is true', () => {
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/*/E.md', { nocase: true, windows: true }), ['a/b/c/e.md']);
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/C/*.MD', { nocase: true, windows: true }), ['a/b/c/e.md']);
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/C/*.md', { nocase: true, windows: true }), ['a/b/c/e.md']);
      assert.deepStrictEqual(match(['a/b/d/e.md'], 'a/b/D/*.md', { nocase: true, windows: true }), ['a/b/d/e.md']);
    });

    it('should not double-set `i` when both `nocase` and the `i` flag are set', () => {
      const opts = { nocase: true, flags: 'i', windows: true };
      assert.deepStrictEqual(match(['a/b/d/e.md'], 'a/b/D/*.md', opts), ['a/b/d/e.md']);
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/*/E.md', opts), ['a/b/c/e.md']);
      assert.deepStrictEqual(match(['a/b/c/e.md'], 'A/b/C/*.MD', opts), ['a/b/c/e.md']);
    });
  });

  describe('options.noextglob', () => {
    it('should match literal parens when noextglob is true (issue #116)', () => {
      assert(isMatch('a/(dir)', 'a/(dir)', { noextglob: true, windows: true }));
    });

    it('should not match extglobs when noextglob is true', () => {
      assert(!isMatch('ax', '?(a*|b)', { noextglob: true, windows: true }));
      assert.deepStrictEqual(match(['a.j.js', 'a.md.js'], '*.*(j).js', { noextglob: true, windows: true }), ['a.j.js']);
      assert.deepStrictEqual(match(['a/z', 'a/b', 'a/!(z)'], 'a/!(z)', { noextglob: true, windows: true }), ['a/!(z)']);
      assert.deepStrictEqual(match(['a/z', 'a/b'], 'a/!(z)', { noextglob: true, windows: true }), []);
      assert.deepStrictEqual(match(['c/a/v'], 'c/!(z)/v', { noextglob: true, windows: true }), []);
      assert.deepStrictEqual(match(['c/z/v', 'c/a/v'], 'c/!(z)/v', { noextglob: true, windows: true }), []);
      assert.deepStrictEqual(match(['c/z/v', 'c/a/v'], 'c/@(z)/v', { noextglob: true, windows: true }), []);
      assert.deepStrictEqual(match(['c/z/v', 'c/a/v'], 'c/+(z)/v', { noextglob: true, windows: true }), []);
      assert.deepStrictEqual(match(['c/z/v', 'c/a/v'], 'c/*(z)/v', { noextglob: true, windows: true }), ['c/z/v']);
      assert.deepStrictEqual(match(['c/z/v', 'z', 'zf', 'fz'], '?(z)', { noextglob: true, windows: true }), ['fz']);
      assert.deepStrictEqual(match(['c/z/v', 'z', 'zf', 'fz'], '+(z)', { noextglob: true, windows: true }), []);
      assert.deepStrictEqual(match(['c/z/v', 'z', 'zf', 'fz'], '*(z)', { noextglob: true, windows: true }), ['z', 'fz']);
      assert.deepStrictEqual(match(['cz', 'abz', 'az'], 'a@(z)', { noextglob: true, windows: true }), []);
      assert.deepStrictEqual(match(['cz', 'abz', 'az'], 'a*@(z)', { noextglob: true, windows: true }), []);
      assert.deepStrictEqual(match(['cz', 'abz', 'az'], 'a!(z)', { noextglob: true, windows: true }), []);
      assert.deepStrictEqual(match(['cz', 'abz', 'az', 'azz'], 'a?(z)', { noextglob: true, windows: true }), ['abz', 'azz']);
      assert.deepStrictEqual(match(['cz', 'abz', 'az', 'azz', 'a+z'], 'a+(z)', { noextglob: true, windows: true }), ['a+z']);
      assert.deepStrictEqual(match(['cz', 'abz', 'az'], 'a*(z)', { noextglob: true, windows: true }), ['abz', 'az']);
      assert.deepStrictEqual(match(['cz', 'abz', 'az'], 'a**(z)', { noextglob: true, windows: true }), ['abz', 'az']);
      assert.deepStrictEqual(match(['cz', 'abz', 'az'], 'a*!(z)', { noextglob: true, windows: true }), []);
    });
  });

  describe('options.unescape', () => {
    it('should remove backslashes in glob patterns:', () => {
      const fixtures = ['abc', '/a/b/c', '\\a\\b\\c'];
      assert.deepStrictEqual(match(fixtures, '\\a\\b\\c', { windows: true }), ['/a/b/c']);
      assert.deepStrictEqual(match(fixtures, '\\a\\b\\c', { unescape: true, windows: true }), ['abc', '/a/b/c']);
      assert.deepStrictEqual(match(fixtures, '\\a\\b\\c', { unescape: false, windows: true }), ['/a/b/c']);
    });
  });

  describe('options.nonegate', () => {
    it('should support the `nonegate` option:', () => {
      assert.deepStrictEqual(match(['a/a/a', 'a/b/a', 'b/b/a', 'c/c/a', 'c/c/b'], '!**/a', { windows: true }), ['c/c/b']);
      assert.deepStrictEqual(match(['a.md', '!a.md', 'a.txt'], '!*.md', { nonegate: true, windows: true }), ['!a.md']);
      assert.deepStrictEqual(match(['!a/a/a', '!a/a', 'a/b/a', 'b/b/a', '!c/c/a', '!c/a'], '!**/a', { nonegate: true, windows: true }), ['!a/a', '!c/a']);
      assert.deepStrictEqual(match(['!*.md', '.dotfile.txt', 'a/b/.dotfile'], '!*.md', { nonegate: true, windows: true }), ['!*.md']);
    });
  });

  describe('options.windows', () => {
    it('should windows file paths by default', () => {
      assert.deepStrictEqual(match(['a\\b\\c.md'], '**/*.md', { windows: true }), ['a/b/c.md']);
      assert.deepStrictEqual(match(['a\\b\\c.md'], '**/*.md', { windows: false }), ['a\\b\\c.md']);
    });

    it('should windows absolute paths', () => {
      assert.deepStrictEqual(match(['E:\\a\\b\\c.md'], 'E:/**/*.md', { windows: true }), ['E:/a/b/c.md']);
      assert.deepStrictEqual(match(['E:\\a\\b\\c.md'], 'E:/**/*.md', { windows: false }), []);
    });

    it('should strip leading `./`', () => {
      const fixtures = ['./a', './a/a/a', './a/a/a/a', './a/a/a/a/a', './a/b', './a/x', './z/z', 'a', 'a/a', 'a/a/b', 'a/c', 'b', 'x/y'].sort();
      const format = str => str.replace(/^\.\//, '');
      const opts = { format, windows: true };
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
      assert.deepStrictEqual(match(['a\\b\\c.md'], '**/*.md', { windows: true }), ['a/b/c.md']);
      assert.deepStrictEqual(match(['a\\b\\c.md'], '**/*.md', { windows: false }), ['a\\b\\c.md']);
    });

    it('should convert absolute paths to posix slashes', () => {
      assert.deepStrictEqual(match(['E:\\a\\b\\c.md'], 'E:/**/*.md', { windows: true }), ['E:/a/b/c.md']);
      assert.deepStrictEqual(match(['E:\\a\\b\\c.md'], 'E:/**/*.md', { windows: false }), []);
    });
  });
});
