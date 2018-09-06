const pm = require('..');

// console.log(pm.parse('foo/bar/*/*/*.js', { segments: true }));
// console.log(pm.parse('foo/(*|**a).js', { segments: true }));
// console.log(pm.parse('foo/**/(*|a).js', { segments: true }));
// console.log(pm.parse('foo/**/(**|a).js', { segments: true }));
// console.log(pm.parse('foo/**/{**/*,}.js', { segments: true }));
// console.log(pm.parse('foo/{**/*,}.js', { segments: true }));
// console.log(pm.parse('/{**/*,}.js', { segments: true }));
// console.log(pm.parse('/[*/].js', { segments: true }));
// console.log(pm.parse('/(**/*|*).js', { segments: true }));
// console.log(pm.parse('foo/**/*.js', { segments: true }));
console.log(pm.makeRe('foo/**/*.js', { segments: true }));
// console.log(pm.parse('foo/*.js', { segments: true }));
// console.log(pm.parse('/foo', { segments: true }));
