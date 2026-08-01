# PARSE_STATE_MACHINE.md — lib/parse.js (v4.0.5) engineering note

One file, one exported function (`parse`, L356-L1322; `parse.fastpaths` is a separate template gallery, L1330-L1414). All citations are `lib/parse.js` lines.

## 1. Parser lifecycle

```
INIT (L357-L437)
  type-check → REPLACEMENTS map ('***'→'*', '**/**'→'**') → clone opts → maxLength guard
  → pick platform tables once: globChars(opts.windows), extglobChars(PLATFORM_CHARS)
  → bind per-call fragment closures: star, globstar(opts), nodot, qmarkNoDot, capture
  → minimatch alias: typeof opts.noext==='boolean' ⇒ opts.noextglob = opts.noext (L408)
  → build state{} seeded with tokens=[bos], bos.output = opts.prepend || ''
  → utils.removePrefix strips './' (state.prefix='./')
        │
        ▼
INLINE FASTPATH (L606-L655)        ← optional escape hatch; pattern free of /()[]{}" and not ^[*!]
  single REGEX_SPECIAL_CHARS_BACKREF replace pass → utils.wrapOutput → return state
        │
        ▼
MAIN LOOP (L661-L1284)             ← while(!eos()): advance one char, dispatch (§4)
  builds tokens[] and mutates state; rewrites previous tokens in place
        │
        ▼
RECOVERY (L1286-L1306)
  unclosed [ ( { → utils.escapeLast escapes last unescaped opener in output
  (strictBrackets converts each into a SyntaxError throw)
  append maybe_slash token (SLASH_LITERAL?) if last token is star|bracket and strictSlashes!==true
        │
        ▼
RETURN (L1308-L1322)
  if state.backtrack: rebuild state.output = Σ token.output ?? token.value (+ token.suffix)
  return state   (output is UNANCHORED; ^(?:…)$ / negation wrap is compileRe's job, lib/picomatch.js)
```

## 2. Parser state fields (state, L412-L428)

| Field | Type | Meaning |
|---|---|---|
| `input` | string | Pattern text after REPLACEMENTS + `./` strip; what the loop indexes into |
| `index` | number | Cursor, −1 … len−1 advanced by `advance()`/`consume()` |
| `start` | number | Index where the logical pattern begins (past stripped `./` and leading `!`s); gate for BOS semantics |
| `dot` | bool | Frozen copy of `opts.dot === true`; selects dot-lookahead fragments |
| `consumed` | string | Raw chars appended by `consume()` (diagnostic parity with token values) |
| `output` | string | The emitted regex body (unanchored); mutated incrementally and by token surgery |
| `prefix` | string | `'./'` when stripped, else `''` |
| `backtrack` | bool | Monotone dirty flag — once true, output must be rebuilt from tokens before return |
| `negated` | bool | Leading `!` chain resolved to odd parity (negate() L457-L473) |
| `brackets` / `braces` / `parens` | number | Open-construct counters; recovery loops unwind them |
| `quotes` | 0\|1 | Inside a `"…"` literal toggle |
| `globstar` | bool | Any globstar was emitted (informational) |
| `tokens` | array | `[bos, …]` — all pushed tokens; `num words` counting/comment: linked via `prev` |
| `peek`, `advance` | fn | Attached at L444-L445 for external state consumers |
| `negatedExtglob` | bool | Added late (L594): a `!(…)` extglob opened at BOS |

Function-local (not on `state`) but equally load-bearing: `extglobs[]` (open extglob frames), `braces[]` (open brace frames), `stack[]` (type-name history for counters — comma handling keys on its top, L962), `prev` (last pushed token), `value` (current char).

## 3. The eight subsystems

| # | Subsystem | Lines | Job |
|---|---|---|---|
| S1 | Range & ReDoS static analysis | L22-L347 (`expandRange`, `splitTopLevel`, `parseRepeatedExtglob`, `analyzeRepeatedExtglob` …) | Brace-range source `[a-z]` w/ RegExp-validity probe + lexicographic `args.sort()`; classify `+(…)`/`*(…)` extglobs as safe / risky-literal / risky→combined char class |
| S2 | Init & option coercion | L356-L437 | Everything in INIT above; exact coercion sites (`fastpaths !== false`, `dot === true`, …) |
| S3 | Inline fastpath | L606-L655 | Regex-replace shortcut for simple patterns; wraps via `utils.wrapOutput` (own negation shape) |
| S4 | Token machinery | L439-L521 | `eos/peek/advance/remaining/consume/append`; `push()` — merges adjacent text tokens, demotes globstar→star on disallowed followers (L493-L505), appends token `.value` into top extglob's `inner` (L507-L509) |
| S5 | Extglob frames | L523-L600 | `extglobOpen` (frame w/ `parens`, `startIndex`, `tokensIndex`, output snapshot) / `extglobClose` — ReDoS triage, negate-close variants (`inner` has `/`, eos, magic suffix recursion L582-L591), risky-path token surgery (L548-L566) |
| S6 | Bracket-class accumulation | L718-L758 (+ `]` close L829-L875) | In-class char collection, POSIX class expansion (`[[:alpha:]]`→range w/ bos ONE_CHAR seed L734-L736), `[!`→`[^` only when `posix===true`, literalBrackets 3-way on close |
| S7 | Brace machinery | L881-L940, dots L997-L1015, comma L958-L969 | `{`/`}` frames, `,`→`\|` alternation, `a..z` range assembly by token-list pop/rebuild (L907-L923), no-comma literal fallback (L925-L934) |
| S8 | Star / globstar disambiguation | L1124-L1284 | Context-keyed rewrite machine: `prev`/`prev.prev` types + `eos()` + `rest` decide star vs globstar; slash-token reopening (`(?:` prefix), `/\*\*/` collapsing, ONE_CHAR/nodot guard emission |

(The char-dispatch switch itself — the `while` body ordering NUL→`\`→brackets→quotes→parens→braces→pipes→commas→slash→dot→`?`→`!`→`+`→`@`→text→`*` — is where S5–S8 are invoked; S1/S4 are used by everything.)

## 4. Invariants

- **I1 — bos anchor.** `tokens[0]` is always the `bos` token; its `output` is `opts.prepend || ''`, upgraded to `ONE_CHAR` when a leading bracket class matches at BOS (L734-L736).
- **I2 — output/token coherence.** Absent `state.backtrack`, `state.output === Σ token.output ?? token.value` for all appended tokens; any edit that breaks this (supplying tokens' outputs, negative-slicing the string) must set `state.backtrack = true` exactly once; rebuild runs once at return (L1308-L1319). `backtrack` is monotone — never reset (sites: L561, L731, L922, L1133).
- **I3 — prev linkage.** After each `push`, `prev === tokens[tokens.length-1]`; tokens are never removed or reordered, only retyped/blanked/post-edited — except the two sanctioned surgeries: brace-range pop (L907-L919) and risky-extglob blanking (L554-L558).
- **I4 — counter/stack consistency.** `brackets/braces/parens/quotes` mirror their frame stacks; `increment/decrement` (L475-L484) are the only mutators and also maintain `stack[]`; RECOVERY unwinds through the same `decrement` (counters and `stack[]` stay synced) but patches **only the output string** via `escapeLast` — the token list is left untouched.
- **I5 — extglob close condition.** `)` closes the top extglob frame iff `state.parens === frame.parens + 1` (L799-L803); inner accumulation happens for every pushed non-paren token while a frame is open (L507-L509).
- **I6 — platform constancy.** Fragment tables are chosen once at INIT; no char is ever matched against the other platform's table mid-parse.
- **I7 — fragment provenance.** Emitted pieces come only from `PLATFORM_CHARS` / `EXTGLOB_CHARS` / `POSIX_REGEX_SOURCE`, or from `escapeRegex`-escaped literal text; raw glob metachars in literals are escaped at emission time (quotes path escapes per char always).
- **I8 — text-token coalescing.** Adjacent `text` tokens are merged into `prev` (L512-L516) so the token stream has no two consecutive text tokens.
- **I9 — star semantics.** A lone `*` never emits something that matches `/` (STAR = `[^/]*?` family); `ONE_CHAR` (`(?=.)`) is emitted for a star at BOS/slash/dot-context unless another `*` follows (L1277-L1280); `?` at BOS/slash gets `QMARK_NO_DOT` unless `opts.dot`.
- **I10 — negate() is BOS-only.** Runs only when `state.index === 0` and `nonegate !== true` (L1061); chains collapse by parity; `!(` is extglob, not negation (guarded by `peek(2) !== '(' || peek(3) === '?'`, L460). A mid-pattern `!` falls through to literal text.
- **I11 — `./` never survives.** Stripped pre-loop by `removePrefix` and mid-loop when a `/` follows a leading `dot` token (L975-L991: pops the dot token, resets `output`/`consumed`, moves `start`).
- **I12 — no anchoring inside parse.** `state.output` contains no `^`/`$` wrappers; `contains`/negation wrapping is applied later (utils.wrapOutput for fastpath, compileRe otherwise).
- **I13 — failure discipline.** parse throws only: TypeError (non-string), SyntaxError (length, strictBrackets). Everything else terminates cleanly — unbalanced constructs pass through RECOVERY as escaped literals.

## 5. One loop iteration

```
advance() ──► value = input[++index]
   │
   ├─ '\u0000'? ───────────────────────────► continue
   ├─ '\'? ─► escape handling: \/ bash-guard, \. \; skip, run-collapse (>2), unescape opt ──► continue (fall into bracket handling if brackets>0)
   ├─ brackets>0 && not closing ']'? ─► S6 accumulate (POSIX expansion on ':', escapes) ──► continue
   ├─ quotes===1 && value!=='"'? ─────► escapeRegex(value); append into prev text ──► continue
   ├─ '"' ─► toggle quotes; keep only if keepQuotes ──► continue
   ├─ '(' ─► parens++ ; push paren ──► continue          ┐
   ├─ ')' ─► strictBrackets? / closes top extglob? ─► S5 extglobClose or literal ──► continue
   ├─ '[' ─► nobracket|no ']' ahead? literal : brackets++ ──► continue
   ├─ ']' ─► close class; literalBrackets 3-way (S6) ──► continue
   ├─ '{' ─► braces++; push brace frame ──► continue     ┃ S7
   ├─ '}' ─► range assembly | alternation close | literal fallback ──► continue
   ├─ '|' ─► extglob.conditions++ ; push text ──► continue
   ├─ ',' ─► inside top-of-stack braces? output '|' : ',' ──► continue
   ├─ '/' ─► leading './' collapse (I11) or push slash ──► continue
   ├─ '.' ─► brace-range dots token | dot | text ──► continue
   ├─ '?' ─► extglob-open 'qmark' | regex-group disambig | QMARK_NO_DOT @BOS/slash | QMARK ──► continue
   ├─ '!' ─► extglob-open 'negate' | negate() @BOS | fall through ──► treat as text
   ├─ '+' ─► extglob-open 'plus' | PLUS_LITERAL variants ──► continue
   ├─ '@' ─► extglob marker or text ──► continue
   ├─ value!=='*' ─► escape $ ^ ; coalesce plain run via REGEX_NON_SPECIAL_CHARS; push/merge text ──► continue
   └─ '*' ─► S8: demote prev globstar | extglob-open 'star' | 2nd-star globstar machine (six context branches) | plain star w/ nodot+ONE_CHAR guards ──► continue

loop exits ──► RECOVERY (I4 unwind + maybe_slash) ──► backtrack rebuild if flagged ──► return state
```
