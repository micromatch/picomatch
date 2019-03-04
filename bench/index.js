'use strict';

const { Suite } = require('benchmark');
const { mm, pm } = require('./load-time');
const { cyan, red, green } = require('ansi-colors');
const argv = require('minimist')(process.argv.slice(2));
const longList = require('./fixtures/long-list');

/**
 * Setup
 */

const cycle = (e, newline) => {
  process.stdout.write('\u001b[G');
  process.stdout.write(`  ${e.target}${newline ? `\n` : ''}`);
};

function bench(name, options) {
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
}

/**
 * Caching disabled
 */

let opts = { nocache: true, normalize: false, unixify: false, strictSlashes: true };

bench(red('.makeRe') + ' star (caching disabled)')
  .add('minimatch', () => mm.makeRe('*'))
  .add('picomatch', () => pm.makeRe('*', opts))
  .run();
bench(cyan('match') + ' star (caching disabled)')
  .add('minimatch', () => mm('abc.txt', '*'))
  .add('picomatch', () => pm('*', opts)('abc.txt', true, true))
  .run();

bench(red('.makeRe') + ' with star (caching disabled)')
  .add('minimatch', () => mm.makeRe('c*3.txt'))
  .add('picomatch', () => pm.makeRe('c*3.txt', opts))
  .run();
bench(cyan('match') + ' with star (caching disabled)')
  .add('minimatch', () => mm('abc.txt', 'c*3.txt'))
  .add('picomatch', () => pm('c*3.txt', opts)('abc.txt', true, true))
  .run();

bench(red('.makeRe') + ' - negated (caching disabled)')
  .add('minimatch', () => mm.makeRe('!c*3.txt'))
  .add('picomatch', () => pm.makeRe('!c*3.txt', opts))
  .run();
bench(cyan('match') + ' - negated (caching disabled)')
  .add('minimatch', () => mm('abc.txt', '!c*3.txt'))
  .add('picomatch', () => pm('!c*3.txt', opts)('abc.txt', true, true))
  .run();

bench(red('.makeRe') + ' - globstar (caching disabled)')
  .add('minimatch', () => mm.makeRe('foo/bar/**/bar.txt'))
  .add('picomatch', () => pm.makeRe('foo/bar/**/bar.txt', opts))
  .run();
bench(cyan('match') + ' - globstar (caching disabled)')
  .add('minimatch', () => mm('foo/bar.txt', '**/bar.txt'))
  .add('picomatch', () => pm('**/bar.txt', opts)('foo/bar.txt', true, true))
  .run();

bench(red('.makeRe') + ' - globstar_negated (caching disabled)')
  .add('minimatch', () => mm.makeRe('!**/bar.txt'))
  .add('picomatch', () => pm.makeRe('!**/bar.txt', opts))
  .run();
bench(cyan('match') + ' - globstar_negated (caching disabled)')
  .add('minimatch', () => mm('foo/bar.txt', '!**/bar.txt'))
  .add('picomatch', () => pm('!**/bar.txt', opts)('foo/bar.txt', true, true))
  .run();

bench(red('.makeRe') + ' - braces (caching disabled)')
  .add('minimatch', () => mm.makeRe('{a,b,c}*.txt'))
  .add('picomatch', () => pm.makeRe('{a,b,c}*.txt', opts))
  .run();
bench(cyan('match') + ' - braces (caching disabled)')
  .add('minimatch', () => mm('abc.txt', '{a,b,c}*.txt'))
  .add('picomatch', () => pm('{a,b,c}*.txt', opts)('abc.txt', true, true))
  .run();

bench(red('.makeRe') + ' - multiple stars (caching disabled)')
  .add('minimatch', () => mm.makeRe('**/*c09.*'))
  .add('picomatch', () => pm.makeRe('**/*c09.*', opts))
  .run();
bench(cyan('match') + ' - multiple stars (caching disabled)')
  .add('minimatch', () => mm('foo/bar/ac09b.txt', '**/*c09.*'))
  .add('picomatch', () => pm('**/*c09.*', opts)('foo/bar/ac09b.txt', true, true))
  .run();

bench(red('.makeRe') + ' - no-glob (caching disabled)')
  .add('minimatch', () => mm.makeRe('abc.txt'))
  .add('picomatch', () => pm.makeRe('abc.txt', opts))
  .run();
bench(cyan('match') + ' - no-glob (caching disabled)')
  .add('minimatch', () => mm('abc.txt', 'abc.txt'))
  .add('picomatch', () => pm('abc.txt', opts)('abc.txt', true, true))
  .run();

/**
 * Caching enabled
 */

bench(red('.makeRe') + ' - star')
  .add('minimatch', () => mm.makeRe('*'))
  .add('picomatch', () => pm.makeRe('*'))
  .run();
bench(cyan('.isMatch') + ' - star')
  .add('minimatch', () => mm('abc.txt', '*'))
  .add('picomatch', () => pm('*')('abc.txt', true, true))
  .run();

bench(red('.makeRe') + ' - with star')
  .add('minimatch', () => mm.makeRe('c*3.txt'))
  .add('picomatch', () => pm.makeRe('c*3.txt'))
  .run();
bench(cyan('.isMatch') + ' - with star')
  .add('minimatch', () => mm('abc.txt', 'c*3.txt'))
  .add('picomatch', () => pm('c*3.txt')('abc.txt', true, true))
  .run();

bench(red('.makeRe') + ' - negated')
  .add('minimatch', () => mm.makeRe('!c*3.txt'))
  .add('picomatch', () => pm.makeRe('!c*3.txt'))
  .run();
bench(cyan('.isMatch') + ' - negated')
  .add('minimatch', () => mm('abc.txt', '!c*3.txt'))
  .add('picomatch', () => pm('!c*3.txt')('abc.txt', true, true))
  .run();

bench(red('.makeRe') + ' - globstar')
  .add('minimatch', () => mm.makeRe('foo/bar/**/bar.txt'))
  .add('picomatch', () => pm.makeRe('foo/bar/**/bar.txt'))
  .run();
bench(cyan('.isMatch') + ' - globstar')
  .add('minimatch', () => mm('foo/bar.txt', '**/bar.txt'))
  .add('picomatch', () => pm('**/bar.txt')('foo/bar.txt', true, true))
  .run();

bench(red('.makeRe') + ' - globstar_negated')
  .add('minimatch', () => mm.makeRe('!**/bar.txt'))
  .add('picomatch', () => pm.makeRe('!**/bar.txt'))
  .run();
bench(cyan('.isMatch') + ' - globstar_negated')
  .add('minimatch', () => mm('foo/bar.txt', '!**/bar.txt'))
  .add('picomatch', () => pm('!**/bar.txt')('foo/bar.txt', true, true))
  .run();

bench(red('.makeRe') + ' - braces')
  .add('minimatch', () => mm.makeRe('{a,b,c}*.txt'))
  .add('picomatch', () => pm.makeRe('{a,b,c}*.txt'))
  .run();
bench(cyan('.isMatch') + ' - braces')
  .add('minimatch', () => mm('abc.txt', '{a,b,c}*.txt'))
  .add('picomatch', () => pm('{a,b,c}*.txt')('abc.txt', true, true))
  .run();

bench(red('.makeRe') + ' - multiple stars')
  .add('minimatch', () => mm.makeRe('**/*c09.*'))
  .add('picomatch', () => pm.makeRe('**/*c09.*'))
  .run();
bench(cyan('.isMatch') + ' - multiple stars')
  .add('minimatch', () => mm('foo/bar/ac09b.txt', '**/*c09.*'))
  .add('picomatch', () => pm('**/*c09.*')('foo/bar/ac09b.txt', true, true))
  .run();

bench(red('.makeRe') + ' - no-glob')
  .add('minimatch', () => mm.makeRe('abc.txt'))
  .add('picomatch', () => pm.makeRe('abc.txt'))
  .run();
bench(cyan('.isMatch') + ' - no-glob')
  .add('minimatch', () => mm('abc.txt', 'abc.txt'))
  .add('picomatch', () => pm('abc.txt')('abc.txt', true, true))
  .run();
