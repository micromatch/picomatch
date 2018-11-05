'use strict';

require('mocha');
const path = require('path');
const isWindows = process.platform === 'win32';
const assert = require('assert');
const { scan } = require('..');
const base = (...args) => scan(...args).base;
const both = (...args) => {
  let { base, pattern } = scan(...args);
  return [base, pattern];
};

/**
 * Most of the unit tests in this file were from https://github.com/es128/glob-parent
 * and https://github.com/jonschlinkert/glob-base. Both libraries use a completely
 * different approach to separating the glob pattern from the "path" from picomatch,
 * and both libraries use path.dirname. Picomatch does not.
 */

describe('picomatch.scan', () => {
  it('should get the "base" and "glob" from a pattern', () => {
    assert.deepEqual(both('foo/bar'), ['foo/bar', '']);
    assert.deepEqual(both('foo/@bar'), ['foo/@bar', '']);
    assert.deepEqual(both('foo/@bar\\+'), ['foo/@bar+', '']);
    assert.deepEqual(both('foo/bar+'), ['foo', 'bar+']);
    assert.deepEqual(both('foo/bar*'), ['foo', 'bar*']);
  });

  it('should handle leading "./"', () => {
    assert.deepEqual(scan('./foo/bar/*.js'), {
      input: './foo/bar/*.js',
      pattern: '*.js',
      isGlob: true,
      parts: ['foo', 'bar'],
      base: 'foo/bar',
      prefix: './'
    });
  });

  it('should handle leading "!"', () => {
    assert.deepEqual(scan('!foo/bar/*.js'), {
      input: '!foo/bar/*.js',
      pattern: '*.js',
      isGlob: true,
      negated: true,
      parts: ['foo', 'bar'],
      base: 'foo/bar'
    });
  });

  it('should handle leading "./" when negated', () => {
    assert.deepEqual(scan('./!foo/bar/*.js'), {
      input: './!foo/bar/*.js',
      pattern: '*.js',
      isGlob: true,
      negated: true,
      parts: ['foo', 'bar'],
      base: 'foo/bar',
      prefix: './'
    });

    assert.deepEqual(scan('!./foo/bar/*.js'), {
      input: '!./foo/bar/*.js',
      pattern: '*.js',
      isGlob: true,
      negated: true,
      parts: ['foo', 'bar'],
      base: 'foo/bar',
      prefix: './'
    });
  });

  it('should strip glob magic to return base path', () => {
    assert.equal(base('.'), '.');
    assert.equal(base('.*'), '');
    assert.equal(base('/.*'), '/');
    assert.equal(base('/.*/'), '/');
    assert.equal(base('a/.*/b'), 'a');
    assert.equal(base('a*/.*/b'), '');
    assert.equal(base('*/a/b/c'), '');
    assert.equal(base('*'), '');
    assert.equal(base('*/'), '');
    assert.equal(base('*/*'), '');
    assert.equal(base('*/*/'), '');
    assert.equal(base('**'), '');
    assert.equal(base('**/'), '');
    assert.equal(base('**/*'), '');
    assert.equal(base('**/*/'), '');
    assert.equal(base('/*.js'), '/');
    assert.equal(base('*.js'), '');
    assert.equal(base('**/*.js'), '');
    assert.equal(base('{a,b}'), '');
    assert.equal(base('/{a,b}'), '/');
    assert.equal(base('/{a,b}/'), '/');
    assert.equal(base('(a|b)'), '');
    assert.equal(base('/(a|b)'), '/');
    assert.equal(base('./(a|b)'), '');
    assert.equal(base('a/(b c)'), 'a', 'parens must be escaped');
    assert.equal(base('a/\\+\\(b c)/foo'), 'a/+(b c)/foo', 'parens must be escaped');
    assert.equal(base('a/\\(b c)'), 'a/(b c)', 'parens must be escaped');
    assert.equal(base('a/(b c)/'), 'a', 'parens must be escaped');
    assert.equal(base('a/(b c)/d'), 'a', 'parens must be escaped');
    assert.equal(base('path/to/*.js'), 'path/to');
    assert.equal(base('/root/path/to/*.js'), '/root/path/to');
    assert.equal(base('chapter/foo [bar]/'), 'chapter');
    assert.equal(base('path/[a-z]'), 'path');
    assert.equal(base('[a-z]'), '');
    assert.equal(base('path/{to,from}'), 'path');
    assert.equal(base('path/(to|from)'), 'path');
    assert.equal(base('path/(foo bar)/subdir/foo.*'), 'path', 'parens must be escaped');
    assert.equal(base('path/!(to|from)'), 'path');
    assert.equal(base('path/?(to|from)'), 'path');
    assert.equal(base('path/+(to|from)'), 'path');
    assert.equal(base('path/*(to|from)'), 'path');
    assert.equal(base('path/@(to|from)'), 'path');
    assert.equal(base('path/!/foo'), 'path/!/foo');
    assert.equal(base('path/?/foo'), 'path', 'qmarks must be escaped');
    assert.equal(base('path/+/foo'), 'path', 'plus sign must be escaped');
    assert.equal(base('path/*/foo'), 'path');
    assert.equal(base('path/@/foo'), 'path/@/foo');
    assert.equal(base('path/!/foo/'), 'path/!/foo/');
    assert.equal(base('path/?/foo/'), 'path', 'qmarks must be escaped');
    assert.equal(base('path/+/foo/'), 'path', 'plus sign must be escaped');
    assert.equal(base('path/*/foo/'), 'path');
    assert.equal(base('path/@/foo/'), 'path/@/foo/');
    assert.equal(base('path/**/*'), 'path');
    assert.equal(base('path/**/subdir/foo.*'), 'path');
    assert.equal(base('path/subdir/**/foo.js'), 'path/subdir');
    assert.equal(base('path/!subdir/foo.js'), 'path/!subdir/foo.js');
    assert.equal(base('path/{foo,bar}/'), 'path');
  });

  it('should respect escaped characters', () => {
    assert.equal(base('path/\\*\\*/subdir/foo.*'), 'path/**/subdir');
    assert.equal(base('path/\\[\\*\\]/subdir/foo.*'), 'path/[*]/subdir');
    assert.equal(base('path/\\*(a|b)'), 'path');
    assert.equal(base('path/\\*(a|b)/subdir/foo.*'), 'path');
    assert.equal(base('path/\\*/(a|b)/subdir/foo.*'), 'path/*');
    assert.equal(base('path/\\*\\(a\\|b\\)/subdir/foo.*'), 'path/*(a|b)/subdir');
    assert.equal(base('path/\\[foo bar\\]/subdir/foo.*'), 'path/[foo bar]/subdir');
    assert.equal(base('path/\\[bar]/'), 'path/[bar]/');
    assert.equal(base('path/\\[bar]'), 'path/[bar]');
    assert.equal(base('[bar]'), '');
    assert.equal(base('[bar]/'), '');
    assert.equal(base('./\\[bar]'), '[bar]');
    assert.equal(base('\\[bar]/'), '[bar]/');
    assert.equal(base('\\[bar\\]/'), '[bar]/');
    assert.equal(base('[bar\\]/'), '[bar]/');
    assert.equal(base('path/foo \\[bar]/'), 'path/foo [bar]/');
    assert.equal(base('path/\\{foo,bar}/'), 'path/{foo,bar}/');
    assert.equal(base('\\{foo,bar}/'), '{foo,bar}/');
    assert.equal(base('\\{foo,bar\\}/'), '{foo,bar}/');
    assert.equal(base('{foo,bar\\}/'), '{foo,bar}/');

    if (!isWindows) {
      assert.equal(base('\\[bar]'), '[bar]');
      assert.equal(base('[bar\\]'), '[bar]');
      assert.equal(base('\\{foo,bar\\}'), '{foo,bar}');
      assert.equal(base('{foo,bar\\}'), '{foo,bar}');
    }
  });

  it('should respect glob enclosures with embedded separators', () => {
    assert.equal(base('path/{,/,bar/baz,qux}/'), 'path');
    assert.equal(base('path/\\{,/,bar/baz,qux}/'), 'path/{,/,bar/baz,qux}/');
    assert.equal(base('path/\\{,/,bar/baz,qux\\}/'), 'path/{,/,bar/baz,qux}/');
    assert.equal(base('/{,/,bar/baz,qux}/'), '/');
    assert.equal(base('/\\{,/,bar/baz,qux}/'), '/{,/,bar/baz,qux}/');
    assert.equal(base('{,/,bar/baz,qux}'), '');
    assert.equal(base('\\{,/,bar/baz,qux\\}'), '{,/,bar/baz,qux}');
    assert.equal(base('\\{,/,bar/baz,qux}/'), '{,/,bar/baz,qux}/');
    assert.equal(base('path/foo[a\\\/]/'), 'path');
    assert.equal(base('path/foo\\[a\\\/]/'), 'path/foo[a\/]/');
    assert.equal(base('foo[a\\\/]'), '');
    assert.equal(base('foo\\[a\\\/]'), 'foo[a\/]');
    assert.equal(base('path/(foo/bar|baz)'), 'path');
    assert.equal(base('path/(foo/bar|baz)/'), 'path');
    assert.equal(base('path/\\(foo/bar|baz)/'), 'path/(foo/bar|baz)/');
  });

  it('should handle escaped nested braces', () => {
    assert.equal(base('path/{../,./,{bar,/baz\\},qux\\}/'), 'path/{../,./,{bar,/baz},qux}/');
    assert.equal(base('path/{../,./,\\{bar,/baz},qux}/'), 'path');
    assert.equal(base('path/\\{../,./,\\{bar,/baz\\},qux\\}/'), 'path/{../,./,{bar,/baz},qux}/');
    assert.equal(base('{../,./,{bar,/baz\\},qux\\}/'), '{../,./,{bar,/baz},qux}/');
    assert.equal(base('{../,./,{bar,/baz\\},qux\\}'), '{../,./,{bar,/baz},qux}');
    assert.equal(base('path/{,/,bar/{baz,qux\\}}/'), 'path');
    assert.equal(base('path/{,/,bar/{baz,qux}\\}/'), 'path');
    assert.equal(base('path/\\{../,./,{bar,/baz},qux}/'), 'path');
  });

  it('should return full non-glob paths', () => {
    assert.equal(base('path'), 'path');
    assert.equal(base('path/foo'), 'path/foo');
    assert.equal(base('path/foo/'), 'path/foo/');
    assert.equal(base('path/foo/bar.js'), 'path/foo/bar.js');
  });
});

describe('glob2base test patterns', () => {
  it('should get a base name', () => {
    assert.equal(base('js/*.js'), 'js');
  });

  it('should get a base name from a nested glob', () => {
    assert.equal(base('js/**/test/*.js'), 'js');
  });

  it('should get a base name from a flat file', () => {
    assert.equal(base('js/test/wow.js'), 'js/test/wow.js'); // differs
  });

  it('should get a base name from character class pattern', () => {
    assert.equal(base('js/t[a-z]st}/*.js'), 'js');
  });

  it('should get a base name from brace , expansion', () => {
    assert.equal(base('js/{src,test}/*.js'), 'js');
  });

  it('should get a base name from brace .. expansion', () => {
    assert.equal(base('js/test{0..9}/*.js'), 'js');
  });

  it('should get a base name from extglob', () => {
    assert.equal(base('js/t+(wo|est)/*.js'), 'js');
  });

  it('should get a base name from a path with non-exglob parens', () => {
    assert.equal(base('js/t(wo|est)/*.js'), 'js');
    assert.equal(base('js/t/(wo|est)/*.js'), 'js/t');
  });

  it('should get a base name from a complex brace glob', () => {
    assert.equal(base('lib/{components,pages}/**/{test,another}/*.txt'), 'lib');
    assert.equal(base('js/test/**/{images,components}/*.js'), 'js/test');
    assert.equal(base('ooga/{booga,sooga}/**/dooga/{eooga,fooga}'), 'ooga');
  });
});

describe('technically invalid windows globs', () => {
  it('should support simple globs with backslash path separator', () => {
    if (process.platform === 'win32') {
      assert.equal(base('C:\\\\path\\\\*.js'), 'C:/path');
      assert.equal(base('C:\\\\path\\*.js'), 'C:/path*.js');
    } else {
      assert.equal(base('C:\\path\\*.js'), 'C:path*.js');
      assert.equal(base('C:\\\\path\\\\*.js'), '');
      assert.equal(base('C:\\\\path\\*.js'), 'C:\\\\path*.js');
    }
  });
});


describe('glob base >', () => {
  it('should parse globs', () => {
    assert.deepEqual(both('!foo'), ['foo', '']);
    assert.deepEqual(both('*'), ['', '*']);
    assert.deepEqual(both('**'), ['', '**']);
    assert.deepEqual(both('**/*.md'), ['', '**/*.md']);
    assert.deepEqual(both('**/*.min.js'), ['', '**/*.min.js']);
    assert.deepEqual(both('**/*foo.js'), ['', '**/*foo.js']);
    assert.deepEqual(both('**/.*'), ['', '**/.*']);
    assert.deepEqual(both('**/d'), ['', '**/d']);
    assert.deepEqual(both('*.*'), ['', '*.*']);
    assert.deepEqual(both('*.js'), ['', '*.js']);
    assert.deepEqual(both('*.md'), ['', '*.md']);
    assert.deepEqual(both('*.min.js'), ['', '*.min.js']);
    assert.deepEqual(both('*/*'), ['', '*/*']);
    assert.deepEqual(both('*/*/*/*'), ['', '*/*/*/*']);
    assert.deepEqual(both('*/*/*/e'), ['', '*/*/*/e']);
    assert.deepEqual(both('*/b/*/e'), ['', '*/b/*/e']);
    assert.deepEqual(both('*b'), ['', '*b']);
    assert.deepEqual(both('.*'), ['', '.*']);
    assert.deepEqual(both('*'), ['', '*']);
    assert.deepEqual(both('a/**/j/**/z/*.md'), ['a', '**/j/**/z/*.md']);
    assert.deepEqual(both('a/**/z/*.md'), ['a', '**/z/*.md']);
    assert.deepEqual(both('node_modules/*-glob/**/*.js'), ['node_modules', '*-glob/**/*.js']);
    assert.deepEqual(both('{a/b/{c,/foo.js}/e.f.g}'), ['', '{a/b/{c,/foo.js}/e.f.g}']);
    assert.deepEqual(both('.a*'), ['', '.a*']);
    assert.deepEqual(both('.b*'), ['', '.b*']);
    assert.deepEqual(both('/*'), ['/', '*']);
    assert.deepEqual(both('a/***'), ['a', '***']);
    assert.deepEqual(both('a/**/b/*.{foo,bar}'), ['a', '**/b/*.{foo,bar}']);
    assert.deepEqual(both('a/**/c/*'), ['a', '**/c/*']);
    assert.deepEqual(both('a/**/c/*.md'), ['a', '**/c/*.md']);
    assert.deepEqual(both('a/**/e'), ['a', '**/e']);
    assert.deepEqual(both('a/**/j/**/z/*.md'), ['a', '**/j/**/z/*.md']);
    assert.deepEqual(both('a/**/z/*.md'), ['a', '**/z/*.md']);
    assert.deepEqual(both('a/**c*'), ['a', '**c*']);
    assert.deepEqual(both('a/**c/*'), ['a', '**c/*']);
    assert.deepEqual(both('a/*/*/e'), ['a', '*/*/e']);
    assert.deepEqual(both('a/*/c/*.md'), ['a', '*/c/*.md']);
    assert.deepEqual(both('a/b/**/c{d,e}/**/xyz.md'), ['a/b', '**/c{d,e}/**/xyz.md']);
    assert.deepEqual(both('a/b/**/e'), ['a/b', '**/e']);
    assert.deepEqual(both('a/b/*.{foo,bar}'), ['a/b', '*.{foo,bar}']);
    assert.deepEqual(both('a/b/*/e'), ['a/b', '*/e']);
    assert.deepEqual(both('a/b/.git/'), ['a/b/.git/', '']);
    assert.deepEqual(both('a/b/.git/**'), ['a/b/.git', '**']);
    assert.deepEqual(both('a/b/.{foo,bar}'), ['a/b', '.{foo,bar}']);
    assert.deepEqual(both('a/b/c/*'), ['a/b/c', '*']);
    assert.deepEqual(both('a/b/c/**/*.min.js'), ['a/b/c', '**/*.min.js']);
    assert.deepEqual(both('a/b/c/*.md'), ['a/b/c', '*.md']);
    assert.deepEqual(both('a/b/c/.*.md'), ['a/b/c', '.*.md']);
    assert.deepEqual(both('a/b/{c,.gitignore,{a,b}}/{a,b}/abc.foo.js'), ['a/b', '{c,.gitignore,{a,b}}/{a,b}/abc.foo.js']);
    assert.deepEqual(both('a/b/{c,/.gitignore}'), ['a/b', '{c,/.gitignore}']);
    assert.deepEqual(both('a/b/{c,d}/'), ['a/b', '{c,d}/']);
    assert.deepEqual(both('a/b/{c,d}/e/f.g'), ['a/b', '{c,d}/e/f.g']);
    assert.deepEqual(both('b/*/*/*'), ['b', '*/*/*']);
  });

  it('should support file extensions', () => {
    assert.deepEqual(both('.md'), ['.md', '']);
  });

  it('should support negation pattern', () => {
    assert.deepEqual(both('!*.min.js'), ['', '*.min.js']);
    assert.deepEqual(both('!foo'), ['foo', '']);
    assert.deepEqual(both('a/b/c/!foo'), ['a/b/c/!foo', '']);
    assert.deepEqual(both('!foo/(a|b).min.js'), ['foo', '(a|b).min.js']);
    assert.deepEqual(both('!foo/[a-b].min.js'), ['foo', '[a-b].min.js']);
    assert.deepEqual(both('!foo/{a,b}.min.js'), ['foo', '{a,b}.min.js']);
  });

  it('should support extglobs', () => {
    assert.deepEqual(both('/a/b/!(a|b)/e.f.g/'), ['/a/b', '!(a|b)/e.f.g/']);
    assert.deepEqual(both('/a/b/@(a|b)/e.f.g/'), ['/a/b', '@(a|b)/e.f.g/']);
    assert.deepEqual(both('@(a|b)/e.f.g/'), ['', '@(a|b)/e.f.g/']);
  });

  it('should support braces: no path', () => {
    assert.deepEqual(both('/a/b/{c,/foo.js}/e.f.g/'), ['/a/b', '{c,/foo.js}/e.f.g/']);
    assert.deepEqual(both('{a/b/c.js,/a/b/{c,/foo.js}/e.f.g/}'), ['', '{a/b/c.js,/a/b/{c,/foo.js}/e.f.g/}']);
    assert.deepEqual(both('/a/b/{c,d}/'), ['/a/b', '{c,d}/']);
    assert.deepEqual(both('/a/b/{c,d}/*.js'), ['/a/b', '{c,d}/*.js']);
    assert.deepEqual(both('/a/b/{c,d}/*.min.js'), ['/a/b', '{c,d}/*.min.js']);
    assert.deepEqual(both('/a/b/{c,d}/e.f.g/'), ['/a/b', '{c,d}/e.f.g/']);
    assert.deepEqual(both('{.,*}'), ['', '{.,*}']);
  });

  it('should support braces in filename', () => {
    assert.deepEqual(both('a/b/.{c,.gitignore}'), ['a/b', '.{c,.gitignore}']);
    assert.deepEqual(both('a/b/.{c,/.gitignore}'), ['a/b', '.{c,/.gitignore}']);
    assert.deepEqual(both('a/b/.{foo,bar}'), ['a/b', '.{foo,bar}']);
    assert.deepEqual(both('a/b/{c,.gitignore}'), ['a/b', '{c,.gitignore}']);
    assert.deepEqual(both('a/b/{c,/.gitignore}'), ['a/b', '{c,/.gitignore}']);
    assert.deepEqual(both('a/b/{c,/gitignore}'), ['a/b', '{c,/gitignore}']);
    assert.deepEqual(both('a/b/{c,d}'), ['a/b', '{c,d}']);
  });

  it('should support braces in dirname', () => {
    assert.deepEqual(both('a/b/{c,./d}/e/f.g'), ['a/b', '{c,./d}/e/f.g']);
    assert.deepEqual(both('a/b/{c,./d}/e/f.min.g'), ['a/b', '{c,./d}/e/f.min.g']);
    assert.deepEqual(both('a/b/{c,.gitignore,{a,./b}}/{a,b}/abc.foo.js'), ['a/b', '{c,.gitignore,{a,./b}}/{a,b}/abc.foo.js']);
    assert.deepEqual(both('a/b/{c,.gitignore,{a,b}}/{a,b}/*.foo.js'), ['a/b', '{c,.gitignore,{a,b}}/{a,b}/*.foo.js']);
    assert.deepEqual(both('a/b/{c,.gitignore,{a,b}}/{a,b}/abc.foo.js'), ['a/b', '{c,.gitignore,{a,b}}/{a,b}/abc.foo.js']);
    assert.deepEqual(both('a/b/{c,/d}/e/f.g'), ['a/b', '{c,/d}/e/f.g']);
    assert.deepEqual(both('a/b/{c,/d}/e/f.min.g'), ['a/b', '{c,/d}/e/f.min.g']);
    assert.deepEqual(both('a/b/{c,d}/'), ['a/b', '{c,d}/']);
    assert.deepEqual(both('a/b/{c,d}/*.js'), ['a/b', '{c,d}/*.js']);
    assert.deepEqual(both('a/b/{c,d}/*.min.js'), ['a/b', '{c,d}/*.min.js']);
    assert.deepEqual(both('a/b/{c,d}/e.f.g/'), ['a/b', '{c,d}/e.f.g/']);
    assert.deepEqual(both('a/b/{c,d}/e/f.g'), ['a/b', '{c,d}/e/f.g']);
    assert.deepEqual(both('a/b/{c,d}/e/f.min.g'), ['a/b', '{c,d}/e/f.min.g']);
    assert.deepEqual(both('foo/{a,b}.min.js'), ['foo', '{a,b}.min.js']);
  });

  it('should support regex character classes', () => {
    assert.deepEqual(both('[a-c]b*'), ['', '[a-c]b*']);
    assert.deepEqual(both('[a-j]*[^c]'), ['', '[a-j]*[^c]']);
    assert.deepEqual(both('[a-j]*[^c]b/c'), ['', '[a-j]*[^c]b/c']);
    assert.deepEqual(both('[a-j]*[^c]bc'), ['', '[a-j]*[^c]bc']);
    assert.deepEqual(both('[ab][ab]'), ['', '[ab][ab]']);
    assert.deepEqual(both('foo/[a-b].min.js'), ['foo', '[a-b].min.js']);
  });

  it('should support qmarks', () => {
    assert.deepEqual(both('?'), ['', '?']);
    assert.deepEqual(both('?/?'), ['', '?/?']);
    assert.deepEqual(both('??'), ['', '??']);
    assert.deepEqual(both('???'), ['', '???']);
    assert.deepEqual(both('?a'), ['', '?a']);
    assert.deepEqual(both('?b'), ['', '?b']);
    assert.deepEqual(both('a?b'), ['', 'a?b']);
    assert.deepEqual(both('a/?/c.js'), ['a', '?/c.js']);
    assert.deepEqual(both('a/?/c.md'), ['a', '?/c.md']);
    assert.deepEqual(both('a/?/c/?/*/f.js'), ['a', '?/c/?/*/f.js']);
    assert.deepEqual(both('a/?/c/?/*/f.md'), ['a', '?/c/?/*/f.md']);
    assert.deepEqual(both('a/?/c/?/e.js'), ['a', '?/c/?/e.js']);
    assert.deepEqual(both('a/?/c/?/e.md'), ['a', '?/c/?/e.md']);
    assert.deepEqual(both('a/?/c/???/e.js'), ['a', '?/c/???/e.js']);
    assert.deepEqual(both('a/?/c/???/e.md'), ['a', '?/c/???/e.md']);
    assert.deepEqual(both('a/??/c.js'), ['a', '??/c.js']);
    assert.deepEqual(both('a/??/c.md'), ['a', '??/c.md']);
    assert.deepEqual(both('a/???/c.js'), ['a', '???/c.js']);
    assert.deepEqual(both('a/???/c.md'), ['a', '???/c.md']);
    assert.deepEqual(both('a/????/c.js'), ['a', '????/c.js']);
  });

  it('should support non-glob patterns', () => {
    assert.deepEqual(both(''), ['', '']);
    assert.deepEqual(both('.'), ['.', '']);
    assert.deepEqual(both('a'), ['a', '']);
    assert.deepEqual(both('.a'), ['.a', '']);
    assert.deepEqual(both('/a'), ['/a', '']);
    assert.deepEqual(both('a/'), ['a/', '']);
    assert.deepEqual(both('/a/'), ['/a/', '']);
    assert.deepEqual(both('/a/b/c'), ['/a/b/c', '']);
    assert.deepEqual(both('/a/b/c/'), ['/a/b/c/', '']);
    assert.deepEqual(both('a/b/c/'), ['a/b/c/', '']);
    assert.deepEqual(both('a.min.js'), ['a.min.js', '']);
    assert.deepEqual(both('a/.x.md'), ['a/.x.md', '']);
    assert.deepEqual(both('a/b/.gitignore'), ['a/b/.gitignore', '']);
    assert.deepEqual(both('a/b/c/d.md'), ['a/b/c/d.md', '']);
    assert.deepEqual(both('a/b/c/d.e.f/g.min.js'), ['a/b/c/d.e.f/g.min.js', '']);
    assert.deepEqual(both('a/b/.git'), ['a/b/.git', '']);
    assert.deepEqual(both('a/b/.git/'), ['a/b/.git/', '']);
    assert.deepEqual(both('a/b/c'), ['a/b/c', '']);
    assert.deepEqual(both('a/b/c.d/e.md'), ['a/b/c.d/e.md', '']);
    assert.deepEqual(both('a/b/c.md'), ['a/b/c.md', '']);
    assert.deepEqual(both('a/b/c.min.js'), ['a/b/c.min.js', '']);
    assert.deepEqual(both('a/b/git/'), ['a/b/git/', '']);
    assert.deepEqual(both('aa'), ['aa', '']);
    assert.deepEqual(both('ab'), ['ab', '']);
    assert.deepEqual(both('bb'), ['bb', '']);
    assert.deepEqual(both('c.md'), ['c.md', '']);
    assert.deepEqual(both('foo'), ['foo', '']);
  });
});
