
import assert from 'assert';
import { match } from './support/index.js';
import { isMatch } from '../lib/index.js';

const equal = (actual, expected, msg) => {
  assert.deepStrictEqual([].concat(actual).sort(), [].concat(expected).sort(), msg);
};

const format = str => str.replace(/^\.\//, '');
const options = () => {
  return {
    format,
    onMatch({ pattern, regex, input, output }, matches) {
      if (output.length > 2 && (output.startsWith('./') || output.startsWith('.\\'))) {
        output = output.slice(2);
      }
      if (matches) {
        matches.add(output);
      }
    }
  };
};

describe('options.onMatch', () => {
  it('should call options.onMatch on each matching string', () => {
    const fixtures = ['a', './a', 'b', 'a/a', './a/b', 'a/c', './a/x', './a/a/a', 'a/a/b', './a/a/a/a', './a/a/a/a/a', 'x/y', './z/z'];

    assert(!isMatch('./.a', '*.a', { format }));
    assert(!isMatch('./.a', './*.a', { format }));
    assert(!isMatch('./.a', 'a/**/z/*.md', { format }));
    assert(!isMatch('./a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md', { format }));
    assert(!isMatch('./a/b/c/j/e/z/c.txt', './a/**/j/**/z/*.md', { format }));
    assert(!isMatch('a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md', { format }));
    assert(isMatch('./.a', './.a', { format }));
    assert(isMatch('./a/b/c.md', 'a/**/*.md', { format }));
    assert(isMatch('./a/b/c/d/e/j/n/p/o/z/c.md', './a/**/j/**/z/*.md', { format }));
    assert(isMatch('./a/b/c/d/e/z/c.md', '**/*.md', { format }));
    assert(isMatch('./a/b/c/d/e/z/c.md', './a/**/z/*.md', { format }));
    assert(isMatch('./a/b/c/d/e/z/c.md', 'a/**/z/*.md', { format }));
    assert(isMatch('./a/b/c/j/e/z/c.md', './a/**/j/**/z/*.md', { format }));
    assert(isMatch('./a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md', { format }));
    assert(isMatch('./a/b/z/.a', './a/**/z/.a', { format }));
    assert(isMatch('./a/b/z/.a', 'a/**/z/.a', { format }));
    assert(isMatch('.a', './.a', { format }));
    assert(isMatch('a/b/c.md', './a/**/*.md', { format }));
    assert(isMatch('a/b/c.md', 'a/**/*.md', { format }));
    assert(isMatch('a/b/c/d/e/z/c.md', 'a/**/z/*.md', { format }));
    assert(isMatch('a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md', { format }));

    equal(match(fixtures, '*', options()), ['a', 'b']);
    equal(match(fixtures, '**/a/**', options()), ['a', 'a/a', 'a/c', 'a/b', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a']);
    equal(match(fixtures, '*/*', options()), ['a/a', 'a/b', 'a/c', 'a/x', 'x/y', 'z/z']);
    equal(match(fixtures, '*/*/*', options()), ['a/a/a', 'a/a/b']);
    equal(match(fixtures, '*/*/*/*', options()), ['a/a/a/a']);
    equal(match(fixtures, '*/*/*/*/*', options()), ['a/a/a/a/a']);
    equal(match(fixtures, './*', options()), ['a', 'b']);
    equal(match(fixtures, './**/a/**', options()), ['a', 'a/a', 'a/b', 'a/c', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a']);
    equal(match(fixtures, './a/*/a', options()), ['a/a/a']);
    equal(match(fixtures, 'a/*', options()), ['a/a', 'a/b', 'a/c', 'a/x']);
    equal(match(fixtures, 'a/*/*', options()), ['a/a/a', 'a/a/b']);
    equal(match(fixtures, 'a/*/*/*', options()), ['a/a/a/a']);
    equal(match(fixtures, 'a/*/*/*/*', options()), ['a/a/a/a/a']);
    equal(match(fixtures, 'a/*/a', options()), ['a/a/a']);
  });
});
