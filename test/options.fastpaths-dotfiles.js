'use strict';

const assert = require('assert');
const pm = require('..');

const variants = [];
for (const windows of [false, true]) {
  for (const dot of [false, true]) {
    for (const strictSlashes of [false, true]) {
      variants.push({ windows, dot, strictSlashes });
    }
  }
}

describe('dotfile fast paths', () => {
  it('should agree with full parsing for dot-only names', () => {
    for (const options of variants) {
      const inputs = ['.', '..', './', '../'];
      if (options.windows) inputs.push('.\\', '..\\');
      for (const input of inputs) {
        assert.strictEqual(pm.isMatch(input, '.*', { ...options, fastpaths: false }), false);
        assert.strictEqual(pm.isMatch(input, '.*', options), false, JSON.stringify({ input, options }));
      }
    }
  });

  it('should agree with full parsing for recursive dot-only names', () => {
    for (const options of variants) {
      const inputs = ['..', './', '../', 'dir/..', 'dir/./', 'dir/../', 'dir/sub/..'];
      if (options.windows) inputs.push('dir\\..', 'dir\\.\\', 'dir\\..\\');
      for (const input of inputs) {
        assert.strictEqual(pm.isMatch(input, '**/.*', { ...options, fastpaths: false }), false);
        assert.strictEqual(pm.isMatch(input, '**/.*', options), false, JSON.stringify({ input, options }));
      }
    }
  });

  it('should preserve ordinary dotfile matches', () => {
    for (const options of variants) {
      for (const input of ['.env', '...', '..notes', '.a.']) {
        assert.strictEqual(pm.isMatch(input, '.*', { ...options, fastpaths: false }), true);
        assert.strictEqual(pm.isMatch(input, '.*', options), true);
      }
    }
  });

  it('should preserve recursive dotfile matches', () => {
    for (const options of variants) {
      const inputs = ['.env', 'dir/.env', 'dir/...', 'dir/..notes', 'dir/sub/.a'];
      if (options.windows) inputs.push('dir\\.env');
      for (const input of inputs) {
        assert.strictEqual(pm.isMatch(input, '**/.*', { ...options, fastpaths: false }), true);
        assert.strictEqual(pm.isMatch(input, '**/.*', options), true);
      }
    }
  });

  it('should preserve capture groups for dotfiles', () => {
    for (const options of variants) {
      const fast = pm.makeRe('.*', { ...options, capture: true }).exec('.env');
      const full = pm.makeRe('.*', { ...options, capture: true, fastpaths: false }).exec('.env');
      assert(fast);
      assert.deepStrictEqual(fast, full);
    }
  });

  it('should preserve Bash mode and explicit dot literals', () => {
    for (const options of variants) {
      for (const [input, pattern] of [['..', '.*'], ['../', '.*'], ['dir/..', '**/.*']]) {
        assert.strictEqual(pm.isMatch(input, pattern, { ...options, bash: true, fastpaths: false }), true);
        assert.strictEqual(pm.isMatch(input, pattern, { ...options, bash: true }), true);
      }
      assert.strictEqual(pm.isMatch('.', '.', options), true);
      assert.strictEqual(pm.isMatch('..', '..', options), true);
    }
  });
});
