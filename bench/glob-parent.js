'use strict';

const { Suite } = require('benchmark');
const { red } = require('ansi-colors');
const argv = require('minimist')(process.argv.slice(2));
const parent = require('glob-parent');
const scan = require('../lib/scan');

/**
 * Setup
 */

const cycle = (e, newline) => {
  process.stdout.write(`\u001B[G  ${e.target}${newline ? '\n' : ''}`);
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

  console.log(`\n${red(config.name)}`);
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

bench('*.js')
  .add('picomatch.scan', () => scan('*.js'))
  .add('   glob-parent', () => parent('*.js'))
  .run();

bench('foo/bar/baz')
  .add('picomatch.scan', () => scan('foo/bar/baz'))
  .add('   glob-parent', () => parent('foo/bar/baz'))
  .run();

bench('foo/*.js')
  .add('picomatch.scan', () => scan('foo/*.js'))
  .add('   glob-parent', () => parent('foo/*.js'))
  .run();

bench('foo/{a,b}/*.js')
  .add('picomatch.scan', () => scan('foo/{a,b}/*.js'))
  .add('   glob-parent', () => parent('foo/{a,b}/*.js'))
  .run();

bench('*.js { parts: true, tokens: true }')
  .add('picomatch.scan', () => scan('*.js', { parts: true, tokens: true }))
  .add('   glob-parent', () => parent('*.js'))
  .run();

bench('foo/bar/baz { parts: true, tokens: true }')
  .add('picomatch.scan', () => scan('foo/bar/baz', { parts: true, tokens: true }))
  .add('   glob-parent', () => parent('foo/bar/baz'))
  .run();

bench('foo/*.js { parts: true, tokens: true }')
  .add('picomatch.scan', () => scan('foo/*.js', { parts: true, tokens: true }))
  .add('   glob-parent', () => parent('foo/*.js'))
  .run();

bench('foo/{a,b}/*.js { parts: true, tokens: true }')
  .add('picomatch.scan', () => scan('foo/{a,b}/*.js', { parts: true, tokens: true }))
  .add('   glob-parent', () => parent('foo/{a,b}/*.js'))
  .run();
