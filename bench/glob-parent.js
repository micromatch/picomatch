'use strict';

const { Suite } = require('benchmark');
const { red } = require('ansi-colors');
const minimist = require('minimist');
const parent = require('glob-parent');
const scan = require('../lib/scan');

const argv = minimist(process.argv.slice(2));

/**
 * Setup
 */

const cycle = (e, newline) => {
  process.stdout.write(`\u001b[G  ${e.target}${newline ? '\n' : ''}`);
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

  return suite;
}

bench(red('*.js'))
  .add('  picomatch', () => scan('*.js'))
  .add('glob-parent', () => parent('*.js'))
  .run();

bench(red('foo/bar/baz'))
  .add('  picomatch', () => scan('foo/bar/baz'))
  .add('glob-parent', () => parent('foo/bar/baz'))
  .run();

bench(red('foo/*.js'))
  .add('  picomatch', () => scan('foo/*.js'))
  .add('glob-parent', () => parent('foo/*.js'))
  .run();

bench(red('foo/{a,b}/*.js'))
  .add('  picomatch', () => scan('foo/{a,b}/*.js'))
  .add('glob-parent', () => parent('foo/{a,b}/*.js'))
  .run();

bench(red('*.js { segments: true }'))
  .add('  picomatch', () => scan('*.js', { segments: true }))
  .add('glob-parent', () => parent('*.js'))
  .run();

bench(red('foo/bar/baz { segments: true }'))
  .add('  picomatch', () => scan('foo/bar/baz', { segments: true }))
  .add('glob-parent', () => parent('foo/bar/baz'))
  .run();

bench(red('foo/*.js { segments: true }'))
  .add('  picomatch', () => scan('foo/*.js', { segments: true }))
  .add('glob-parent', () => parent('foo/*.js'))
  .run();

bench(red('foo/{a,b}/*.js { segments: true }'))
  .add('  picomatch', () => scan('foo/{a,b}/*.js', { segments: true }))
  .add('glob-parent', () => parent('foo/{a,b}/*.js'))
  .run();
