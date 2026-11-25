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

    it('should compile and answer a glob too large to classify', () => {
      // Classifying is capped: past the cap the regex is treated as one that can backtrack.
      const result = finishes('*a'.repeat(300), 'a'.repeat(500) + '//');
      assert(!result.timedOut, 'a glob of 300 stars did not finish');
      assert.strictEqual(result.output, 'false');
      assert(isMatch('a'.repeat(500), '*a'.repeat(300)));
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

  describe('what one regex may cost besides time', () => {
    // Runs a script in a child process with this module's path as its first argument.
    const child = (script, nodeOptions = []) => spawnSync(process.execPath, [...nodeOptions, '-e', script, require.resolve('..')], {
      timeout: 20000,
      encoding: 'utf8'
    });

    it('should answer a glob of thousands of characters', () => {
      for (const n of [9000, 30000]) {
        const isLong = picomatch('a'.repeat(n) + '*b*c*');
        assert.strictEqual(isLong('a'.repeat(n) + 'bxx'), false);
        assert.strictEqual(isLong('a'.repeat(n) + 'bxc'), true);
      }
    });

    it('should leave a glob too deep for the stack to the regex', () => {
      // A chain of optional groups, then groups nested inside each other.
      const chain = makeRe('?(a)'.repeat(3000));
      assert.strictEqual(chain.test('a'.repeat(3000)), true);
      assert.strictEqual(chain.test('b'), false);
      assert(isMatch('a', '('.repeat(3000) + 'a' + ')'.repeat(3000)));
    });

    it('should keep deciding after a name takes the DFA past its state limit', function() {
      this.timeout(30000);
      // More than 4,000 states of this glob are reachable, and the long name reaches them.
      const script = 'const re = require(process.argv[1]).makeRe("+(*a)??????????????");'
        + 'let name = "", r = 1;'
        + 'for (let i = 0; i < 9000; i++) { r = (Math.imul(r, 1664525) + 1013904223) >>> 0; name += (r >>> 30) & 1 ? "a" : "b"; }'
        + 'const out = [re.test(name + "a".repeat(15)), re.restarts() > 0, re.states() <= 4000];'
        + 'out.push(re.test("a".repeat(42) + "/"), re.test("a".repeat(60) + "/"));'
        + 'process.stdout.write(JSON.stringify(out));';
      const result = child(script);
      assert(!result.error, 'the near miss after the long name did not finish');
      assert.strictEqual(result.stdout, '[true,true,true,false,false]');
    });

    it('should give the same answers with a table of a few states', () => {
      const { globRegExp } = require('../lib/bounded/glob-regexp');
      let inputs = [''];
      for (let length = 0, level = ['']; length < 6; length++) {
        level = [].concat(...level.map(s => ['a', 'b', '.', '/'].map(c => s + c)));
        inputs = inputs.concat(level);
      }
      let restarts = 0;
      for (const glob of ['+(*a)', '*(*a)', '+(a|*a)', '+(!(a))', '*a*a*b', '**/+(*.)+(a|b).+(a|b)?(x)', '*(!(*a*)*b)']) {
        const plain = picomatch.makeRe(glob);
        for (const maxStates of [2, 3, 7]) {
          const regex = globRegExp(plain.source, plain.flags, { dfa: 'always', maxStates });
          for (const input of inputs) {
            assert.strictEqual(regex.test(input), RegExp.prototype.test.call(plain, input), `${glob} on ${JSON.stringify(input)} with ${maxStates} states`);
          }
          assert(regex.states() <= maxStates, `${glob} holds ${regex.states()} states`);
          restarts += regex.restarts();
        }
      }
      assert(restarts > 1000, `only ${restarts} restarts`);
    });

    it('should not keep the terms of a regex that is gone', function() {
      this.timeout(30000);
      const script = 'const pm = require(process.argv[1]);'
        + 'const heap = () => { global.gc(); return process.memoryUsage().heapUsed / 1e6; };'
        + 'for (let i = 0; i < 1000; i++) pm.makeRe("+(*v" + i + ")").test("xxxxxx/");'
        + 'const before = heap();'
        + 'for (let i = 0; i < 10000; i++) pm.makeRe("+(*w" + i + ")").test("xxxxxx/");'
        + 'process.stdout.write((heap() - before).toFixed(1));';
      const result = child(script, ['--expose-gc']);
      assert(!result.error, 'did not finish');
      const grown = Number(result.stdout);
      assert(result.stdout !== '' && Number.isFinite(grown), `no number: ${result.stdout} ${result.stderr.slice(-200)}`);
      assert(grown < 10, `the heap grew ${grown} MB over 10,000 globs`);
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
