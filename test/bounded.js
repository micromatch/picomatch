'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const picomatch = require('..');
const { makeRe, isMatch } = picomatch;

// Runs `makeRe(glob).test(input)` in a child process, so that a regex that backtracks
// without bound shows up as a timeout instead of hanging the suite.
const finishes = (glob, input, options = {}) => {
  const script = 'const pm = require(process.argv[1]);'
    + 'const [glob, input, options] = JSON.parse(process.argv[2]);'
    + 'process.stdout.write(String(pm.makeRe(glob, options).test(input)));';
  const child = spawnSync(process.execPath, ['-e', script, require.resolve('..'), JSON.stringify([glob, input, options])], {
    timeout: 5000,
    encoding: 'utf8'
  });
  return { timedOut: Boolean(child.error), output: child.stdout };
};

describe('bounded backtracking', () => {
  describe('regexes that cannot backtrack badly', () => {
    it('should return a plain RegExp', () => {
      for (const glob of ['*.js', '**/*.js', 'src/**/*.{ts,tsx}', '**/!(*.test|*.spec).{js,ts}', 'a/b/c']) {
        const regex = makeRe(glob);
        assert.strictEqual(Object.getPrototypeOf(regex), RegExp.prototype, glob);
        assert.strictEqual(regex.test, RegExp.prototype.test, glob);
        assert.strictEqual(regex.exec, RegExp.prototype.exec, glob);
        assert.deepStrictEqual(Object.getOwnPropertyNames(regex), ['lastIndex'], glob);
      }
    });
  });

  describe('regexes that can', () => {
    const risky = [
      ['+(*a)', 'a'.repeat(40) + '/'],
      ['*(*a)', 'a'.repeat(40) + '/'],
      ['+(a|*a)', 'a'.repeat(40) + '/'],
      ['+(!(a))', 'b'.repeat(40) + '/'],
      ['@(*a)+', 'a'.repeat(40) + '/'],
      ['{*a,b}+', 'a'.repeat(40) + '/'],
      ['*a*a*a*a*b', 'a'.repeat(400) + '/'],
      ['**/+(*.)+(spec|test).+(ts|js)?(x)', '.a'.repeat(40) + '/']
    ];

    it('should finish on inputs that almost match', () => {
      for (const [glob, input] of risky) {
        const result = finishes(glob, input);
        assert(!result.timedOut, `${glob} did not finish`);
        assert.strictEqual(result.output, 'false', glob);
      }
    });

    it('should finish with the nocase option', () => {
      const result = finishes('+(*A)', 'a'.repeat(40) + '/', { nocase: true });
      assert(!result.timedOut);
      assert.strictEqual(result.output, 'false');
    });

    it('should keep the source, flags and prototype of the regex', () => {
      for (const [glob] of risky) {
        const regex = makeRe(glob);
        const plain = new RegExp(regex.source, regex.flags);
        assert.strictEqual(Object.getPrototypeOf(regex), RegExp.prototype, glob);
        assert.deepStrictEqual(regex, plain, glob);
        assert.strictEqual(String(regex), String(plain), glob);
        assert.strictEqual(makeRe(glob, { nocase: true }).flags, 'i', glob);
      }
    });

    it('should give the same answers as the regex alone', () => {
      // Short inputs only: the regex alone is what backtracks on long ones.
      const inputs = ['', 'a', 'b', 'aa', 'ab', 'ba', 'aaa', 'aab', 'a/a', 'a/', '/a', '.a', 'a.a', 'x.spec.ts',
        'src/x.spec.ts', 'a.b.test.jsx', 'x.spec.tsz', 'aaaaaaab', 'abababab', 'a!', 'a\n'];
      for (const [glob] of risky) {
        for (const options of [{}, { dot: true }, { nocase: true }]) {
          const regex = makeRe(glob, options);
          const plain = new RegExp(regex.source, regex.flags);
          for (const input of inputs) {
            assert.strictEqual(regex.test(input), plain.test(input), `${glob} ${JSON.stringify(options)} on ${JSON.stringify(input)}`);
          }
        }
      }
    });

    it('should keep capture groups', () => {
      const regex = makeRe('(*a)+');
      const plain = new RegExp(regex.source, regex.flags);
      assert.deepStrictEqual(Array.from(regex.exec('xa')), Array.from(plain.exec('xa')));
      assert.strictEqual(regex.exec('xb'), null);
      assert.deepStrictEqual('xa'.match(regex).slice(), 'xa'.match(plain).slice());
      assert.strictEqual('xa'.replace(regex, '[$1]'), 'xa'.replace(plain, '[$1]'));
    });

    it('should match through the main API', () => {
      assert(isMatch('aaa', '+(*a)'));
      assert(!isMatch('aab', '+(*a)'));
      assert(picomatch('**/+(*.)+(spec|test).+(ts|js)?(x)')('src/app/auth.spec.ts'));
      assert(!picomatch('**/+(*.)+(spec|test).+(ts|js)?(x)')('src/app/auth.ts'));
    });
  });

  describe('regexes that are left alone', () => {
    it('should return a plain RegExp for flags other than "i"', () => {
      const regex = makeRe('+(*a)', { flags: 'g' });
      assert.strictEqual(regex.flags, 'g');
      assert.strictEqual(regex.test, RegExp.prototype.test);
    });

    it('should still return a regex that matches nothing for an invalid source', () => {
      assert.strictEqual(String(picomatch.toRegex('(')), String(/$^/));
      assert.throws(() => picomatch.toRegex('(', { debug: true }));
    });
  });
});
