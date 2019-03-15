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

let opts = { nocache: true };
let optsDot = { nocache: true, dot: true };

bench(red('.makeRe') + ' star (caching disabled)')
  .add('minimatch', () => mm.makeRe('*'))
  .add('picomatch', () => pm.makeRe('*', opts))
  .run();
bench(cyan('match') + ' star (caching disabled)')
  .add('minimatch', () => mm('abc.txt', '*'))
  .add('picomatch', () => pm('*', opts)('abc.txt'))
  .run();

bench(red('.makeRe') + ' star; dot=true (caching disabled)')
  .add('minimatch', () => mm.makeRe('*', { dot: true }))
  .add('picomatch', () => pm.makeRe('*', optsDot))
  .run();
bench(cyan('match') + ' star; dot=true (caching disabled)')
  .add('minimatch', () => mm('.abc.txt', '*', { dot: true }))
  .add('picomatch', () => pm('*', optsDot)('.abc.txt'))
  .run();

bench(red('.makeRe') + ' globstar (caching disabled)')
  .add('minimatch', () => mm.makeRe('**'))
  .add('picomatch', () => pm.makeRe('**', opts))
  .run();
bench(cyan('match') + ' globstar (caching disabled)')
  .add('minimatch', () => mm('abc.txt', '**'))
  .add('picomatch', () => pm('**', opts)('abc.txt'))
  .run();

bench(red('.makeRe') + ' globstars (caching disabled)')
  .add('minimatch', () => mm.makeRe('**/**/**'))
  .add('picomatch', () => pm.makeRe('**/**/**', opts))
  .run();
bench(cyan('match') + ' globstars (caching disabled)')
  .add('minimatch', () => mm('foo/abc.txt', '**/**/**'))
  .add('picomatch', () => pm('**/**/**', opts)('foo/abc.txt'))
  .run();

bench(red('.makeRe') + ' with leading star (caching disabled)')
  .add('minimatch', () => mm.makeRe('*.txt'))
  .add('picomatch', () => pm.makeRe('*.txt', opts))
  .run();
bench(cyan('match') + ' with leading star (caching disabled)')
  .add('minimatch', () => mm('abc.txt', '*.txt'))
  .add('picomatch', () => pm('*.txt', opts)('abc.txt'))
  .run();

bench(red('.makeRe') + ' with star (caching disabled)')
  .add('minimatch', () => mm.makeRe('c*3.txt'))
  .add('picomatch', () => pm.makeRe('c*3.txt', opts))
  .run();
bench(cyan('match') + ' with star (caching disabled)')
  .add('minimatch', () => mm('abc.txt', 'c*3.txt'))
  .add('picomatch', () => pm('c*3.txt', opts)('abc.txt'))
  .run();

bench(red('.makeRe') + ' - negated (caching disabled)')
  .add('minimatch', () => mm.makeRe('!c*3.txt'))
  .add('picomatch', () => pm.makeRe('!c*3.txt', opts))
  .run();
bench(cyan('match') + ' - negated (caching disabled)')
  .add('minimatch', () => mm('abc.txt', '!c*3.txt'))
  .add('picomatch', () => pm('!c*3.txt', opts)('abc.txt'))
  .run();

bench(red('.makeRe') + ' - with globstar (caching disabled)')
  .add('minimatch', () => mm.makeRe('foo/**/bar.txt'))
  .add('picomatch', () => pm.makeRe('foo/**/bar.txt', opts))
  .run();
bench(cyan('match') + ' - with globstar (caching disabled)')
  .add('minimatch', () => mm('foo/baz/bar.txt', 'foo/**/bar.txt'))
  .add('picomatch', () => pm('foo/**/bar.txt', opts)('foo/baz/bar.txt'))
  .run();

bench(red('.makeRe') + ' - with globstar negated (caching disabled)')
  .add('minimatch', () => mm.makeRe('!**/bar.txt'))
  .add('picomatch', () => pm.makeRe('!**/bar.txt', opts))
  .run();
bench(cyan('match') + ' - with globstar negated (caching disabled)')
  .add('minimatch', () => mm('foo/bar.txt', '!**/bar.txt'))
  .add('picomatch', () => pm('!**/bar.txt', opts)('foo/bar.txt'))
  .run();

bench(red('.makeRe') + ' - braces (caching disabled)')
  .add('minimatch', () => mm.makeRe('{a,b,c}*.txt'))
  .add('picomatch', () => pm.makeRe('{a,b,c}*.txt', opts))
  .run();
bench(cyan('match') + ' - braces (caching disabled)')
  .add('minimatch', () => mm('abc.txt', '{a,b,c}*.txt'))
  .add('picomatch', () => pm('{a,b,c}*.txt', opts)('abc.txt'))
  .run();

bench(red('.makeRe') + ' - multiple stars (caching disabled)')
  .add('minimatch', () => mm.makeRe('**/*c09.*'))
  .add('picomatch', () => pm.makeRe('**/*c09.*', opts))
  .run();
bench(cyan('match') + ' - multiple stars (caching disabled)')
  .add('minimatch', () => mm('foo/bar/ac09b.txt', '**/*c09.*'))
  .add('picomatch', () => pm('**/*c09.*', opts)('foo/bar/ac09b.txt'))
  .run();

bench(red('.makeRe') + ' - no glob (caching disabled)')
  .add('minimatch', () => mm.makeRe('abc.txt'))
  .add('picomatch', () => pm.makeRe('abc.txt', opts))
  .run();
bench(cyan('match') + ' - no glob (caching disabled)')
  .add('minimatch', () => mm('abc.txt', 'abc.txt'))
  .add('picomatch', () => pm('abc.txt', opts)('abc.txt'))
  .run();

/**
 * Caching enabled
 */

bench(red('.makeRe') + ' star (caching enabled)')
  .add('minimatch', () => mm.makeRe('*'))
  .add('picomatch', () => pm.makeRe('*'))
  .run();
bench(cyan('match') + ' star (caching enabled)')
  .add('minimatch', () => mm('abc.txt', '*'))
  .add('picomatch', () => pm('*')('abc.txt'))
  .run();

bench(red('.makeRe') + ' star; dot=true (caching enabled)')
  .add('minimatch', () => mm.makeRe('*', { dot: true }))
  .add('picomatch', () => pm.makeRe('*'))
  .run();
bench(cyan('match') + ' star; dot=true (caching enabled)')
  .add('minimatch', () => mm('.abc.txt', '*', { dot: true }))
  .add('picomatch', () => pm('*')('.abc.txt'))
  .run();

bench(red('.makeRe') + ' globstar (caching enabled)')
  .add('minimatch', () => mm.makeRe('**'))
  .add('picomatch', () => pm.makeRe('**'))
  .run();
bench(cyan('match') + ' globstar (caching enabled)')
  .add('minimatch', () => mm('abc.txt', '**'))
  .add('picomatch', () => pm('**')('abc.txt'))
  .run();

bench(red('.makeRe') + ' globstars (caching enabled)')
  .add('minimatch', () => mm.makeRe('**/**/**'))
  .add('picomatch', () => pm.makeRe('**/**/**'))
  .run();
bench(cyan('match') + ' globstars (caching enabled)')
  .add('minimatch', () => mm('foo/abc.txt', '**/**/**'))
  .add('picomatch', () => pm('**/**/**')('foo/abc.txt'))
  .run();

bench(red('.makeRe') + ' with leading star (caching enabled)')
  .add('minimatch', () => mm.makeRe('*.txt'))
  .add('picomatch', () => pm.makeRe('*.txt'))
  .run();
bench(cyan('match') + ' with leading star (caching enabled)')
  .add('minimatch', () => mm('abc.txt', '*.txt'))
  .add('picomatch', () => pm('*.txt')('abc.txt'))
  .run();

bench(red('.makeRe') + ' with star (caching enabled)')
  .add('minimatch', () => mm.makeRe('c*3.txt'))
  .add('picomatch', () => pm.makeRe('c*3.txt'))
  .run();
bench(cyan('match') + ' with star (caching enabled)')
  .add('minimatch', () => mm('abc.txt', 'c*3.txt'))
  .add('picomatch', () => pm('c*3.txt')('abc.txt'))
  .run();

bench(red('.makeRe') + ' - negated (caching enabled)')
  .add('minimatch', () => mm.makeRe('!c*3.txt'))
  .add('picomatch', () => pm.makeRe('!c*3.txt'))
  .run();
bench(cyan('match') + ' - negated (caching enabled)')
  .add('minimatch', () => mm('abc.txt', '!c*3.txt'))
  .add('picomatch', () => pm('!c*3.txt')('abc.txt'))
  .run();

bench(red('.makeRe') + ' - with globstar (caching enabled)')
  .add('minimatch', () => mm.makeRe('foo/**/bar.txt'))
  .add('picomatch', () => pm.makeRe('foo/**/bar.txt'))
  .run();
bench(cyan('match') + ' - with globstar (caching enabled)')
  .add('minimatch', () => mm('foo/baz/bar.txt', 'foo/**/bar.txt'))
  .add('picomatch', () => pm('foo/**/bar.txt')('foo/baz/bar.txt'))
  .run();

bench(red('.makeRe') + ' - with globstar negated (caching enabled)')
  .add('minimatch', () => mm.makeRe('!**/bar.txt'))
  .add('picomatch', () => pm.makeRe('!**/bar.txt'))
  .run();
bench(cyan('match') + ' - with globstar negated (caching enabled)')
  .add('minimatch', () => mm('foo/bar.txt', '!**/bar.txt'))
  .add('picomatch', () => pm('!**/bar.txt')('foo/bar.txt'))
  .run();

bench(red('.makeRe') + ' - braces (caching enabled)')
  .add('minimatch', () => mm.makeRe('{a,b,c}*.txt'))
  .add('picomatch', () => pm.makeRe('{a,b,c}*.txt'))
  .run();
bench(cyan('match') + ' - braces (caching enabled)')
  .add('minimatch', () => mm('abc.txt', '{a,b,c}*.txt'))
  .add('picomatch', () => pm('{a,b,c}*.txt')('abc.txt'))
  .run();

bench(red('.makeRe') + ' - multiple stars (caching enabled)')
  .add('minimatch', () => mm.makeRe('**/*c09.*'))
  .add('picomatch', () => pm.makeRe('**/*c09.*'))
  .run();
bench(cyan('match') + ' - multiple stars (caching enabled)')
  .add('minimatch', () => mm('foo/bar/ac09b.txt', '**/*c09.*'))
  .add('picomatch', () => pm('**/*c09.*')('foo/bar/ac09b.txt'))
  .run();

bench(red('.makeRe') + ' - no glob (caching enabled)')
  .add('minimatch', () => mm.makeRe('abc.txt'))
  .add('picomatch', () => pm.makeRe('abc.txt'))
  .run();
bench(cyan('match') + ' - no glob (caching enabled)')
  .add('minimatch', () => mm('abc.txt', 'abc.txt'))
  .add('picomatch', () => pm('abc.txt')('abc.txt'))
  .run();
