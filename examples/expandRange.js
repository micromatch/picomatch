'use strict';

const fill = require('fill-range');
const pm = require('..');

const regex = pm.makeRe('foo/{01..25}/bar', {
  expandRange(a, b) {
    return `(${fill(a, b, { toRegex: true })})`;
  }
});

console.log(regex);
//=> /^(?:foo\/((?:[1-9]|1[0-9]|2[0-5])))$/
