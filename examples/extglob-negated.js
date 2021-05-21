'use strict';

const picomatch = require('..');

const fixtures = [
  ['/file.d.ts', false],
  ['/file.ts', true],
  ['/file.d.something.ts', true],
  ['/file.dhello.ts', true]
];

const pattern = '/!(*.d).ts';
const isMatch = picomatch(pattern);

console.log(fixtures.map(f => [isMatch(f[0]), f[1]]));
