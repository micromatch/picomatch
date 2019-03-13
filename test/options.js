'use strict';

const path = require('path');
const assert = require('assert');
const match = require('./support/match');
const { clearCache, isMatch, makeRe } = require('..');

if (!process.env.ORIGINAL_PATH_SEP) {
  process.env.ORIGINAL_PATH_SEP = path.sep
}

const compare = (a, b) => {
  a = a.toLowerCase();
  b = b.toLowerCase();
  return a > b ? 1 : a < b ? -1 : 0;
};

describe('options', () => {
  beforeEach(() => clearCache());
  afterEach(() => clearCache());
  beforeEach(() => (path.sep = '\\'));
  afterEach(() => (path.sep = process.env.ORIGINAL_PATH_SEP));
  after(() => (path.sep = process.env.ORIGINAL_PATH_SEP));

  describe.skip('options.matchBase', () => {
    it('should match the basename of file paths when `options.matchBase` is true', () => {
      assert.deepEqual(match(['a/b/c/d.md'], '*.md'), [], 'should not match multiple levels');
      assert.deepEqual(match(['a/b/c/foo.md'], '*.md'), [], 'should not match multiple levels');
      assert.deepEqual(match(['ab', 'acb', 'acb/', 'acb/d/e', 'x/y/acb', 'x/y/acb/d'], 'a?b'), ['acb'], 'should not match multiple levels');
      assert.deepEqual(match(['a/b/c/d.md'], '*.md', { matchBase: true }), ['a/b/c/d.md']);
      assert.deepEqual(match(['a/b/c/foo.md'], '*.md', { matchBase: true }), ['a/b/c/foo.md']);
      assert.deepEqual(match(['x/y/acb', 'acb/', 'acb/d/e', 'x/y/acb/d'], 'a?b', { matchBase: true }), ['x/y/acb', 'acb/']);
    });

    it('should work with negation patterns', () => {
      assert(isMatch('./x/y.js', '*.js', { matchBase: true }));
      assert(!isMatch('./x/y.js', '!*.js', { matchBase: true }));
      assert(isMatch('./x/y.js', '**/*.js', { matchBase: true }));
      assert(!isMatch('./x/y.js', '!**/*.js', { matchBase: true }));
    });
  });

  describe.skip('options.flags', () => {
    it('should be case-sensitive by default', () => {
      assert.deepEqual(match(['a/b/d/e.md'], 'a/b/D/*.md'), [], 'should not match a dirname');
      assert.deepEqual(match(['a/b/c/e.md'], 'A/b/*/E.md'), [], 'should not match a basename');
      assert.deepEqual(match(['a/b/c/e.md'], 'A/b/C/*.MD'), [], 'should not match a file extension');
    });

    it('should not be case-sensitive when `i` is set on `options.flags`', () => {
      assert.deepEqual(match(['a/b/d/e.md'], 'a/b/D/*.md', { flags: 'i' }), ['a/b/d/e.md']);
      assert.deepEqual(match(['a/b/c/e.md'], 'A/b/*/E.md', { flags: 'i' }), ['a/b/c/e.md']);
      assert.deepEqual(match(['a/b/c/e.md'], 'A/b/C/*.MD', { flags: 'i' }), ['a/b/c/e.md']);
    });
  });

  describe.skip('options.nocase', () => {
    it('should not be case-sensitive when `options.nocase` is true', () => {
      assert.deepEqual(match(['a/b/c/e.md'], 'A/b/*/E.md', { nocase: true }), ['a/b/c/e.md']);
      assert.deepEqual(match(['a/b/c/e.md'], 'A/b/C/*.MD', { nocase: true }), ['a/b/c/e.md']);
      assert.deepEqual(match(['a/b/c/e.md'], 'A/b/C/*.md', { nocase: true }), ['a/b/c/e.md']);
      assert.deepEqual(match(['a/b/d/e.md'], 'a/b/D/*.md', { nocase: true }), ['a/b/d/e.md']);
    });

    it('should not double-set `i` when both `nocase` and the `i` flag are set', () => {
      let opts = { nocase: true, flags: 'i' };
      assert.deepEqual(match(['a/b/d/e.md'], 'a/b/D/*.md', opts), ['a/b/d/e.md']);
      assert.deepEqual(match(['a/b/c/e.md'], 'A/b/*/E.md', opts), ['a/b/c/e.md']);
      assert.deepEqual(match(['a/b/c/e.md'], 'A/b/C/*.MD', opts), ['a/b/c/e.md']);
    });
  });

  describe.skip('options.noextglob', () => {
    it('should match literal parens when noextglob is true (issue #116)', () => {
      assert(isMatch('a/(dir)', 'a/(dir)', { noextglob: true }));
    });

    it('should not match extglobs when noextglob is true', () => {
      assert(!isMatch('ax', '?(a*|b)', { noextglob: true }));
      assert.deepEqual(match(['a.j.js', 'a.md.js'], '*.*(j).js', { noextglob: true }), ['a.j.js']);
      assert.deepEqual(match(['a/z', 'a/b', 'a/!(z)'], 'a/!(z)', { noextglob: true }), ['a/!(z)']);
      assert.deepEqual(match(['a/z', 'a/b'], 'a/!(z)', { noextglob: true }), []);
      assert.deepEqual(match(['c/a/v'], 'c/!(z)/v', { noextglob: true }), []);
      assert.deepEqual(match(['c/z/v', 'c/a/v'], 'c/!(z)/v', { noextglob: true }), []);
      assert.deepEqual(match(['c/z/v', 'c/a/v'], 'c/@(z)/v', { noextglob: true }), []);
      assert.deepEqual(match(['c/z/v', 'c/a/v'], 'c/+(z)/v', { noextglob: true }), []);
      assert.deepEqual(match(['c/z/v', 'c/a/v'], 'c/*(z)/v', { noextglob: true }), ['c/z/v']);
      assert.deepEqual(match(['c/z/v', 'z', 'zf', 'fz'], '?(z)', { noextglob: true }), ['fz']);
      assert.deepEqual(match(['c/z/v', 'z', 'zf', 'fz'], '+(z)', { noextglob: true }), []);
      assert.deepEqual(match(['c/z/v', 'z', 'zf', 'fz'], '*(z)', { noextglob: true }), ['z', 'fz']);
      assert.deepEqual(match(['cz', 'abz', 'az'], 'a@(z)', { noextglob: true }), []);
      assert.deepEqual(match(['cz', 'abz', 'az'], 'a*@(z)', { noextglob: true }), []);
      assert.deepEqual(match(['cz', 'abz', 'az'], 'a!(z)', { noextglob: true }), []);
      assert.deepEqual(match(['cz', 'abz', 'az', 'azz'], 'a?(z)', { noextglob: true }), ['abz', 'azz']);
      assert.deepEqual(match(['cz', 'abz', 'az', 'azz', 'a+z'], 'a+(z)', { noextglob: true }), ['a+z']);
      assert.deepEqual(match(['cz', 'abz', 'az'], 'a*(z)', { noextglob: true }), ['abz', 'az']);
      assert.deepEqual(match(['cz', 'abz', 'az'], 'a**(z)', { noextglob: true }), ['abz', 'az']);
      assert.deepEqual(match(['cz', 'abz', 'az'], 'a*!(z)', { noextglob: true }), []);
    });
  });

  describe.skip('options.nodupes', () => {
    beforeEach(() => {
      path.sep = '\\';
    });
    afterEach(() => {
      path.sep = process.env.ORIGINAL_PATH_SEP;
    });

    it('should remove duplicate elements from the result array:', () => {
      let fixtures = ['.editorconfig', '.git', '.gitignore', '.nyc_output', '.travis.yml', '.verb.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'LICENSE', 'coverage', 'example.js', 'example.md', 'example.css', 'index.js', 'node_modules', 'package.json', 'test.js', 'utils.js'];
      assert.deepEqual(match(['abc', '/a/b/c', '\\a\\b\\c'], '/a/b/c', { unixify: false }), ['/a/b/c']);
      assert.deepEqual(match(['abc', '/a/b/c', '\\a\\b\\c'], '\\a\\b\\c', { unixify: false }), ['\\a\\b\\c']);
      assert.deepEqual(match(['abc', '/a/b/c', '\\a\\b\\c'], '/a/b/c', { unixify: false, nodupes: true }), ['/a/b/c']);
      assert.deepEqual(match(['abc', '/a/b/c', '\\a\\b\\c'], '\\a\\b\\c', { unixify: false, nodupes: true }), ['\\a\\b\\c']);
      assert.deepEqual(match(fixtures, ['example.*', '*.js'], { unixify: false, nodupes: true }), ['example.js', 'example.md', 'example.css', 'index.js', 'test.js', 'utils.js']);
    });

    it('should not remove duplicates', () => {
      assert.deepEqual(match(['abc', '/a/b/c', '\\a\\b\\c'], '/a/b/c'), ['/a/b/c', '\\a\\b\\c']);
      assert.deepEqual(match(['abc', '/a/b/c', '\\a\\b\\c'], '\\a\\b\\c'), ['\\a\\b\\c']);
      assert.deepEqual(match(['abc', '/a/b/c', '\\a\\b\\c'], '\\a\\b\\c', { unixify: false, }), ['\\a\\b\\c'
      ]);
    });
  });

  describe('options.unescape', () => {
    it('should remove backslashes in glob patterns:', () => {
      let fixtures = ['abc', '/a/b/c', '\\a\\b\\c'];
      assert.deepEqual(match(fixtures, '\\a\\b\\c'), ['\\a\\b\\c']);
      assert.deepEqual(match(fixtures, '\\a\\b\\c'), ['\\a\\b\\c']);
      assert.deepEqual(match(fixtures, '\\a\\b\\c', { unescape: false }), ['\\a\\b\\c']);
      assert.deepEqual(match(fixtures, '\\a\\b\\c', { unescape: true, unixify: false }), ['abc', '\\a\\b\\c']);
    });
  });

  describe.skip('options.nonegate', () => {
    it('should support the `nonegate` option:', () => {
      assert.deepEqual(match(['a/a/a', 'a/b/a', 'b/b/a', 'c/c/a', 'c/c/b'], '!**/a'), ['c/c/b']);
      assert.deepEqual(match(['a.md', '!a.md', 'a.txt'], '!*.md', { nonegate: true }), ['!a.md']);
      assert.deepEqual(match(['!a/a/a', '!a/a', 'a/b/a', 'b/b/a', '!c/c/a', '!c/a'], '!**/a', { nonegate: true }), ['!a/a', '!c/a']);
      assert.deepEqual(match(['!*.md', '.dotfile.txt', 'a/b/.dotfile'], '!*.md', { nonegate: true }), ['!*.md']);
    });
  });

  describe('options.unixify', () => {
    it('should unixify file paths by default', () => {
      assert.deepEqual(match(['a\\b\\c.md'], '**/*.md'), ['a\\b\\c.md']);
      assert.deepEqual(match(['a\\b\\c.md'], '**/*.md', { unixify: false }), ['a\\b\\c.md']);
    });

    it('should unixify absolute paths', () => {
      assert.deepEqual(match(['E:\\a\\b\\c.md'], 'E:/**/*.md'), ['E:\\a\\b\\c.md']);
      assert.deepEqual(match(['E:\\a\\b\\c.md'], 'E:/**/*.md', { unixify: false }), []);
    });

    it('should strip leading `./`', () => {
      let fixtures = ['./a', './a/a/a', './a/a/a/a', './a/a/a/a/a', './a/b', './a/x', './z/z', 'a', 'a/a', 'a/a/b', 'a/c', 'b', 'x/y'];
      let format = str => str.replace(/^\.\//, '');
      let opts = { format };
      assert.deepEqual(match(fixtures, '*', opts), ['./a', 'a', 'b']);
      assert.deepEqual(match(fixtures, '**/a/**', opts), ['a', './a', './a/a/a', './a/a/a/a', './a/a/a/a/a', './a/b', './a/x', 'a/a', 'a/a/b', 'a/c'].sort());
      assert.deepEqual(match(fixtures, '*/*', opts), ['./a/b', './a/x', './z/z', 'a/a', 'a/c', 'x/y'].sort());
      assert.deepEqual(match(fixtures, '*/*/*', opts), ['./a/a/a', 'a/a/b'].sort());
      assert.deepEqual(match(fixtures, '*/*/*/*', opts), ['./a/a/a/a'].sort());
      assert.deepEqual(match(fixtures, '*/*/*/*/*', opts), ['./a/a/a/a/a'].sort());
      assert.deepEqual(match(fixtures, './*', opts), ['./a', 'a', 'b'].sort());
      assert.deepEqual(match(fixtures, './**/a/**', opts), ['a', './a', './a/a/a', './a/a/a/a', './a/a/a/a/a', './a/b', './a/x', 'a/a', 'a/a/b', 'a/c'].sort());
      assert.deepEqual(match(fixtures, './a/*/a', opts), ['./a/a/a'].sort());
      assert.deepEqual(match(fixtures, 'a/*', opts), ['./a/b', './a/x', 'a/a', 'a/c'].sort());
      assert.deepEqual(match(fixtures, 'a/*/*', opts), ['./a/a/a', 'a/a/b'].sort());
      assert.deepEqual(match(fixtures, 'a/*/*/*', opts), ['./a/a/a/a'].sort());
      assert.deepEqual(match(fixtures, 'a/*/*/*/*', opts), ['./a/a/a/a/a'].sort());
      assert.deepEqual(match(fixtures, 'a/*/a', opts), ['./a/a/a'].sort());

      assert.deepEqual(match(fixtures, '*', { ...opts, unixify: false }), ['./a', 'a', 'b'].sort());
      assert.deepEqual(match(fixtures, '**/a/**', { ...opts, unixify: false }), ['a', './a', './a/a/a', './a/a/a/a', './a/a/a/a/a', './a/b', './a/x', 'a/a', 'a/a/b', 'a/c'].sort());
      assert.deepEqual(match(fixtures, '*/*', { ...opts, unixify: false }), ['./a/b', './a/x', './z/z', 'a/a', 'a/c', 'x/y'].sort());
      assert.deepEqual(match(fixtures, '*/*/*', { ...opts, unixify: false }), ['./a/a/a', 'a/a/b'].sort());
      assert.deepEqual(match(fixtures, '*/*/*/*', { ...opts, unixify: false }), ['./a/a/a/a'].sort());
      assert.deepEqual(match(fixtures, '*/*/*/*/*', { ...opts, unixify: false }), ['./a/a/a/a/a'].sort());
      assert.deepEqual(match(fixtures, './*', { ...opts, unixify: false }), ['./a', 'a', 'b'].sort());
      assert.deepEqual(match(fixtures, './**/a/**', { ...opts, unixify: false }), ['a', './a', './a/a/a', './a/a/a/a', './a/a/a/a/a', './a/b', './a/x', 'a/a', 'a/a/b', 'a/c'].sort());
      assert.deepEqual(match(fixtures, './a/*/a', { ...opts, unixify: false }), ['./a/a/a'].sort());
      assert.deepEqual(match(fixtures, 'a/*', { ...opts, unixify: false }), ['./a/b', './a/x', 'a/a', 'a/c'].sort());
      assert.deepEqual(match(fixtures, 'a/*/*', { ...opts, unixify: false }), ['./a/a/a', 'a/a/b'].sort());
      assert.deepEqual(match(fixtures, 'a/*/*/*', { ...opts, unixify: false }), ['./a/a/a/a'].sort());
      assert.deepEqual(match(fixtures, 'a/*/*/*/*', { ...opts, unixify: false }), ['./a/a/a/a/a'].sort());
      assert.deepEqual(match(fixtures, 'a/*/a', { ...opts, unixify: false }), ['./a/a/a'].sort());
    });
  });

  describe.skip('options.dot', () => {
    describe.skip('when `dot` or `dotfile` is NOT true:', () => {
      it('should not match dotfiles by default:', () => {
        assert.deepEqual(match(['.dotfile'], '*'), []);
        assert.deepEqual(match(['.dotfile'], '**'), []);
        assert.deepEqual(match(['a/b/c/.dotfile.md'], '*.md'), []);
        assert.deepEqual(match(['a/b', 'a/.b', '.a/b', '.a/.b'], '**'), ['a/b']);
        assert.deepEqual(match(['a/b/c/.dotfile'], '*.*'), []);

        // https://github.com/isaacs/minimatch/issues/30
        assert.deepEqual(match(['foo/bar.js'], '**/foo/**'), ['foo/bar.js']);
        assert.deepEqual(match(['./foo/bar.js'], './**/foo/**'), ['./foo/bar.js']);
        assert.deepEqual(match(['./foo/bar.js'], './**/foo/**', { unixify: false }), ['./foo/bar.js']);
        assert.deepEqual(match(['./foo/bar.js'], '**/foo/**'), ['./foo/bar.js']);
        assert.deepEqual(match(['./foo/bar.js'], '**/foo/**', { unixify: false }), ['./foo/bar.js']);
      });

      it('should match dotfiles when a leading dot is defined in the path:', () => {
        assert.deepEqual(match(['a/b/c/.dotfile.md'], '**/.*'), ['a/b/c/.dotfile.md']);
        assert.deepEqual(match(['a/b/c/.dotfile.md'], '**/.*.md'), ['a/b/c/.dotfile.md']);
      });

      it('should use negation patterns on dotfiles:', () => {
        assert.deepEqual(match(['.a', '.b', 'c', 'c.md'], '!.*'), ['c', 'c.md']);
        assert.deepEqual(match(['.a', '.b', 'c', 'c.md'], '!.b'), ['.a', 'c', 'c.md']);
      });
    });

    describe.skip('when options.dot is true:', () => {
      it('should match dotfiles when there is a leading dot:', () => {
        let opts = { dot: true };
        assert.deepEqual(match(['.dotfile'], '*', opts), ['.dotfile']);
        assert.deepEqual(match(['.dotfile'], '**', opts), ['.dotfile']);
        assert.deepEqual(match(['a/b', 'a/.b', '.a/b', '.a/.b'], '**', opts), ['a/b', 'a/.b', '.a/b', '.a/.b']);
        assert.deepEqual(match(['a/b', 'a/.b', 'a/.b', '.a/.b'], 'a/{.*,**}', opts), ['a/b', 'a/.b']);
        assert.deepEqual(match(['a/b', 'a/.b', 'a/.b', '.a/.b'], '{.*,**}', {}), ['a/b']);
        assert.deepEqual(match(['a/b', 'a/.b', 'a/.b', '.a/.b'], '{.*,**}', opts), ['a/b', 'a/.b', '.a/.b']);
        assert.deepEqual(match(['.dotfile'], '.dotfile', opts), ['.dotfile']);
        assert.deepEqual(match(['.dotfile.md'], '.*.md', opts), ['.dotfile.md']);
      });

      it('should match dotfiles when there is not a leading dot:', () => {
        let opts = { dot: true };
        assert.deepEqual(match(['.dotfile'], '*.*', opts), ['.dotfile']);
        assert.deepEqual(match(['.a', '.b', 'c', 'c.md'], '*.*', opts), ['.a', '.b', 'c.md']);
        assert.deepEqual(match(['.dotfile'], '*.md', opts), []);
        assert.deepEqual(match(['.verb.txt'], '*.md', opts), []);
        assert.deepEqual(match(['a/b/c/.dotfile'], '*.md', opts), []);
        assert.deepEqual(match(['a/b/c/.dotfile.md'], '*.md', opts), []);
        assert.deepEqual(match(['a/b/c/.verb.md'], '**/*.md', opts), ['a/b/c/.verb.md']);
        assert.deepEqual(match(['foo.md'], '*.md', opts), ['foo.md']);
      });

      it('should use negation patterns on dotfiles:', () => {
        assert.deepEqual(match(['.a', '.b', 'c', 'c.md'], '!.*'), ['c', 'c.md']);
        assert.deepEqual(match(['.a', '.b', 'c', 'c.md'], '!(.*)'), ['c', 'c.md']);
        assert.deepEqual(match(['.a', '.b', 'c', 'c.md'], '!(.*)*'), ['c', 'c.md']);
        assert.deepEqual(match(['.a', '.b', 'c', 'c.md'], '!*.*'), ['.a', '.b', 'c']);
      });

      it('should match dotfiles when `options.dot` is true:', () => {
        assert.deepEqual(match(['a/./b', 'a/../b', 'a/c/b', 'a/.d/b'], 'a/.*/b', { dot: true }), ['a/./b', 'a/../b', 'a/.d/b']);
        assert.deepEqual(match(['a/./b', 'a/../b', 'a/c/b', 'a/.d/b'], 'a/.*/b', { dot: false }), ['a/./b', 'a/../b', 'a/.d/b']);
        assert.deepEqual(match(['a/./b', 'a/../b', 'a/c/b', 'a/.d/b'], 'a/*/b', { dot: true }), ['a/c/b', 'a/.d/b']);
        assert.deepEqual(match(['.dotfile'], '*.*', { dot: true }), ['.dotfile']);
        assert.deepEqual(match(['.dotfile'], '*.md', { dot: true }), []);
        assert.deepEqual(match(['.dotfile'], '.dotfile', { dot: true }), ['.dotfile']);
        assert.deepEqual(match(['.dotfile.md'], '.*.md', { dot: true }), ['.dotfile.md']);
        assert.deepEqual(match(['.verb.txt'], '*.md', { dot: true }), []);
        assert.deepEqual(match(['.verb.txt'], '*.md', { dot: true }), []);
        assert.deepEqual(match(['a/b/c/.dotfile'], '*.md', { dot: true }), []);
        assert.deepEqual(match(['a/b/c/.dotfile.md'], '**/*.md', { dot: true }), ['a/b/c/.dotfile.md']);
        assert.deepEqual(match(['a/b/c/.dotfile.md'], '**/.*', { dot: false }), ['a/b/c/.dotfile.md']);
        assert.deepEqual(match(['a/b/c/.dotfile.md'], '**/.*.md', { dot: false }), ['a/b/c/.dotfile.md']);
        assert.deepEqual(match(['a/b/c/.dotfile.md'], '*.md', { dot: false }), []);
        assert.deepEqual(match(['a/b/c/.dotfile.md'], '*.md', { dot: true }), []);
        assert.deepEqual(match(['a/b/c/.verb.md'], '**/*.md', { dot: true }), ['a/b/c/.verb.md']);
        assert.deepEqual(match(['d.md'], '*.md', { dot: true }), ['d.md']);
      });
    });
  });

  describe.skip('windows', () => {
    it('should unixify file paths', () => {
      assert.deepEqual(match(['a\\b\\c.md'], '**/*.md'), ['a\\b\\c.md']);
      assert.deepEqual(match(['a\\b\\c.md'], '**/*.md', { unixify: false }), ['a\\b\\c.md']);
    });

    it('should unixify absolute paths', () => {
      assert.deepEqual(match(['E:\\a\\b\\c.md'], 'E:/**/*.md'), ['E:\\a\\b\\c.md']);
      assert.deepEqual(match(['E:\\a\\b\\c.md'], 'E:/**/*.md', { unixify: false }), []);
    });
  });
});
