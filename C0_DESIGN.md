# C0_DESIGN.md — Foundation chunk design (review-amended)

Amendments from the maintainer review are folded in. Supersedes the in-chat design of the same loop. Citations are `lib/parse.js` unless noted.

## Scope (unchanged)

`parse()` minus character handling: module wiring, guards, `REPLACEMENTS`, option coercion, platform-table binding, per-call fragment closures, `state` init, `./` prefix strip, cursor ops, `append`/`push` (without globstar demotion), counter/stack ops, recovery loops, `maybe_slash`, backtrack rebuild, return. Lines L2-L16, L44-L46, L356-L521 minus L457-L473 minus L493-L505 minus L523-L600; L1286-L1322.

## Scoping correction (new — found while generating the corpus)

The C0 Definition-of-Done in PARSE_CHUNKS.md over-reached: `'abc'`→`'abc'` needs C1's text branch; recovery fixtures (`'a['`, strictBrackets throws) only fire once C5/C6/C7's *open* branches increment their counters. **C0-pure observable surface** = guards + messages, `REPLACEMENTS` (`state.input`), `removePrefix` (`state.prefix`, retained full `state.input`), `state` defaults/shape, empty pattern, no-op recovery/rebuild paths. Branch-dependent behaviors are staged fixtures activating with their chunk (see `../pmx/fixtures/c0_oracle.json` `chunk` fields). C0 DoD here is amended accordingly.

## Amendments (folded in)

**[C-1] Storage unit is UTF-16.** `input_chars: Vec<u16>` (not `Vec<char>`). Four independent observables ride on units: `maxLength` guard + message numbers (L364-369), observable `state.index`/`state.start` (L412-428), `state.index += match[0].length` (L1117), C8's `slice(0, -n)` suffix math. `Vec<u16>` makes `input.len() == JS length` by construction; lone-surrogate halves for astral chars reproduce JS `input[i]` behavior exactly (`advance()` returns one UTF-16 unit). Pattern arrives as `&str`; stored via `flat_map(str::encode_utf16)`.

**[I-1] `Parser` embeds `state` wholesale** — no duplicated scalar field list, no `finish()` reassembly. `Parser { state: ParseState, input_chars: Vec<u16>, len: isize, prev: usize, extglobs: Vec<ExtglobFrame>, braces: Vec<BraceFrame>, stack: Vec<CounterKind>, platform: &'static PlatformChars, extglob_chars: ExtglobChars, fragments: Fragments, opts: Options }`. `finish()` = `Ok(self.state)`.

**[I-2] `stack: Vec<CounterKind>`**, `enum CounterKind { Braces, Brackets, Parens }`; `increment/decrement(CounterKind)` match on the counter fields. No stringly-typed dispatch (rulebook §5).

**[I-3] Cursor API types.** `eos()`, `peek(n) -> Option<u16>` (JS `undefined` ⇒ `None`), `advance() -> Option<u16>` (past-end ⇒ `None` but still increments; `\u0000` is a real value, never a sentinel), `remaining() -> &[u16]` (no `String` allocation; C7/C8 use hand-rolled prefix compares on it), `char_at(i) -> Option<u16>` checked helper. No panics (rulebook §5).

**[I-4] `push` truthiness rule pinned.** JS `if (tok.value || tok.output) append(tok)` (L511): a token with `value === '' && output === ''` skips append **and therefore skips `consume`** — `state.consumed` (observable) stays put. Rust condition: `tok.value.is_empty() && tok.output.as_deref().map_or(true, str::is_empty)` ⇒ skip append. Token merge order and `extglobs.last_mut().inner.push_str(value)` (L507-L509) implemented honestly against an empty C0 stack (not stubbed away).

**[I-5] Guard order pinned:** REPLACEMENTS substitution (L361) → length measurement (L364) → `./` strip (L430). Measured `len` includes a leading `'/.'`.

**[I-6] `'Expected a string'` unreachable from core.** `parse(input: &str)` can't express non-strings; `PmxError::ExpectedString` variant is kept for the napi/subprocess adapters (which receive raw JS values) and marked with a comment.

**[I-7] `parse('', _)` returns an empty state** (not `Err`): `eos()` true immediately, loop skipped, recovery no-ops, `backtrack` false. The empty-pattern `TypeError` lives in `picomatch()`/`makeRe` (lib/picomatch.js:L58, L306), a different layer.

**[I-8] `strip_suffix(&mut self, s: &str)` helper** on output: removes a *verified* trailing sub-string in UTF-8 bytes, for C8's negative-slice sites. One helper with a debug assertion of suffix presence replaces scattered truncate math; byte-boundary safety argument recorded (L1189-L1196 read fields before mutation).

## Deferred nice-to-haves (reviewer N-1…N-4)

Static-per-platform `EXTGLOB_CHARS` via `concat!` (N-1); `TokenKind` variants land per chunk instead of up-front (N-2); oracle-2 JSON serialization lives in the adapter crate, core keeps pub fields only (N-3); `Options` declares all fields now, accessors land per chunk with citations (N-4).

## Structures (final)

- `ParseState` — pub struct, 16 fields + `negated_extglob` from birth; equals JS observable shape minus fn attachments (`peek`/`advance` L444-445, dropped by oracle-2 serialization).
- `Token` — `{ kind: TokenKind, value: String, output: Option<String>, suffix: Option<String>, prev: usize }`; index-arena links (`prev.prev` = `tokens[tokens[prev].prev]`).
- `Fragments` — per-call computed strings: `star` (bash ⇒ `globstar(opts)`), `globstar`, `capture`, `nodot`, `qmark_no_dot` (L395-L405).
- `PmxError` (thiserror) — `ExpectedString | InputTooLong{len,max} | MissingOpening{c} | MissingClosing{c}`; `Display` reproduces JS message bytes exactly, incl. `'use "\\\\c"'` and clamped `--max` (`Math.min(65536, opts.maxLength)`, float semantics preserved).

## Module structure

```
crates/pmx-core/src/
├── lib.rs            #![forbid(unsafe_code)] re-exports
├── constants.rs      (tables, globChars, extglobChars, REPLACEMENTS, MAX_LENGTH)
├── utils.rs          (escape_regex, remove_prefix, escape_last, …)
├── options.rs        Options + C0 accessors only: windows/dot/bash/capture/prepend/max_length/noextglob/strict_brackets/strict_slashes
├── error.rs          PmxError
└── parse/
    ├── mod.rs        pub fn parse(&str,&Options)->Result<ParseState,PmxError>; REPLACEMENTS; guards; removePrefix; Parser wiring
    ├── state.rs      ParseState, Token, TokenKind(pub subsets per chunk)
    └── parser.rs     Parser: init, cursor ops, append, push, increment/decrement, recovery, maybe_slash, rebuild
```

Later chunks land as `impl Parser` in `parse/braces.rs`, `parse/brackets.rs`, `parse/extglob.rs`, `parse/stars.rs` (module-per-chunk, review diffs stay local).

## Test assets (this loop)

`../pmx/fixtures/extract-c0.js` (corpus extractor against the reference checkout) → `c0_oracle.json` → `verify-c0.js` (re-drives the corpus, byte-compares) and `../pmx/crates/pmx-core/tests/c0_foundation.rs` (runs once C0 lands; asserts every corpus row byte-exactly).
