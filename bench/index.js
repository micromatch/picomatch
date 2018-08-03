'use strict';

const { Suite } = require('benchmark');
const argv = require('minimist')(process.argv.slice(2));
const longList = require('./fixtures/long-list');
const { micro, mini, pico } = require('./load-time');

/**
 * Setup
 */

const cycle = (e, newline) => {
  process.stdout.write('\u001b[G');
  process.stdout.write(`  ${e.target}${newline ? '\n' : ''}`);
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

const pOpts = { strict: true };
const pOpts2 = { strict: true, nocache: true };

const miOpts = { nodupes: false };
const miOpts2 = { nodupes: false, cache: false };

bench('.isMatch - star')
  .add('micromatch', () => micro.isMatch('abc.txt', '*'), miOpts)
  .add('minimatch', () => mini('abc.txt', '*'))
  .add('picomatch', () => pico.isMatch('abc.txt', '*'), pOpts)
  .run();

bench('.isMatch')
  .add('micromatch', () => micro.isMatch('abc.txt', 'c*3.txt'), miOpts)
  .add('minimatch', () => mini('abc.txt', 'c*3.txt'))
  .add('picomatch', () => pico.isMatch('abc.txt', 'c*3.txt'), pOpts)
  .run();

bench('.isMatch - negated')
  .add('micromatch', () => micro.isMatch('abc.txt', '!c*3.txt'), miOpts)
  .add('minimatch', () => mini('abc.txt', '!c*3.txt'))
  .add('picomatch', () => pico.isMatch('abc.txt', '!c*3.txt'), pOpts)
  .run();

bench('.isMatch - globstar')
  .add('micromatch', () => micro.isMatch('foo/bar.txt', '**/bar.txt'), miOpts)
  .add('minimatch', () => mini('foo/bar.txt', '**/bar.txt'))
  .add('picomatch', () => pico.isMatch('foo/bar.txt', '**/bar.txt'), pOpts)
  .run();

bench('.isMatch - globstar_negated')
  .add('micromatch', () => micro.isMatch('foo/bar.txt', '!**/bar.txt'), miOpts)
  .add('minimatch', () => mini('foo/bar.txt', '!**/bar.txt'))
  .add('picomatch', () => pico.isMatch('foo/bar.txt', '!**/bar.txt'), pOpts)
  .run();

bench('.isMatch - braces')
  .add('micromatch', () => micro.isMatch('abc.txt', '{a,b,c}*.txt'), miOpts)
  .add('minimatch', () => mini('abc.txt', '{a,b,c}*.txt'))
  .add('picomatch', () => pico.isMatch('abc.txt', '{a,b,c}*.txt'), pOpts)
  .run();

bench('.match - long_list')
  .add('micromatch', () => micro.match(longList, '**/*c09.*', miOpts))
  .add('minimatch', () => mini.match(longList, '**/*c09.*'))
  .add('picomatch', () => pico.match(longList, '**/*c09.*', pOpts))
  .run();

bench('.match - long_list_multiple_globstars')
  .add('micromatch', () => micro.match(longList, '**', miOpts))
  .add('minimatch', () => mini.match(longList, '**'))
  .add('picomatch', () => pico.match(longList, 'a/**/*c09.txt', pOpts))
  .run();

bench('.match - long_list_single_globstars')
  .add('micromatch', () => micro.match(longList, 'a/**/f/**/*c09.*', miOpts))
  .add('minimatch', () => mini.match(longList, 'a/**/f/**/*c09.*'))
  .add('picomatch', () => pico.match(longList, '**', pOpts))
  .run();

bench('.isMatch (caching disabled)')
  .add('micromatch', () => micro.isMatch('abc.txt', 'c*3.txt', miOpts2))
  .add('minimatch', () => mini('abc.txt', 'c*3.txt'))
  .add('picomatch', () => pico.isMatch('abc.txt', 'c*3.txt', pOpts2))
  .run();

bench('.isMatch star (caching disabled)')
  .add('micromatch', () => micro.isMatch('abc.txt', '*', miOpts2))
  .add('minimatch', () => mini('abc.txt', '*'))
  .add('picomatch', () => pico.isMatch('abc.txt', '*', pOpts2))
  .run();

bench('.isMatch - negated (caching disabled)')
  .add('micromatch', () => micro.isMatch('abc.txt', '!c*3.txt', miOpts2))
  .add('minimatch', () => mini('abc.txt', '!c*3.txt'))
  .add('picomatch', () => pico.isMatch('abc.txt', '!c*3.txt', pOpts2))
  .run();

bench('.isMatch - globstar (caching disabled)')
  .add('micromatch', () => micro.isMatch('foo/bar.txt', '**/bar.txt', miOpts2))
  .add('minimatch', () => mini('foo/bar.txt', '**/bar.txt'))
  .add('picomatch', () => pico.isMatch('foo/bar.txt', '**/bar.txt', pOpts2))
  .run();

bench('.isMatch - globstar_negated (caching disabled)')
  .add('micromatch', () => micro.isMatch('foo/bar.txt', '!**/bar.txt', miOpts2))
  .add('minimatch', () => mini('foo/bar.txt', '!**/bar.txt'))
  .add('picomatch', () => pico.isMatch('foo/bar.txt', '!**/bar.txt', pOpts2))
  .run();

bench('.isMatch - braces (caching disabled)')
  .add('micromatch', () => micro.isMatch('abc.txt', '{a,b,c}*.txt', miOpts2))
  .add('minimatch', () => mini('abc.txt', '{a,b,c}*.txt'))
  .add('picomatch', () => pico.isMatch('abc.txt', '{a,b,c}*.txt', pOpts2))
  .run();

bench('.match - long_list (caching disabled)')
  .add('micromatch', () => micro.match(longList, '**/*c09.*', miOpts2))
  .add('minimatch', () => mini.match(longList, '**/*c09.*'))
  .add('picomatch', () => pico.match(longList, '**/*c09.*', pOpts2))
  .run();

bench('.match - long_list_globstars_and_stars (caching disabled)')
  .add('micromatch', () => micro.match(longList, 'a/**/*c09.txt', miOpts2))
  .add('minimatch', () => mini.match(longList, 'a/**/*c09.txt'))
  .add('picomatch', () => pico.match(longList, 'a/**/*c09.txt', pOpts2))
  .run();

bench('.match - long_list_multiple_globstars (caching disabled)')
  .add('micromatch', () => micro.match(longList, 'a/**/f/**/*c09.*', miOpts2))
  .add('minimatch', () => mini.match(longList, 'a/**/f/**/*c09.*'))
  .add('picomatch', () => pico.match(longList, 'a/**/f/**/*c09.*', pOpts2))
  .run();

bench('.match - long_list_single_globstars (caching disabled)')
  .add('micromatch', () => micro.match(longList, '**', miOpts2))
  .add('minimatch', () => mini.match(longList, '**'))
  .add('picomatch', () => pico.match(longList, '**', pOpts2))
  .run();
