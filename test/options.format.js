'use strict';

const assert = require('assert');
const match = require('./support/match');
const picomatch = require('..');
const { isMatch } = picomatch;

const equal = (actual, expected, msg) => {
  assert.deepStrictEqual([].concat(actual).sort(), [].concat(expected).sort(), msg);
};

describe('options.format', () => {

  for (const option of ['basename', 'matchBase']) {
    describe(`with ${option}`, () => {
      it('should match the formatted basename', () => {
        const opts = { [option]: true, format: str => str.toLowerCase() };

        assert(isMatch('SRC/FILE.JS', '*.js', opts));
        assert(!isMatch('SRC/FILE.JS', '*.JS', opts));
        assert(!isMatch('SRC/FILE.TXT', '*.js', opts));
      });

      it('should format the path before extracting its basename', () => {
        const opts = { [option]: true, format: str => str.replace(/:/g, '/') };

        assert(isMatch('src:file.js', 'file.js', opts));
        assert(!isMatch('src:file.js', 'src*', opts));
      });

      it('should not match an empty formatted basename', () => {
        const opts = { [option]: true, format: str => str.replace(/^\.\//, '') };

        for (const pattern of ['*', 'undefined']) {
          const result = picomatch(pattern, opts)('./', true);

          assert.strictEqual(result.isMatch, false);
          assert.strictEqual(result.match, false);
          assert.strictEqual(result.input, './');
          assert.strictEqual(result.output, '');
          assert(!isMatch('', pattern, opts));
        }

        assert(isMatch('src/undefined', 'undefined', opts));
      });

      it('should match ignored patterns against the formatted basename', () => {
        const opts = { [option]: true, format: str => str.toLowerCase(), ignore: '*.js' };

        assert(!isMatch('SRC/FILE.JS', '*', opts));
        assert(isMatch('SRC/FILE.TXT', '*', opts));
      });

      it('should format once and preserve the input and output in match results', () => {
        const inputs = [];
        const matches = [];
        const matcher = picomatch('*.js', {
          [option]: true,
          format: str => {
            inputs.push(str);
            return str.toLowerCase();
          },
          onMatch: result => matches.push(result)
        });
        const result = matcher('SRC/FILE.JS', true);

        assert.strictEqual(result.isMatch, true);
        assert.strictEqual(result.input, 'SRC/FILE.JS');
        assert.strictEqual(result.output, 'src/file.js');
        assert.deepStrictEqual(inputs, ['SRC/FILE.JS']);
        assert.deepStrictEqual(matches, [result]);
      });
    });
  }

  // see https://github.com/isaacs/minimatch/issues/30
  it('should match the string returned by options.format', () => {
    const opts = { format: str => str.replace(/\\/g, '/').replace(/^\.\//, ''), strictSlashes: true };
    const fixtures = ['a', './a', 'b', 'a/a', './a/b', 'a/c', './a/x', './a/a/a', 'a/a/b', './a/a/a/a', './a/a/a/a/a', 'x/y', './z/z'];

    assert(!isMatch('./.a', '*.a', opts));
    assert(!isMatch('./.a', './*.a', opts));
    assert(!isMatch('./.a', 'a/**/z/*.md', opts));
    assert(!isMatch('./a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md', opts));
    assert(!isMatch('./a/b/c/j/e/z/c.txt', './a/**/j/**/z/*.md', opts));
    assert(!isMatch('a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md', opts));
    assert(isMatch('./.a', './.a', opts));
    assert(isMatch('./a/b/c.md', 'a/**/*.md', opts));
    assert(isMatch('./a/b/c/d/e/j/n/p/o/z/c.md', './a/**/j/**/z/*.md', opts));
    assert(isMatch('./a/b/c/d/e/z/c.md', '**/*.md', opts));
    assert(isMatch('./a/b/c/d/e/z/c.md', './a/**/z/*.md', opts));
    assert(isMatch('./a/b/c/d/e/z/c.md', 'a/**/z/*.md', opts));
    assert(isMatch('./a/b/c/j/e/z/c.md', './a/**/j/**/z/*.md', opts));
    assert(isMatch('./a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md', opts));
    assert(isMatch('./a/b/z/.a', './a/**/z/.a', opts));
    assert(isMatch('./a/b/z/.a', 'a/**/z/.a', opts));
    assert(isMatch('.a', './.a', opts));
    assert(isMatch('a/b/c.md', './a/**/*.md', opts));
    assert(isMatch('a/b/c.md', 'a/**/*.md', opts));
    assert(isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md', opts));
    assert(isMatch('a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md', opts));
    assert(isMatch('./a', '*', opts));

    assert(isMatch('./foo/bar.js', '**/foo/**', opts));
    assert(isMatch('./foo/bar.js', './**/foo/**', opts));
    assert(isMatch('.\\foo\\bar.js', '**/foo/**', { ...opts, windows: false }));
    assert(isMatch('.\\foo\\bar.js', './**/foo/**', opts));
    equal(match(fixtures, '*', opts), ['a', 'b']);
    equal(match(fixtures, '**/a/**', opts), ['a/a', 'a/c', 'a/b', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a']);
    equal(match(fixtures, '*/*', opts), ['a/a', 'a/b', 'a/c', 'a/x', 'x/y', 'z/z']);
    equal(match(fixtures, '*/*/*', opts), ['a/a/a', 'a/a/b']);
    equal(match(fixtures, '*/*/*/*', opts), ['a/a/a/a']);
    equal(match(fixtures, '*/*/*/*/*', opts), ['a/a/a/a/a']);
    equal(match(fixtures, '*', opts), ['a', 'b']);
    equal(match(fixtures, '**/a/**', opts), ['a/a', 'a/c', 'a/b', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a']);
    equal(match(fixtures, 'a/*/a', opts), ['a/a/a']);
    equal(match(fixtures, 'a/*', opts), ['a/a', 'a/b', 'a/c', 'a/x']);
    equal(match(fixtures, 'a/*/*', opts), ['a/a/a', 'a/a/b']);
    equal(match(fixtures, 'a/*/*/*', opts), ['a/a/a/a']);
    equal(match(fixtures, 'a/*/*/*/*', opts), ['a/a/a/a/a']);
    equal(match(fixtures, 'a/*/a', opts), ['a/a/a']);
  });
});
