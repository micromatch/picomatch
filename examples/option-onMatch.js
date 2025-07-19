'use strict';

const pm = require('..');

const onMatch = ({ glob, regex, input, output }) => {
  console.log({ input, output });
  // { input: 'some\\path', output: 'some/path' }
  // { input: 'some\\path', output: 'some/path' }
  // { input: 'some\\path', output: 'some/path' }
};

const isMatch = pm.matcher('**', { onMatch, windows: true });
isMatch('some\\path');
isMatch('some\\path');
isMatch('some\\path');
