'use strict';

const assert = require('assert');
const picomatch = require('..');

describe('options.format with non-string inputs', () => {
  const input = { path: 'file.js' };
  const format = value => value.path;

  it('formats non-string inputs before validating the result', () => {
    assert.strictEqual(picomatch('*.js', { format })(input), true);
  });

  it('preserves the original input and exposes the formatted output', () => {
    const matcher = picomatch('*.js', { format });
    const result = matcher(input, true);

    assert.strictEqual(result.isMatch, true);
    assert.strictEqual(result.input, input);
    assert.strictEqual(result.output, 'file.js');
  });

  it('supports exact matches after formatting', () => {
    assert.strictEqual(picomatch('file.js', { format })(input), true);
  });

  it('supports arrays of patterns', () => {
    assert.strictEqual(picomatch(['*.ts', '*.js'], { format })(input), true);
  });

  it('supports primitive values when the formatter converts them to strings', () => {
    assert.strictEqual(picomatch('42', { format: value => String(value) })(42), true);
  });

  it('applies ignore patterns to formatted object inputs', () => {
    const matcher = picomatch('*', { format, ignore: '*.js' });
    assert.strictEqual(matcher(input), false);
  });

  it('still rejects non-string inputs without a custom formatter', () => {
    assert.throws(() => picomatch('*.js')(input), {
      name: 'TypeError',
      message: 'Expected input to be a string'
    });
  });

  it('does not treat the built-in Windows formatter as a custom formatter', () => {
    assert.throws(() => picomatch('*.js', { windows: true })(input), {
      name: 'TypeError',
      message: 'Expected input to be a string'
    });
  });

  it('rejects a formatter result that is not a string', () => {
    assert.throws(() => picomatch('*.js', { format: value => value.path.length })(input), {
      name: 'TypeError',
      message: 'Expected input to be a string'
    });
  });

  it('preserves empty-string behavior without invoking the formatter', () => {
    let calls = 0;
    const matcher = picomatch('*.js', {
      format: value => {
        calls++;
        return value;
      }
    });

    assert.strictEqual(matcher(''), false);
    assert.strictEqual(calls, 0);
  });

  it('calls the formatter once per match attempt', () => {
    let calls = 0;
    const matcher = picomatch('*.js', {
      format: value => {
        calls++;
        return value.path;
      }
    });

    assert.strictEqual(matcher(input), true);
    assert.strictEqual(calls, 1);
  });
});
