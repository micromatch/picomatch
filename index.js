/*global navigator*/

'use strict';

const pico = require('./lib/picomatch');

const isWindows = () => {
  if (typeof navigator !== 'undefined' && navigator.platform) {
    const platform = navigator.platform.toLowerCase();
    return platform === 'win32' || platform === 'windows';
  }

  if (typeof process !== 'undefined' && process.platform) {
    return process.platform === 'win32';
  }

  return false;
};

function picomatch(glob, options, returnState = false) {
  // default to os.platform()
  if (options && (options.windows === null || options.windows === undefined)) {
    // don't mutate the original options object
    options = { ...options, windows: isWindows() };
  }

  return pico(glob, options, returnState);
}

Object.assign(picomatch, pico);
module.exports = picomatch;
