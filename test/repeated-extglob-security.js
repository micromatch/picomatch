'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const pm = require('..');
const safe = require('../lib/safe-repetition');

const unsafe = ['+(ab|abab)c', '+("a"|"aa")c', '+({a,aa})c', '+([a]|aa)c', '+(a?(a))c', '+(+(a))c', '*(!(foo))b', '*(a+|b)c'];

describe('mandatory repeated-extglob safety', () => {
  it('rejects ambiguous generated languages, not only the advisory spellings', () => {
    for (const pattern of unsafe) {
      for (const maxExtglobRecursion of [false, 1, 100]) {
        assert.throws(() => pm.makeRe(pattern, { maxExtglobRecursion }), /Unsafe repeated extglob/);
      }
    }
  });

  it('checks surrounding raw quantifiers after the complete token stream is rendered', () => {
    for (const pattern of ['(+(a))+b', 'x(+(a))+b', '(+(a))*b']) {
      assert.throws(() => pm.makeRe(pattern, { regex: true }), /Unsafe repeated extglob/);
    }
    assert.throws(() => pm.makeRe('(+(a)){1,}b', { nobrace: true }), /Unsafe repeated extglob/);
    assert.throws(() => pm.makeRe('(+(a))\\{1,\\}b', { unescape: true }), /Unsafe repeated extglob/);
    assert.throws(() => pm.makeRe('(+(a))\\+b', { unescape: true }), /Unsafe repeated extglob/);
  });

  it('covers all string-pattern compilation entry points and option aliases', () => {
    const pattern = '+(ab|abab)c';
    const parse = require('../lib/parse');
    const posix = require('../posix');
    for (const compile of [
      () => pm(pattern), () => pm(['*.js', pattern]),
      () => pm('*', { ignore: pattern }), () => pm.isMatch('abc', pattern),
      () => pm.matchBase('abc', pattern), () => pm.parse(pattern),
      () => pm.parse([pattern]), () => pm.makeRe(pattern, {}, true),
      () => parse(pattern), () => posix(pattern)
    ]) assert.throws(compile, /Unsafe repeated extglob/);
  });

  it('preserves safe nested and prefix-overlapping, uniquely decodable bodies', () => {
    assert(pm.isMatch('ababa', '+(ab|a)'));
    assert(pm.isMatch('fooofoo', '*(f*(o))', { maxExtglobRecursion: 1 }));
    assert(pm.isMatch('foo/bar/baz.jsx', 'foo/bar/**/*.+(js|jsx)'));
    assert(pm.isMatch('a.c', '+([[:alpha:].])', { posix: true }));
    assert(pm.isMatch('bar', '!(foo)'));
    assert(pm.isMatch('+(ab|abab)', '\\+\\(ab\\|abab\\)'));
    assert(pm.isMatch('+(ab|abab)', '+(ab|abab)', { noextglob: true }));
  });

  it('does not change last-iteration star captures to make an unsafe regex appear safe', () => {
    for (const pattern of ['+(*a)', '*(a*)', '+(a*b)']) {
      assert.throws(() => pm.makeRe(pattern, { capture: true }), /Unsafe repeated extglob/);
    }
    assert.deepStrictEqual(Array.from(pm.makeRe('+(foo|bar)', { capture: true }).exec('foobar')), ['foobar', 'foobar']);
  });

  it('does not silently change unanchored match spans or truthy capture options', () => {
    assert.throws(() => pm.makeRe('+(a*b)', { contains: true }), /Unsafe repeated extglob/);
    assert.throws(() => pm.makeRe('+(*a)', { capture: 1 }), /Unsafe repeated extglob/);
    assert.throws(() => pm.makeRe('+(*a)', { contains: 1 }), /Unsafe repeated extglob/);
    const state = pm.parse('+(*a)');
    assert.throws(() => pm.compileRe(state, { contains: true }), /Unsafe repeated extglob/);
    assert.throws(() => pm.compileRe(state, { contains: true }, true), /Unsafe repeated extglob/);
  });

  it('combines character alternatives before later flag changes can introduce ambiguity', () => {
    for (const options of [{ nocase: true }, { flags: 'i' }, { flags: 'iu' }]) {
      assert(pm.isMatch('AaAA', '+(a|A)', options));
      assert(!pm.isMatch('aaa!', '+(a|A)c', options));
    }
    const state = pm.parse('+(a|A)c');
    assert(!pm.compileRe(state, { flags: 'i' }).test('a'.repeat(1000) + '!'));
    assert.throws(() => pm.parse('+(ab|AB)c'), /Unsafe repeated extglob/);
  });

  it('does not flatten Bash dot-segment guards into a different language', () => {
    assert.throws(() => pm.makeRe('+(.a*)', { bash: true }), /Unsafe repeated extglob/);
    assert(pm.isMatch('aba', '+(a*)', { bash: true }));
  });

  it('proves assertions and preserves parallel/nullable-path ambiguity', () => {
    for (const source of ['(?:a)+', '(?:a*)*', 'a|aa', 'ab|abab', 'a(?:a)?', '(?=(?:a+)+b)a', '(?!(?:a|aa)+b)a', '(?=a+b)a', '(?!a+b)a', 's|[^\\x00-\\x7f]']) {
      assert.strictEqual(safe(source), false, source);
    }
    for (const source of ['foo|bar', 'ab|a', 'f(?:o)*', '(?=.)a', '[^/]', '[a-z]']) {
      assert.strictEqual(safe(source), true, source);
    }
    assert.strictEqual(safe('a'.repeat(9000)), false);
    assert.strictEqual(safe('('.repeat(40) + 'a' + ')'.repeat(40)), false);
  });

  it('terminates the attack matrix in an isolated process with a hard deadline', function() {
    this.timeout(10000);
    const worker = 'const p=require(process.argv[1]);const [pattern,options]=JSON.parse(process.argv[2]);try{const result=p(pattern,options)(\'a\'.repeat(100000)+\'!\');if(result!==false)process.exit(2)}catch(e){if(!(e instanceof SyntaxError))throw e}';
    for (const pattern of ['+(*)b', '+(*a)b', '+(a*)b', '*(*a)b', '+(ab|abab)c', '+("a"|"aa")c', '+({a,aa})c', '+([a]|aa)c', '+(a?(a))c', '+(a|A)c']) {
      for (const options of [{}, { maxExtglobRecursion: false }, { flags: 'iu' }]) {
        const result = spawnSync(process.execPath, ['--max-old-space-size=64', '-e', worker, require.resolve('..'), JSON.stringify([pattern, options])], { timeout: 1000, encoding: 'utf8' });
        assert.ifError(result.error);
        assert.strictEqual(result.status, 0, `${pattern}: ${result.stderr}`);
      }
    }
  });

  it('retains short-input language and outer captures for the supported star rewrite', () => {
    // Original 4.0.7 generated expressions, restricted to tiny inputs here.
    const cases = [
      ['+(*a)', /^(?:(?=.)(?:[^/]*?a)+)$/],
      ['*(a*)', /^(?:(?=.)(?:a[^/]*?)*)$/],
      ['+(a*b)', /^(?:(?=.)(?:a[^/]*?b)+)$/],
      ['+(*)', /^(?:(?=.)(?:[^/]*?)+)$/]
    ];
    const strings = [''];
    for (let length = 0; length < 4; length++) for (const value of strings.filter(v => v.length === length)) for (const char of ['a', 'b', '.', '\n', '/']) strings.push(value + char);
    for (const [pattern, original] of cases) {
      const patched = pm.makeRe(pattern);
      for (const input of strings) assert.strictEqual(patched.test(input), original.test(input), `${pattern}: ${JSON.stringify(input)}`);
    }
  });
});
