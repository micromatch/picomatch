'use strict';

const { Suite } = require('benchmark');
const { cyan, red, green } = require('ansi-colors');
const argv = require('minimist')(process.argv.slice(2));
const mm = require('../node_modules/minimatch');
const pm = require('..');

/**
 * Setup
 */

const cycle = (e, newline) => {
  process.stdout.write(`\u001b[G  ${e.target}${newline ? `\n` : ''}`);
};

const bench = (name, options) => {
  const config = { name, ...options };
  const suite = new Suite(config);
  const add = suite.add.bind(suite);
  suite.on('error', console.error);

  if (argv.run && !new RegExp(argv.run).test(name)) {
    suite.add = () => suite;
    return suite;
  }

  console.log(`\n# ${config.name}`);
  suite.add = (key, fn, opts) => {
    if (typeof fn !== 'function') opts = fn;

    add(key, {
      onCycle: e => cycle(e),
      onComplete: e => cycle(e, true),
      fn,
      ...opts
    });
    return suite;
  };

  return suite;
};

bench(red('.makeRe') + ' star')
  .add('picomatch', () => pm.makeRe('*'))
  // .add('minimatch', () => mm.makeRe('*'))
  .run();
bench(cyan('match') + ' star')
  .add('picomatch', () => pm('*')('abc.txt'))
  // .add('minimatch', () => mm('abc.txt', '*'))
  .run();

bench(red('.makeRe') + ' star; dot=true')
  .add('picomatch', () => pm.makeRe('*', { dot: true }))
  // .add('minimatch', () => mm.makeRe('*', { dot: true }))
  .run();
bench(cyan('match') + ' star; dot=true')
  .add('picomatch', () => pm('*', { dot: true })('.abc.txt'))
  // .add('minimatch', () => mm('.abc.txt', '*', { dot: true }))
  .run();

bench(red('.makeRe') + ' globstar')
  .add('picomatch', () => pm.makeRe('**'))
  // .add('minimatch', () => mm.makeRe('**'))
  .run();
bench(cyan('match') + ' globstar')
  .add('picomatch', () => pm('**')('abc.txt'))
  // .add('minimatch', () => mm('abc.txt', '**'))
  .run();

bench(red('.makeRe') + ' globstars')
  .add('picomatch', () => pm.makeRe('**/**/**'))
  // .add('minimatch', () => mm.makeRe('**/**/**'))
  .run();
bench(cyan('match') + ' globstars')
  .add('picomatch', () => pm('**/**/**')('foo/abc.txt'))
  // .add('minimatch', () => mm('foo/abc.txt', '**/**/**'))
  .run();

bench(red('.makeRe') + ' with leading star')
  .add('picomatch', () => pm.makeRe('*.txt'))
  // .add('minimatch', () => mm.makeRe('*.txt'))
  .run();
bench(cyan('match') + ' with leading star')
  .add('picomatch', () => pm('*.txt')('abc.txt'))
  // .add('minimatch', () => mm('abc.txt', '*.txt'))
  .run();

bench(red('.makeRe') + ' with star')
  .add('picomatch', () => pm.makeRe('c*3.txt'))
  // .add('minimatch', () => mm.makeRe('c*3.txt'))
  .run();
bench(cyan('match') + ' with star')
  .add('picomatch', () => pm('c*3.txt')('abc.txt'))
  // .add('minimatch', () => mm('abc.txt', 'c*3.txt'))
  .run();

bench(red('.makeRe') + ' - negated')
  .add('picomatch', () => pm.makeRe('!c*3.txt'))
  // .add('minimatch', () => mm.makeRe('!c*3.txt'))
  .run();
bench(cyan('match') + ' - negated')
  .add('picomatch', () => pm('!c*3.txt')('abc.txt'))
  // .add('minimatch', () => mm('abc.txt', '!c*3.txt'))
  .run();

bench(red('.makeRe') + ' - with globstar')
  .add('picomatch', () => pm.makeRe('foo/**/bar.txt'))
  // .add('minimatch', () => mm.makeRe('foo/**/bar.txt'))
  .run();
bench(cyan('match') + ' - with globstar')
  .add('picomatch', () => pm('foo/**/bar.txt')('foo/baz/bar.txt'))
  // .add('minimatch', () => mm('foo/baz/bar.txt', 'foo/**/bar.txt'))
  .run();

bench(red('.makeRe') + ' - with globstar negated')
  .add('picomatch', () => pm.makeRe('!**/bar.txt'))
  // .add('minimatch', () => mm.makeRe('!**/bar.txt'))
  .run();
bench(cyan('match') + ' - with globstar negated')
  .add('picomatch', () => pm('!**/bar.txt')('foo/bar.txt'))
  // .add('minimatch', () => mm('foo/bar.txt', '!**/bar.txt'))
  .run();

bench(red('.makeRe') + ' - braces')
  .add('picomatch', () => pm.makeRe('{a,b,c}*.txt'))
  // .add('minimatch', () => mm.makeRe('{a,b,c}*.txt'))
  .run();
bench(cyan('match') + ' - braces')
  .add('picomatch', () => pm('{a,b,c}*.txt')('abc.txt'))
  // .add('minimatch', () => mm('abc.txt', '{a,b,c}*.txt'))
  .run();

bench(red('.makeRe') + ' - multiple stars')
  .add('picomatch', () => pm.makeRe('**/*c09.*'))
  // .add('minimatch', () => mm.makeRe('**/*c09.*'))
  .run();
bench(cyan('match') + ' - multiple stars')
  .add('picomatch', () => pm('**/*c09.*')('foo/bar/ac09b.txt'))
  // .add('minimatch', () => mm('foo/bar/ac09b.txt', '**/*c09.*'))
  .run();

bench(red('.makeRe') + ' - no glob')
  .add('picomatch', () => pm.makeRe('abc.txt'))
  // .add('minimatch', () => mm.makeRe('abc.txt'))
  .run();
bench(cyan('match') + ' - no glob')
  .add('picomatch', () => pm('abc.txt')('abc.txt'))
  // .add('minimatch', () => mm('abc.txt', 'abc.txt'))
  .run();
