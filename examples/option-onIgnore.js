
const pm = require('../lib');

const onIgnore = ({ glob, regex, input, output }) => {
  console.log({ glob, regex, input, output });
  // { glob: '*', regex: /^(?:(?!\.)(?=.)[^\/]*?\/?)$/, input: 'foo', output: 'foo' }
};

const isMatch = pm.matcher('*', { onIgnore, ignore: 'f*' });
isMatch('foo');
isMatch('bar');
isMatch('baz');
