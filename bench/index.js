'use strict';

const { Suite } = require('benchmark');
const { red } = require('ansi-colors');
const minimist = require('minimist');
const mm = require('minimatch');
const pm = require('..');

const argv = minimist(process.argv.slice(2));

/**
 * Setup
 */

const cycle = (e, newline) => {
  process.stdout.write(`\u001b[G  ${e.target}${newline ? '\n' : ''}`);
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

bench(`${red('.makeRe')} star`)
  .add('picomatch', () => pm.makeRe('*', { fastpaths: false }))
  .add('minimatch', () => mm.makeRe('*'))
  .run();

bench(`${red('.makeRe')} leading star`)
  .add('picomatch', () => pm.makeRe('*.txt', { fastpaths: false }))
  .add('minimatch', () => mm.makeRe('*.txt'))
  .run();

bench(`${red('.makeRe')} path with star`)
  .add('picomatch', () => pm.makeRe('foo/*.js', { fastpaths: false }))
  .add('minimatch', () => mm.makeRe('foo/*.js'))
  .run();

bench(`${red('.makeRe')} star w/ { dot: true }`)
  .add('picomatch', () => pm.makeRe('*', { dot: true , fastpaths: false }))
  .add('minimatch', () => mm.makeRe('*', { dot: true }))
  .run();

bench(`${red('.makeRe')} globstar`)
  .add('picomatch', () => pm.makeRe('**', { fastpaths: false }))
  .add('minimatch', () => mm.makeRe('**'))
  .run();

bench(`${red('.makeRe')} multiple globstars`)
  .add('picomatch', () => pm.makeRe('**/**/**', { fastpaths: false }))
  .add('minimatch', () => mm.makeRe('**/**/**'))
  .run();

bench(`${red('.makeRe')} basic braces`)
  .add('picomatch', () => pm.makeRe('foo/{a,b,c}*.txt', { fastpaths: false }))
  .add('minimatch', () => mm.makeRe('foo/{a,b,c}*.txt'))
  .run();
