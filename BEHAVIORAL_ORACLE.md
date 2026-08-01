# BEHAVIORAL_ORACLE.md — every comparable behavior, ranked

An oracle is any observable behavior of the JavaScript implementation that can be compared, one input at a time, with the port. This document enumerates all ten, ranks them strongest → weakest, and defines the comparison order for the migration.

Evidence base: every claim below was verified against this checkout (v4.0.5). "Validated by" cites the original test files that already pin that behavior — those files are the ground truth the port's adapter must satisfy.

## Ranking summary

| # | Oracle | Byte-exact? | Differentially fuzzable? | Suite evidence today |
|---|---|---|---|---|
| 1 | Regex source string (`makeRe().source`) | Yes — identical strings | Yes — primary fuzz target | ~21 direct assertions, plus every boolean indirectly |
| 2 | `parse()` output + token stream | Yes — serializable | Yes — second fuzz tier | api.picomatch.js token-stream describes |
| 3 | `scan()` state object | Yes — serializable | Yes — cheap | api.scan.js (40 its, deep-equals) |
| 4 | Thrown errors (class + throw/no-throw) | Semantic (class), byte-exact boundary | Yes — crash parity | extglobs.js, special-characters.js, malicious.js, api.picomatch.js |
| 5 | Error messages (text) | Byte-exact where asserted | Yes, low yield (finite set) | api.picomatch.js:15-16, malicious.js:22-27, extglobs.js:14-15, special-characters.js:235-242 |
| 6 | Matcher boolean (`isMatch`) | Semantic (1 bit per triple) | Yes — oracle of last resort | ~1,900 of 1,977 its (the 40% score) |
| 7 | `match.output` / result-object fields | Semantic string equality | Yes | 9 support/match files, options.format.js |
| 8 | Option normalization/coercion | Byte-exact on normalized effect | Partially — it's the fuzz *matrix* dimension | options.js, options.noextglob.js:14-18, malicious.js (maxLength), api.posix.js |
| 9 | Platform-specific behavior | Byte-exact within fixed (flag, OS) pair | Partially — environment, not input, dimension | slashes-windows.js + 5 `process.platform` guards |
| 10 | Performance benchmarks | No — distributions, environment-bound | No (not a parity oracle) | bench/ (separate package, minimatch-relative) |

Why this order: oracles 1–5 are **total, deterministic, and comparable at character precision** — a single check gives a decisive verdict. Oracles 6–7 give only 1 bit or a derived string per check, but carry the bulk of suite mass (and the score). Oracles 8–9 are matrix modifiers that multiply the inputs to oracles 1–7 rather than adding new comparison points. Oracle 10 is not a correctness oracle at all.

---

## 1. Regex source string — `makeRe(pattern, options).source`

- **What is compared:** the complete regex source string produced for a (pattern, options) pair — before compilation *and* before matching. This is the library's actual product: parse emits `state.output`, `compileRe` wraps it in anchors/negation wrappers, `toRegex` compiles it. Comparing `.source` covers the entire compile pipeline in one string.
- **Why it is valuable:** it makes equivalence a *total function* check at character precision instead of a sampled one. A source that is byte-identical under every option for every fuzz pattern is near-proof of implementation equivalence; a boolean match with a divergent source is a latent failure on an untried input. It also exposes *why* a boolean differs.
- **Validated by:** options.maxExtglobRecursion.js (19 byte-exact `.source` assertions on ReDoS-triage output), malicious.js:41 (byte-exact `makeRe('[[:constructor:]]').toString()`), extreme and representative booleans everywhere else (each boolean assertion implicitly pins a source that yields it).
- **Byte-exact or semantic:** **byte-exact.** Character-for-character, including escape placement, non-capturing-group spelling `(?:` vs capturing `(`, and `(?=.)`/lookahead ordering.
- **Differential fuzzing:** **Yes — the primary fuzz oracle.** Rulebook oracle 1: every fuzz iteration compares this first across the pattern grammar (stars, globstars, braces, extglobs, POSIX classes, brackets, escapes, negation, windows separators) × the option matrix. Divergences shrink to a minimal pattern that produces a different source string.

## 2. `parse()` output state and token stream — `picomatch.parse(pattern, options)` (with `fastpaths:false`)

- **What is compared:** the full structural state — `output` (unanchored body), `negated`, `negatedExtglob`, `dot`, counters, and the **token array** with per-token `type`/`value`/`output` (serializable canonically). Compare field-by-field, tokens in order.
- **Why it is valuable:** it is strictly *more* informative than oracle 1: the unanchored `output` separates parse's work from compileRe's wrapping, and the token stream reveals structural divergence (wrong token types, split text tokens, missing lookbehind edits) that the final string can mask (e.g. two different token streams that concatenate to the same string). Also the only exposure of `returnState` semantics used by `picomatch(state, opts)`.
- **Validated by:** api.picomatch.js `describe('.parse > tokens')` — exact `[type, value]` and `{output, value}` streams for `a*.txt`, `{a,b}*`, `foo.(m|c|)js` (lines 317-366); `describe('.state')` — `negatedExtglob` booleans via `picomatch('!(abc)', {}, true).state` (L367-377+).
- **Byte-exact or semantic:** **byte-exact** after canonical serialization (functions on state — `peek`/`advance` — are dropped; no reference identity compared except token linkage order).
- **Differential fuzzing:** **Yes — second tier.** Always run after oracle 1; a structural increment over strings, especially for state flags (`negated`, `negatedExtglob`, `backtrack`-independent shapes) and fastpath-vs-full-parse shape differences (fastpath state is the small `{negated, fastpaths, output}` object — itself an observable divergence point for `returnState` consumers).

## 3. `scan()` state object — `picomatch.scan(pattern, options)` / `require('../lib/scan')`

- **What is compared:** the complete scan state: `prefix, input, start, base, glob, isBrace, isBracket, isGlob, isExtglob, isGlobstar, negated, negatedExtglob`, plus with options `parts`/`tokens`: `parts` arrays, `slashes` index arrays, per-token `value/depth/isGlob/…`, and `maxDepth` (globstar depth = `Infinity`, serialized as e.g. `null` in JSON — define the canonical mapping).
- **Why it is valuable:** scan is a standalone public surface used by downstream tooling (glob-parent/glob-base users). It is cheap to evaluate, fully deterministic, and its 12-field shape catches index-arithmetic bugs (`start`, `lastIndex`, prefix shifting, `./` and `!` handling) that never surface in boolean matching since the match pipeline doesn't consume scan.
- **Validated by:** api.scan.js — 40 its of `assert.deepStrictEqual` on entire state objects, including the ported glob-parent/glob-base corpus, `{ parts: true }` part arrays, and "technically invalid windows globs" shapes.
- **Byte-exact or semantic:** **byte-exact** on canonical serialization (field names, order, string contents, numeric indices).
- **Differential fuzzing:** **Yes.** Same generator as oracle 1, different projection. High yield-per-cost for separator/negation-prefix edge cases (`!./foo/*.js` → `prefix: '!/'`, `start: 3`).

## 4. Thrown errors — the throw/no-throw boundary and error class

- **What is compared:** for every (input, API, options): *does it throw?* and *which class* — `TypeError` vs `SyntaxError` vs clean return. The library has exactly 13 throw sites (12 explicit throws + 1 engine-error rethrow; see appendix), plus an implicit contract everywhere else: picomatch **never throws** for a well-typed glob, no matter how adversarial (unbalanced `[ { (`, 65k-char inputs, prototype-pollution keys).
- **Why it is valuable:** throw-parity failures are catastrophic and silent in boolean fuzzing (an exception ≠ false). The never-throws property is load-bearing for the "no `unwrap()`/panic" Rust rule and is what users of the `/$^/` fallback rely on.
- **Validated by:** api.picomatch.js:13-17 (TypeError on `''`/`null` patterns), extglobs.js:13-16 and special-characters.js:230-245 (strictBrackets SyntaxErrors), malicious.js:20-31 (maxLength SyntaxErrors, 65,500-char non-throws).
- **Byte-exact or semantic:** **semantic on class** (`TypeError`/`SyntaxError`/none — a Rust port has its own error types; the class correspondence is the comparison), **byte-exact on the boundary condition** (exactly the same inputs throw).
- **Differential fuzzing:** **Yes.** Grammar fuzz deliberately feeding unbalanced constructs, empty/whitespace patterns, lone `\`, NUL, `maxLength` edges (N−1/N/N+1), and 100k inputs; compare "threw / class / not" per input. This is also the panic-freedom proof for the port.

## 5. Error messages — the exact text

- **What is compared:** message strings for each throw site, including interpolations: `Input length: ${len}, exceeds maximum allowed length: ${max}` (with the **clamped** `max`, e.g. `maxLength: 499` → `...length: 499`), and the six `Missing {opening|closing}: "${char}" - use "\\${char}" to match literal characters` variants.
- **Why it is valuable:** three message families are asserted literally in the suite — message *format* is part of the contract (the maxLength message's two numbers are checked at 65540/65536 and 504/499, proving the `Math.min(MAX_LENGTH, opts.maxLength)` clamp is observable in text). One family is engine-owned and non-portable: `debug:true` rethrows V8's own RegExp construction error (picomatch.js:L344-L346) — that text cannot be required of a Rust engine.
- **Validated by:** api.picomatch.js:15-16 (`/Expected pattern to be a non-empty string/`), malicious.js:22-27 (`/exceeds maximum allowed/`, exact `Input length: 65540, exceeds maximum allowed length: 65536`), extglobs.js:14-15 (`/Missing closing: "\)"/i`, `/Missing opening: "\("/i`), special-characters.js:235-242.
- **Byte-exact or semantic:** **byte-exact for library-owned messages** (all 12 sites are fixed templates with numeric interpolation); **semantic-only for the debug rethrow** (compare "throws", not the engine's prose).
- **Differential fuzzing:** **Yes, but low yield** — the message set is finite; fuzzing reduces to verifying the `${len}`/`${max}` interpolation and template selection. Do once, then fold into oracle 4's harness.

## 6. Matcher boolean — `isMatch(str, pattern, options)`

- **What is compared:** the final match decision for a (string, pattern, options) triple. This is the only oracle positions 1–5 don't imply — the boundary between compile-time and match-time (literal-equality shortcut, `format`/`basename` fallbacks, `capture`-forced exec, `ignore` post-filter, `on*` hooks).
- **Why it is valuable:** it is **the score** (40%: the unmodified mocha suite is overwhelmingly boolean), and it is the end-to-end integration check — a pipeline can pass oracles 1–5 and still diverge here (e.g. regex-execution semantics, `Boolean(execResult)` coercion, string-equality shortcut ordering).
- **Validated by:** essentially every file — ~1,900 of the 1,977 its, with mass concentrated in extglobs-* (≈68% of the suite), dots-invalid, slashes-*, negation.
- **Byte-exact or semantic:** **semantic** (one bit per triple; cannot distinguish two sources that happen to agree on this input).
- **Differential fuzzing:** **Yes — last tier.** Run only after oracles 1–3 agree on a pattern; boolean divergences then isolate *match-time* code (test() shortcuts, ignore/hooks, capture paths) and regex-engine behavioral gaps. A boolean divergence with byte-identical source is evidence against the regex executor, not the compiler.

## 7. `match.output` and the result object — `matcher(input, true)`

- **What is compared:** the `output` field of the match result (the possibly-format-transformed input: `toPosixSlashes` under `windows`, or `options.format`), the `match` array (capture groups when `options.capture`), and result-object field set `{glob, state, regex, posix, input, output, match, isMatch}` including the `ignore`-flipped `isMatch` and hook firing order (`onResult` fires even on non-match).
- **Why it is valuable:** output normalization is a silent-failure zone: nine files assert collected `output` values, not just booleans — windows slash normalization, `format` overrides, and capture arrays all flow through `picomatch.test`'s short pipeline (picomatch.js:L128-L156).
- **Validated by:** the 9 files importing test/support/match.js (braces, dotfiles, extglobs, globstars, options, options.format, options.ignore, options.onMatch, qmarks), which assert `match.output` arrays via deep-equal; options.format.js (custom format); api.picomatch.js (result-object use).
- **Byte-exact or semantic:** **semantic string equality** — `output` is compared as a string per input (it is deterministic, but it is a derived projection of one behavior, narrower than the raw artifact).
- **Differential fuzzing:** **Yes**, paired with oracle 6 in the same harness (compare full result object, not just the boolean) — and it is the only way to fuzz `windows: true` *output* normalization, distinct from windows *matching*.

## 8. Option normalization and coercion

- **What is compared:** the *normalized effect* of options before compilation: the `noext`→`noextglob` alias (parse.js:L408-L410, applied only when `typeof noext === 'boolean'`), `maxLength` clamping (`Math.min(MAX_LENGTH, opt)` observable in error text and boundary), `noext` post-blanking of `isExtglob`/`isGlob` in scan (scan.js:L288-L291), `windows` defaulting gated on an options object existing (index.js:L8-L11), `matchBase|basename` equivalence, `nocase`/flags resolution order (`opts.flags || (nocase ? 'i' : '')`), and truthiness vs strict-boolean coercions (`opts.x === true` vs `!== false` vs `?? d`) as enumerated in ARCHITECTURE.md §5's coercion table.
- **Why it is valuable:** coercion bugs are the single largest mass-failure axis (per the review prompt's check #4): one wrong `!== false` vs `=== true` flips dozens of booleans. Normalization is where option semantics are *decided* — compare there, not at 50 downstream sites.
- **Validated by:** options.noextglob.js:14-18 (`noext` alias), options.js (`flags`/`nocase` resolution, matchBase+windows), malicious.js:28-31 (`maxLength` clamp), api.posix.js (no platform defaulting on the posix entry).
- **Byte-exact or semantic:** **byte-exact on the normalized options object** (the post-coercion option set feeding oracles 1–7) — but the comparison point is a *function of options*, i.e. an equivalence-class probe: `f(opts)` under aliased/coerced forms must equal `f(canonical opts)`.
- **Differential fuzzing:** **partially** — options are the fuzz *matrix dimension* rather than a comparison artifact. What is fuzzable are coherence relations: `noext:true` ≡ `noextglob:true`, `maxLength:9999` ≡ `maxLength:9999` clamped identity, presence-vs-absence of the options object. These belong in the fuzzer's option-matrix generator.

## 9. Platform-specific behavior

- **What is compared:** behavior under (a) the `{ windows: true }` option — fragment table swap, backslash-separator handling, `C:\…` paths, `basename` splitting on `[\\/]`, output normalization to posix slashes — and (b) host-OS differences on the 5 `process.platform !== 'win32'` guarded tests, plus `index.js`'s OS-dependent defaulting (`pm('*')` vs `pm('*', {})` on a Windows host).
- **Why it is valuable:** the Windows fragment table changes 11 of 16 fragments; entire boolean landscapes shift. CI runs ubuntu/windows/macos — host-OS guards are load-bearing, and the option-vs-default asymmetry (#133) is itself a pinned behavior.
- **Validated by:** slashes-windows.js (445 assertion sites, all `{ windows: true }`, host-OS-independent), test/regex-features.js:307-312 (`basename` windows forms), bash.js/extglobs.js×2/malicious.js/qmarks.js (the five host-OS guards), api.posix.js (no-default assertion).
- **Byte-exact or semantic:** **byte-exact within a fixed (flag, host-OS) pair** — compare like-for-like runs; never compare outputs across different (flag, OS) contexts.
- **Differential fuzzing:** **partially** — `windows` is a fuzz option-matrix dimension (fully fuzzable on any host); host-OS dependence needs the same corpus replayed on three OSes (CI matrix), not input fuzzing.

## 10. Performance benchmarks

- **What is compared:** throughput/latency/resource distributions: `makeRe` compile throughput vs minimatch (bench/index.js suites: `*`, `**`, `**/**/**`, `*.txt`, `{a,b,c}*.txt`, `{a..z}*.txt`, bracket/range forms), load/require time (bench/load-time.js), first-match latency (bench/first-match-*.js), plus port-side cold start (`pmx '*'` vs `node -e require(...)`), match p50/p95/p99/max, and peak RSS — per the rulebook's honest-numbers requirements.
- **Why it is valuable:** "speed is the product" — but only after parity. Performance also *detects* correctness shortcuts accidentally (a port that skips ReDoS triage is faster and wrong; `test/malicious.js` makes that speedup visible as a hang). Performance differences explain, never excuse, behavioral divergence.
- **Validated by:** no test correctness-couples to performance; bench/ is a separate package comparing picomatch vs minimatch.
- **Byte-exact or semantic:** **neither — statistical.** Distributions (histograms, percentiles), not point values, with confounders disclosed (JIT warmup, allocator, CPU pinning).
- **Differential fuzzing:** **No** — not a parity oracle. It runs on a fixed benchmark corpus post-parity, tracked over time; the only fuzz-adjacent use is feeding `test/malicious.js`-class adversarial inputs to both sides to prove the port doesn't escape the ReDoS mitigations (a bounded-**time** behavioral assertion, not a benchmark).

---

## Recommended comparison order for the migration

```
for each (pattern, options) pair from the grammar×matrix generator or the failing test:
  1. makeRe().source            — byte-identical?        (oracle 1)  ── stop; fix compile
  2. parse() state+tokens       — structurally equal?     (oracle 2)  ── localize to a token rule
  3. scan() state               — structurally equal?     (oracle 3)  ── isolate scanner index math
  4. throw parity (class)       — same boundary, same class? (oracle 4)
  5. error message text         — byte-identical where library-owned? (oracle 5)
  6. isMatch(str)               — same boolean?           (oracle 6)  ── only now touch match-time code
  7. result.output/match array  — same string/captures?   (oracle 7)  ── isolate format/ignore/hooks
  ── options 8 and platform 9 run as the generator matrix around 1–7, not as steps ──
  10. performance               — only after 1–7 hold suite-wide; separate honest track
```

Stop-and-fix rule: never investigate oracle N+1 while oracle N diverges — a lower-stage divergence invalidates every downstream comparison (a changed source makes a boolean agreement meaningless, and a changed token stream makes the source's agreement coincidence). In practice the daily loop inverts this list once: run the boolean suite first *for triage ranking* (which file loses most), then debug each failure by walking oracles 1→7 downward until the first divergence.

### Appendix — complete throwable inventory (13 sites)

| Site | Class | Message template | Asserted by |
|---|---|---|---|
| picomatch.js:L58-L60 | TypeError | `Expected pattern to be a non-empty string` | api.picomatch.js:15-16 |
| picomatch.js:L129-L131 | TypeError | `Expected input to be a string` | (not directly asserted) |
| picomatch.js:L306-L308 | TypeError | `Expected a non-empty string` | (not directly asserted) |
| parse.js:L357-L359 | TypeError | `Expected a string` | (not directly asserted) |
| parse.js:L364-L369 **and** L1332-L1336 (two sites, same template) | SyntaxError | `Input length: ${len}, exceeds maximum allowed length: ${max}` (max = `Math.min(65536, opts.maxLength)`) | malicious.js:22-27 |
| parse.js:L795-L796 | SyntaxError | `Missing opening: "(" - use "\\(" to match literal characters` (mid-loop `)` with zero parens, strictBrackets) | extglobs.js:15, special-characters.js:235 |
| parse.js:L816-L817 | SyntaxError | `Missing closing: "]" …` (`[` with no remaining `]`, strictBrackets) | special-characters.js:242 |
| parse.js:L836-L837 | SyntaxError | `Missing opening: "[" - use "\\[" …` (`]` with zero brackets, strictBrackets) | special-characters.js:241 |
| parse.js:L1287 | SyntaxError | `Missing closing: "]" …` (strictBrackets recovery loop) | (same family as above) |
| parse.js:L1292-L1294 | SyntaxError | `Missing closing: ")" …` (unclosed `(`, strictBrackets recovery loop) | extglobs.js:14, special-characters.js:236 |
| parse.js:L1298-L1300 | SyntaxError | `Missing closing: "}" …` (unclosed `{`, strictBrackets recovery loop) | (family asserted via extglobs/special-characters `a(b`/`a)b` analogues) |
| picomatch.js:L344-L346 (toRegex) | rethrow | engine-owned RegExp error text, only under `debug === true` | none — semantic-only comparison |
