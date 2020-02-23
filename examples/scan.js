'use strict';

const pm = require('..');

console.log(pm.scan('foo/bar/*/*/*.js'));
console.log(pm.scan('foo/(*|**a).js'));
console.log(pm.scan('foo/**/(*|a).js'));
console.log(pm.scan('foo/**/(**|a).js'));
console.log(pm.scan('foo/**/{**/*,}.js'));
console.log(pm.scan('foo/{**/*,}.js'));
console.log(pm.scan('/{**/*,}.js'));
console.log(pm.scan('/[*/].js'));
console.log(pm.scan('/(**/*|*).js'));
console.log(pm.scan('foo/**/*.js'));
console.log(pm.scan('foo/bar/*.js'));
console.log(pm.scan('foo/*.js'));
console.log(pm.scan('/foo'));

const braces = require('braces');

const scan = (pattern, options) => {
  // const matchers = {};
  const patterns = braces.expand(pattern, options);
  const result = patterns.map(p => pm.scan(p, options));

  for (let i = 0; i < result.length; i++) {
    const state = result[i];
    if (state.maxDepth === Infinity) continue;

    // const matcher = matchers[state.base] || (matchers[state.base] = {});
    let foundGlob = false;

    for (const token of state.tokens) {
      if (token.isGlob === true) {
        foundGlob = true;
      }

      if (foundGlob === false) {
        continue;
      }

      if (token.isGlob === false) {
        token.matcher = name => token.value === name;
      } else {
        token.matcher = function glob() {};
      }

    }
    console.log(state);
  }

  return result;
};

scan('{one/two,foo}/*/abc/{bar,**/*}.js', { parts: true, tokens: true });

// scan('./foo/**/*/*.js', { parts: true, tokens: true });
// scan('**/bar.js', { parts: true, tokens: true });
// scan('foo/**/bar.js', { parts: true, tokens: true });
// scan('foo/**/{bar,*/*}.js', { parts: true, tokens: true });
// scan('foo/**/{bar,*/*}/*.js', { parts: true, tokens: true });
// const { tokens } = scan('foo/*/{bar,*/*}/*.js', { parts: true, tokens: true });
// for (const token of tokens) {
//   console.log(token);
// }

// console.log(scan('./foo/**/*/*.js', { parts: true, tokens: true }));
// console.log(scan('foo/**/bar.js', { parts: true, tokens: true }));
// console.log(scan('foo/**/{bar,*/*}.js', { parts: true, tokens: true }));
// console.log(scan('foo/**/{bar,*/*}/*.js', { parts: true, tokens: true }));
// console.log(scan('!./foo/*.js'));
// console.log(scan('!./foo/*.js', { parts: true, tokens: true }));
