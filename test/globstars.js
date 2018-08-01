'use strict';

require('mocha');
const fill = require('fill-range');
const assert = require('assert');
const picomatch = require('..');
const pm = require('./support');

describe('globstars', () => {
  beforeEach(() => picomatch.clearCache());

  it('should support globstars (**)', () => {
    let fixtures = ['../../b', '../a', '../c', '../c/d', '.a/a', '/a', '/a/', 'a', 'a/', 'a/../a', 'a/.a', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z', 'aa/a', 'aaa/a', 'aab/a', 'ab/../ac'];

    assert.deepEqual(pm(fixtures, '/**/*'), ['/a']);
    assert.deepEqual(pm(fixtures, '**'), ['/a', '/a/', 'a', 'a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z', 'aa/a', 'aaa/a', 'aab/a']);
    assert.deepEqual(pm(fixtures, '**/**'), ['/a', '/a/', 'a', 'a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z', 'aa/a', 'aaa/a', 'aab/a']);
    assert.deepEqual(pm(fixtures, '**/'), ['/a/', 'a/']);
    assert.deepEqual(pm(fixtures, '**/*'), ['/a', 'a', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z', 'aa/a', 'aaa/a', 'aab/a']);
    assert.deepEqual(pm(fixtures, '**/**/*'), ['/a', 'a', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z', 'aa/a', 'aaa/a', 'aab/a']);

    assert.deepEqual(pm(fixtures, '**/**/x'), ['a/x']);
    assert.deepEqual(pm(fixtures, '**/x'), ['a/x']);
    assert.deepEqual(pm(fixtures, '**/x/*'), ['a/x/y']);
    assert.deepEqual(pm(fixtures, '*/x/**'), ['a/x/y', 'a/x/y/z']);
    assert.deepEqual(pm(fixtures, '**/x/**'), ['a/x/y', 'a/x/y/z']);
    assert.deepEqual(pm(fixtures, '**/x/*/*'), ['a/x/y/z']);
    assert.deepEqual(pm(fixtures, 'a/**'), ['a/', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
    assert.deepEqual(pm(fixtures, 'a/**/*'), ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
    assert.deepEqual(pm(fixtures, 'a/**/**/*'), ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
    assert.deepEqual(pm(fixtures, 'b/**'), []);

    assert.deepEqual(pm('a/b', 'a/**/'), []);
    assert.deepEqual(pm('a/b/.js/c.txt', '**/*'), []);
    assert.deepEqual(pm('a/b/c/d', 'a/**/'), []);
    assert.deepEqual(pm('a/bb', 'a/**/'), []);
    assert.deepEqual(pm('a/cb', 'a/**/'), []);
    assert.deepEqual(pm('/a/b', '/**'), ['/a/b']);
    assert.deepEqual(pm('a.b', '**/*'), ['a.b']);
    assert.deepEqual(pm('a.js', '**/*'), ['a.js']);
    assert.deepEqual(pm('a.js', '**/*.js'), ['a.js']);
    assert.deepEqual(pm('a.md', '**/*.md'), ['a.md']);
    assert.deepEqual(pm('a/', 'a/**/'), []);
    assert.deepEqual(pm('a/a.js', '**/*.js'), ['a/a.js']);
    assert.deepEqual(pm('a/a/b.js', '**/*.js'), ['a/a/b.js']);
    assert.deepEqual(pm('a/b', 'a/**/b'), ['a/b']);
    assert.deepEqual(pm('a/b', 'a/**b'), ['a/b']);
    assert.deepEqual(pm('a/b.md', '**/*.md'), ['a/b.md']);
    assert.deepEqual(pm('a/b/c.js', '**/*'), ['a/b/c.js']);
    assert.deepEqual(pm('a/b/c.txt', '**/*'), ['a/b/c.txt']);
    assert.deepEqual(pm('a/b/c/d/', 'a/**/'), ['a/b/c/d/']);
    assert.deepEqual(pm('a/b/c/d/a.js', '**/*'), ['a/b/c/d/a.js']);
    assert.deepEqual(pm('a/b/c/z.js', 'a/b/**/*.js'), ['a/b/c/z.js']);
    assert.deepEqual(pm('a/b/z.js', 'a/b/**/*.js'), ['a/b/z.js']);
    assert.deepEqual(pm('ab', '**/*'), ['ab']);
    assert.deepEqual(pm('ab/a/d', '**/*'), ['ab/a/d']);
    assert.deepEqual(pm('ab/b', '**/*'), ['ab/b']);
    assert.deepEqual(pm('za.js', '**/*'), ['za.js']);
  });

  it('should support multiple globstars in one pattern', () => {
    assert(!pm.isMatch('a/b/c/d/e/z/foo.md', 'a/**/j/**/z/*.md'));
    assert(!pm.isMatch('a/b/c/j/e/z/foo.txt', 'a/**/j/**/z/*.md'));
    assert(pm.isMatch('a/b/c/d/e/j/n/p/o/z/foo.md', 'a/**/j/**/z/*.md'));
    assert(pm.isMatch('a/b/c/d/e/z/foo.md', 'a/**/z/*.md'));
    assert(pm.isMatch('a/b/c/j/e/z/foo.md', 'a/**/j/**/z/*.md'));
  });

  it('should match dotfiles', () => {
    let fixtures = ['.gitignore', 'a/b/z/.dotfile', 'a/b/z/.dotfile.js', 'a/b/z/.dotfile.txt', 'a/b/z/.dotfile.md'];
    assert(!pm.isMatch('.gitignore', 'a/**/z/*.md'));
    assert(!pm.isMatch('a/b/z/.dotfile', 'a/**/z/*.md'));
    assert(!pm.isMatch('a/b/z/.dotfile.md', '**/c/.*.md'));
    assert(pm.isMatch('a/b/z/.dotfile.md', '**/.*.md'));
    assert(pm.isMatch('a/b/z/.dotfile.md', 'a/**/z/.*.md'));
    assert.deepEqual(pm(fixtures, 'a/**/z/.*.md'), ['a/b/z/.dotfile.md']);
  });

  it('should match file extensions:', () => {
    assert.deepEqual(pm(['.md', 'a.md', 'a/b/c.md', '.txt'], '**/*.md'), ['a.md', 'a/b/c.md']);
    assert.deepEqual(pm(['.md', 'a/b/.md'], '.md'), ['.md']);
    assert.deepEqual(pm(['.md', 'a/b/.md'], '**/.md'), ['.md', 'a/b/.md']);
  });

  it('should respect trailing slashes on paterns', () => {
    let fixtures = ['a', 'a/', 'b', 'b/', 'a/a', 'a/a/', 'a/b', 'a/b/', 'a/c', 'a/c/', 'a/x', 'a/x/', 'a/a/a', 'a/a/b', 'a/a/b/', 'a/a/a/', 'a/a/a/a', 'a/a/a/a/', 'a/a/a/a/a', 'a/a/a/a/a/', 'x/y', 'z/z', 'x/y/', 'z/z/', 'a/b/c/.d/e/'];

    assert.deepEqual(pm(fixtures, '**/*/a/'), ['a/a/', 'a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/']);
    assert.deepEqual(pm(fixtures, '**/*/a/*/'), ['a/a/b/', 'a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/']);
    assert.deepEqual(pm(fixtures, '**/*/x/'), ['a/x/']);
    assert.deepEqual(pm(fixtures, '**/*/*/*/*/'), ['a/a/a/a/', 'a/a/a/a/a/']);
    assert.deepEqual(pm(fixtures, '**/*/*/*/*/*/'), ['a/a/a/a/a/']);
    assert.deepEqual(pm(fixtures, '*a/a/*/'), ['a/a/b/', 'a/a/a/']);
    assert.deepEqual(pm(fixtures, '**a/a/*/'), ['a/a/b/', 'a/a/a/']);
    assert.deepEqual(pm(fixtures, '**/a/*/*/'), ['a/a/b/', 'a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/']);
    assert.deepEqual(pm(fixtures, '**/a/*/*/*/'), ['a/a/a/a/', 'a/a/a/a/a/']);
    assert.deepEqual(pm(fixtures, '**/a/*/*/*/*/'), ['a/a/a/a/a/']);
    assert.deepEqual(pm(fixtures, '**/a/*/a/'), ['a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/']);
    assert.deepEqual(pm(fixtures, '**/a/*/b/'), ['a/a/b/']);
  });

  it('should match slashes', () => {
    assert.deepEqual(pm(['/../c'], '/**/*'), []);
    assert.deepEqual(pm(['/', '.'], '**'), ['/']);
    assert.deepEqual(pm(['/', '.'], '**/'), ['/']);
  });

  it('should match literal globstars when escaped', () => {
    let fixtures = ['.md', '**a.md', '**.md', '.md', '**'];
    assert.deepEqual(pm(fixtures, '\\*\\**.md'), ['**a.md', '**.md']);
    assert.deepEqual(pm(fixtures, '\\*\\*.md'), ['**.md']);
  });

  // related to https://github.com/isaacs/minimatch/issues/67
  it('should work consistently with `makeRe` and matcher functions', () => {
    let re = pm.makeRe('node_modules/foobar/**/*.bar');
    assert(re.test('node_modules/foobar/foo.bar'));
    assert(pm.isMatch('node_modules/foobar/foo.bar', 'node_modules/foobar/**/*.bar'));
    assert.deepEqual(pm(['node_modules/foobar/foo.bar'], 'node_modules/foobar/**/*.bar'), [
      'node_modules/foobar/foo.bar'
    ]);
  });
});
