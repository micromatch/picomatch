'use strict';

const assert = require('assert');
const { isMatch } = require('..');

describe('issue-related tests', () => {
  it('should match with braces (see picomatch/issues#8)', () => {
    assert(isMatch('directory/.test.txt', '{file.txt,directory/**/*}', { dot: true }));
    assert(isMatch('directory/test.txt', '{file.txt,directory/**/*}', { dot: true }));
    assert(!isMatch('directory/.test.txt', '{file.txt,directory/**/*}'));
    assert(isMatch('directory/test.txt', '{file.txt,directory/**/*}'));
  });

  it('should match Japanese characters (see micromatch/issues#127)', () => {
    assert(isMatch('フォルダ/aaa.js', 'フ*/**/*'));
    assert(isMatch('フォルダ/aaa.js', 'フォ*/**/*'));
    assert(isMatch('フォルダ/aaa.js', 'フォル*/**/*'));
    assert(isMatch('フォルダ/aaa.js', 'フ*ル*/**/*'));
    assert(isMatch('フォルダ/aaa.js', 'フォルダ/**/*'));
  });

  it('micromatch issue#15', () => {
    assert(isMatch('a/b-c/d/e/z.js', 'a/b-*/**/z.js'));
    assert(isMatch('z.js', 'z*'));
    assert(isMatch('z.js', '**/z*'));
    assert(isMatch('z.js', '**/z*.js'));
    assert(isMatch('z.js', '**/*.js'));
    assert(isMatch('foo', '**/foo'));
  });

  it('micromatch issue#23', () => {
    assert(!isMatch('zzjs', 'z*.js'));
    assert(!isMatch('zzjs', '*z.js'));
  });

  it('micromatch issue#24', () => {
    assert(!isMatch('a/b/c/d/', 'a/b/**/f'));
    assert(isMatch('a', 'a/**'));
    assert(isMatch('a', '**'));
    assert(isMatch('a/', '**'));
    assert(isMatch('a/b/c/d', '**'));
    assert(isMatch('a/b/c/d/', '**'));
    assert(isMatch('a/b/c/d/', '**/**'));
    assert(isMatch('a/b/c/d/', '**/b/**'));
    assert(isMatch('a/b/c/d/', 'a/b/**'));
    assert(isMatch('a/b/c/d/', 'a/b/**/'));
    assert(isMatch('a/b/c/d/e.f', 'a/b/**/**/*.*'));
    assert(isMatch('a/b/c/d/e.f', 'a/b/**/*.*'));
    assert(isMatch('a/b/c/d/g/e.f', 'a/b/**/d/**/*.*'));
    assert(isMatch('a/b/c/d/g/g/e.f', 'a/b/**/d/**/*.*'));
  });

  it('micromatch issue#58 - only match nested dirs when `**` is the only thing in a segment', () => {
    assert(!isMatch('a/b/c', 'a/b**'));
    assert(!isMatch('a/c/b', 'a/**b'));
  });

  it('micromatch issue#79', () => {
    assert(isMatch('a/foo.js', '**/foo.js'));
    assert(isMatch('foo.js', '**/foo.js'));
    assert(isMatch('a/foo.js', '**/foo.js', { dot: true }));
    assert(isMatch('foo.js', '**/foo.js', { dot: true }));
  });

  it('picomatch issue#142 - should match trailing globstars in parens', () => {
    assert(isMatch('test/utils', 'test(/utils/**)'));
    assert(isMatch('test/utils', 'test?(/utils/**)'));
    assert(isMatch('test/utils/file', 'test(/utils/**)'));
    assert(isMatch('test/utils/file', 'test?(/utils/**)'));
    assert(!isMatch('test', 'test(/utils/**)'));
    assert(isMatch('test', 'test?(/utils/**)'));
    assert(!isMatch('test/utils', 'test(/utils/**)', { strictSlashes: true }));
    assert(!isMatch('test/utils', 'test(/utils/**)/file'));
  });

  it('should not treat an unescaped character class as a literal filename (picomatch/issues#71)', () => {
    // `[1-5]` is a class of one digit, not the five-character name `[1-5]`.
    // `isMatch` used to short-circuit when the input string equalled the
    // pattern, so this returned true even though makeRe('[1-5]') does not match.
    assert(!isMatch('[1-5]', '[1-5]'));
    assert(!isMatch('[0-9]', '[0-9]'));
    assert(!isMatch('[a-c]', '[a-c]'));
    assert(isMatch('1', '[1-5]'));
    assert(isMatch('3', '[1-5]'));
    assert(!isMatch('6', '[1-5]'));
    assert(isMatch('[1-5]', '\\[1-5\\]'));
    assert(isMatch('[1-5]', '[1-5]', { literalBrackets: true }));
    assert(isMatch('[1-5]', '[1-5]', { nobracket: true }));
  });

  it('should treat a leading `**` followed by a literal as a single star (picomatch/issues#99)', () => {
    // `**` only acts as a globstar when it is the sole content of a path segment.
    // When it is adjacent to other characters in the same segment (here `.thing.js`),
    // it must behave like a single star and not match across path separators.
    assert(!isMatch('somepath/test.thing.js', '**.thing.js'));
    assert(!isMatch('a/b/c.js', '**.js'));
    // these sibling cases already behaved correctly and must keep working
    assert(!isMatch('somepath/test.dash-thing.js', '**.dash-thing.js'));
    assert(isMatch('test.thing.js', '**.thing.js'));
    assert(isMatch('somepath/test.thing.js', '**/*.thing.js'));
  });
});
