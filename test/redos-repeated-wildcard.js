'use strict';

const assert = require('assert');
const path = require('path');
const { execFileSync } = require('child_process');
const picomatch = require('..');
const { isMatch, makeRe } = picomatch;

/**
 * CVE-2026-112366 (GHSA-fc5q-39xc-vjpf): a wildcard inside a repeated extglob,
 * such as `+(*)` or `+(*a)`, nested one unbounded quantifier inside another and
 * backtracked exponentially on short input that almost matched.
 */

const unprotected = options => ({ ...options, maxExtglobRecursion: false });
const optionSets = [{}, { dot: true }, { windows: true }, { bash: true }, { capture: true }, { nocase: true }];

const shortInputs = (() => {
  const alphabet = ['a', 'b', '.', '/', '\\', '\n', 'x'];
  const inputs = [''];
  let prev = [''];
  for (let len = 1; len <= 4; len++) {
    const next = [];
    for (const p of prev) for (const c of alphabet) next.push(p + c);
    inputs.push(...next);
    prev = next;
  }
  return inputs;
})();

const POSIX_REBUILD_LOSS = new Set(['+(a|[[:upper:]]*)', '[[:alpha:]]+(*.js|*.ts)']);
const isLiteral = (re, pattern) => re.test(pattern) && /\\[+*]\\\(/.test(re.source);
const NESTED_WILDCARD = /\((?:\?:)?[^()]*(?:\[\^[^\]]*\]|\.)\*\??[^()]*\)[*+]/;

describe('repeated extglobs containing wildcards (CVE-2026-112366)', () => {
  const rewritten = [
    '+(*)', '*(*)', '+(*a)', '*(*a)', '+(a*)', '+(*)a', '*(*)a', '+(a*b)', '+(*a)b', 'x+(*a)', 'x+(*a)y',
    '+(?*a)', '+(*?)a', '+(*.js)', '*(*.js)x', '+(*[ab])', '+([ab]*)c', '+(*.[jt]s)', '+(**a)',
    '+(*.js|*.ts)', '+(a*|b*)', '+(*a|*b)', '+(a*|b)', '*(a*|b)', '+(*a|b)', '+(*a|[bc]x)', '+(a*|[bc])',
    'a/+(*a)/b', '**/+(*a)', '+(*a)/**', '+(*a)+(*b)', '+(!(a))', '*(!(f))', '*(!(foo))', '+(!(*.js))',
    // POSIX classes and literal braces change the output after the extglob closes.
    '+(*[[:alpha:]])', '+([[:alpha:]]*)', '+(a|[[:upper:]]*)', '[[:alpha:]]/+(*a)', '[[:alpha:]]+(*.js|*.ts)',
    'x{+(*a)}', '{+(*)}', 'x{*(*a|b)}', '{*(b*)}a', '.{+(*)}', 'ab+(*a)',
    // Star-free groups (braces, `@(...)`, `?(...)`) inside the body.
    '+(*.{js,ts})', '*(*.@(js|ts))', '+({a,b}*)', '+(*.{js,ts})x', '+(*.?(js))',
    // A globstar right before the extglob is demoted to a star when it opens.
    '**+(*a)', 'x/**+(*.js)', '{+(*})'
  ];

  it('should compile no wildcard inside a repeat', () => {
    for (const pattern of rewritten) {
      for (const options of optionSets) {
        const source = makeRe(pattern, options).source;
        assert(!NESTED_WILDCARD.test(source), `${pattern} ${JSON.stringify(options)}: ${source}`);
      }
    }
  });

  it('should rewrite rather than literalize them with the default options', () => {
    for (const pattern of rewritten) {
      assert(!isLiteral(makeRe(pattern), pattern), pattern);
    }
  });

  it('should match exactly what the unprotected regex matches', function() {
    this.timeout(60000);
    for (const pattern of rewritten) {
      for (const options of optionSets) {
        const before = makeRe(pattern, unprotected(options));
        const after = makeRe(pattern, options);
        // Where no exact rewrite exists (in bash mode `.*?` cannot match a
        // newline that `?` can), the existing literal safeguard applies.
        if (isLiteral(after, pattern)) continue;
        // 2.x drops text merged before a POSIX class when it rebuilds its
        // output (fixed in 4.x by 563f534), so its unprotected regex is wrong
        // there; the rewrite keeps the text, as 4.x does.
        if (POSIX_REBUILD_LOSS.has(pattern)) continue;
        for (const input of shortInputs) {
          assert.strictEqual(after.test(input), before.test(input), `${pattern} ${JSON.stringify(options)} ${JSON.stringify(input)}`);
        }
      }
    }
  });

  it('should keep text before a POSIX class, as 4.x does', () => {
    assert(isMatch('a', '+(a|[[:upper:]]*)'));
    assert(isMatch('Bx', '+(a|[[:upper:]]*)'));
    assert(isMatch('afoo.js', '[[:alpha:]]+(*.js|*.ts)'));
  });

  it('should keep matching the usual examples', () => {
    assert(isMatch('abc', '+(*)'));
    assert(isMatch('aba', '+(*a)'));
    assert(!isMatch('ab', '+(*a)'));
    assert(isMatch('foo.js', '+(*.js|*.ts)'));
    assert(isMatch('foo.jsbar.ts', '+(*.js|*.ts)'));
    assert(!isMatch('foo.md', '+(*.js|*.ts)'));
    assert(isMatch('ax', '*(a*|b)'));
    assert(isMatch('bbax', '*(a*|b)'));
    assert(isMatch('', '*(a*|b)', { dot: true }) === isMatch('', '*(a*|b)', unprotected({ dot: true })));
    assert(isMatch('xay', 'x+(*a)y'));
    assert(!isMatch('a/a', '+(*a)'));
    assert(isMatch('fff', '*(!(f))'));
    assert(!isMatch('f', '*(!(f))'));
  });

  it('should keep the same capture groups', () => {
    for (const pattern of ['+(*a)', '+(*.js|*.ts)', '+(a*|[bc])', '+(*a|[bc]x)']) {
      const groups = re => new RegExp(`${re.source}|`).exec('').length;
      assert.strictEqual(groups(makeRe(pattern, { capture: true })), groups(makeRe(pattern, unprotected({ capture: true }))), pattern);
    }
  });

  it('should treat wildcard repeats it cannot rewrite exactly as literals', () => {
    for (const pattern of ['+(a*|*b)', '+(@(*a))', '+(*a/b)', '+(**)', '+(!(a)b)', '+(a*(*b))', '+(*[,-0])']) {
      assert(isMatch(pattern, pattern), pattern);
      assert(!isMatch('aaa', pattern), pattern);
    }
  });

  it('should leave escaped stars, plain alternations and the opt-out alone', () => {
    assert.strictEqual(makeRe('+(\\*a)').source, makeRe('+(\\*a)', unprotected()).source);
    assert(isMatch('*a*a', '+(\\*a)'));
    assert.strictEqual(makeRe('+(foo|bar)').source, makeRe('+(foo|bar)', unprotected()).source);
    assert.strictEqual(makeRe('*(f*(o))').source, makeRe('*(f*(o))', unprotected()).source);
    assert(/\)\+/.test(makeRe('+(*a)', { maxExtglobRecursion: false }).source));
  });

  it('should read a regex `+` after a group with a wildcard literally, as bash does', () => {
    for (const pattern of ['@(*a)+', '(*a)+', '{*a,b}+', '!(b)+', '@(*)+', '+(*a)+', '@(x@(*a))+']) {
      const source = makeRe(pattern).source;
      assert(!NESTED_WILDCARD.test(source), `${pattern}: ${source}`);
      assert(/\\\+\)\$$/.test(source), `${pattern}: ${source}`);
    }
    assert(isMatch('ba+', '@(*a)+'));
    assert(!isMatch('ba', '@(*a)+'));
    assert(isMatch('abb', 'a(b)+'));
    assert(isMatch('abab', '@(a|b)+'));
    assert(isMatch('ab', '[ab]+'));
    assert(isMatch('ba', '@(*a)+', { maxExtglobRecursion: false }));
  });

  it('should never return a nested wildcard repeat, even for malformed patterns', function() {
    this.timeout(20000);
    // Unbalanced parentheses are repaired after the extglob checks ran, which
    // could still leave a wildcard inside a repeat; these become literals.
    const cases = [
      ['(*|+((""))', {}], ['((*)|+()', {}], ['(*|*(())', {}], ['({*,}|()*', { regex: true }],
      ['a({*,}|+(\\))', {}], ['(*|+((""\\]))', {}], ['{*,}\\*', { unescape: true }],
      ['*([^/]\\*)', { unescape: true }]
    ];
    for (const [pattern, options] of cases) {
      const re = makeRe(pattern, options);
      assert(!NESTED_WILDCARD.test(re.source), `${pattern}: ${re.source}`);
      assert(re.test(pattern), `${pattern}: ${re.source}`);
    }
    const script = `
      const pm = require(${JSON.stringify(path.resolve(__dirname, '..'))});
      for (const [pattern, options] of ${JSON.stringify(cases)}) {
        const re = pm.makeRe(pattern, options);
        for (const run of ['a', 'ab', 'x']) for (const end of ['!', '/', '']) re.test(run.repeat(48 / run.length) + end);
      }
    `;
    execFileSync(process.execPath, ['-e', script], { timeout: 10000 });
  });

  it('should keep quoted text in a rewritten body', () => {
    assert(!isMatch('evil.sh', '+(*".js")'));
    assert(isMatch('a.js', '+(*".js")'));
    assert(!isMatch('src/x.js', 'src/+(*".min").js'));
    assert(isMatch('src/x.min.js', 'src/+(*".min").js'));
    assert(isMatch('*a', '+("*"*)'));
    assert(!isMatch('a', '+("*"*)'));
    assert(isMatch('*x', '*({b,"*"}*)'));
  });

  it('should keep a lazy `?` after a rewritten repeat meaningless', () => {
    // With `capture` the `?` makes the capture group optional; keep it.
    assert(isMatch('/', '/+(*.b)?', { capture: true }));
    // After quoted text the `?` belongs to that text.
    assert(isMatch('a', '+(*a)"b"?'));
    assert(isMatch('ab', '+(*a)"b"?'));
    assert(!isMatch('x', '+(*.js)?x'));
    assert(isMatch('a.jsx', '+(*.js)?x'));
    assert(!isMatch('ac', 'a+(*b)?c'));
    assert(!isMatch('.js', '+({a,b}*)?.js'));
  });

  it('should survive brace ranges that pop the extglob tokens', function() {
    this.timeout(20000);
    const script = `
      const pm = require(${JSON.stringify(path.resolve(__dirname, '..'))});
      for (const p of ['({a..!(b}))+', '@({a..!(b}x))+', '{a..+(b})', '{a..*(b})x', '{a..?(b})']) pm.makeRe(p);
    `;
    execFileSync(process.execPath, ['-e', script], { timeout: 10000 });
    assert(/\)\+\)\$$/.test(makeRe('*/({a..c})+').source));
  });

  it('should catch nested wildcard repeats the final check used to miss', () => {
    for (const [pattern, options] of [['(*){0000000001,}x', { nobrace: true }], ['(\\S+)+x', {}], ['{a,+(*})', {}], ['(*a){1,30}', { nobrace: true }], ['[.]+(+()a|*(**[.])a', {}]]) {
      const re = makeRe(pattern, options);
      assert(re.test(pattern), `${pattern}: ${re.source}`);
    }
    // A literal fallback keeps the pattern's leading negation.
    assert(isMatch('b', '!a(*){2,}', { nobrace: true }));
    assert(!isMatch('a(*){2,}', '!a(*){2,}', { nobrace: true }));
    // `+(!(x))` is rewritten in capture mode too.
    assert(!/\\\+\\\(/.test(makeRe('+(!(a))b', { capture: true }).source));
  });

  it('should parse long patterns in linear time', function() {
    this.timeout(20000);
    const script = `
      const pm = require(${JSON.stringify(path.resolve(__dirname, '..'))});
      pm.makeRe('+(*a)'.repeat(13000));
      pm.makeRe('@('.repeat(10000) + '*' + ')+'.repeat(10000));
      pm.makeRe('{a,*b}+'.repeat(9000));
      pm.makeRe(')+'.repeat(32768));
    `;
    execFileSync(process.execPath, ['-e', script], { timeout: 5000 });
  });

  it('should finish hostile input quickly', function() {
    this.timeout(20000);
    const script = `
      const pm = require(${JSON.stringify(path.resolve(__dirname, '..'))});
      const patterns = ${JSON.stringify([...rewritten, '+(a*|*b)', '+(@(*a))', '+(!(a)b)', '@(*a)+', '(*a)+', '{*a,b}+', '!(b)+', '@(*)+'])};
      const inputs = [];
      for (const run of ['a', 'ab', 'a.', 'b', 'x']) {
        for (const end of ['!', '/', '\\\\', '\\n', '']) inputs.push(run.repeat(48 / run.length) + end, 'x' + run.repeat(48 / run.length) + end);
      }
      for (const pattern of patterns) {
        for (const options of ${JSON.stringify(optionSets)}) {
          const re = pm.makeRe(pattern, options);
          for (const input of inputs) re.test(input);
        }
      }
    `;
    execFileSync(process.execPath, ['-e', script], { timeout: 10000 });
  });
});
