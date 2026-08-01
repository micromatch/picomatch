# TEST_ANALYSIS.md — picomatch test suite anatomy

Measured from the actual suite (36 files, 1,977 `it()` blocks — verified by running `npx mocha` — ~9.4k assertion call sites). Per-file counts below are exact `it()` counts; "asserts" are grep-counted assertion call sites (higher than `it()` where loops/arrays are asserted).

## 1. How many test files

36 test files + 1 helper (`test/support/match.js`, in a subdir so mocha's `test/*.js` discovery skips it). All use `node:assert` + mocha. Only four import surfaces exist: `require('..')` (34 files), `require('../posix')` (1), `require('../lib/scan')` (1), `require('../lib/utils')` (1), `require('./support/match')` (9), `require('fill-range')` (2, devDependency used as an `options.expandRange` callback).

## 2. Per-file coverage

| File | its | asserts | Covers (via describe headers/content) |
|---|---|---|---|
| extglobs-bash.js | 648 | 650 | Every extglob operator (`?*+@!`) × nesting × positions, **bash-mode** semantics (`{ bash: true }`) |
| extglobs-minimatch.js | 642 | 643 | Same operator matrix under **minimatch-compatible** (default) semantics |
| dots-invalid.js | 152 | 1010 | Invalid dot segments: leading/nested `..`, `./`, trailing `.` — matching exclusions |
| bash.spec.js | 111 | 112 | bash spec-derived cases: dotglob, globstar, `GLOBIGNORE`-adjacent behavior |
| extglobs.js | 42 | 551 | Extglob negation corners, file extensions, statechar (`!(abc)` state) |
| api.scan.js | 40 | 334 | `scan()` deep-equals on full state; `{parts:true}` variants; glob-parent/glob-base ported corpus; "technically invalid windows globs" |
| special-characters.js | 39 | 479 | Unicode, control chars, quotes, regex metachars as literals, path chars |
| api.picomatch.js | 24 | 242 | API validation/errors, multi-pattern arrays, `.parse` **token-stream** asserts, `.state` (negatedExtglob, returnState) |
| regex-features.js | 26 | 202 | **JS-regex passthrough**: `\b`, lookbehinds `(?<!)(?<=)`, backreferences `\1`, regex groups, `require('../lib/utils')` → `basename` (L307-312) |
| posix-classes.js | 34 | 209 | `[[:alpha:]]` classes, bracket conversion, literals, `makeRe` sources |
| dotfiles.js | 23 | 257 | Leading dots with/without `options.dot`, valid dotfiles |
| negation.js | 13 | 228 | `!` patterns, double negation, `nonegate`, negation + globstars |
| globstars.js | 18 | 364 | `**` positions, trailing/leading globstars, slash interactions |
| stars.js | 17 | 288 | Single `*` behavior, dot/star interactions |
| slashes-posix.js | 18 | 1099 | `/` handling, trailing slashes, `strictSlashes` (posix table) |
| slashes-windows.js | 12 | 445 | `\\` ↔ `/` under `{ windows: true }`, `C:\…` paths, UNC-ish shapes |
| bash.js | 12 | 646 | bash 4.3 spec/unit port |
| braces.js | 17 | 147 | `{a,b}`, nested braces, ranges via `fill-range` `expandRange` callback, escaping |
| extglobs-temp.js | 11 | 1091 | Dense assertion-per-`it` extglob edge matrix (bash + other subgroups) |
| options.js | 16 | 93 | matchBase (+windows regression note L26), flags, nocase, noextglob in the old API |
| options.maxExtglobRecursion.js | 11 | 43 | ReDoS triage: recursion limits, **19 byte-exact `.source` asserts** on rewritten output, anti-catastrophic-backtracking `.test()` templates (L147-151) |
| qmarks.js | 10 | 85 | `?` behavior incl. platform branch |
| issue-related.js | 7 | 38 | Regression pinning for upstream issues #15 #23 #24 #58 #79 #127 |
| malicious.js | 5 | 16 | 65,500-char adversarial inputs, `maxLength` **exact error-message** asserts (L21-27), `Object.prototype` keys (`__proto__` etc.), byte-exact `makeRe().toString()` (L41) |
| minimatch.js | 8 | 37 | minimatch-parity cases incl. its issue backlog; direct `makeRe(...).test()` |
| non-globs.js | 4 | 35 | Literal filenames, no special chars |
| brackets.js | 3 | 10 | Bracket classes + trailing stars |
| api.posix.js | 2 | 5 | `posix.js` entry: no OS defaulting |
| options.ignore.js | 2 | 32 | `options.ignore`, hooks suppressed in ignore matcher |
| options.noextglob.js | 2 | 9 | `noextglob` disables extglob parsing |
| parens.js | 2 | 11 | Non-extglob parens (capturing groups in patterns) |
| options.format.js | 1 | 28 | Custom `options.format` on result `output` |
| options.onMatch.js | 1 | 23 | `onMatch` hook payloads |
| options.expandRange.js | 1 | 4 | Custom `expandRange` fn (fill-range `toRegex`) |
| options.noglobstar.js | 1 | 5 | `noglobstar` collapses `**` |
| wildmat.js | 2 | 43 | git/wildmat-derived semantics |

## 3. Which APIs the tests import/exercise

| API | Directly exercised by | Shape of assertions |
|---|---|---|
| `picomatch()` factory / `isMatch` | all 36 files | boolean |
| `makeRe` | options.maxExtglobRecursion.js, malicious.js, extglobs.js, minimatch.js, posix-classes.js, slashes-windows.js, special-characters.js | `.source`/`.toString()` byte-exact + `.test()` |
| `parse` | api.picomatch.js only (`.parse > tokens` describe) | exact `[type, value]` (and output) token streams for `a*.txt`, `{a,b}*`, `foo.(m\|c\|)js` |
| `scan` | api.scan.js only | deepStrictEqual on full 12-field state; `parts`/`tokens` variants |
| matcher `returnState`/`.state` | api.picomatch.js (`.state` describe) | `negatedExtglob` booleans via `picomatch('!(abc)', {}, true).state` |
| result `output` field | the 9 files importing test/support/match.js | collected `match.output` vs expected arrays |
| `matchBase` | options.js (incl. windows regression) | boolean |
| `toRegex` | braces.js:193, options.expandRange.js (via `fill-range` `{ toRegex: true }` callbacks) | indirect through makeRe |
| `test` | minimatch.js, options.maxExtglobRecursion.js, slashes-windows.js | `regex.test(...)` on emitted sources |
| `utils.basename` | regex-features.js:307-312 | exact strings incl. windows + trailing slashes |
| `compileRe`, `constants` | none directly | exercised only transitively |

## 4. Which behaviors are tested the most

1. **Extglobs dominate**: extglobs-bash (648) + extglobs-minimatch (642) + extglobs-temp (11 its / 1091 asserts) + extglobs (42/551) ≈ **68% of all `it()` blocks**. The `?(…)*(…)+(…)@(…)!(…)` matrix × nesting × concatenation is the suite's center of gravity.
2. **Dot-segment exclusion**: dots-invalid (152/1010) + dotfiles (23/257) + dot handling inside bash.spec and stars.
3. **Slash handling**: slashes-posix (1099 asserts) + slashes-windows (445) — trailing slash, `strictSlashes`, separator class tables.
4. **Negation**: negation (228) + extglob negation sections + bash.spec dotglob.

## 5–6. Module coverage intensity

- `lib/parse.js` — effectively covered by ~1,900 of the 1,977 its (every behavioral file), plus the only token-stream asserts (api.picomatch.js) and the only `.source` mass (options.maxExtglobRecursion.js). Highest coverage by far.
- `lib/picomatch.js` — api.picomatch.js, all options.*.js files, support/match-based files.
- `lib/scan.js` — exactly one file: api.scan.js (40 its). Small module, complete isolation.
- `lib/utils.js` — regex-features.js:307-312 only (basename). Other utils reached transitively.
- `constants.js` — indirectly via every makeRe output; POSIX class map directly via posix-classes.js and malicious.js (`__proto__` pollution guard).
- `index.js`/`posix.js` — api.posix.js + platform-branched files.

## 7. Edge cases that appear repeatedly

- Leading-dot exclusion in every star/qmark/globstar context (dotfiles, stars, globstars, bash.spec).
- Trailing slash acceptance when `strictSlashes` absent (slashes-posix/windows, stars).
- Backslash handling: windows separators vs escapes; **run-length ≥ 2 backslash collapsing** (slashes-windows, malicious's 65,500-char runs, special-characters).
- `./` prefix normalization (api.scan.js "leading ./", globstars, minimatch).
- Unbalanced `[`, `{`, `(` (dots-invalid, options.js, parens.js) and `strictBrackets` throwing.
- Empty patterns / empty input strings (api.picomatch validation).
- Object-prototype pollution keys: `__proto__`, `constructor`, `toString` as literal patterns (malicious.js) — why `POSIX_REGEX_SOURCE.__proto__` is nulled.
- Over-long input → exact `SyntaxError` message format (malicious.js L21-27, options.maxExtglobRecursion.js via `maxLength`).
- Negation chains and `!` parity (`!!`, `!!!`, `!(` extglob vs negate boundary) — negation.js, bash.spec.js.
- Regex passthrough: lookbehind/backreference patterns handed to the JS engine unchanged (regex-features.js).
- Windows drive-letter and backslash paths under `{ windows: true }` (slashes-windows.js).

## 8. Platform-specific tests

Exactly 5 guards, all of the form `if (process.platform !== 'win32')`:

| File | Guards | What they skip on Windows |
|---|---|---|
| bash.js | 1 | platform-dependent bash-semantic case |
| extglobs.js | 2 | extglob cases with `\` escapes |
| malicious.js | 1 | the 65,500-escape-run match (`'\\A'` vs 65,500 backslashes + 'A') |
| qmarks.js | 1 | `?`-with-backslash case |

Note this is only about **running on Windows**; windows *semantics* (`{ windows: true }` option) are tested unconditionally in slashes-windows.js regardless of host OS. CI runs the suite on ubuntu/windows/macos × node 12–25, so these guards are load-bearing — a ported adapter must reproduce identical guard outcomes on each OS.

## Score-relevant observations

- 68% of the suite is extglob-shaped; passes cluster. A port that lands extglobs early gains the largest single parity jump; stars/globstars/dotfiles are the long tail.
- 20+ assertions already byte-compare regex **sources** (oracle-1 style) — mostly in options.maxExtglobRecursion.js (ReDoS triage output) and malicious.js. These pin exact fallback/literalization strings including escape placement.
- Exact `SyntaxError` message **formats** are asserted (malicious.js L21-27): `Input length: ${len}, exceeds maximum allowed length: ${max}` — message equality is part of the contract.
- The 9 support/match-based files (braces, dotfiles, extglobs, globstars, options, options.format, options.ignore, options.onMatch, qmarks) pin the match result's `output` field (not just `isMatch`) — `windows` format normalization flows through `picomatch.test`'s `format` step.
