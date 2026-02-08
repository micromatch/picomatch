import pico from './lib/picomatch.js';
import { isWindows } from './lib/utils.js';

export default function picomatch(glob, options, returnState = false) {
  // default to os.platform()
  if (options && (options.windows === null || options.windows === undefined)) {
    // don't mutate the original options object
    options = { ...options, windows: isWindows() };
  }

  return pico(glob, options, returnState);
}

Object.assign(picomatch, pico);
