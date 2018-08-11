'use strict';

const { Suite } = require('benchmark');
const { cyan, red, green } = require('ansi-colors');
const argv = require('minimist')(process.argv.slice(2));
const longList = require('./fixtures/long-list');
const { mini, pico } = require('./load-time');

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
  .add('minimatch', () => mini.makeRe('*'))
  .add('picomatch', () => pico.makeRe('*', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' star (caching disabled)')
  .add('minimatch', () => mini('abc.txt', '*'))
  .add('picomatch', () => pico.isMatch('abc.txt', '*', noCacheOpts))
  .run();

bench(red('.makeRe') + ' no-glob (caching disabled)')
  .add('minimatch', () => mini.makeRe('abc.txt'))
  .add('picomatch', () => pico.makeRe('abc.txt', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' no-glob (caching disabled)')
  .add('minimatch', () => mini('abc.txt', 'abc.txt'))
  .add('picomatch', () => pico.isMatch('abc.txt', 'abc.txt', noCacheOpts))
  .run();

bench(red('.makeRe') + ' with star (caching disabled)')
  .add('minimatch', () => mini.makeRe('c*3.txt'))
  .add('picomatch', () => pico.makeRe('c*3.txt', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' with star (caching disabled)')
  .add('minimatch', () => mini('abc.txt', 'c*3.txt'))
  .add('picomatch', () => pico.isMatch('abc.txt', 'c*3.txt', noCacheOpts))
  .run();

bench(red('.makeRe') + ' - negated (caching disabled)')
  .add('minimatch', () => mini.makeRe('!c*3.txt'))
  .add('picomatch', () => pico.makeRe('!c*3.txt', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' - negated (caching disabled)')
  .add('minimatch', () => mini('abc.txt', '!c*3.txt'))
  .add('picomatch', () => pico.isMatch('abc.txt', '!c*3.txt', noCacheOpts))
  .run();

bench(red('.makeRe') + ' - globstar (caching disabled)')
  .add('minimatch', () => mini.makeRe('foo/bar/**/bar.txt'))
  .add('picomatch', () => pico.makeRe('foo/bar/**/bar.txt', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' - globstar (caching disabled)')
  .add('minimatch', () => mini('foo/bar.txt', '**/bar.txt'))
  .add('picomatch', () => pico.isMatch('foo/bar.txt', '**/bar.txt', noCacheOpts))
  .run();

bench(red('.makeRe') + ' - globstar_negated (caching disabled)')
  .add('minimatch', () => mini.makeRe('!**/bar.txt'))
  .add('picomatch', () => pico.makeRe('!**/bar.txt', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' - globstar_negated (caching disabled)')
  .add('minimatch', () => mini('foo/bar.txt', '!**/bar.txt'))
  .add('picomatch', () => pico.isMatch('foo/bar.txt', '!**/bar.txt', noCacheOpts))
  .run();

bench(red('.makeRe') + ' - braces (caching disabled)')
  .add('minimatch', () => mini.makeRe('{a,b,c}*.txt'))
  .add('picomatch', () => pico.makeRe('{a,b,c}*.txt', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' - braces (caching disabled)')
  .add('minimatch', () => mini('abc.txt', '{a,b,c}*.txt'))
  .add('picomatch', () => pico.isMatch('abc.txt', '{a,b,c}*.txt', noCacheOpts))
  .run();

bench(red('.makeRe') + ' - multiple stars (caching disabled)')
  .add('minimatch', () => mini.makeRe('**/*c09.*'))
  .add('picomatch', () => pico.makeRe('**/*c09.*', noCacheOpts))
  .run();
bench(cyan('.isMatch') + ' - multiple stars (caching disabled)')
  .add('minimatch', () => mini('foo/bar/ac09b.txt', '**/*c09.*'))
  .add('picomatch', () => pico.isMatch('foo/bar/ac09b.txt', '**/*c09.*', noCacheOpts))
  .run();

bench(green('.match') + ' - long_list (caching disabled)')
  .add('minimatch', () => mini.match(longList, '**/*c09.*'))
  .add('picomatch', () => pico.match(longList, '**/*c09.*', noCacheOpts))
  .run();

bench(green('.match') + ' - long_list_globstars_and_stars (caching disabled)')
  .add('minimatch', () => mini.match(longList, 'a/**/*c09.txt'))
  .add('picomatch', () => pico.match(longList, 'a/**/*c09.txt', noCacheOpts))
  .run();

bench(green('.match') + ' - long_list_multiple_globstars (caching disabled)')
  .add('minimatch', () => mini.match(longList, 'a/**/f/**/*c09.*'))
  .add('picomatch', () => pico.match(longList, 'a/**/f/**/*c09.*', noCacheOpts))
  .run();

bench(green('.match') + ' - long_list_single_globstars (caching disabled)')
  .add('minimatch', () => mini.match(longList, '**'))
  .add('picomatch', () => pico.match(longList, '**', noCacheOpts))
  .run();

// /**
//  * Cached
//  */

// bench('.isMatch - star')
//   .add('comparison', () => isMatch('abc.txt'))
//   .add('minimatch', () => mini('abc.txt', '*'))
//   .add('picomatch', () => pico.isMatch('abc.txt', '*'), picoOpts)
//   .run();

// bench('.isMatch')
//   .add('minimatch', () => mini('abc.txt', 'c*3.txt'))
//   .add('picomatch', () => pico.isMatch('abc.txt', 'c*3.txt'), picoOpts)
//   .run();

// bench('.isMatch - negated')
//   .add('minimatch', () => mini('abc.txt', '!c*3.txt'))
//   .add('picomatch', () => pico.isMatch('abc.txt', '!c*3.txt'), picoOpts)
//   .run();

// bench('.isMatch - globstar')
//   .add('minimatch', () => mini('foo/bar.txt', '**/bar.txt'))
//   .add('picomatch', () => pico.isMatch('foo/bar.txt', '**/bar.txt'), picoOpts)
//   .run();

// bench('.isMatch - globstar_negated')
//   .add('minimatch', () => mini('foo/bar.txt', '!**/bar.txt'))
//   .add('picomatch', () => pico.isMatch('foo/bar.txt', '!**/bar.txt'), picoOpts)
//   .run();

// bench('.isMatch - braces')
//   .add('minimatch', () => mini('abc.txt', '{a,b,c}*.txt'))
//   .add('picomatch', () => pico.isMatch('abc.txt', '{a,b,c}*.txt'), picoOpts)
//   .run();

// bench('.match - long_list')
//   .add('minimatch', () => mini.match(longList, '**/*c09.*'))
//   .add('picomatch', () => pico.match(longList, '**/*c09.*', picoOpts))
//   .run();

// bench('.match - long_list_multiple_globstars')
//   .add('minimatch', () => mini.match(longList, '**'))
//   .add('picomatch', () => pico.match(longList, 'a/**/*c09.txt', picoOpts))
//   .run();

// bench('.match - long_list_single_globstars')
//   .add('minimatch', () => mini.match(longList, 'a/**/f/**/*c09.*'))
//   .add('picomatch', () => pico.match(longList, '**', picoOpts))
//   .run();
