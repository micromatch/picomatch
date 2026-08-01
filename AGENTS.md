# AGENTS.md

## Project context

- This checkout is the **read-only reference original** for the `pmx` Rust port (v4.0.5, pinned). The port rulebook, build/review/spec prompts, and workspace live one level up (`../agents.md`, `../promptspec.md`, `../promptreview.md`, `../claude.md`) — read those before port-directed work.
- Do not modify `lib/`, `index.js`, `posix.js`, or `test/` for port work — the original suite is the scoring oracle and must stay byte-identical. Writable deliverables are docs: this file, `ARCHITECTURE.md` (repo reverse-engineering), `TEST_ANALYSIS.md` (suite anatomy), `BEHAVIORAL_ORACLE.md` (ranked comparison oracles), `PARSE_STATE_MACHINE.md` / `PARSE_CHUNKS.md` (parse.js anatomy + chunking plan), `C0_DESIGN.md` (review-amended design), and any `specs/` requested later.
- The port workspace lives at `../pmx/` (fixtures, corpus extractors, `crates/` later). This repo stays the read-only reference: `../pmx/fixtures/extract-*.js` requires it by path; never edit what the extractors read.
- Port goal from the rulebook: bug-for-bug parity, including known upstream bugs — never "fix" matching behavior.

## Commands

- `npm test` — the real gate: eslint over the repo, then the full mocha suite. Run this, not just mocha.
- Single test file: `npx mocha test/braces.js` (no mocha config; mocha auto-discovers `test/*.js` — helper code lives in `test/support/` precisely so it isn't picked up).
- Benchmarks are a **separate package**: `cd bench && npm install` before `node index.js`. Root `npm install` does not cover it.
- CI (`.github/workflows/test.yml`) runs `npm run test:ci` = nyc + mocha **without lint** across node 12–25 × linux/windows/mac — lint locally, and never assume one OS or one node version.

## Hard rules

- **Zero runtime dependencies.** The library's entire selling point is "no dependencies." Nothing goes in `dependencies` in package.json; `sideEffects: false` and the `files` whitelist must stay as-is.
- **Node >= 12 compatibility.** ESLint parses ES2018 — no optional chaining (`?.`), nullish coalescing (`??`), `Array.at`, etc. CommonJS only, `'use strict'` header, single quotes, semicolons, no trailing commas, 2-space indent.
- **No lockfile.** `.npmrc` (root and `bench/`) sets `package-lock=false`. Don't commit one.
- **Speed is the product.** Hot paths in `lib/` are allocation-sensitive; perf comes from the `fastpaths` templates in `lib/parse.js` (pre-baked regex sources for common patterns) — there is no result cache. Measure with `bench/` before "optimizing" anything.

## Docs gotcha

- `README.md` is **generated** from `.verb.md` by verb (see the `verb` block in package.json). Edit `.verb.md`, never README.md directly — README edits get overwritten.

## Layout

Pipeline: `lib/scan.js` (glob → tokens) → `lib/parse.js` (tokens → AST) → `lib/picomatch.js` (AST → regex, matching, cache). `lib/constants.js` is char-code tables, `lib/utils.js` shared helpers.

- `index.js` — public entry; wraps `lib/picomatch` to default the `windows` option from `os.platform()`.
- `posix.js` — raw `lib/picomatch` with no platform defaulting (POSIX semantics).
- `examples/` — runnable demos of individual APIs/options.

## Tests

- Plain `node:assert` + mocha, ~2000 `it` blocks. Tests encode **bash/minimatch compatibility semantics** — a "small" matching change breaks hundreds of assertions. Run the full suite before calling any glob-behavior change done.
- Several suites branch on `process.platform` (`test/bash.js`, `test/malicious.js`, `test/qmarks.js`, `test/extglobs.js`) — behavior differs by OS and CI checks all three.
