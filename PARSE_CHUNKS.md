# PARSE_CHUNKS.md — lib/parse.js implementation chunking plan (v4.0.5)

Basis: full read of `lib/parse.js` (1,416 lines) + empirical probes against this checkout. Chunks are split by **logical responsibility**, sized so each is independently implementable and verifiable against the original via oracle 1 (`makeRe().source` byte identity) and the named test files. No Rust code yet — approval gate before C0 starts.

> ⚠️ **Empirical fact that shapes this plan** (verified against this checkout): the fastpath gallery and the main loop are **not byte-identical and can diverge semantically** on the same pattern. Examples: `makeRe('.*').test('..')` → `true`, but `toRegex(parse('.*').output)` → `false`; `makeRe('*.js').test('a.js/')` → `true`, slow path → `false`. Root cause: `makeRe` routes patterns starting with `.` or `*` through `parse.fastpaths` (lib/picomatch.js:L312), whose templates differ (missing/extra lookaheads, unconditional `\/?` suffix). Tests exercise the `makeRe` behavior. **Both behaviors must be ported as-is (bug-for-bug).** This is a bug-catcher candidate (oracle-1 vs oracle-2 public disagreement) — log it for DECISIONS.md later; do not "fix" it.

## Chunk map

Terminology: "branch fragment" = a named sub-branch of the main loop's dispatch, since several chunks own *parts* of one physical branch. Branch fragmentation is intentional — it follows the dependency structure, not the file layout.

---

### C0 — Foundation: state, token machinery, recovery, return

| | |
|---|---|
| **Purpose** | Everything that makes the parser *be* a parser: module header/`require`s, guards, option coercion, per-call fragment closures, the `state` object, cursor ops, `push`, recovery loops, dirty-flag rebuild, `return state`. |
| **Lines** | L1-L16, L44-L46, L356-L521 **minus** L457-L473 (`negate`), L493-L505 (globstar demotion block inside `push`), L523-L600 (extglob open/close); L1286-L1322. |
| **Includes** | Type/length guards (+ `REPLACEMENTS` map, `maxLength` clamp), platform-table binding (`globChars`, `extglobChars`), closures (`globstar(opts)`, `star`, `nodot`, `qmarkNoDot`, `capture`), minimatch alias `noext`→`noextglob`, `bos` token + `state{}` init, `utils.removePrefix`, helpers `eos/peek/advance/remaining/consume/append/increment/decrement`, `push` (text-merge + extglob-`inner` accumulation only), `syntaxError`, recovery loops (`escapeLast`), `maybe_slash` affix, backtrack rebuild, return. |
| **State fields touched** | All of them (defines them): `input, index, start, dot, consumed, output, prefix, backtrack, negated, brackets, braces, parens, quotes, globstar, tokens` |
| **Depends on** | `constants.js` (both fragment tables, `POSIX_REGEX_SOURCE`, regexes, `REPLACEMENTS`, `MAX_LENGTH`), `utils.js` (`escapeRegex`, `removePrefix`, `escapeLast`) |
| **Difficulty** | 3 / 5 |
| **Risk** | High — every later chunk sits on this scaffolding; a wrong `push` semantics invalidates all downstream byte comparisons. |
| **Tests** | malicious.js (length guards, exact `Input length: N, exceeds…` messages), api.picomatch.js (`.parse > tokens` eventually), non-globs.js (as smoke) |
| **Definition of Done** | (a) `parse('abc', {})` returns a state whose `output` is `\\?`-free literal `abc` and whose `tokens` are `[bos, text]`; (b) `parse(123)` throws `TypeError('Expected a string')`; (c) `parse('*'.repeat(65537))` throws `SyntaxError` with the exact interpolated message; (d) `parse('***')` yields identical output to `parse('*')` post-REPLACEMENTS; (e) unbalanced `'a['` (strictBrackets unset) terminates with `[` escaped via `escapeLast` semantics; (f) oracle-1 byte-identity vs `lib/parse.js` for a fixture set of literal patterns through both fastpaths-disabled `parse` and the state shape. |

**Boundary contract:** `push` ships **without** the globstar-demotion block (L493-L505); C8 inserts it. The tokenizer while-loop shell itself is owned by C1; C0 provides everything it calls.

---

### C1 — Main loop dispatcher: NUL, escapes, quotes, text, inline fastpath

| | |
|---|---|
| **Purpose** | The `while (!eos())` loop skeleton with the exact branch **order** of the source, filled in for the four simplest responsibilities; plus the inline-fastpath early exit that bypasses the loop for construct-free patterns. |
| **Lines** | L606-L655 (inline fastpath), L661-L711 (NUL + escapes incl. run-collapse), L765-L782 (quotes), L1109-L1122 (text coalescing + `$`/`^` escaping). |
| **Includes** | `while(!eos())` shell; ``\u0000`` skip; `\` handling (`\/` bash guard, `\.`/`\;` skip, trailing `\`, `\\\…` run-collapse run-length parity, `unescape` option); in-quote per-char `escapeRegex`; `keepQuotes`; plain-text run coalescing via `REGEX_NON_SPECIAL_CHARS` + `push` text-merge; inline-fastpath: `REGEX_SPECIAL_CHARS_BACKREF` single-replace pass + `utils.wrapOutput` + early `return state`. |
| **State fields touched** | `index, consumed, output, quotes, tokens, backtrack` (indirectly) |
| **Depends on** | C0 (+ `utils.wrapOutput`) |
| **Difficulty** | 2 / 5 |
| **Risk** | Medium — escape-run collapsing (`slashes % 2`) and the `\`→`/`-guard interactions are edge-dense; inline fastpath must route *exactly* the patterns the regex admits (any deviation sends a pattern down the wrong pipeline → source bytes diverge). |
| **Tests** | non-globs.js, special-characters.js (literal/control-char subsets), malicious.js (65,500-backslash runs), extglobs.js escapes guards (partial) |
| **Definition of Done** | (a) oracle-1 byte-identity on a fuzz corpus of literal/escaped/quoted patterns (no wildcards) for both routes — inline fastpath (`parse`, default) and forced slow path (`fastpaths:false`); (b) routing predicate equivalence: for every fuzz pattern, port chooses inline-fastpath vs loop exactly when the original does (observable via `state.tokens` presence); (c) NUL and quote cases from special-characters.js pass. |

---

### C2 — Segment semantics: slash handling, dot handling, `./` collapse

| | |
|---|---|
| **Purpose** | Everything about path separators and dot segments: the `/` branch, the leading `./` collapse, the `.` branch (except its brace-range hook). |
| **Lines** | L975-L991 (slash + `./` collapse), L997-L1015 (dot branch) **minus** L998-L1006 (brace `dots` hook → C5). |
| **Includes** | `SLASH_LITERAL` emission; `dot`→`DOT_LITERAL` with the `dot` token type reserved for brace/BOS-adjacent positions vs `text` type elsewhere (`state.braces + state.parens === 0 && prev not bos/slash`); `/` after leading `dot` token: pop token, reset `output`/`consumed`, move `start`. |
| **State fields touched** | `output, tokens, index, start, consumed` (reset), `braces, parens` (read) |
| **Depends on** | C1 |
| **Difficulty** | 2 / 5 |
| **Risk** | Low-medium — the `./` collapse mutates three state fields and pops a token; easy to get the token stream wrong while the output stays right (oracle-2 fails while oracle-1 passes). |
| **Tests** | slashes-posix.js (text-segment cases), dots-invalid.js (later, with C3/C8), api.picomatch.js `./foo/**/*.txt` token/stream cases |
| **Definition of Done** | (a) oracle-1 on `./a`, `a/./b`, `a/../b`, `a//b` class patterns; (b) oracle-2: token streams for `./a/b` contain **no** residual `dot`/`slash` for the prefix and `start` advanced by 2; (c) `dot`-vs-`text` token typing matches original across the 3-context matrix. |

---

### C3 — Single wildcards: `?` and `*`, with BOS/dot guards

| | |
|---|---|
| **Purpose** | The qmark branch (including its regex-group disambiguation after `(`) and the plain-star branch with all guard emission — *excluding* globstar and extglob openers (those belong to C7/C8 and are named branch fragments below). |
| **Lines** | L1021-L1047 (qmark) **minus** L1023-L1026 (`extglobOpen('qmark')` → C7); L1246-L1283 (plain star) **plus** the `+'+' in branches it shares. |
| **Includes** | `?(…)` vs `(?` regex-lookaround/group detection after `(` (value/output decision `\\?` vs raw), `QMARK_NO_DOT` at BOS/slash unless `opts.dot`, `QMARK` elsewhere; single-star token w/ `nodot`/`NO_DOTS_SLASH`/`NO_DOT_SLASH` prefix-guard selection by `prev.type` (`slash`/`bos`/`dot`) and `opts.dot`, `ONE_CHAR` emission unless `peek()==='*'`, `bash` fork (`.*?`, `nodot` prefix at bos/slash), `opts.regex === true` pass-through after bracket/paren. |
| **State fields touched** | `output, tokens, consumed, backtrack` (via demote), `globstar`, `index` |
| **Depends on** | C2 (slash/dot token types consumed by guards) |
| **Difficulty** | 3 / 5 |
| **Risk** | Medium-high — guard-order sensitivity: the extglob-open check (C7) will be inserted *above* the paren-disambiguation when it lands; qmark/star guard matrices across `{dot, bash, regex} × {bos, slash, dot, other}` are where boolean mass-failures start. |
| **Tests** | qmarks.js, stars.js, dotfiles.js (with dot), special-characters.js qmark section; (parens.js + regex-features.js additionally need the `(`/`)` branches — owned by C7) |
| **Definition of Done** | (a) oracle-1 over the full guard matrix (fixture generator covering prev-type × dot × bash × regex × capture); (b) `?` after `(` byte-parity including the `(?<!)-style` lookaround cases from regex-features.js; (c) qmarks.js + stars.js boolean green (patterns not using `**`); (d) bash-mode star outputs from bash.spec.js single-star cases. |

---

### C4 — Fastpath gallery (`parse.fastpaths`)

| | |
|---|---|
| **Purpose** | The closed-form template engine `makeRe` routes `.`/`*`-leading patterns to: REPLACEMENTS + maxLength guard + `create()` template switch + `/^(.*?)\.(\w+)$/` chain + `strictSlashes`/`capture`/`bash`/`dot`/`noglobstar` variants. **Behaviorally load-bearing** — see the warning at the top: its output intentionally differs from the slow path, and tests pin the fastpath output. |
| **Lines** | L1324-L1414 (+ its makeRe-side gate contract noted here: `input[0] === '.' || input[0] === '*'`, lib/picomatch.js:L312-L314). |
| **Includes** | `parse.fastpaths` entirety: template cases `*`, `.*`, `*.*`, `*/*`, `**`, `**/*`, `**/*.*`, `**/.*`, extension-chain fallback, `nodot`/`slashDot` selection, `globstar(opts)` (with `noglobstar === true` → `star`), unconditional `\/?` suffix when `strictSlashes !== true`, `removePrefix`. |
| **State fields touched** | None (own mini-state `{ negated:false, prefix:'' }` + closure locals) |
| **Depends on** | C0 only (constants + `utils.removePrefix`) — **independent of C1-C3** |
| **Difficulty** | 2 / 5 |
| **Risk** | High — not because it's intricate, but because this is the *production code path* for the most common patterns (`*.js`, `**`, `.*`), yet it byte-diverges from the slow loop (verified); any "cleanup to match the loop" here is an oracle-1 failure factory, and the `state` shape it feeds (`{negated, fastpaths:true, output}`) is observable via `returnState`. |
| **Tests** | everything `makeRe`-routed: stars.js, dotfiles.js, extglob-suite use-through, options.js; DIRECT: none own it — validation is byte-fuzz |
| **Definition of Done** | (a) port's `fastpaths(pattern, opts)` returns the original's exact string (including `undefined` routing) for a systematic corpus: 8 template cases × `{dot, bash, capture, noglobstar, strictSlashes, windows}` × extension-chain depth 0-3; (b) divergence lock-in: port reproduces the documented divergences (`'..' vs '.*'` → match, `*.js`/`a.js/` → match) byte-for-byte; (c) `makeRe` routing order identical (fastpaths tried first, `undefined` ⇒ full parse). |

---

### C5 — Braces: alternation, ranges, `expandRange`

| | |
|---|---|
| **Purpose** | `{`/`}` frames, comma alternation, dot-dot range assembly with token-list surgery, the `expandRange` helper (incl. custom-callback path). |
| **Lines** | L22-L38 (`expandRange`), L881-L940 (`{`/`}`), L958-L969 (comma), L997-L1006 (`dots` hook in the dot branch). |
| **Includes** | `brace` open frame tokens (`outputIndex`, `tokensIndex`), `comma`→`|` when innermost stack-top is `braces`, `dots` token typing, `}`: range pop/rebuild via `expandRange` (custom fn → caller result; else lexicographic `args.sort()`, `[a-z]` validity probe via `new RegExp` try/catch, escape-on-invalid `a..z` fallback), no-comma/no-dots literal fallback (`\{…\}` output re-slice), `brace.dots`/`brace.comma` flags, `.` inside braces→prev `dots` token. |
| **State fields touched** | `braces, output, tokens, backtrack` (range sets it), `stack` (via increment/decrement), `index, consumed` |
| **Depends on** | C0 (+ C1 text paths); C3 needed only for test-pattern coverage (`{a,b}*` shapes) |
| **Difficulty** | 4 / 5 |
| **Risk** | High — `expandRange`'s JS-only behaviors (default-toString **string** sort, RegExp-construction *validity probing*) have no direct Rust analog and must be re-derived behaviorally; token-slice surgery on `}` assumes C0's token invariants. |
| **Tests** | braces.js, options.expandRange.js (custom `fill-range` callback), extglobs-temp.js (brace nests), bash.js (brace sections) |
| **Definition of Done** | (a) oracle-1 on the brace corpus: plain alternation, nested braces, ranges (`{a..z}`, `{9..0}`, invalid ranges hitting the escaped fallback), no-comma literals, unclosed `{` via recovery; (b) `expandRange` custom-function path produces caller output verbatim; (c) braces.js boolean green; (d) oracle-2 token streams for `{a,b}*` and `foo.{m|c}js` match api.picomatch.js fixtures exactly. |

---

### C6 — Brackets and POSIX classes

| | |
|---|---|
| **Purpose** | `[]` character classes: open/close branches, in-class accumulation, POSIX-class expansion, the `literalBrackets` three-way, the `[^…]` slash-injection, the `[!…` non-conversion default. |
| **Lines** | L718-L758 (accumulation + POSIX + negation), L814-L875 (`[`/`]` branches), plus bos `ONE_CHAR` upgrade L734-L736. |
| **Includes** | `bracket` token open (with `remaining().includes(']')` lookahead + strictBrackets throws), in-class char appends incl. POSIX `[:name:]`→range via `POSIX_REGEX_SOURCE` (with the `prev.posix` flag, missing-name fallthrough, `bos.output = ONE_CHAR` upgrade when the class is the first token), `[`/`]` in-class escaping rules, `-` before `]` escape, `!`→`^` **only when** `opts.posix === true`, `[^…]` without `/` → `/]` injection on close, `literalBrackets === false | true | unset` 3-way on close (regex-class / literal-escaped / both-match alternation), strictBrackets errors at all four sites. |
| **State fields touched** | `brackets, output, tokens, backtrack` (POSIX expansion), `stack` |
| **Depends on** | C1 (escape interplay enters/exits the class), C0 |
| **Difficulty** | 3 / 5 |
| **Risk** | High — encodes bug-parity #187 (`[!…]` literal `!` by default) and the asymmetric `posix` coercion (`!== false` vs `=== true`); the both-match alternation default when `literalBrackets` is unset changes output shape entirely. |
| **Tests** | posix-classes.js, brackets.js, special-characters.js (strictBrackets sites), malicious.js (`[[:constructor:]]` byte-assert + prototype keys) |
| **Definition of Done** | (a) oracle-1 over `[…]` corpus: negations (`[^...]`, `[!...]` × posix unset/true), ranges, embedded classes (13 POSIX names + unknown names), literal-looking classes across the 3 `literalBrackets` states, unclosed `[`; (b) `[[:constructor:]]` produces the original's exact source (malicious.js:41); (c) posix-classes.js boolean green. |

---

### C7 — Parens and extglobs: open/close, ReDoS triage, recursion

| | |
|---|---|
| **Purpose** | The whole extglob subsystem: `(`/`)` handling, `extglobOpen`/`extglobClose` (all five operators `?*+@!`), the negate-close variants incl. the magic suffix recursion, `|` conditions accounting, and the S1 static-analysis helpers that decide ReDoS risk. |
| **Lines** | L48-L347 (S1 helpers), L523-L600 (`extglobOpen`/`extglobClose`), L788-L808 (`(`/`)`) **plus** opener fragments owned by earlier branches: `?(`-opener in qmark (L1023-L1026), `!(`-opener (L1054-L1058), `+(` (L1072-L1075), `@(` (L1096-L1099), `*(` (L1140-L1143), and `|` conditions (L946-L952). |
| **Includes** | Paren counting + strictBrackets errors (mid-loop + recovery interplay with C0); frame capture (`parens` snapshot, `startIndex`, `tokensIndex`, output snapshot); `extglobClose` close-condition (`state.parens === frame.parens + 1`); all five open/close fragment emissions (with `capture`); **negate-close** three variants (`inner` has `/` ⇒ `globstar`, `eos()`/`/^\)+$/` remainder, `*`-in-`inner` + `/.[^\\/]+$/` remainder ⇒ **recursive `parse(rest, {..., fastpaths:false})`** + `negatedExtglob` at BOS); `||`-conditions accounting; **ReDoS triage**: `splitTopLevel`, `isPlainBranch`, `normalizeSimpleBranch`, `hasRepeatedCharPrefixOverlap`, `parseRepeatedExtglob`, `getStarExtglobSequenceChars`, `buildCharClassStar`, `repeatedExtglobRecursion`, `analyzeRepeatedExtglob` (`maxExtglobRecursion` coercion: `=== false` disables, number overrides default 0), risky→literal surgery (blank later tokens, restore output from snapshot, `backtrack`) vs risky→combined-char-class `safeOutput`. |
| **State fields touched** | `parens, output, tokens, backtrack, index, consumed, negatedExtglob`, extglobs stack, `stack` |
| **Depends on** | C0, C1, C3 (opener insertion points + star `ONE_CHAR` guard semantics used at open), init-bound fragments from C0 |
| **Difficulty** | 5 / 5 |
| **Risk** | Very high — the largest behavioral center of the suite (~68% extglob-shaped), the recursive-parse edge, and the ReDoS triage's three-way output rewrite are all in this chunk; silent "improvement" temptation is maximal (preserve #113, #142-adjacent behavior). |
| **Tests** | extglobs.js, extglobs-bash.js, extglobs-minimatch.js, extglobs-temp.js (≈68% of suite mass), options.noextglob.js, options.maxExtglobRecursion.js (19 `.source` asserts), malicious.js, parens.js, regex-features.js, api.picomatch.js (`!(abc)` state tests) |
| **Definition of Done** | (a) oracle-1 per operator × nesting depth × position matrix; (b) oracle-1 **specifically over `options.maxExtglobRecursion.js`'s 19 `.source` fixtures** (the rewrite output is byte-pinned); (c) `maxExtglobRecursion` `false`/number/unset triage decisions match on the helper-generated risky corpus; (d) the four extglobs files boolean-parity via the makeRe path; (e) recursion case: `!(*.d).ts` family byte-parity incl. forced `fastpaths:false` inner call; (f) `negatedExtglob` state flags match for the api.picomatch.js fixtures. |

---

### C8 — Globstar machinery and `push` demotion

| | |
|---|---|
| **Purpose** | `**`: the second-star context machine, its `push()`-side demotion, `bash` globstar semantics, and `/\*\*/` collapsing. |
| **Lines** | L493-L505 (globstar demotion block in `push`), L1128-L1244 (star/globstar branch fragments **minus** C7's `*(` opener at L1140-L1143 and C3's tail at L1246+), plus fastpaths `noglobstar` interplay (already C4). |
| **Includes** | prev-globstar/star demotion at loop level; the six second-star context branches (bos+`eos` ⇒ whole-pattern globstar; slash+`eos` ⇒ `|$/|$` variants; slash+`/` follow ⇒ slash-splicing reopen with `(?:`/`$/|$` end variants; bos+`/` follow ⇒ `(?:^|\/|globstar\/)`; default demote-to-globstar-in-place), `while (rest.slice(0,3) === '/**')` collapsing with the "next char is `/`/eos" guard, `bash === true` empty-output stars mid-segment, `noglobstar === true` absorb, `state.globstar = true` marking, `strictSlashes` `|$/|`-suffix choice inside globstar close fragments. |
| **State fields touched** | `output, tokens, consumed, index, backtrack, globstar` (+ the `push` demotion path) |
| **Depends on** | C3 (single star), C2 (slash), C0 (`push` hook), C4 already stable (`noglobstar` template closure shared) |
| **Difficulty** | 5 / 5 |
| **Risk** | Highest per line — the "two overlapping demotion mechanisms" region (the one called out in PARSE_STATE_MACHINE.md as the hardest read); branch conditions reference `prev`, `prev.prev`, `eos`, `rest[0]`, `before.type`; #142/#104 (`**` inside parens) behavior must NOT be fixed. |
| **Tests** | globstars.js, bash.spec.js (dotglob/globstar sections), bash.js, dots-invalid.js (152 its), minimatch.js (`foo/**/*.txt`, `!(axios)/**`), issue-related.js |
| **Definition of Done** | (a) oracle-1 over the position matrix: `**`, `a/**`, `**/a`, `a/**/b`, `a/**/**/b`, `/**/` runs, `**` adjacent text, braces/parens adjacency (#142-class inputs byte-matched **including** the buggy output), all × `{dot, bash, noglobstar, strictSlashes, capture}`; (b) globstars.js + bash.spec.js boolean green; (c) demotion: `push` now rewrites prior globstar→star exactly when the original's L493-L505 fires (oracle-2 token check on `{a,**}b`-class shapes). |

---

### C9 — Pattern negation (`!`) and `negate()`

| | |
|---|---|
| **Purpose** | Leading-`!` pattern negation: the parity counter, its extglob boundary guard, and `nonegate`; plus final booking of the split `!` branch. (The *output* wrapper for `state.negated` is owned by `compileRe` in lib/picomatch.js — out of scope for this file, noted here as the integration point.) |
| **Lines** | L457-L473 (`negate`), L1061-L1065 (the `!` branch's non-extglob path), plus verification of C7's `!(` opener ordering. |
| **Includes** | `negate()` chain walk `while (peek() === '!' && (peek(2) !== '(' || peek(3) === '?'))`, `count % 2` parity fold, `state.start` advancement, `state.negated = true`; `nonegate` gate; mid-pattern `!` fall-through to text (already landed in C1); ordering verification that the `!(`-opener (C7) precedes the `negate()` call. |
| **State fields touched** | `negated, start, index` |
| **Depends on** | C7 (the `!(` boundary: extglob vs negation), C8 (globstar-containing negated patterns) |
| **Difficulty** | 3 / 5 |
| **Risk** | High — the `(peek(2) !== '(' || peek(3) === '?')` guard is easy to misread as De Morgan vs source; `!!`/`!!!` parity and `!(`-after-`!` chains are where #148-class mistakes live; the negation *wrapper* asymmetry (compileRe vs utils.wrapOutput shapes) is out-of-file but must be wired compatibly. |
| **Tests** | negation.js, bash.spec.js (dotglob section uses leading-`!` patterns), special-characters.js, options.js (`nonegate`), minimatch.js |
| **Definition of Done** | (a) oracle-1 over `!`-chain corpus: `!a`, `!!a`, `!!!a`, `!(a)`, `!!(a)`, `!(!(a))`, `!` mid-pattern, × `{nonegate, dot, capture}`; (b) negation.js boolean green; (c) end-to-end through compileRe: `makeRe('!a.js').source === '^(?!^(?:a\\.js)$).*$'` and utils.wrapOutput-shaped fastpath negations byte-equal. |

---

## Implementation roadmap

```
C0 foundation ─► C1 dispatcher ─► C2 segments ─► C3 wildcards ─► C4 fastpaths ─► C5 braces ─► C6 brackets/posix ─► C7 extglobs ─► C8 globstars ─► C9 negation
     │                                     │
     └── C4 is logically independent; scheduled after C3 only so the loop's fragment conventions exist to review against.
```

Dependency-true ordering (matches the rulebook's `parse(tokenizer) → braces → brackets/posix → extglobs → stars/globstars → negation` mapping, with fastpaths inserted where it's dependency-free):

| Step | Chunk | Why now |
|---|---|---|
| 1 | C0 | Everything depends on it. |
| 2 | C1 | The loop exists only hereafter; unblocks literal/escape truth. |
| 3 | C2 | Star/qmark guards consume slash/dot token types. |
| 4 | C3 | Ends "tokenizer" phase; first large boolean unblock (qmarks/stars/dotfiles). |
| 5 | C4 | Independent; stabilizes the `makeRe` production path before downstream chunks can distort it. Locks in the documented fastpath/slow-path divergence. |
| 6 | C5 | Rulebook order; braces.js + expandRange option. |
| 7 | C6 | Rulebook order; posix-classes.js; isolation from extglob mass. |
| 8 | C7 | The 68%-mass chunk; needs stable wildcards/brackets around it. |
| 9 | C8 | Hardest per line; everything it rewrites (star, push) is now settled and test-covered, so regressions localize. |
| 10 | C9 | Last, because its correctness depends on the `!(` boundary (C7) and globstar semantics inside negated patterns (C8). |

Integration note: `compileRe`/`toRegex`/negation-wrapping are **lib/picomatch.js** work, sequenced after the parse track in the rulebook order; C9's DoD §c is the hand-off contract.

## Cross-chunk modification ledger (what later chunks edit in earlier ones)

| Later chunk | Edits in earlier chunk | Contract |
|---|---|---|
| C8 | inserts globstar-demotion block into C0's `push` (L493-L505) | C0 leaves a documented insertion point; behavior inert until `globstar` tokens exist |
| C7 | inserts `extglobOpen` probe at the **top** of C3's `?` branch (L1023-L1026), C3's `*` tail (L1140-L1143), and into `!`/`+`/`@` branches (C1/C3) | branch-order citations listed in C7; inserting above, never below |
| C5 | adds the `dots` hook at the **top** of C2's dot branch (L998-L1006) | C2 leaves the branch shape stable for insertion |
| C9 | adds `negate()` call at the **bottom** of the `!` branch (after C7's `!(` probe) | exactly mirrors source order L1053-L1065 |
| C5 | introduces comma token type consumed by C8's demotion checks | token `type` strings are part of the oracle-2 contract |
| C6 | may set `bos.output = ONE_CHAR` (L734-L736) | mutates C0's anchor token — flagged |

Awaiting approval before implementing C0.
