'use strict';

const assert = require('assert');
const { isMatch, makeRe } = require('..');

describe('options.maxExtglobRecursion', () => {
  it('should literalize risky repeated extglobs by default', () => {
    assert.strictEqual(
      makeRe('+(a|aa)').source,
      '^(?:\\+\\(a\\|aa\\))$'
    );
    assert.strictEqual(
      makeRe('+(*|?)').source,
      '^(?:\\+\\(\\*\\|\\?\\))$'
    );
    assert.strictEqual(
      makeRe('+(+(a))').source,
      '^(?:\\+\\(\\+\\(a\\)\\))$'
    );
    assert.strictEqual(
      makeRe('*(+(a))').source,
      '^(?:\\*\\(\\+\\(a\\)\\))$'
    );

    assert(!isMatch('a'.repeat(20) + 'b', '+(a|aa)'));
    assert(!isMatch('a'.repeat(12) + '!', '+(+(a))'));
  });

  it('should preserve non-risky extglobs by default', () => {
    assert(isMatch('abcabc', '+(abc)'));
    assert(isMatch('foobar', '*(foo|bar)'));
    assert(isMatch('a', '(a|@(b|c)|d)'));
    assert(isMatch('fffooo', '*(*(f)*(o))'));
    assert(isMatch('abc', '+(*)c'));
  });

  it('should allow limited nested repeated extglobs when configured', () => {
    assert.strictEqual(
      makeRe('+(+(a))', { maxExtglobRecursion: 1 }).source,
      '^(?:(?=.)(?:(?:a)+)+)$'
    );
    assert.strictEqual(
      makeRe('*(+(a))', { maxExtglobRecursion: 1 }).source,
      '^(?:(?=.)(?:(?:a)+)*)$'
    );

    assert(isMatch('aaa', '+(+(a))', { maxExtglobRecursion: 1 }));
    assert(isMatch('aaa', '*(+(a))', { maxExtglobRecursion: 1 }));
  });

  it('should still block ambiguous repeated alternation when recursion is allowed', () => {
    assert.strictEqual(
      makeRe('+(a|aa)', { maxExtglobRecursion: 1 }).source,
      '^(?:\\+\\(a\\|aa\\))$'
    );
    assert.strictEqual(
      makeRe('+(*|?)', { maxExtglobRecursion: 1 }).source,
      '^(?:\\+\\(\\*\\|\\?\\))$'
    );
  });

  it('should rewrite risky repeated extglobs embedded in larger patterns', () => {
    assert.strictEqual(
      makeRe('foo/+(a|aa)/bar').source,
      '^(?:foo\\/\\+\\(a\\|aa\\)\\/bar)$'
    );
    assert.strictEqual(
      makeRe('x+(a|aa)y').source,
      '^(?:x\\+\\(a\\|aa\\)y)$'
    );

    assert(isMatch('foo/+(a|aa)/bar', 'foo/+(a|aa)/bar'));
    assert(!isMatch('foo/aa/bar', 'foo/+(a|aa)/bar'));
    assert(isMatch('x+(a|aa)y', 'x+(a|aa)y'));
    assert(!isMatch('xaay', 'x+(a|aa)y'));
  });

  it('should rewrite star-only repeated extglobs embedded in larger patterns', () => {
    assert.strictEqual(
      makeRe('pre*(*(f)*(o))post').source,
      '^(?:pre[fo]*post)$'
    );

    assert(isMatch('prefoopost', 'pre*(*(f)*(o))post'));
  });

  it('should rewrite star-only repeated extglobs', () => {
    assert.strictEqual(
      makeRe('*(*(f))').source,
      '^(?:(?=.)f*)$'
    );

    assert(isMatch('fff', '*(*(f))'));
  });

  it('should rewrite multi-branch star-only repeated extglobs without dropping branches', () => {
    // Regression: the risky-extglob rewrite previously emitted only the first
    // branch, so `+(*(a)|*(b))` collapsed to `a*` and silently stopped matching
    // any string containing `b`. The safe rewrite must preserve every branch.
    assert.strictEqual(
      makeRe('+(*(a)|*(b))').source,
      '^(?:(?=.)[ab]*)$'
    );
    assert.strictEqual(
      makeRe('*(*(a)|c)').source,
      '^(?:(?=.)[ac]*)$'
    );

    for (const str of ['a', 'b', 'ab', 'ba', 'aabb']) {
      assert(isMatch(str, '+(*(a)|*(b))'), `expected to match ${str}`);
    }
    assert(!isMatch('c', '+(*(a)|*(b))'));

    for (const str of ['c', 'a', 'aca', 'cac']) {
      assert(isMatch(str, '*(*(a)|c)'), `expected to match ${str}`);
    }
    assert(!isMatch('d', '*(*(a)|c)'));
  });

  it('should preserve capture behavior for rewritten repeated extglobs', () => {
    const embedded = makeRe('foo/+(a|aa)/bar', { capture: true });
    assert.strictEqual(embedded.source, '^(?:foo\\/\\+\\(a\\|aa\\)\\/bar)$');
    assert.deepStrictEqual(
      Array.from(embedded.exec('foo/+(a|aa)/bar')),
      ['foo/+(a|aa)/bar']
    );

    const simplified = makeRe('*(*(f)*(o))', { capture: true });
    assert.strictEqual(simplified.source, '^(?:(?=.)([fo]*))$');
    assert.deepStrictEqual(
      Array.from(simplified.exec('fffooo')),
      ['fffooo', 'fffooo']
    );
  });

  it('should only rewrite the risky repeated extglob when adjacent extglobs are present', () => {
    assert.strictEqual(
      makeRe('+(a|aa)@(x)').source,
      '^(?:\\+\\(a\\|aa\\)(x))$'
    );

    assert(isMatch('+(a|aa)x', '+(a|aa)@(x)'));
    assert(!isMatch('aaax', '+(a|aa)@(x)'));
  });
  it('should disable the safeguard when maxExtglobRecursion is false', () => {
    assert(
      /\(\?:a\|aa\)\+/.test(
        makeRe('+(a|aa)', { maxExtglobRecursion: false }).source
      )
    );
    assert(
      /\(\?:\(\?:a\)\+\)\+/.test(
        makeRe('+(+(a))', { maxExtglobRecursion: false }).source
      )
    );
  });

  describe('repeated extglobs with a top-level star', () => {
    it('should drop the repeat when a single starred branch absorbs it', () => {
      assert.strictEqual(makeRe('+(*)').source, '^(?:(?=.)(?:[^/]*?))$');
      assert.strictEqual(makeRe('*(*)').source, '^(?:(?=.)(?:[^/]*?)?)$');
      assert.strictEqual(makeRe('+(*a)').source, '^(?:(?=.)(?:[^/]*?a))$');
      assert.strictEqual(makeRe('*(*a)').source, '^(?:(?=.)(?:[^/]*?a)?)$');
      assert.strictEqual(makeRe('x*(*a)y').source, '^(?:x(?:[^/]*?a)?y)$');
    });

    it('should repeat only the star-free branches when the starred ones absorb the rest', () => {
      assert.strictEqual(makeRe('+(*a|b)').source, '^(?:(?=.)(?:[^/]*?a|b)(?:b)*)$');
      assert.strictEqual(makeRe('*(a*|b)').source, '^(?:(?=.)(?:b)*(?:a[^/]*?)?)$');
    });

    it('should literalize starred branches that cannot absorb the repeat', () => {
      assert.strictEqual(makeRe('+(a*|*b)').source, '^(?:\\+\\(a\\*\\|\\*b\\))$');
      assert.strictEqual(makeRe('+(a*b|a)').source, '^(?:\\+\\(a\\*b\\|a\\))$');
      assert.strictEqual(makeRe('+(a/*)').source, '^(?:\\+\\(a\\/\\*\\))$');
    });

    it('should match the same strings as before', () => {
      assert(isMatch('abc', '+(*)'));
      assert(isMatch('xa', '+(*a)'));
      assert(isMatch('xaya', '+(*a)'));
      assert(!isMatch('xab', '+(*a)'));
      assert(!isMatch('', '*(*a)'));
      assert(isMatch('ab', '+(*a|b)'));
      assert(isMatch('xabb', '+(*a|b)'));
      assert(!isMatch('xb', '+(*a|b)'));
      assert(isMatch('ax', '*(a*|b)'));
      assert(isMatch('bbax', '*(a*|b)'));
      assert(!isMatch('bx', '*(a*|b)'));
      assert(isMatch('x.js', '+(*.js|*.ts)'));
      assert(!isMatch('a/b', '+(*)'));
    });

    it('should not backtrack catastrophically', () => {
      const input = 'a'.repeat(5000) + '/';
      for (const pattern of ['+(*)', '*(*)', '+(*a)', '*(*a)', '+(*a*)', '+(*a|b)', '*(a*|b)']) {
        const start = Date.now();
        assert(!isMatch(input, pattern));
        assert(Date.now() - start < 1000, pattern);
      }
    });

    it('should not backtrack catastrophically on a star inside a nested group', () => {
      const input = 'a'.repeat(5000) + '/';
      const patterns = [
        '+(@(*))', '*(@(*))', '+(@(*a))', '+(@(*)|b)', '+(!(*))', '+(!(a))',
        '*(!(a)|b)', '+(@(@(*)))', '+(!(@(*a)))', '+(*(a)a)', '+(@(*(a)))',
        '+(@(+(*(a))))'
      ];
      for (const pattern of patterns) {
        const start = Date.now();
        isMatch(input, pattern);
        assert(Date.now() - start < 1000, pattern);
      }
    });

    it('should drop the repeat when a nested star or negation absorbs it', () => {
      assert.strictEqual(makeRe('+(@(*))').source, '^(?:(?=.)(?:([^/]*?)))$');
      assert.strictEqual(makeRe('*(@(*))').source, '^(?:(?=.)(?:([^/]*?))?)$');
      assert.strictEqual(makeRe('+(@(*a))').source, '^(?:(?=.)(?:([^/]*?a)))$');
      assert.strictEqual(makeRe('+(@(*)|b)').source, '^(?:(?=.)(?:b)*(?:([^/]*?)|b))$');
      assert.strictEqual(makeRe('+(!(a))').source, '^(?:(?=.)(?:(?:(?!(?:a)$))[^/]*?))$');
    });

    it('should literalize a nested star run whose copies can overlap', () => {
      assert.strictEqual(makeRe('+(*(a)a)').source, '^(?:\\+\\(\\*\\(a\\)a\\))$');
      assert.strictEqual(makeRe('+(@(*(a)a))').source, '^(?:\\+\\(@\\(\\*\\(a\\)a\\)\\))$');
      assert.strictEqual(makeRe('+(*(a)b)').source, '^(?:(?=.)(?:(?:a)*b)+)$');
    });

    it('should match the same strings as before with nested groups', () => {
      assert(isMatch('abc', '+(@(*))'));
      assert(isMatch('xa', '+(@(*a))'));
      assert(!isMatch('xab', '+(@(*a))'));
      assert(isMatch('bbb', '+(@(*)|b)'));
      assert(isMatch('fff', '+(!(f))'));
      assert(!isMatch('f', '+(!(f))'));
      assert(isMatch('bar', '*(!(foo))'));
      assert(!isMatch('foo', '*(!(foo))'));
      assert(isMatch('aaab', '+(*(a)b)'));
    });

    it('should not backtrack catastrophically on a hidden repeat or an ambiguous alternation', () => {
      const inputs = ['a'.repeat(90) + '!', 'b'.repeat(90) + '!', 'aba'.repeat(30) + '!', 'abc'.repeat(30) + '!'];
      const patterns = [
        '+(@(+([ab])))', '+([ab]|b)', '*(@([ab])|b)', '+(a|b|ab)', '*(@([ab]|ab[ab])|b)',
        '+(*(ab)c|abc)', '+(@(*(ab?)[ab])|b)', '+(a*([ab]))', '*(ab*(ab))'
      ];
      for (const pattern of patterns) {
        const start = Date.now();
        for (const input of inputs) isMatch(input, pattern);
        assert(Date.now() - start < 1000, pattern);
      }
    });

    it('should treat a whole-branch @() like its own branches', () => {
      assert.strictEqual(makeRe('+(@(*(a)))').source, makeRe('+(*(a))').source);
      assert.strictEqual(makeRe('+(@(a|b)|c)').source, '^(?:(?=.)(?:(a|b)|c)+)$');
    });

    it('should literalize a repeat hidden in @() and an ambiguous alternation', () => {
      assert.strictEqual(makeRe('+(@(+([ab])))').source, makeRe('+(@(+([ab])))', { maxExtglobRecursion: 0 }).source);
      assert.strictEqual(makeRe('+([ab]|b)').source, '^(?:\\+\\(\\[ab\\]\\|b\\))$');
      assert.strictEqual(makeRe('+(a|b|ab)').source, '^(?:\\+\\(a\\|b\\|ab\\))$');
      assert.strictEqual(makeRe('*(b|B)', { nocase: true }).source, '^(?:\\*\\(b\\|B\\))$');
      assert.strictEqual(makeRe('+(*(ab)c|abc)').source, '^(?:\\+\\(\\*\\(ab\\)c\\|abc\\))$');
    });

    it('should leave unambiguous alternations alone', () => {
      assert.strictEqual(makeRe('+(js|ts|jsx)').source, '^(?:(?=.)(?:js|ts|jsx)+)$');
      assert.strictEqual(makeRe('+(a|ab)').source, '^(?:(?=.)(?:a|ab)+)$');
      assert.strictEqual(makeRe('*(b|B)').source, '^(?:(?=.)(?:b|B)*)$');
      assert(isMatch('jstsjsx', '+(js|ts|jsx)'));
      assert.strictEqual(makeRe('+(*(a)b|c)').source, '^(?:(?=.)(?:(?:a)*b|c)+)$');
      assert.strictEqual(makeRe('*(f*(o))').source, '^(?:(?=.)(?:f(?:o)*)*)$');
    });

    it('should not backtrack catastrophically on syntax the check does not model', () => {
      const inputs = ['a'.repeat(90) + '!', 'b'.repeat(90) + '!', 'ab'.repeat(45) + '!'];
      const patterns = [
        '+({a,a})', '+({a,b}|b)', '+(a|a{b,})', '+(a|"a")', '+(a|[[:alpha:]])', '+({a..b}|a)',
        '+([a-b]{,a})', '+(\\w|a)', '+(\\x61|a)', '+(a+)', '+(a+|b)', '+((a|a))', '+((a)|a)'
      ];
      for (const pattern of patterns) {
        const start = Date.now();
        for (const input of inputs) isMatch(input, pattern);
        assert(Date.now() - start < 1000, pattern);
      }
    });

    it('should literalize a branch with a brace, quote, regex escape or bare plus', () => {
      assert.strictEqual(makeRe('+({a,b})').source, '^(?:\\+\\(\\{a,b\\}\\))$');
      assert.strictEqual(makeRe('+(a|"a")').source, '^(?:\\+\\(a\\|"a"\\))$');
      assert.strictEqual(makeRe('+(a+)').source, '^(?:\\+\\(a\\+\\))$');
      assert(isMatch('+({a,a})', '+({a,a})'));
      assert(isMatch('+(a|"a")', '+(a|"a")'));
    });

    it('should leave groups, slashes, escaped symbols and plain brackets alone', () => {
      assert(isMatch('foo', '*((foo))'));
      assert(isMatch('b/a', '*(b/a)'));
      assert(isMatch('*a*', '+(\\*|a)'));
      assert(isMatch('a.c', '+([[:alpha:].])'));
      assert(isMatch('abcx', '+(a|b[)*'));
      assert.strictEqual(makeRe('+([ab]|c)').source, '^(?:(?=.)(?:(?:\\[ab\\]|[ab])|c)+)$');
    });

    it('should not let a plus after a glob group quantify a risky group', () => {
      const inputs = ['b'.repeat(90) + '!', 'a'.repeat(90) + '!', 'a'.repeat(90) + '/'];
      const patterns = ['!(a)+(?(c))', '?(!(a)+(?(b)|c))', '!(a)+', '@(a|a)+', '{a,a}+', '@(!(a)+)'];
      for (const pattern of patterns) {
        const start = Date.now();
        for (const input of inputs) isMatch(input, pattern);
        assert(Date.now() - start < 1000, pattern);
      }
      assert.strictEqual(makeRe('!(a)+').source, '^(?:(?=.)(?:(?!(?:a))[^/]*?)\\+)$');
      assert(isMatch('b+', '!(a)+'));
      assert(isMatch('a+', '{a,a}+'));
      assert(isMatch('a+', '@(a|a)+'));
    });

    it('should keep the quantifier after a safe group and a regex group', () => {
      assert(isMatch('jsts', '@(js|ts)+'));
      assert(isMatch('abcab', '{ab,c}+'));
      assert(isMatch('abac', '(a|b)+c'));
      assert.strictEqual(makeRe('(a|a)+b').source, '^(?:(a|a)+b)$');
    });

    it('should keep the repeat when maxExtglobRecursion is false', () => {
      assert.strictEqual(
        makeRe('+(*a)', { maxExtglobRecursion: false }).source,
        '^(?:(?=.)(?:[^/]*?a)+)$'
      );
      assert.strictEqual(
        makeRe('+(*)', { maxExtglobRecursion: false }).source,
        '^(?:(?=.)(?:[^/]*?)+)$'
      );
    });

    it('should keep spaces when flattening @() alternatives', () => {
      assert(isMatch(' red', '+(@(red| red))'));
      assert(isMatch('red red', '+(@(red| red))'));
    });

    it('should rewrite the branches of a flattened @() group', () => {
      assert(isMatch('txt', '+(@(log*|txt))'));
      assert(isMatch('txtlogx', '+(@(log*|txt))'));
    });

    it('should build the rewrite from the current star tokens', () => {
      assert(!isMatch('dir/log', '+(***log)'));
      assert(isMatch('xlog', '+(***log)'));
    });

    it('should keep the capture layout of a rewritten repeat', () => {
      const exec = (pattern, input) => [...makeRe(pattern, { capture: true }).exec(input)];
      assert.deepStrictEqual(exec('+(x*|[ab])', 'xyz'), ['xyz', 'xyz', 'yz', undefined]);
      assert.deepStrictEqual(exec('+(x*|[ab])', 'ab'), ['ab', 'ab', undefined, 'b']);
      assert.deepStrictEqual(exec('+(*a|b)', 'xab'), ['xab', 'xab', undefined]);
      assert.deepStrictEqual(exec('+(*a|b)', 'xa'), ['xa', 'xa', 'x']);
    });

    it('should not read a regex quantifier as a glob wildcard', () => {
      const opts = { regex: true, literalBrackets: false };
      assert(!makeRe('+([a]*|b)', opts).test('aba'));
      assert(makeRe('+([a]*|b)', opts).test('+([a]*|b)'));
      assert(makeRe('+([a]|b)', opts).test('aba'));
    });

    it('should match its own text, backslashes included, when literal', () => {
      assert(makeRe('+(log\\w|cache)').test('+(log\\w|cache)'));
      assert(!makeRe('+(log\\w|cache)').test('+(logw|cache)'));
    });

    it('should bound the work on a wide alternation', () => {
      const alts = Array.from({ length: 4096 }, (_, i) => `a${i.toString(36)}`).join('|');
      const start = Date.now();
      makeRe(`+(@(${alts})x|y)`, { maxExtglobRecursion: 0 });
      assert(Date.now() - start < 2000);
    });

    it('should keep a plus after a captured star literal', () => {
      assert(!/\(\[\^\/\]\*\?\)\+/.test(makeRe('@(a*+(?(x)))', { capture: true }).source));
      assert(makeRe('+(a)*', { regex: true }).test('aab'));
    });
  });
});
