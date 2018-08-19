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

/**
 * Cached
 */

bench('.match - long_list')
  .add('minimatch', () => mini.match(longList, '**/*c09.*'))
  .add('picomatch', () => pico.match(longList, '**/*c09.*', picoOpts))
  .run();

bench('.match - long_list_multiple_globstars')
  .add('minimatch', () => mini.match(longList, '**'))
  .add('picomatch', () => pico.match(longList, 'a/**/*c09.txt', picoOpts))
  .run();

bench('.match - long_list_single_globstars')
  .add('minimatch', () => mini.match(longList, 'a/**/f/**/*c09.*'))
  .add('picomatch', () => pico.match(longList, '**', picoOpts))
  .run();
