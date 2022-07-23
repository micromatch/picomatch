
import assert from 'assert';
const match = require('./support/match');
const { isMatch } = require('../lib');

describe('options.ignore', () => {
  it('should not match ignored patterns', () => {
    assert(isMatch('a+b/src/glimini.js', 'a+b/src/*.js', { ignore: ['**/f*'] }));
    assert(!isMatch('a+b/src/glimini.js', 'a+b/src/*.js', { ignore: ['**/g*'] }));
    assert(isMatch('+b/src/glimini.md', '+b/src/*', { ignore: ['**/*.js'] }));
    assert(!isMatch('+b/src/glimini.js', '+b/src/*', { ignore: ['**/*.js'] }));
  });

  const negations = ['a/a', 'a/b', 'a/c', 'a/d', 'a/e', 'b/a', 'b/b', 'b/c'];
  const globs = ['.a', '.a/a', '.a/a/a', '.a/a/a/a', 'a', 'a/.a', 'a/a', 'a/a/.a', 'a/a/a', 'a/a/a/a', 'a/a/a/a/a', 'a/a/b', 'a/b', 'a/b/c', 'a/c', 'a/x', 'b', 'b/b/b', 'b/b/c', 'c/c/c', 'e/f/g', 'h/i/a', 'x/x/x', 'x/y', 'z/z', 'z/z/z'].sort();

  it('should filter out ignored patterns', () => {
    const opts = { ignore: ['a/**'], strictSlashes: true };
    const dotOpts = { ...opts, dot: true };

    assert.deepStrictEqual(match(globs, '*', opts), ['a', 'b']);
    assert.deepStrictEqual(match(globs, '*', { ...opts, strictSlashes: false }), ['b']);
    assert.deepStrictEqual(match(globs, '*', { ignore: '**/a' }), ['b']);
    assert.deepStrictEqual(match(globs, '*/*', opts), ['x/y', 'z/z']);
    assert.deepStrictEqual(match(globs, '*/*/*', opts), ['b/b/b', 'b/b/c', 'c/c/c', 'e/f/g', 'h/i/a', 'x/x/x', 'z/z/z']);
    assert.deepStrictEqual(match(globs, '*/*/*/*', opts), []);
    assert.deepStrictEqual(match(globs, '*/*/*/*/*', opts), []);
    assert.deepStrictEqual(match(globs, 'a/*', opts), []);
    assert.deepStrictEqual(match(globs, '**/*/x', opts), ['x/x/x']);
    assert.deepStrictEqual(match(globs, '**/*/[b-z]', opts), ['b/b/b', 'b/b/c', 'c/c/c', 'e/f/g', 'x/x/x', 'x/y', 'z/z', 'z/z/z']);

    assert.deepStrictEqual(match(globs, '*', { ignore: '**/a', dot: true }), ['.a', 'b']);
    assert.deepStrictEqual(match(globs, '*', dotOpts), ['.a', 'a', 'b']);
    assert.deepStrictEqual(match(globs, '*/*', dotOpts), ['.a/a', 'x/y', 'z/z'].sort());
    assert.deepStrictEqual(match(globs, '*/*/*', dotOpts), ['.a/a/a', 'b/b/b', 'b/b/c', 'c/c/c', 'e/f/g', 'h/i/a', 'x/x/x', 'z/z/z'].sort());
    assert.deepStrictEqual(match(globs, '*/*/*/*', dotOpts), ['.a/a/a/a']);
    assert.deepStrictEqual(match(globs, '*/*/*/*/*', dotOpts), []);
    assert.deepStrictEqual(match(globs, 'a/*', dotOpts), []);
    assert.deepStrictEqual(match(globs, '**/*/x', dotOpts), ['x/x/x']);

    // see https://github.com/jonschlinkert/micromatch/issues/79
    assert.deepStrictEqual(match(['foo.js', 'a/foo.js'], '**/foo.js'), ['foo.js', 'a/foo.js']);
    assert.deepStrictEqual(match(['foo.js', 'a/foo.js'], '**/foo.js', { dot: true }), ['foo.js', 'a/foo.js']);

    assert.deepStrictEqual(match(negations, '!b/a', opts), ['b/b', 'b/c']);
    assert.deepStrictEqual(match(negations, '!b/(a)', opts), ['b/b', 'b/c']);
    assert.deepStrictEqual(match(negations, '!(b/(a))', opts), ['b/b', 'b/c']);
    assert.deepStrictEqual(match(negations, '!(b/a)', opts), ['b/b', 'b/c']);

    assert.deepStrictEqual(match(negations, '**'), negations, 'nothing is ignored');
    assert.deepStrictEqual(match(negations, '**', { ignore: ['*/b', '*/a'] }), ['a/c', 'a/d', 'a/e', 'b/c']);
    assert.deepStrictEqual(match(negations, '**', { ignore: ['**'] }), []);
  });
});
