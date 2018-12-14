'use strict';

const { cyan, blue, green, red, yellow } = require('ansi-colors');
const argv = require('minimist')(process.argv.slice(2), { alias: { c: 'compare' } });
const bash = require('bash-match');
const minimatch = require('minimatch');
const multimatch = require('multimatch');
const micromatch = require('micromatch');
const picomatch = require('../..');

const mm = (input, patterns, options) => {
  if (Array.isArray(patterns)) {
    return multimatch([].concat(input), patterns, options);
  }
  if (Array.isArray(input)) {
    return minimatch.match(input, patterns, options);
  }
  return minimatch(input, patterns, options);
};

mm.isMatch = (str, pattern, options) => mm(str, pattern, options);
mm.makeRe = minimatch.makeRe;
mm.match = mm;

const compare = (list, pattern, options) => {
  list = [].concat(list);
  let same = (compare[argv.compare] || compare.all)(list, pattern, options);
  return picomatch(list, pattern, options);
};

const header = (list, pattern, options) => {
  // L = list, P = pattern(s), R = regex source string
  console.log('--- L ' + format(list, yellow));
  console.log('--- P ' + format(pattern, cyan));
  console.log('---PR ' + format([].concat(pattern).map(p => picomatch.makeRe(p, options)), blue));
  if (argv.mm || argv.minimatch || argv.compare === 'all' || argv.compare === true) {
    console.log('---MR ' + format([].concat(pattern).map(p => minimatch.makeRe(p, options)), blue));
  }
};

compare.all = compare.a = (list, pattern, options) => {
  header(list, pattern, options);
  console.log('      bash', format(bash(list, pattern, options), green));
  console.log(' minimatch', format(mm(list, pattern, options), green));
  console.log(' picomatch', format(picomatch(list, pattern, options), green));
  console.log();
};

compare.minimatch = compare.mm = (list, pattern, options) => {
  let mmResult = mi(list, pattern, options);
  let pmResult = picomatch(list, pattern, options);

  if (mmResult.join('') !== pmResult.join('') || argv.v) {
    header(list, pattern, options);
    console.log('---MM ' + format([].concat(pattern).map(p => mm.makeRe(p, options)), blue));
    console.log(' minimatch', format(mmResult, green));
    console.log(' picomatch', format(pmResult, green));
    console.log();
  }
};

compare.bash = compare.b = (list, pattern, options) => {
  let bashResult = bash(list, pattern, options);
  let pmResult = picomatch(list, pattern, options);
  let v = bash.version().split('.').slice(0, 2).join('.');
  if (bashResult.join('') !== pmResult.join('') || argv.v) {
    header(list, pattern, options);
    console.log(` bash v${v}`, format(bashResult, green));
    console.log(' picomatch', format(pmResult, green));
    console.log();
  }
};

function format(pattern, color) {
  return `[ ${[].concat(pattern).map(v => color(v)).join(', ')} ]`;
}

compare.isMatch = (...args) => {
  return compare(...args).length > 0;
};

compare.makeRe = picomatch.makeRe;
compare.match = picomatch.match;
compare.any = picomatch.any;

picomatch.match = (list, pattern, options = {}) => {
  let isMatch = picomatch(pattern, options);
  let matches = new Set();
  for (let ele of list) {
    let match = isMatch(ele);
    if (match) {
      matches.add(typeof match === 'boolean' ? ele : match);
    }
  }
  return [...matches];
};

if (argv.compare) {
  module.exports = compare;
} else if (argv.mi) {
  module.exports = micromatch;
} else if (argv.mm) {
  module.exports = mm;
} else if (argv.bash) {
  module.exports = bash;
} else {
  module.exports = picomatch;
}
