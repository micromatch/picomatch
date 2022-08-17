
const pm = require('../lib');

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
