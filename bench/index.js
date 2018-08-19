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

  if (argv.run && name !== argv.run) {
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

  // suite.on('complete', fastest.bind(suite));
  return suite;
}

const picoOpts = { strictSlashes: true, strict: true };
const noCacheOpts = { ...picoOpts, nocache: true };

const miniOpts = { nodupes: false };
const miOpts2 = { nodupes: false, cache: false };

/**
 * Not cached
 */

bench(red('.makeRe') + ' star (caching disabled)')
  .add('minimatch', () => mm.makeRe('*'))
  .add('picomatch', () => pm.makeRe('*', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' star (caching disabled)')
  .add('minimatch', () => mm('abc.txt', '*'))
  .add('picomatch', () => pm.isMatch('abc.txt', '*', noCacheOpts))
  .run();

bench(red('.makeRe') + ' no-glob (caching disabled)')
  .add('minimatch', () => mm.makeRe('abc.txt'))
  .add('picomatch', () => pm.makeRe('abc.txt', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' no-glob (caching disabled)')
  .add('minimatch', () => mm('abc.txt', 'abc.txt'))
  .add('picomatch', () => pm.isMatch('abc.txt', 'abc.txt', noCacheOpts))
  .run();

bench(red('.makeRe') + ' with star (caching disabled)')
  .add('minimatch', () => mm.makeRe('c*3.txt'))
  .add('picomatch', () => pm.makeRe('c*3.txt', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' with star (caching disabled)')
  .add('minimatch', () => mm('abc.txt', 'c*3.txt'))
  .add('picomatch', () => pm.isMatch('abc.txt', 'c*3.txt', noCacheOpts))
  .run();

bench(red('.makeRe') + ' - negated (caching disabled)')
  .add('minimatch', () => mm.makeRe('!c*3.txt'))
  .add('picomatch', () => pm.makeRe('!c*3.txt', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' - negated (caching disabled)')
  .add('minimatch', () => mm('abc.txt', '!c*3.txt'))
  .add('picomatch', () => pm.isMatch('abc.txt', '!c*3.txt', noCacheOpts))
  .run();

bench(red('.makeRe') + ' - globstar (caching disabled)')
  .add('minimatch', () => mm.makeRe('foo/bar/**/bar.txt'))
  .add('picomatch', () => pm.makeRe('foo/bar/**/bar.txt', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' - globstar (caching disabled)')
  .add('minimatch', () => mm('foo/bar.txt', '**/bar.txt'))
  .add('picomatch', () => pm.isMatch('foo/bar.txt', '**/bar.txt', noCacheOpts))
  .run();

bench(red('.makeRe') + ' - globstar_negated (caching disabled)')
  .add('minimatch', () => mm.makeRe('!**/bar.txt'))
  .add('picomatch', () => pm.makeRe('!**/bar.txt', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' - globstar_negated (caching disabled)')
  .add('minimatch', () => mm('foo/bar.txt', '!**/bar.txt'))
  .add('picomatch', () => pm.isMatch('foo/bar.txt', '!**/bar.txt', noCacheOpts))
  .run();

bench(red('.makeRe') + ' - braces (caching disabled)')
  .add('minimatch', () => mm.makeRe('{a,b,c}*.txt'))
  .add('picomatch', () => pm.makeRe('{a,b,c}*.txt', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' - braces (caching disabled)')
  .add('minimatch', () => mm('abc.txt', '{a,b,c}*.txt'))
  .add('picomatch', () => pm.isMatch('abc.txt', '{a,b,c}*.txt', noCacheOpts))
  .run();

bench(red('.makeRe') + ' - multiple stars (caching disabled)')
  .add('minimatch', () => mm.makeRe('**/*c09.*'))
  .add('picomatch', () => pm.makeRe('**/*c09.*', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' - multiple stars (caching disabled)')
  .add('minimatch', () => mm('foo/bar/ac09b.txt', '**/*c09.*'))
  .add('picomatch', () => pm.isMatch('foo/bar/ac09b.txt', '**/*c09.*', noCacheOpts))
  .run();

/**
 * Cached
 */

bench(cyan('.isMatch') + ' - star only')
  .add('minimatch', () => mm('abc.txt', '*'))
  .add('picomatch', () => pm.isMatch('abc.txt', '*'), picoOpts)
  .run();

bench(cyan('.isMatch') + ' - star basname')
  .add('minimatch', () => mm('abc.txt', 'c*3.txt'))
  .add('picomatch', () => pm.isMatch('abc.txt', 'c*3.txt'), picoOpts)
  .run();

bench(cyan('.isMatch') + ' - star basename negated')
  .add('minimatch', () => mm('abc.txt', '!c*3.txt'))
  .add('picomatch', () => pm.isMatch('abc.txt', '!c*3.txt'), picoOpts)
  .run();

bench(cyan('.isMatch') + ' - globstar')
  .add('minimatch', () => mm('foo/bar.txt', '**/bar.txt'))
  .add('picomatch', () => pm.isMatch('foo/bar.txt', '**/bar.txt'), picoOpts)
  .run();

bench(cyan('.isMatch') + ' - globstar negated')
  .add('minimatch', () => mm('foo/bar.txt', '!**/bar.txt'))
  .add('picomatch', () => pm.isMatch('foo/bar.txt', '!**/bar.txt'), picoOpts)
  .run();

bench(cyan('.isMatch') + ' - braces')
  .add('minimatch', () => mm('abc.txt', '{a,b,c}*.txt'))
  .add('picomatch', () => pm.isMatch('abc.txt', '{a,b,c}*.txt'), picoOpts)
  .run();
