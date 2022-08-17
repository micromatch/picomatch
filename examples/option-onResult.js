
const pm = require('../lib');

const onResult = ({ glob, regex, input, output }) => {
  console.log({ input, output });
};

const isMatch = pm.matcher('*', { onResult, ignore: 'f*' });
isMatch('foo');
isMatch('bar');
isMatch('baz');
