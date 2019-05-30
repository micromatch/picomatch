'use strict';

const os = require('os');
const path = require('path');
const pico = require('..');

const onVariable = (token, state) => {
  console.log(token);
  // console.log(state)
};

if (process.platform === 'win32') {
  let variables = { ...process.env, rootDir: 'C:\\Program files (x86)\\<USERNAME>' };
  let options = { variables, onVariable, windows: true };
  let regex = pico.makeRe('!./<rootDir>/test/{foo,bar,baz}/.test.js', options);
  console.log(regex);

} else {
  let variables = { ...process.env, rootDir: '!/Users/<USER>/' };
  let options = { variables, onVariable };
  let regex = pico.makeRe('./<rootDir>/test/{foo,bar,baz}/.test.js', options);
  console.log(regex);
}
