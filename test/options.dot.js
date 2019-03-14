'use strict';

require('mocha');
const assert = require('assert');
const match = require('./support/match');
const { isMatch } = require('..');

describe('options.dot', () => {
  it('should not match dotfiles by default:', () => {
    assert.deepEqual(match(['.dotfile'], '*'), []);
    assert.deepEqual(match(['.dotfile'], '**'), []);
    assert.deepEqual(match(['a/b/c/.dotfile.md'], '*.md'), []);
    assert.deepEqual(match(['a/b', 'a/.b', '.a/b', '.a/.b'], '**'), ['a/b']);
    assert.deepEqual(match(['a/b/c/.dotfile'], '*.*'), []);
  });

  it('should match dotfiles when a leading dot is defined in the path:', () => {
    assert.deepEqual(match(['a/b/c/.dotfile.md'], '**/.*'), ['a/b/c/.dotfile.md']);
    assert.deepEqual(match(['a/b/c/.dotfile.md'], '**/.*.md'), ['a/b/c/.dotfile.md']);
  });

  it('should use negation patterns on dotfiles:', () => {
    assert.deepEqual(match(['.a', '.b', 'c', 'c.md'], '!.*'), ['c', 'c.md']);
    assert.deepEqual(match(['.a', '.b', 'c', 'c.md'], '!.b'), ['.a', 'c', 'c.md']);
  });

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
    let fixtures = ['a/./b', 'a/../b', 'a/c/b', 'a/.d/b'];
    assert.deepEqual(match(fixtures, 'a/.*/b'), ['a/.d/b']);
    assert.deepEqual(match(fixtures, 'a/.*/b', { dot: true }), ['a/.d/b']);
    assert.deepEqual(match(fixtures, 'a/*/b', { dot: true }), ['a/c/b', 'a/.d/b']);
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

  it('should match dotfiles when `options.dot` is true', () => {
    assert(isMatch('/a/b/.dot', '**/*dot', { dot: true }));
    assert(isMatch('/a/b/.dot', '**/.[d]ot', { dot: true }));
    assert(isMatch('/a/b/.dot', '**/?dot', { dot: true }));
    assert(isMatch('.dotfile.js', '.*.js', { dot: true }));
    assert(isMatch('.dot', '*dot', { dot: true }));
    assert(isMatch('.dot', '?dot', { dot: true }));
    assert(isMatch('/a/b/.dot', '/**/*dot', { dot: true }));
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
