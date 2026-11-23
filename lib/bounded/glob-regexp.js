'use strict';

// The regex for a source picomatch built, made so that a long input cannot stall it. What comes
// back is always a plain RegExp from picomatch's own source and flags, so everything a caller
// can read off it (source, flags, toString, its prototype, capture groups) is picomatch's. The
// source is read and its backtracking classified once, when the regex is made
// (backtracking.js), and the class decides the rest:
//
// - linear: the RegExp is returned as it is. Nothing can stall it, and it costs exactly what
//   picomatch's costs, on every engine.
// - polynomial: the RegExp carries its own test() and exec(), not enumerable. Up to the length
//   at which its work reaches WORK_BUDGET the regex itself runs; past it a DFA built as inputs
//   reach it decides.
// - exponential, or not decided: the same two methods, with the DFA deciding every input.
//
// The DFA cannot backtrack. A string that does not match returns false or null without the
// regex running; one that does match is handed to the regex by exec() for its groups. So the
// work on an input of n code units is at most the larger of WORK_BUDGET and a multiple of n.
//
// String.prototype.match, replace and search reach the object through its own exec(). split
// does not: the spec has it build a new RegExp from this one and run that, so split backtracks
// exactly as picomatch's regex does.

const { machine, TooLarge } = require('./dfa');
const { read, forTest } = require('./regex-reader');
const { regexLengthLimit, keptLimit } = require('./backtracking');

const builtinExec = RegExp.prototype.exec;
const made = new WeakSet();

// The flags picomatch uses: none, or i for nocase. Anything else is not built and gives null.
// limits.dfa 'always' sends every input to the DFA, which is how the tests reach it on globs
// whose regex would otherwise answer.
function globRegExp(source, flags, limits = {}) {
  if (flags !== '' && flags !== 'i') return null;
  const always = limits.dfa === 'always';
  // A source already known to be linear needs no reading at all.
  if (!always && keptLimit(source, flags) === Infinity) return new RegExp(source, flags);
  // One reading of the source serves the classifier and, later, the DFA. A source the reader
  // cannot read throws here, and the caller falls back.
  const tree = read(source, { ignoreCase: flags === 'i' });
  const lengthLimit = always ? -1 : regexLengthLimit(source, flags, tree);
  const re = new RegExp(source, flags);
  if (lengthLimit === Infinity) return re;

  // The same regex without the methods below, for the engine's own test().
  const plain = new RegExp(source, flags);
  let dfa = null;
  // Set once the DFA grows past its state limit; from then on the regex answers alone.
  let fallback = null;

  // true when the regex itself may run on this input.
  const bounded = text => text.length <= lengthLimit || fallback !== null;
  function byDfa(text) {
    try {
      if (dfa === null) dfa = machine(forTest(tree), limits);
      return dfa.test(text);
    } catch (err) {
      if (!(err instanceof TooLarge)) throw err;
      fallback = err.message;
      dfa = undefined;
      return plain.test(text);
    }
  }

  // Own properties, not enumerable, so deepStrictEqual and a property listing see picomatch's
  // regex; writable, as the prototype's methods are.
  Object.defineProperty(re, 'test', {
    value: function test(input) {
      const text = String(input);
      return bounded(text) ? plain.test(text) : byDfa(text);
    },
    writable: true, configurable: true, enumerable: false
  });
  Object.defineProperty(re, 'exec', {
    value: function exec(input) {
      const text = String(input);
      if (!bounded(text) && !byDfa(text)) {
        if (re.global || re.sticky) re.lastIndex = 0;
        return null;
      }
      return builtinExec.call(re, text);
    },
    writable: true, configurable: true, enumerable: false
  });
  Object.defineProperty(re, 'fallback', { get: () => fallback, enumerable: false, configurable: true });
  Object.defineProperty(re, 'states', { value: () => (dfa ? dfa.states() : 0), enumerable: false, configurable: true });
  made.add(re);
  return re;
}

// Whether a regex came back with the DFA behind it; false for a linear one, returned plain.
const isGlobRegExp = re => made.has(re);

module.exports = { globRegExp, isGlobRegExp };
