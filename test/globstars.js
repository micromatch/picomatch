
import assert from 'assert';
const match = require('./support/match');
const { isMatch } = require('../lib');

describe('stars', () => {
  describe('issue related', () => {
    it('should match paths with no slashes (micromatch/#15)', () => {
      assert(isMatch('a.js', '**/*.js'));
      assert(isMatch('a.js', '**/a*'));
      assert(isMatch('a.js', '**/a*.js'));
      assert(isMatch('abc', '**/abc'));
    });

    it('should regard non-exclusive double-stars as single stars', () => {
      const fixtures = ['a', 'a/', 'a/a', 'a/a/', 'a/a/a', 'a/a/a/', 'a/a/a/a', 'a/a/a/a/', 'a/a/a/a/a', 'a/a/a/a/a/', 'a/a/b', 'a/a/b/', 'a/b', 'a/b/', 'a/b/c/.d/e/', 'a/c', 'a/c/', 'a/b', 'a/x/', 'b', 'b/', 'x/y', 'x/y/', 'z/z', 'z/z/'];

      assert.deepStrictEqual(match(fixtures, '**a/a/*/'), ['a/a/a/', 'a/a/b/']);
      assert(!isMatch('aaa/bba/ccc', 'aaa/**ccc'));
      assert(!isMatch('aaa/bba/ccc', 'aaa/**z'));
      assert(isMatch('aaa/bba/ccc', 'aaa/**b**/ccc'));
      assert(!isMatch('a/b/c', '**c'));
      assert(!isMatch('a/b/c', 'a/**c'));
      assert(!isMatch('a/b/c', 'a/**z'));
      assert(!isMatch('a/b/c/b/c', 'a/**b**/c'));
      assert(!isMatch('a/b/c/d/e.js', 'a/b/c**/*.js'));
      assert(isMatch('a/b/c/b/c', 'a/**/b/**/c'));
      assert(isMatch('a/aba/c', 'a/**b**/c'));
      assert(isMatch('a/b/c', 'a/**b**/c'));
      assert(isMatch('a/b/c/d.js', 'a/b/c**/*.js'));
    });

    it('should support globstars followed by braces', () => {
      assert(isMatch('a/b/c/d/e/z/foo.md', 'a/**/c/**{,(/z|/x)}/*.md'));
      assert(isMatch('a/b/c/d/e/z/foo.md', 'a/**{,(/x|/z)}/*.md'));
    });

    it('should support globstars followed by braces with nested extglobs', () => {
      assert(isMatch('/x/foo.md', '@(/x|/z)/*.md'));
      assert(isMatch('/z/foo.md', '@(/x|/z)/*.md'));
      assert(isMatch('a/b/c/d/e/z/foo.md', 'a/**/c/**@(/z|/x)/*.md'));
      assert(isMatch('a/b/c/d/e/z/foo.md', 'a/**@(/x|/z)/*.md'));
    });

    it('should support multiple globstars in one pattern', () => {
      assert(!isMatch('a/b/c/d/e/z/foo.md', 'a/**/j/**/z/*.md'));
      assert(!isMatch('a/b/c/j/e/z/foo.txt', 'a/**/j/**/z/*.md'));
      assert(isMatch('a/b/c/d/e/j/n/p/o/z/foo.md', 'a/**/j/**/z/*.md'));
      assert(isMatch('a/b/c/d/e/z/foo.md', 'a/**/z/*.md'));
      assert(isMatch('a/b/c/j/e/z/foo.md', 'a/**/j/**/z/*.md'));
    });

    it('should match file extensions:', () => {
      assert.deepStrictEqual(match(['.md', 'a.md', 'a/b/c.md', '.txt'], '**/*.md'), ['a.md', 'a/b/c.md']);
      assert.deepStrictEqual(match(['.md/.md', '.md', 'a/.md', 'a/b/.md'], '**/.md'), ['.md', 'a/.md', 'a/b/.md']);
      assert.deepStrictEqual(match(['.md/.md', '.md/foo/.md', '.md', 'a/.md', 'a/b/.md'], '.md/**/.md'), ['.md/.md', '.md/foo/.md']);
    });

    it('should respect trailing slashes on paterns', () => {
      const fixtures = ['a', 'a/', 'a/a', 'a/a/', 'a/a/a', 'a/a/a/', 'a/a/a/a', 'a/a/a/a/', 'a/a/a/a/a', 'a/a/a/a/a/', 'a/a/b', 'a/a/b/', 'a/b', 'a/b/', 'a/b/c/.d/e/', 'a/c', 'a/c/', 'a/b', 'a/x/', 'b', 'b/', 'x/y', 'x/y/', 'z/z', 'z/z/'];

      assert.deepStrictEqual(match(fixtures, '**/*/a/'), ['a/a/', 'a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/']);
      assert.deepStrictEqual(match(fixtures, '**/*/a/*/'), ['a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/', 'a/a/b/']);
      assert.deepStrictEqual(match(fixtures, '**/*/x/'), ['a/x/']);
      assert.deepStrictEqual(match(fixtures, '**/*/*/*/*/'), ['a/a/a/a/', 'a/a/a/a/a/']);
      assert.deepStrictEqual(match(fixtures, '**/*/*/*/*/*/'), ['a/a/a/a/a/']);
      assert.deepStrictEqual(match(fixtures, '*a/a/*/'), ['a/a/a/', 'a/a/b/']);
      assert.deepStrictEqual(match(fixtures, '**a/a/*/'), ['a/a/a/', 'a/a/b/']);
      assert.deepStrictEqual(match(fixtures, '**/a/*/*/'), ['a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/', 'a/a/b/']);
      assert.deepStrictEqual(match(fixtures, '**/a/*/*/*/'), ['a/a/a/a/', 'a/a/a/a/a/']);
      assert.deepStrictEqual(match(fixtures, '**/a/*/*/*/*/'), ['a/a/a/a/a/']);
      assert.deepStrictEqual(match(fixtures, '**/a/*/a/'), ['a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/']);
      assert.deepStrictEqual(match(fixtures, '**/a/*/b/'), ['a/a/b/']);
    });

    it('should match literal globstars when stars are escaped', () => {
      const fixtures = ['.md', '**a.md', '**.md', '.md', '**'];
      assert.deepStrictEqual(match(fixtures, '\\*\\**.md'), ['**a.md', '**.md']);
      assert.deepStrictEqual(match(fixtures, '\\*\\*.md'), ['**.md']);
    });

    it('single dots', () => {
      assert(!isMatch('.a/a', '**'));
      assert(!isMatch('a/.a', '**'));
      assert(!isMatch('.a/a', '**/'));
      assert(!isMatch('a/.a', '**/'));
      assert(!isMatch('.a/a', '**/**'));
      assert(!isMatch('a/.a', '**/**'));
      assert(!isMatch('.a/a', '**/**/*'));
      assert(!isMatch('a/.a', '**/**/*'));
      assert(!isMatch('.a/a', '**/**/x'));
      assert(!isMatch('a/.a', '**/**/x'));
      assert(!isMatch('.a/a', '**/x'));
      assert(!isMatch('a/.a', '**/x'));
      assert(!isMatch('.a/a', '**/x/*'));
      assert(!isMatch('a/.a', '**/x/*'));
      assert(!isMatch('.a/a', '**/x/**'));
      assert(!isMatch('a/.a', '**/x/**'));
      assert(!isMatch('.a/a', '**/x/*/*'));
      assert(!isMatch('a/.a', '**/x/*/*'));
      assert(!isMatch('.a/a', '*/x/**'));
      assert(!isMatch('a/.a', '*/x/**'));
      assert(!isMatch('.a/a', 'a/**'));
      assert(!isMatch('a/.a', 'a/**'));
      assert(!isMatch('.a/a', 'a/**/*'));
      assert(!isMatch('a/.a', 'a/**/*'));
      assert(!isMatch('.a/a', 'a/**/**/*'));
      assert(!isMatch('a/.a', 'a/**/**/*'));
      assert(!isMatch('.a/a', 'b/**'));
      assert(!isMatch('a/.a', 'b/**'));
    });

    it('double dots', () => {
      assert(!isMatch('a/../a', '**'));
      assert(!isMatch('ab/../ac', '**'));
      assert(!isMatch('../a', '**'));
      assert(!isMatch('../../b', '**'));
      assert(!isMatch('../c', '**'));
      assert(!isMatch('../c/d', '**'));
      assert(!isMatch('a/../a', '**/'));
      assert(!isMatch('ab/../ac', '**/'));
      assert(!isMatch('../a', '**/'));
      assert(!isMatch('../../b', '**/'));
      assert(!isMatch('../c', '**/'));
      assert(!isMatch('../c/d', '**/'));
      assert(!isMatch('a/../a', '**/**'));
      assert(!isMatch('ab/../ac', '**/**'));
      assert(!isMatch('../a', '**/**'));
      assert(!isMatch('../../b', '**/**'));
      assert(!isMatch('../c', '**/**'));
      assert(!isMatch('../c/d', '**/**'));
      assert(!isMatch('a/../a', '**/**/*'));
      assert(!isMatch('ab/../ac', '**/**/*'));
      assert(!isMatch('../a', '**/**/*'));
      assert(!isMatch('../../b', '**/**/*'));
      assert(!isMatch('../c', '**/**/*'));
      assert(!isMatch('../c/d', '**/**/*'));
      assert(!isMatch('a/../a', '**/**/x'));
      assert(!isMatch('ab/../ac', '**/**/x'));
      assert(!isMatch('../a', '**/**/x'));
      assert(!isMatch('../../b', '**/**/x'));
      assert(!isMatch('../c', '**/**/x'));
      assert(!isMatch('../c/d', '**/**/x'));
      assert(!isMatch('a/../a', '**/x'));
      assert(!isMatch('ab/../ac', '**/x'));
      assert(!isMatch('../a', '**/x'));
      assert(!isMatch('../../b', '**/x'));
      assert(!isMatch('../c', '**/x'));
      assert(!isMatch('../c/d', '**/x'));
      assert(!isMatch('a/../a', '**/x/*'));
      assert(!isMatch('ab/../ac', '**/x/*'));
      assert(!isMatch('../a', '**/x/*'));
      assert(!isMatch('../../b', '**/x/*'));
      assert(!isMatch('../c', '**/x/*'));
      assert(!isMatch('../c/d', '**/x/*'));
      assert(!isMatch('a/../a', '**/x/**'));
      assert(!isMatch('ab/../ac', '**/x/**'));
      assert(!isMatch('../a', '**/x/**'));
      assert(!isMatch('../../b', '**/x/**'));
      assert(!isMatch('../c', '**/x/**'));
      assert(!isMatch('../c/d', '**/x/**'));
      assert(!isMatch('a/../a', '**/x/*/*'));
      assert(!isMatch('ab/../ac', '**/x/*/*'));
      assert(!isMatch('../a', '**/x/*/*'));
      assert(!isMatch('../../b', '**/x/*/*'));
      assert(!isMatch('../c', '**/x/*/*'));
      assert(!isMatch('../c/d', '**/x/*/*'));
      assert(!isMatch('a/../a', '*/x/**'));
      assert(!isMatch('ab/../ac', '*/x/**'));
      assert(!isMatch('../a', '*/x/**'));
      assert(!isMatch('../../b', '*/x/**'));
      assert(!isMatch('../c', '*/x/**'));
      assert(!isMatch('../c/d', '*/x/**'));
      assert(!isMatch('a/../a', 'a/**'));
      assert(!isMatch('ab/../ac', 'a/**'));
      assert(!isMatch('../a', 'a/**'));
      assert(!isMatch('../../b', 'a/**'));
      assert(!isMatch('../c', 'a/**'));
      assert(!isMatch('../c/d', 'a/**'));
      assert(!isMatch('a/../a', 'a/**/*'));
      assert(!isMatch('ab/../ac', 'a/**/*'));
      assert(!isMatch('../a', 'a/**/*'));
      assert(!isMatch('../../b', 'a/**/*'));
      assert(!isMatch('../c', 'a/**/*'));
      assert(!isMatch('../c/d', 'a/**/*'));
      assert(!isMatch('a/../a', 'a/**/**/*'));
      assert(!isMatch('ab/../ac', 'a/**/**/*'));
      assert(!isMatch('../a', 'a/**/**/*'));
      assert(!isMatch('../../b', 'a/**/**/*'));
      assert(!isMatch('../c', 'a/**/**/*'));
      assert(!isMatch('../c/d', 'a/**/**/*'));
      assert(!isMatch('a/../a', 'b/**'));
      assert(!isMatch('ab/../ac', 'b/**'));
      assert(!isMatch('../a', 'b/**'));
      assert(!isMatch('../../b', 'b/**'));
      assert(!isMatch('../c', 'b/**'));
      assert(!isMatch('../c/d', 'b/**'));
    });

    it('should match', () => {
      assert(!isMatch('a', '**/'));
      assert(!isMatch('a', '**/a/*'));
      assert(!isMatch('a', '**/a/*/*'));
      assert(!isMatch('a', '*/a/**'));
      assert(!isMatch('a', 'a/**/*'));
      assert(!isMatch('a', 'a/**/**/*'));
      assert(!isMatch('a/b', '**/'));
      assert(!isMatch('a/b', '**/b/*'));
      assert(!isMatch('a/b', '**/b/*/*'));
      assert(!isMatch('a/b', 'b/**'));
      assert(!isMatch('a/b/c', '**/'));
      assert(!isMatch('a/b/c', '**/**/b'));
      assert(!isMatch('a/b/c', '**/b'));
      assert(!isMatch('a/b/c', '**/b/*/*'));
      assert(!isMatch('a/b/c', 'b/**'));
      assert(!isMatch('a/b/c/d', '**/'));
      assert(!isMatch('a/b/c/d', '**/d/*'));
      assert(!isMatch('a/b/c/d', 'b/**'));
      assert(isMatch('a', '**'));
      assert(isMatch('a', '**/**'));
      assert(isMatch('a', '**/**/*'));
      assert(isMatch('a', '**/**/a'));
      assert(isMatch('a', '**/a'));
      assert(isMatch('a', '**/a/**'));
      assert(isMatch('a', 'a/**'));
      assert(isMatch('a/b', '**'));
      assert(isMatch('a/b', '**/**'));
      assert(isMatch('a/b', '**/**/*'));
      assert(isMatch('a/b', '**/**/b'));
      assert(isMatch('a/b', '**/b'));
      assert(isMatch('a/b', '**/b/**'));
      assert(isMatch('a/b', '*/b/**'));
      assert(isMatch('a/b', 'a/**'));
      assert(isMatch('a/b', 'a/**/*'));
      assert(isMatch('a/b', 'a/**/**/*'));
      assert(isMatch('a/b/c', '**'));
      assert(isMatch('a/b/c', '**/**'));
      assert(isMatch('a/b/c', '**/**/*'));
      assert(isMatch('a/b/c', '**/b/*'));
      assert(isMatch('a/b/c', '**/b/**'));
      assert(isMatch('a/b/c', '*/b/**'));
      assert(isMatch('a/b/c', 'a/**'));
      assert(isMatch('a/b/c', 'a/**/*'));
      assert(isMatch('a/b/c', 'a/**/**/*'));
      assert(isMatch('a/b/c/d', '**'));
      assert(isMatch('a/b/c/d', '**/**'));
      assert(isMatch('a/b/c/d', '**/**/*'));
      assert(isMatch('a/b/c/d', '**/**/d'));
      assert(isMatch('a/b/c/d', '**/b/**'));
      assert(isMatch('a/b/c/d', '**/b/*/*'));
      assert(isMatch('a/b/c/d', '**/d'));
      assert(isMatch('a/b/c/d', '*/b/**'));
      assert(isMatch('a/b/c/d', 'a/**'));
      assert(isMatch('a/b/c/d', 'a/**/*'));
      assert(isMatch('a/b/c/d', 'a/**/**/*'));
    });

    it('should match nested directories', () => {
      assert(isMatch('a/b', '*/*'));
      assert(isMatch('a/b/c/xyz.md', 'a/b/c/*.md'));
      assert(isMatch('a/bb.bb/c/xyz.md', 'a/*/c/*.md'));
      assert(isMatch('a/bb/c/xyz.md', 'a/*/c/*.md'));
      assert(isMatch('a/bbbb/c/xyz.md', 'a/*/c/*.md'));

      assert(isMatch('a/b/c', '**/*'));
      assert(isMatch('a/b/c', '**/**'));
      assert(isMatch('a/b/c', '*/**'));
      assert(isMatch('a/b/c/d/e/j/n/p/o/z/c.md', 'a/**/j/**/z/*.md'));
      assert(isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md'));
      assert(isMatch('a/bb.bb/aa/b.b/aa/c/xyz.md', 'a/**/c/*.md'));
      assert(isMatch('a/bb.bb/aa/bb/aa/c/xyz.md', 'a/**/c/*.md'));
      assert(!isMatch('a/b/c/j/e/z/c.txt', 'a/**/j/**/z/*.md'));
      assert(!isMatch('a/b/c/xyz.md', 'a/b/**/c{d,e}/**/xyz.md'));
      assert(!isMatch('a/b/d/xyz.md', 'a/b/**/c{d,e}/**/xyz.md'));
      assert(!isMatch('a/b', 'a/**/'));
      assert(!isMatch('a/b/.js/c.txt', '**/*'));
      assert(!isMatch('a/b/c/d', 'a/**/'));
      assert(!isMatch('a/bb', 'a/**/'));
      assert(!isMatch('a/cb', 'a/**/'));
      assert(isMatch('/a/b', '/**'));
      assert(isMatch('a.b', '**/*'));
      assert(isMatch('a.js', '**/*'));
      assert(isMatch('a.js', '**/*.js'));
      assert(isMatch('a/', 'a/**/'));
      assert(isMatch('a/a.js', '**/*.js'));
      assert(isMatch('a/a/b.js', '**/*.js'));
      assert(isMatch('a/b', 'a/**/b'));
      assert(isMatch('a/b', 'a/**b'));
      assert(isMatch('a/b.md', '**/*.md'));
      assert(isMatch('a/b/c.js', '**/*'));
      assert(isMatch('a/b/c.txt', '**/*'));
      assert(isMatch('a/b/c/d/', 'a/**/'));
      assert(isMatch('a/b/c/d/a.js', '**/*'));
      assert(isMatch('a/b/c/z.js', 'a/b/**/*.js'));
      assert(isMatch('a/b/z.js', 'a/b/**/*.js'));
      assert(isMatch('ab', '**/*'));
      assert(isMatch('ab/c', '**/*'));
      assert(isMatch('ab/c/d', '**/*'));
      assert(isMatch('abc.js', '**/*'));
    });

    it('should not match dotfiles by default', () => {
      assert(!isMatch('a/.b', 'a/**/z/*.md'));
      assert(!isMatch('a/b/z/.a', 'a/**/z/*.a'));
      assert(!isMatch('a/b/z/.a', 'a/*/z/*.a'));
      assert(!isMatch('a/b/z/.a', 'b/a'));
      assert(!isMatch('a/foo/z/.b', 'a/**/z/*.md'));
    });

    it('should match leading dots when defined in pattern', () => {
      const fixtures = ['.gitignore', 'a/b/z/.dotfile', 'a/b/z/.dotfile.md', 'a/b/z/.dotfile.md', 'a/b/z/.dotfile.md'];
      assert(!isMatch('.gitignore', 'a/**/z/*.md'));
      assert(!isMatch('a/b/z/.dotfile', 'a/**/z/*.md'));
      assert(!isMatch('a/b/z/.dotfile.md', '**/c/.*.md'));
      assert(isMatch('a/.b', 'a/.*'));
      assert(isMatch('a/b/z/.a', 'a/*/z/.a'));
      assert(isMatch('a/b/z/.dotfile.md', '**/.*.md'));
      assert(isMatch('a/b/z/.dotfile.md', 'a/**/z/.*.md'));
      assert.deepStrictEqual(match(['.md', 'a.md', 'a/b/c.md', '.txt'], '**/*.md'), ['a.md', 'a/b/c.md']);
      assert.deepStrictEqual(match(['.md/.md', '.md', 'a/.md', 'a/b/.md'], '**/.md'), ['.md', 'a/.md', 'a/b/.md']);
      assert.deepStrictEqual(match(['.md/.md', '.md/foo/.md', '.md', 'a/.md', 'a/b/.md'], '.md/**/.md'), ['.md/.md', '.md/foo/.md']);
      assert.deepStrictEqual(match(fixtures, 'a/**/z/.*.md'), ['a/b/z/.dotfile.md']);
    });

    it('todo... (micromatch/#24)', () => {
      assert(isMatch('foo/bar/baz/one/image.png', 'foo/bar/**/one/**/*.*'));
      assert(isMatch('foo/bar/baz/one/two/image.png', 'foo/bar/**/one/**/*.*'));
      assert(isMatch('foo/bar/baz/one/two/three/image.png', 'foo/bar/**/one/**/*.*'));
      assert(!isMatch('a/b/c/d/', 'a/b/**/f'));
      assert(isMatch('a', 'a/**'));
      assert(isMatch('a', '**'));
      assert(isMatch('a', 'a{,/**}'));
      assert(isMatch('a/', '**'));
      assert(isMatch('a/', 'a/**'));
      assert(isMatch('a/b/c/d', '**'));
      assert(isMatch('a/b/c/d/', '**'));
      assert(isMatch('a/b/c/d/', '**/**'));
      assert(isMatch('a/b/c/d/', '**/b/**'));
      assert(isMatch('a/b/c/d/', 'a/b/**'));
      assert(isMatch('a/b/c/d/', 'a/b/**/'));
      assert(isMatch('a/b/c/d/', 'a/b/**/c/**/'));
      assert(isMatch('a/b/c/d/', 'a/b/**/c/**/d/'));
      assert(isMatch('a/b/c/d/e.f', 'a/b/**/**/*.*'));
      assert(isMatch('a/b/c/d/e.f', 'a/b/**/*.*'));
      assert(isMatch('a/b/c/d/e.f', 'a/b/**/c/**/d/*.*'));
      assert(isMatch('a/b/c/d/e.f', 'a/b/**/d/**/*.*'));
      assert(isMatch('a/b/c/d/g/e.f', 'a/b/**/d/**/*.*'));
      assert(isMatch('a/b/c/d/g/g/e.f', 'a/b/**/d/**/*.*'));

      assert(isMatch('a/b-c/z.js', 'a/b-*/**/z.js'));
      assert(isMatch('a/b-c/d/e/z.js', 'a/b-*/**/z.js'));
    });
  });

  describe('globstars', () => {
    it('should match globstars', () => {
      assert(isMatch('a/b/c/d.js', '**/*.js'));
      assert(isMatch('a/b/c.js', '**/*.js'));
      assert(isMatch('a/b.js', '**/*.js'));
      assert(isMatch('a/b/c/d/e/f.js', 'a/b/**/*.js'));
      assert(isMatch('a/b/c/d/e.js', 'a/b/**/*.js'));
      assert(isMatch('a/b/c/d.js', 'a/b/c/**/*.js'));
      assert(isMatch('a/b/c/d.js', 'a/b/**/*.js'));
      assert(isMatch('a/b/d.js', 'a/b/**/*.js'));

      assert(!isMatch('a/d.js', 'a/b/**/*.js'));
      assert(!isMatch('d.js', 'a/b/**/*.js'));
    });

    it('should regard non-exclusive double-stars as single stars', () => {
      assert(!isMatch('a/b/c', '**c'));
      assert(!isMatch('a/b/c', 'a/**c'));
      assert(!isMatch('a/b/c', 'a/**z'));
      assert(!isMatch('a/b/c/b/c', 'a/**b**/c'));
      assert(!isMatch('a/b/c/d/e.js', 'a/b/c**/*.js'));
      assert(isMatch('a/b/c/b/c', 'a/**/b/**/c'));
      assert(isMatch('a/aba/c', 'a/**b**/c'));
      assert(isMatch('a/b/c', 'a/**b**/c'));
      assert(isMatch('a/b/c/d.js', 'a/b/c**/*.js'));
    });

    it('should support globstars (**)', () => {
      assert(!isMatch('a', 'a/**/*'));
      assert(!isMatch('a', 'a/**/**/*'));
      assert(!isMatch('a', 'a/**/**/**/*'));
      assert(!isMatch('a/', '**/a'));
      assert(!isMatch('a/', 'a/**/*'));
      assert(!isMatch('a/', 'a/**/**/*'));
      assert(!isMatch('a/', 'a/**/**/**/*'));
      assert(!isMatch('a/b', '**/a'));
      assert(!isMatch('a/b/c/j/e/z/c.txt', 'a/**/j/**/z/*.md'));
      assert(!isMatch('a/bb', 'a/**/b'));
      assert(!isMatch('a/c', '**/a'));
      assert(!isMatch('a/b', '**/a'));
      assert(!isMatch('a/x/y', '**/a'));
      assert(!isMatch('a/b/c/d', '**/a'));
      assert(isMatch('a', '**'));
      assert(isMatch('a', '**/a'));
      assert(isMatch('a', 'a/**'));
      assert(isMatch('a/', '**'));
      assert(isMatch('a/', '**/a/**'));
      assert(isMatch('a/', 'a/**'));
      assert(isMatch('a/', 'a/**/**'));
      assert(isMatch('a/a', '**/a'));
      assert(isMatch('a/b', '**'));
      assert(isMatch('a/b', '*/*'));
      assert(isMatch('a/b', 'a/**'));
      assert(isMatch('a/b', 'a/**/*'));
      assert(isMatch('a/b', 'a/**/**/*'));
      assert(isMatch('a/b', 'a/**/**/**/*'));
      assert(isMatch('a/b', 'a/**/b'));
      assert(isMatch('a/b/c', '**'));
      assert(isMatch('a/b/c', '**/*'));
      assert(isMatch('a/b/c', '**/**'));
      assert(isMatch('a/b/c', '*/**'));
      assert(isMatch('a/b/c', 'a/**'));
      assert(isMatch('a/b/c', 'a/**/*'));
      assert(isMatch('a/b/c', 'a/**/**/*'));
      assert(isMatch('a/b/c', 'a/**/**/**/*'));
      assert(isMatch('a/b/c/d', '**'));
      assert(isMatch('a/b/c/d', 'a/**'));
      assert(isMatch('a/b/c/d', 'a/**/*'));
      assert(isMatch('a/b/c/d', 'a/**/**/*'));
      assert(isMatch('a/b/c/d', 'a/**/**/**/*'));
      assert(isMatch('a/b/c/d.e', 'a/b/**/c/**/*.*'));
      assert(isMatch('a/b/c/d/e/f/g.md', 'a/**/f/*.md'));
      assert(isMatch('a/b/c/d/e/f/g/h/i/j/k/l.md', 'a/**/f/**/k/*.md'));
      assert(isMatch('a/b/c/def.md', 'a/b/c/*.md'));
      assert(isMatch('a/bb.bb/c/ddd.md', 'a/*/c/*.md'));
      assert(isMatch('a/bb.bb/cc/d.d/ee/f/ggg.md', 'a/**/f/*.md'));
      assert(isMatch('a/bb.bb/cc/dd/ee/f/ggg.md', 'a/**/f/*.md'));
      assert(isMatch('a/bb/c/ddd.md', 'a/*/c/*.md'));
      assert(isMatch('a/bbbb/c/ddd.md', 'a/*/c/*.md'));
    });
  });
});
