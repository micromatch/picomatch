'use strict';

const assert = require('assert');
const { isMatch, makeRe, parse } = require('..');

describe('options.prepend', () => {
  it('should prepend a string to the parsed regex source (issue #110)', () => {
    const state = parse('abc', { prepend: 'foo' });
    assert.strictEqual(state.tokens[0].output, 'foo');
    assert.strictEqual(state.output, 'fooabc');
  });

  it('should prepend a string to the generated matcher regex', () => {
    assert.strictEqual(makeRe('abc', { prepend: 'foo' }).source, '^(?:fooabc)$');
    assert(isMatch('fooabc', 'ab*', { prepend: 'foo' }));
    assert(!isMatch('abc', 'ab*', { prepend: 'foo' }));
  });

  it('should prepend a string when compiling common fast-path patterns', () => {
    const re = makeRe('*.js', { prepend: 'foo' });
    assert.ok(re.source.indexOf('^(?:foo') === 0);
    assert(isMatch('fooa.js', '*.js', { prepend: 'foo' }));
    assert(!isMatch('a.js', '*.js', { prepend: 'foo' }));
  });

  it('should not double-prepend when the parser rebuilds output after backtracking', () => {
    const re = makeRe('[[:alpha:]]', { prepend: 'foo' });
    assert.ok(re.source.indexOf('^(?:foo') === 0);
    assert.strictEqual(re.source.split('foo').length - 1, 1);
    assert(isMatch('fooa', '[[:alpha:]]', { prepend: 'foo' }));
    assert(!isMatch('a', '[[:alpha:]]', { prepend: 'foo' }));
  });

  it('should not re-apply prepend when parsing a suffix after a negated extglob', () => {
    const state = parse('!(*.d).ts', { prepend: 'foo' });
    assert.strictEqual(state.output.split('foo').length - 1, 1);
    assert(isMatch('foofile.ts', '!(*.d).ts', { prepend: 'foo' }));
    assert(!isMatch('foofile.d.ts', '!(*.d).ts', { prepend: 'foo' }));
  });
});
