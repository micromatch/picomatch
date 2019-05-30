'use strict';

const picomatch = require('..');
console.log(picomatch.parse('foo bar', { fastpaths: false }));
console.log(picomatch.parse("C:/Program Files \\(x86\\)"));
