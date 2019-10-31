'use strict';

require('mocha');
const assert = require('assert');
const match = require('./support/match');
const { isMatch } = require('..');

describe('dotfiles', () => {
  describe('normal', () => {
    it('should not match dotfiles by default:', () => {
      assert.deepEqual(match(['.dotfile'], '*'), []);
      assert.deepEqual(match(['.dotfile'], '**'), []);
      assert.deepEqual(match(['a/b/c/.dotfile.md'], '*.md'), []);
      assert.deepEqual(match(['a/b', 'a/.b', '.a/b', '.a/.b'], '**'), ['a/b']);
      assert.deepEqual(match(['a/b/c/.dotfile'], '*.*'), []);
    });
  });

  describe('leading dot', () => {
    it('should match dotfiles when a leading dot is defined in the path:', () => {
      assert.deepEqual(match(['a/b/c/.dotfile.md'], '**/.*'), ['a/b/c/.dotfile.md']);
      assert.deepEqual(match(['a/b/c/.dotfile.md'], '**/.*.md'), ['a/b/c/.dotfile.md']);
    });

    it('should use negation patterns on dotfiles:', () => {
      assert.deepEqual(match(['.a', '.b', 'c', 'c.md'], '!.*'), ['c', 'c.md']);
      assert.deepEqual(match(['.a', '.b', 'c', 'c.md'], '!.b'), ['.a', 'c', 'c.md']);
    });

    it('should match dotfiles when there is a leading dot:', () => {
      const opts = { dot: true };
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
      const opts = { dot: true };
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
  });

  describe('options.dot', () => {
    it('should match dotfiles when `options.dot` is true:', () => {
      const fixtures = ['a/./b', 'a/../b', 'a/c/b', 'a/.d/b'];
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
      assert.deepEqual(match(fixtures, 'a/*/b', { dot: true }), ['a/c/b', 'a/.d/b']);
      assert.deepEqual(match(fixtures, 'a/.*/b'), ['a/.d/b']);
      assert.deepEqual(match(fixtures, 'a/.*/b', { dot: true }), ['a/.d/b']);
    });

    it('should match dotfiles when `options.dot` is true', () => {
      assert(isMatch('.dot', '**/*dot', { dot: true }));
      assert(isMatch('.dot', '*dot', { dot: true }));
      assert(isMatch('.dot', '?dot', { dot: true }));
      assert(isMatch('.dotfile.js', '.*.js', { dot: true }));
      assert(isMatch('/a/b/.dot', '/**/*dot', { dot: true }));
      assert(isMatch('/a/b/.dot', '**/*dot', { dot: true }));
      assert(isMatch('/a/b/.dot', '**/.[d]ot', { dot: true }));
      assert(isMatch('/a/b/.dot', '**/?dot', { dot: true }));
      assert(isMatch('/a/b/.dot', '/**/.[d]ot', { dot: true }));
      assert(isMatch('/a/b/.dot', '/**/?dot', { dot: true }));
      assert(isMatch('a/b/.dot', '**/*dot', { dot: true }));
      assert(isMatch('a/b/.dot', '**/.[d]ot', { dot: true }));
      assert(isMatch('a/b/.dot', '**/?dot', { dot: true }));
    });

    it('should not match dotfiles when `options.dot` is false', () => {
      assert(!isMatch('a/b/.dot', '**/*dot', { dot: false }));
      assert(!isMatch('a/b/.dot', '**/?dot', { dot: false }));
    });

    it('should not match dotfiles when `.dot` is not defined and a dot is not in the glob pattern', () => {
      assert(!isMatch('a/b/.dot', '**/*dot'));
      assert(!isMatch('a/b/.dot', '**/?dot'));
    });
  });

  describe('valid dotfiles', () => {
    it('micromatch issue#63 (dots)', () => {
      assert(!isMatch('/aaa/.git/foo', '/aaa/**/*'));
      assert(!isMatch('/aaa/bbb/.git', '/aaa/bbb/*'));
      assert(!isMatch('/aaa/bbb/.git', '/aaa/bbb/**'));
      assert(!isMatch('/aaa/bbb/ccc/.git', '/aaa/bbb/**'));
      assert(!isMatch('aaa/bbb/.git', 'aaa/bbb/**'));
      assert(isMatch('/aaa/bbb/', '/aaa/bbb/**'));
      assert(isMatch('/aaa/bbb/foo', '/aaa/bbb/**'));

      assert(isMatch('/aaa/.git/foo', '/aaa/**/*', { dot: true }));
      assert(isMatch('/aaa/bbb/.git', '/aaa/bbb/*', { dot: true }));
      assert(isMatch('/aaa/bbb/.git', '/aaa/bbb/**', { dot: true }));
      assert(isMatch('/aaa/bbb/ccc/.git', '/aaa/bbb/**', { dot: true }));
      assert(isMatch('aaa/bbb/.git', 'aaa/bbb/**', { dot: true }));
    });

    it('should not match dotfiles with single stars by default', () => {
      assert(isMatch('foo', '*'));
      assert(isMatch('foo/bar', '*/*'));
      assert(!isMatch('.foo', '*'));
      assert(!isMatch('.foo/bar', '*/*'));
      assert(!isMatch('.foo/.bar', '*/*'));
      assert(!isMatch('foo/.bar', '*/*'));
      assert(!isMatch('foo/.bar/baz', '*/*/*'));
    });

    it('should work with dots in the path', () => {
      assert(isMatch('../test.js', '../*.js'));
      assert(isMatch('../.test.js', '../*.js', { dot: true }));
      assert(!isMatch('../.test.js', '../*.js'));
    });

    it('should not match dotfiles with globstar by default', () => {
      assert(!isMatch('.foo', '**/**'));
      assert(!isMatch('.foo', '**'));
      assert(!isMatch('.foo', '**/*'));
      assert(!isMatch('bar/.foo', '**/*'));
      assert(!isMatch('.bar', '**/*'));
      assert(!isMatch('foo/.bar', '**/*'));
      assert(!isMatch('foo/.bar', '**/*a*'));
    });

    it('should match dotfiles when a leading dot is in the pattern', () => {
      assert(!isMatch('foo', '**/.*a*'));
      assert(isMatch('.bar', '**/.*a*'));
      assert(isMatch('foo/.bar', '**/.*a*'));
      assert(isMatch('.foo', '**/.*'));

      assert(!isMatch('foo', '.*a*'));
      assert(isMatch('.bar', '.*a*'));
      assert(!isMatch('bar', '.*a*'));

      assert(!isMatch('foo', '.b*'));
      assert(isMatch('.bar', '.b*'));
      assert(!isMatch('bar', '.b*'));

      assert(!isMatch('foo', '.*r'));
      assert(isMatch('.bar', '.*r'));
      assert(!isMatch('bar', '.*r'));
    });

    it('should not match a dot when the dot is not explicitly defined', () => {
      assert(!isMatch('.dot', '**/*dot'));
      assert(!isMatch('.dot', '**/?dot'));
      assert(!isMatch('.dot', '*/*dot'));
      assert(!isMatch('.dot', '*/?dot'));
      assert(!isMatch('.dot', '*dot'));
      assert(!isMatch('.dot', '/*dot'));
      assert(!isMatch('.dot', '/?dot'));
      assert(!isMatch('/.dot', '**/*dot'));
      assert(!isMatch('/.dot', '**/?dot'));
      assert(!isMatch('/.dot', '*/*dot'));
      assert(!isMatch('/.dot', '*/?dot'));
      assert(!isMatch('/.dot', '/*dot'));
      assert(!isMatch('/.dot', '/?dot'));
      assert(!isMatch('abc/.dot', '*/*dot'));
      assert(!isMatch('abc/.dot', '*/?dot'));
      assert(!isMatch('abc/.dot', 'abc/*dot'));
      assert(!isMatch('abc/abc/.dot', '**/*dot'));
      assert(!isMatch('abc/abc/.dot', '**/?dot'));
    });

    it('should not match leading dots with question marks', () => {
      assert(!isMatch('.dot', '?dot'));
      assert(!isMatch('/.dot', '/?dot'));
      assert(!isMatch('abc/.dot', 'abc/?dot'));
    });

    it('should match double dots when defined in pattern', () => {
      assert(!isMatch('../../b', '**/../*'));
      assert(!isMatch('../../b', '*/../*'));
      assert(!isMatch('../../b', '../*'));
      assert(!isMatch('../abc', '*/../*'));
      assert(!isMatch('../abc', '*/../*'));
      assert(!isMatch('../c/d', '**/../*'));
      assert(!isMatch('../c/d', '*/../*'));
      assert(!isMatch('../c/d', '../*'));
      assert(!isMatch('abc', '**/../*'));
      assert(!isMatch('abc', '*/../*'));
      assert(!isMatch('abc', '../*'));
      assert(!isMatch('abc/../abc', '../*'));
      assert(!isMatch('abc/../abc', '../*'));
      assert(!isMatch('abc/../', '**/../*'));

      assert(isMatch('..', '..'));
      assert(isMatch('../b', '../*'));
      assert(isMatch('../../b', '../../*'));
      assert(isMatch('../../..', '../../..'));
      assert(isMatch('../abc', '**/../*'));
      assert(isMatch('../abc', '../*'));
      assert(isMatch('abc/../abc', '**/../*'));
      assert(isMatch('abc/../abc', '*/../*'));
      assert(isMatch('abc/../abc', '**/../*'));
      assert(isMatch('abc/../abc', '*/../*'));
    });

    it('should not match double dots when not defined in pattern', async() => {
      assert(!isMatch('../abc', '**/*'));
      assert(!isMatch('../abc', '**/**/**'));
      assert(!isMatch('../abc', '**/**/abc'));
      assert(!isMatch('../abc', '**/**/abc/**'));
      assert(!isMatch('../abc', '**/*/*'));
      assert(!isMatch('../abc', '**/abc/**'));
      assert(!isMatch('../abc', '*/*'));
      assert(!isMatch('../abc', '*/abc/**'));
      assert(!isMatch('abc/../abc', '**/*'));
      assert(!isMatch('abc/../abc', '**/*/*'));
      assert(!isMatch('abc/../abc', '**/*/abc'));
      assert(!isMatch('abc/../abc', '*/**/*'));
      assert(!isMatch('abc/../abc', '*/*/*'));
      assert(!isMatch('abc/../abc', 'abc/**/*'));
      assert(!isMatch('abc/../abc', '**/**/*'));
      assert(!isMatch('abc/../abc', '**/*/*'));
      assert(!isMatch('abc/../abc', '*/**/*'));
      assert(!isMatch('abc/../abc', '*/*/*'));

      assert(!isMatch('../abc', '**/**/**', { dot: true }));
      assert(!isMatch('../abc', '**/**/abc', { dot: true }));
      assert(!isMatch('../abc', '**/**/abc/**', { dot: true }));
      assert(!isMatch('../abc', '**/abc/**', { dot: true }));
      assert(!isMatch('../abc', '*/abc/**', { dot: true }));

      assert(!isMatch('../abc', '**/*/*', { dot: true }));
      assert(!isMatch('../abc', '*/*', { dot: true }));
      assert(!isMatch('abc/../abc', '**/*/*', { dot: true }));
      assert(!isMatch('abc/../abc', '*/*/*', { dot: true }));
      assert(!isMatch('abc/../abc', '**/*/*', { dot: true }));
      assert(!isMatch('abc/../abc', '*/*/*', { dot: true }));
      assert(!isMatch('abc/..', '**/*', { dot: true }));
      assert(!isMatch('abc/..', '*/*', { dot: true }));
      assert(!isMatch('abc/abc/..', '*/**/*', { dot: true }));

      assert(!isMatch('abc/../abc', 'abc/**/*'));
      assert(!isMatch('abc/../abc', 'abc/**/*', { dot: true }));
      assert(!isMatch('abc/../abc', 'abc/**/*/*', { dot: true }));
      assert(!isMatch('abc/../abc', 'abc/*/*/*', { dot: true }));
      assert(!isMatch('abc/../abc', 'abc/**/*/*', { dot: true }));
      assert(!isMatch('abc/../abc', 'abc/*/*/*', { dot: true }));
      assert(!isMatch('abc/..', 'abc/**/*', { dot: true }));
      assert(!isMatch('abc/..', 'abc/*/*', { dot: true }));
      assert(!isMatch('abc/abc/..', 'abc/*/**/*', { dot: true }));

      assert(!isMatch('../abc', '**/*/*', { dot: true }));
      assert(!isMatch('../abc', '*/*', { dot: true }));
      assert(!isMatch('abc/../abc', '**/*/*', { dot: true }));
      assert(!isMatch('abc/../abc', '*/*/*', { dot: true }));
      assert(!isMatch('abc/../abc', '**/*/*', { dot: true }));
      assert(!isMatch('abc/../abc', '*/*/*', { dot: true }));
      assert(!isMatch('abc/..', '**/*', { dot: true }));
      assert(!isMatch('abc/..', '*/*', { dot: true }));
      assert(!isMatch('abc/abc/..', '*/**/*', { dot: true }));

      assert(!isMatch('abc/../abc', 'abc/**/*', { strictSlashes: true }));
      assert(!isMatch('abc/../abc', 'abc/**/*/*', { strictSlashes: true }));
      assert(!isMatch('abc/../abc', 'abc/**/*/*', { strictSlashes: true }));
      assert(!isMatch('abc/../abc', 'abc/*/*/*', { strictSlashes: true }));
      assert(!isMatch('abc/../abc', 'abc/**/*/*', { strictSlashes: true }));
      assert(!isMatch('abc/../abc', 'abc/*/*/*', { strictSlashes: true }));
      assert(!isMatch('abc/..', 'abc/**/*', { strictSlashes: true }));
      assert(!isMatch('abc/..', 'abc/*/*', { strictSlashes: true }));
      assert(!isMatch('abc/abc/..', 'abc/*/**/*', { strictSlashes: true }));
    });

    it('should not match single exclusive dots when not defined in pattern', async() => {
      assert(!isMatch('.', '**'));
      assert(!isMatch('abc/./abc', '**'));
      assert(!isMatch('abc/abc/.', '**'));
      assert(!isMatch('abc/abc/./abc', '**'));

      assert(!isMatch('.', '**', { dot: true }));
      assert(!isMatch('..', '**', { dot: true }));
      assert(!isMatch('../', '**', { dot: true }));
      assert(!isMatch('/../', '**', { dot: true }));
      assert(!isMatch('/..', '**', { dot: true }));
      assert(!isMatch('abc/./abc', '**', { dot: true }));
      assert(!isMatch('abc/abc/.', '**', { dot: true }));
      assert(!isMatch('abc/abc/./abc', '**', { dot: true }));
    });

    it('should match leading dots in root path when glob is prefixed with **/', () => {
      assert(!isMatch('.abc/.abc', '**/.abc/**'));
      assert(isMatch('.abc', '**/.abc/**'));
      assert(isMatch('.abc/', '**/.abc/**'));
      assert(isMatch('.abc/abc', '**/.abc/**'));
      assert(isMatch('.abc/abc/b', '**/.abc/**'));
      assert(isMatch('abc/.abc/b', '**/.abc/**'));
      assert(isMatch('abc/abc/.abc', '**/.abc'));
      assert(isMatch('abc/abc/.abc', '**/.abc/**'));
      assert(isMatch('abc/abc/.abc/', '**/.abc/**'));
      assert(isMatch('abc/abc/.abc/abc', '**/.abc/**'));
      assert(isMatch('abc/abc/.abc/c/d', '**/.abc/**'));
      assert(isMatch('abc/abc/.abc/c/d/e', '**/.abc/**'));
    });

    it('should match a dot when the dot is explicitly defined', () => {
      assert(isMatch('/.dot', '**/.dot*'));
      assert(isMatch('aaa/bbb/.dot', '**/.dot*'));
      assert(isMatch('aaa/.dot', '*/.dot*'));
      assert(isMatch('.aaa.bbb', '.*.*'));
      assert(isMatch('.aaa.bbb', '.*.*'));
      assert(!isMatch('.aaa.bbb/', '.*.*', { strictSlashes: true }));
      assert(!isMatch('.aaa.bbb', '.*.*/'));
      assert(isMatch('.aaa.bbb/', '.*.*/'));
      assert(isMatch('.aaa.bbb/', '.*.*{,/}'));
      assert(isMatch('.aaa.bbb', '.*.bbb'));
      assert(isMatch('.dotfile.js', '.*.js'));
      assert(isMatch('.dot', '.*ot'));
      assert(isMatch('.dot.bbb.ccc', '.*ot.*.*'));
      assert(isMatch('.dot', '.d?t'));
      assert(isMatch('.dot', '.dot*'));
      assert(isMatch('/.dot', '/.dot*'));
    });

    it('should match dots defined in brackets', () => {
      assert(isMatch('/.dot', '**/.[d]ot'));
      assert(isMatch('aaa/.dot', '**/.[d]ot'));
      assert(isMatch('aaa/bbb/.dot', '**/.[d]ot'));
      assert(isMatch('aaa/.dot', '*/.[d]ot'));
      assert(isMatch('.dot', '.[d]ot'));
      assert(isMatch('.dot', '.[d]ot'));
      assert(isMatch('/.dot', '/.[d]ot'));
    });
  });
});
