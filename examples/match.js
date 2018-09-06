'use strict';

const path = require('path');
const assert = require('assert');
const mm = require('minimatch');
const pm = require('..');

/**
 * Example function for matching an array of strings
 */

const match = (list, pattern, options = {}) => {
  let normalize = false;
  if (pattern.startsWith('./')) {
    pattern = pattern.slice(2);
    normalize = true;
  }

  let isMatch = pm(pattern, options);
  let matches = new Set();
  for (let ele of list) {
    if (normalize === true || options.normalize === true) {
      ele = path.posix.normalize(ele);
    }
    if (isMatch(ele)) {
      matches.add(options.onMatch ? options.onMatch(ele) : ele);
    }
  }
  return [...matches];
};

let fixtures = ['a.md', 'a/b.md', './a.md', './a/b.md', 'a/b/c.md', './a/b/c.md', '.\\a\\b\\c.md', 'a\\b\\c.md'];

console.log(path.posix.normalize('./{a,b,c}/*.md'));
console.log(match(fixtures, './**/*.md'));
// assert.deepEqual(match(fixtures, '**/*.md'), ['a.md', 'a/b.md', 'a/b/c.md', 'a\\b\\c.md']);
// assert.deepEqual(match(fixtures, '**/*.md', { normalize: true, unixify: false }), ['a.md', 'a/b.md', 'a/b/c.md', 'a\\b\\c.md']);
// assert.deepEqual(match(fixtures, '*.md'), ['a.md']);
// assert.deepEqual(match(fixtures, '*.md', { normalize: true, unixify: false }), ['a.md']);
// assert.deepEqual(match(fixtures, '*.md'), ['a.md']);
// assert.deepEqual(match(fixtures, '*/*.md', { normalize: true, unixify: false }), ['a/b.md']);
// assert.deepEqual(match(fixtures, '*/*.md'), ['a/b.md']);
// assert.deepEqual(match(fixtures, './**/*.md', { normalize: true, unixify: false }), ['a.md', 'a/b.md', 'a/b/c.md', 'a\\b\\c.md', './a.md', './a/b.md', '.\\a\\b\\c.md', 'a\\b\\c.md']);
// assert.deepEqual(match(fixtures, './**/*.md'), ['a.md', 'a/b.md', 'a/b/c.md']);
// assert.deepEqual(match(fixtures, './*.md', { normalize: true, unixify: false }), ['a.md', './a.md']);
// assert.deepEqual(match(fixtures, './*.md'), ['a.md']);
// assert.deepEqual(match(fixtures, './*/*.md', { normalize: true, unixify: false }), ['a/b.md', './a/b.md']);
// assert.deepEqual(match(fixtures, './*/*.md'), ['a/b.md']);
// assert.deepEqual(match(['./a'], 'a'), ['./a'], { normalize: true, unixify: false });
// assert.deepEqual(match(['./a'], 'a'), ['a']);
