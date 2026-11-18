'use strict';

const assert = require('assert');
const { isMatch, makeRe } = require('..');
const { hasExponentialBacktracking } = require('../lib/ambiguity');

// A literalized pattern is matched in linear time, so these inputs finish in
// well under a millisecond. Before the fix each of them took from seconds to
// hours (the official 4.0.7 regex needs about 1 s at roughly 30 characters,
// and each extra repetition doubles it).
const BUDGET_MS = 250;

const timed = fn => {
  const start = process.hrtime();
  fn();
  const [s, ns] = process.hrtime(start);
  return s * 1e3 + ns / 1e6;
};

const attacks = [
  // [pattern, options, hostile input]
  ['+(*a)', {}, 'a'.repeat(5000) + '/'],
  ['+(*)c', {}, 'a'.repeat(5000)],
  ['+(a*)', {}, 'a'.repeat(5000) + '/'],
  ['+(*)', {}, 'a'.repeat(5000) + '/'],
  ['*(a*|b)', {}, 'a'.repeat(5000) + '/'],
  ['+(a|a*a)', {}, 'a'.repeat(5000) + '/'],
  ['(a+|b)+', {}, 'a'.repeat(5000) + '\u0000'],
  ['(a+|b)+', { windows: true }, 'a'.repeat(5000) + '\u0000'],
  ['*(!(f))', { windows: true }, 'a'.repeat(5000) + '/'],
  ['+(!(f))', { windows: true }, 'a'.repeat(5000) + '/'],
  ['*(!(f))', { bash: true, windows: true }, 'a'.repeat(5000) + '\n'],
  ['*(!(foo))', { bash: true, windows: true }, 'a'.repeat(5000) + '\n'],
  ['*/*(W*, *)*', {}, 'a/' + 'W, '.repeat(2000) + '/x'],
  ['**/*(W*, *)*', {}, 'a/' + 'W, '.repeat(2000) + '/x'],
  ['a[\\W]+c', {}, 'a' + '[!]'.repeat(2000) + 'x'],
  ['a[\\D]+c', {}, 'a' + '[!]'.repeat(2000) + 'x'],
  ['a[\\S]+c', {}, 'a' + '[!]'.repeat(2000) + 'x'],
  ['+(+(a))', { maxExtglobRecursion: 1 }, 'a'.repeat(5000) + '!'],
  ['*(+(a))', { maxExtglobRecursion: 1 }, 'a'.repeat(5000) + '!'],
  ['!(+(*))', {}, 'a'.repeat(5000) + '/'],
  // single-branch repeats, including a globstar that crosses slashes
  ['+([a]*)b', {}, 'a'.repeat(5000)],
  ['*([a]*)b', {}, 'a'.repeat(5000)],
  ['+(@(*a))', {}, 'a'.repeat(5000) + '/'],
  ['+(@(a*))', {}, 'a'.repeat(5000) + '/'],
  ['+(**/a)b', {}, 'a/'.repeat(2500) + 'a'],
  ['+(**/a)', {}, 'a/'.repeat(2500) + 'x'],
  ['*(**/a)b', {}, 'a/'.repeat(2500) + 'a'],
  ['+(a/**)b', {}, 'a/'.repeat(2500) + 'a'],
  ['+(**/a|b)c', {}, 'a/'.repeat(2500) + 'a'],
  ['@(+(**/a))b', {}, 'a/'.repeat(2500) + 'a'],
  ['+(**/a)b', { windows: true }, 'a/'.repeat(2500) + 'a'],
  // negated escape classes and empty branches
  ['+([^\\W]|a)', {}, 'a'.repeat(5000) + '!'],
  ['+(a|[^\\W])b', {}, 'a'.repeat(5000) + '!'],
  ['+(a|aa[^\\W])', {}, 'a'.repeat(5000) + '!'],
  ['+(aa@(|))', {}, 'a'.repeat(5000) + '!'],
  ['+(aa@(|))b', {}, 'a'.repeat(5000) + '!'],
  ['+(a**/@(|))', {}, 'a'.repeat(5000) + '!'],
  ['+([!\\Wb])', { nocase: true }, '[!!B]'.repeat(1000) + 'a'],
  ['+(a|[!\\Wb])', { nocase: true }, '[!!B]'.repeat(1000) + 'a'],
  ['**/?(*.)+(spec|test).[jt]s?(x)', { noextglob: true }, 'a.'.repeat(2500) + 'x']
];

describe('exponential backtracking (ReDoS)', () => {
  describe('generated regexes', () => {
    for (const [pattern, options, input] of attacks) {
      it(`should match "${pattern}" ${JSON.stringify(options)} in linear time`, () => {
        const re = makeRe(pattern, options);
        const ms = timed(() => re.test(input));
        assert(ms < BUDGET_MS, `${re.source} took ${ms.toFixed(1)} ms on ${input.length} characters`);
      });
    }

    it('should match exponential patterns as literal text', () => {
      assert.strictEqual(makeRe('+(*)c').source, '^(?:\\+\\(\\*\\)c)$');
      assert.strictEqual(makeRe('a[\\W]+c').source, '^(?:a\\[\\W\\]\\+c)$');
      assert(isMatch('+(*)c', '+(*)c'));
      assert(!isMatch('abc', '+(*)c'));
    });

    it('should leave an invalid generated regex alone', () => {
      // `capture` makes this glob compile to an unbalanced group; makeRe()
      // already turns that into a regex that matches nothing.
      assert.strictEqual(makeRe('src/**/!(*.test).ts', { capture: true }).source, '$^');
    });

    it('should keep the generated regex when maxExtglobRecursion is false', () => {
      assert.strictEqual(makeRe('(a+|b)+', { maxExtglobRecursion: false }).source, '^(?:(a+|b)+)$');
      assert(isMatch('abab', '(a+|b)+', { maxExtglobRecursion: false }));
    });
  });

  describe('patterns that are not changed', () => {
    // Expected sources are the output of the code before this change.
    const unchanged = [
      ['*', '^(?:(?!\\.)(?=.)[^/]*?\\/?)$'],
      ['**', '^(?:(?!\\.)(?:(?:(?!(?:^|\\/)\\.)[\\s\\S])*?)\\/?)$'],
      ['*.js', '^(?:(?!\\.)(?=.)[^/]*?\\.js\\/?)$'],
      ['**/*.js', '^(?:(?:(?!\\.)(?:(?:(?!(?:^|\\/)\\.)[\\s\\S])*?)\\/)?(?!\\.)(?=.)[^/]*?\\.js\\/?)$'],
      ['src/**/*.{js,ts}', '^(?:src(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.)[\\s\\S])*?)\\/|\\/|$)(?!\\.)(?=.)[^/]*?\\.(js|ts))$'],
      ['!**/node_modules/**', '^(?!^(?:(?:^|\\/|(?:(?:(?!(?:^|\\/)\\.)[\\s\\S])*?)\\/)node_modules(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.)[\\s\\S])*?)|$))$).*$'],
      ['**/*.test.ts', '^(?:(?:(?!\\.)(?:(?:(?!(?:^|\\/)\\.)[\\s\\S])*?)\\/)?(?!\\.)(?=.)[^/]*?\\.test\\.ts\\/?)$'],
      ['**/__tests__/**/*.[jt]s?(x)', '^(?:(?:^|\\/|(?:(?:(?!(?:^|\\/)\\.)[\\s\\S])*?)\\/)__tests__(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.)[\\s\\S])*?)\\/|\\/|$)(?!\\.)(?=.)[^/]*?\\.(?:\\[jt\\]|[jt])s(?:x)?)$'],
      ['**/?(*.)+(spec|test).[jt]s?(x)', '^(?:(?:^|\\/|(?:(?:(?!(?:^|\\/)\\.)[\\s\\S])*?)\\/)(?:[^/]*?\\.)?(?:spec|test)+\\.(?:\\[jt\\]|[jt])s(?:x)?)$'],
      ['a/**/b/**/c', '^(?:a(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.)[\\s\\S])*?)\\/|\\/|$)b(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.)[\\s\\S])*?)\\/|\\/|$)c)$'],
      ['[abc]*.md', '^(?:(?:\\[abc\\]|[abc])[^/]*?\\.md)$'],
      ['[!a]*', '^(?:[^a/][^/]*?\\/?)$'],
      ['foo/{bar,baz}/*.txt', '^(?:foo\\/(bar|baz)\\/(?!\\.)(?=.)[^/]*?\\.txt)$'],
      ['+(abc)', '^(?:(?=.)(?:abc)+)$'],
      ['*(foo|bar)', '^(?:(?=.)(?:foo|bar)*)$'],
      ['@(a|b)', '^(?:(a|b))$'],
      ['?(a|b)', '^(?:(?=.)(?:a|b)?)$'],
      ['!(*.d).ts', '^(?:(?=.)(?:(?!(?:[^/]*?\\.d)\\.ts)[^/]*?)\\.ts)$'],
      ['*(*(f)*(o))', '^(?:(?=.)[fo]*)$'],
      ['+(a|b)', '^(?:(?=.)(?:a|b)+)$'],
      ['a[\\w]+c', '^(?:a(?:\\[\\w\\]|[\\w])+c)$'],
      ['a[\\d]+c', '^(?:a(?:\\[\\d\\]|[\\d])+c)$'],
      ['(f|o)+\\b', '^(?:(f|o)+\\b)$'],
      ['*.+(js|jsx)', '^(?:(?!\\.)(?=.)[^/]*?\\.(?:js|jsx)+)$'],
      ['+(+(a)b)', '^(?:(?=.)(?:(?:a)+b)+)$'],
      ['packages/*/src/**/*.tsx', '^(?:packages\\/(?!\\.)(?=.)[^/]*?\\/src(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.)[\\s\\S])*?)\\/|\\/|$)(?!\\.)(?=.)[^/]*?\\.tsx)$'],
      ['{a,b}/**/{c,d}/*', '^(?:(a|b)(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.)[\\s\\S])*?)\\/|\\/|$)(c|d)\\/(?!\\.)(?=.)[^/]*?\\/?)$'],
      ['**/[^.]*', '^(?:(?:^|\\/|(?:(?:(?!(?:^|\\/)\\.)[\\s\\S])*?)\\/)[^./][^/]*?\\/?)$'],
      ['a/*/b', '^(?:a\\/(?!\\.)(?=.)[^/]*?\\/b)$'],
      ['?.md', '^(?:^(?:[^.\\/]\\.md)$)$']
    ];

    for (const [pattern, source] of unchanged) {
      it(`should compile "${pattern}" exactly as before`, () => {
        assert.strictEqual(makeRe(pattern).source, source);
      });
    }
  });

  describe('hasExponentialBacktracking', () => {
    const exponential = [
      '(a|a)+', '(?:a|aa)+', '(a*)*', '(a+)+', '(?:[^/]*?a)+', '(?:a|[ab])+', '(?:ab*|b)+',
      '(?:a[^/]*?|b)*', '^(?:(?=.)(?:[^/]*?)+)$', '(\\w+\\s?)+$', '(x+x+)+y', '(?:ab|abab)+',
      '(?:W[^/]*?, [^/]*?)*', '(?:(?!f)[^/]*?)*', '(?:a|a[^/])+', '(.*a){2,}', '(?:[^\\\\/]*?a)+',
      '(?:\\[\\W\\]|[\\W])+', '(?:\\[\\S\\]|[\\S])+', '(?!(?:(?:a)+)+)b', '(?<=(a+)+)b',
      // two derivations of one edge: empty branches, optional pieces
      '(?:a(?:|)b)+', '(?:a(?:|)(?:|)b)+', '(?:a(?:|b?)c)+', '(?:a(?:(?=b)|)b)+',
      '(?:(?:a?)+b)+', '(?:(?:|a){2})+',
      // negated escapes inside a class
      '(?:[^\\W]|a)+', '(?:[^\\D]|1)+', '(?:[^\\S]| )+', '(?:[^\\Wb]|a)+',
      // legacy octal and control escapes
      '(?:\\012|\\n)+', '(?:[\\1]|\\x01)+', '(?:[\\c1]|\\x11)+',
      // backreferences
      '^(ab)(?:\\1?ab)+$', '(?:(a)\\1|aa)+', '(?:(a)(?:\\1|a))+'
    ];

    const exponentialWithFlags = [
      ['(?:.|\\n)+x', 's'],
      ['(?:[\\u0100-\\u2000]|S)+', 'iu'],
      ['(?:\\u212A|k)+', 'iu'],
      ['(?:[a-z]|K)+', 'i'],
      // under `i` a class like [!\Wb] folds its members (it also matches B)
      ['(?:\\[!\\Wb\\]|[!\\Wb])+', 'i'],
      ['(?:[!\\Wb]|B)+', 'i'],
      ['(?:\\p{L}|a)+', 'u'],
      ['(?:\\u{61}|a)+', 'u'],
      ['(?:\\uD83D\\uDE00|\\u{1F600})+', 'u'],
      ['(?:\u{1F600}|\\uD83D\\uDE00)+', '']
    ];

    for (const [source, flags] of exponentialWithFlags) {
      it(`should flag ${source} with flags "${flags}"`, () => {
        assert.strictEqual(hasExponentialBacktracking(source, flags), true);
      });
    }

    const safe = [
      '(?:js|jsx)+', '(?:of|oof(?:o)+)*', 'a*b*', '(?:ab)+', '[^/]*?\\.js', '(?:a|b)+', '(?:spec|test)',
      '^(?:(?!\\.)(?=.)[^/]*?\\.js\\/?)$', '(?:f|of(?:o)+)*', '(?:x(?:a|aa))+', 'a+', '[ab]+',
      '(?:a[^/])+', '(?:[^/]*?\\/)+', '(?:a|b|c)*d', '^(?:(?=.)a*)$', '(?:A|a)+', '(?:\\[\\w\\]|[\\w])+',
      '(?:\\[\\d\\]|[\\d])+', '(?:(?:a)+b)+', '[]+', '(?:a){3}',
      // empty iterations of an optional repeat are rejected by JavaScript
      '(?:a?)+', '(?:a(?:)?b)+', '(?:a(?:)*b)+', '(?:a(?:b?)?c)+',
      '(?:.|\\n)+x', '(?:[^\\Wa]|a)+',
      // a repeated fixed sequence with a backreference splits one way only
      '(\\w)(?:\\1)+', '([^/]*?)\\/(\\1)+\\/(\\1)+'
    ];

    for (const source of exponential) {
      it(`should flag ${source}`, () => {
        assert.strictEqual(hasExponentialBacktracking(source), true);
      });
    }

    for (const source of safe) {
      it(`should not flag ${source}`, () => {
        assert.strictEqual(hasExponentialBacktracking(source), false);
      });
    }

    it('should take the case-insensitive flag into account', () => {
      assert.strictEqual(hasExponentialBacktracking('(?:A|a)+'), false);
      assert.strictEqual(hasExponentialBacktracking('(?:A|a)+', 'i'), true);
    });

    it('should treat a source it cannot parse as unsafe', () => {
      assert.strictEqual(hasExponentialBacktracking('a)+'), true);
    });
  });
});
