const pm = require('..');

console.log(pm.scan('foo/bar/*/*/*.js', { segments: true }));
console.log(pm.scan('foo/(*|a).js', { segments: true }));
console.log(pm.scan('foo/**/(*|a).js', { segments: true }));
console.log(pm.scan('foo/**/{**/*,}.js', { segments: true }));
console.log(pm.scan('foo/{**/*,}.js', { segments: true }));
