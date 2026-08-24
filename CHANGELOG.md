# Release history

**All notable changes to this project will be documented in this file.**

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

<details>
  <summary><strong>Guiding Principles</strong></summary>

- Changelogs are for humans, not machines.
- There should be an entry for every single version.
- The same types of changes should be grouped.
- Versions and sections should be linkable.
- The latest version comes first.
- The release date of each versions is displayed.
- Mention whether you follow Semantic Versioning.

</details>

<details>
  <summary><strong>Types of changes</strong></summary>

Changelog entries are classified using the following labels _(from [keep-a-changelog](http://keepachangelog.com/)_):

- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.

</details>

## 4.0.7 (2026-08-24)

### Fixed

* Fixed terminal globstars in parenthesized patterns ([#142](https://github.com/micromatch/picomatch/issues/142), [e279bd7](https://github.com/micromatch/picomatch/commit/e279bd7)).

## 4.0.6 (2026-08-24)

### Fixed

* `scan()` now scans the full pattern when tokens are requested, instead of merging the remaining path segments into the final token ([#62](https://github.com/micromatch/picomatch/issues/62), [5f5819d](https://github.com/micromatch/picomatch/commit/5f5819d)).
* `scan()` now returns complete pattern parts, including leading and trailing empty segments, and handles nested and escaped parentheses correctly ([#58](https://github.com/micromatch/picomatch/issues/58), [f201165](https://github.com/micromatch/picomatch/commit/f201165)).

## 4.0.5 (2026-07-02)

### Fixed

* Preserved every branch when safely rewriting repeated extglobs ([#182](https://github.com/micromatch/picomatch/pull/182), [6289307](https://github.com/micromatch/picomatch/commit/6289307)).
* Honored the `windows` option when matching basenames ([#183](https://github.com/micromatch/picomatch/pull/183), [ab8bc4d](https://github.com/micromatch/picomatch/commit/ab8bc4d)).

## 4.0.4 (2026-03-23)

### Security

* Prevented regular expression denial of service (ReDoS) from crafted repeated or nested extglob quantifiers by safely rewriting or treating risky patterns as literals. The new `maxExtglobRecursion` option defaults to `0`; positive numeric values allow limited nesting, while `false` disables the safeguard ([CVE-2026-33671](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj), [5eceecd](https://github.com/micromatch/picomatch/commit/5eceecd)).
* Prevented inherited object properties from being interpreted as POSIX character classes ([CVE-2026-33672](https://github.com/advisories/GHSA-3v7f-55p6-f55p), [4516eb5](https://github.com/micromatch/picomatch/commit/4516eb5)).

## 4.0.3 (2025-07-15)

### Fixed

* Avoided an exception when a glob pattern contains `constructor` ([#144](https://github.com/micromatch/picomatch/pull/144), [a9e2dd2](https://github.com/micromatch/picomatch/commit/a9e2dd2)).

## 4.0.2 (2024-03-27)

### Changed

* Moved Windows platform detection to the shared utilities ([f7751de](https://github.com/micromatch/picomatch/commit/f7751de)).
* Updated development dependencies ([d958901](https://github.com/micromatch/picomatch/commit/d958901)).

## 4.0.1 (2024-02-07)

### Breaking changes

* Raised the minimum supported Node.js version from 10 to 12 ([6ce95f5](https://github.com/micromatch/picomatch/commit/6ce95f5)).

## 4.0.0 (2024-02-07)

### Breaking changes

* On supported Node.js versions, 4.0.0 does not remove any public matcher API or change matching semantics. Its compatibility change is the removal of Picomatch's Node.js version check for regular expression lookbehinds. Runtimes without native lookbehind support, which are outside the supported Node.js range, now use the standard `toRegex()` behavior: a non-matching fallback by default and the native `RegExp` error when `debug: true` ([#129](https://github.com/micromatch/picomatch/pull/129), [907d706](https://github.com/micromatch/picomatch/commit/907d706)).

### Fixed

* Preserved complete `text` values when `parse()` combines adjacent text tokens ([#100](https://github.com/micromatch/picomatch/issues/100), [#125](https://github.com/micromatch/picomatch/issues/125), [#126](https://github.com/micromatch/picomatch/pull/126), [563f534](https://github.com/micromatch/picomatch/commit/563f534)). Thanks to @connor4312.

### Changed

* Removed the Node.js `os` dependency from the main entry point to support browser environments ([#124](https://github.com/micromatch/picomatch/pull/124), [b0ff9b1](https://github.com/micromatch/picomatch/commit/b0ff9b1)). Thanks to @gwsbhqt.
* Added `sideEffects: false` to `package.json` ([#128](https://github.com/micromatch/picomatch/pull/128), [8f18eb6](https://github.com/micromatch/picomatch/commit/8f18eb6)). Thanks to @frandiox.
* Restored all properties from the core matcher, including the undocumented `picomatch.constants`, on the package's main export ([335eac6](https://github.com/micromatch/picomatch/commit/335eac6)).

## 3.0.2 (2026-03-23)

### Fixed

* Avoided an exception when a glob pattern contains `constructor` ([#144](https://github.com/micromatch/picomatch/pull/144), [8c08b94](https://github.com/micromatch/picomatch/commit/8c08b94)).

### Security

* Backported the extglob-quantifier ReDoS fix from 4.0.4. Risky repeated extglobs are now safely rewritten or treated as literals by default; positive numeric `maxExtglobRecursion` values allow limited nesting, while `false` disables the safeguard ([CVE-2026-33671](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj), [05c0743](https://github.com/micromatch/picomatch/commit/05c0743)).
* Prevented inherited object properties from being interpreted as POSIX character classes ([CVE-2026-33672](https://github.com/advisories/GHSA-3v7f-55p6-f55p), [0bdde35](https://github.com/micromatch/picomatch/commit/0bdde35)).

## 3.0.1 (2023-10-29)

### Breaking changes

* Raised the minimum supported Node.js version from 8.6 to 10 ([5214db4](https://github.com/micromatch/picomatch/commit/5214db4)).

## 3.0.0 (2023-10-28)

### Breaking changes

* Windows path-separator handling in the core and static APIs is now controlled by the `windows` option instead of automatic platform detection. Calls without an options object use POSIX behavior; pass `windows: true` when backslashes should be treated as path separators. The main `picomatch()` entry point applies platform detection only when an options object is provided ([#73](https://github.com/micromatch/picomatch/pull/73), [49d10c4](https://github.com/micromatch/picomatch/commit/49d10c4)).
* The undocumented `picomatch.constants` property is no longer copied to the package's main export ([7e120bb](https://github.com/micromatch/picomatch/commit/7e120bb)). It is restored in 4.0.0 ([335eac6](https://github.com/micromatch/picomatch/commit/335eac6)).
* The v3 `matchBase()` implementation did not forward Windows mode to its platform-independent basename helper. As a result, backslash-separated inputs did not match by basename, even with `windows: true`. This is fixed in 4.0.5 ([#183](https://github.com/micromatch/picomatch/pull/183), [ab8bc4d](https://github.com/micromatch/picomatch/commit/ab8bc4d)).

### Added

* Added the dependency-free `picomatch/posix` entry point for browser and other non-Node.js environments. It uses POSIX path semantics unless `windows: true` is passed ([7e120bb](https://github.com/micromatch/picomatch/commit/7e120bb)).

### Changed

* Removed the Node.js `path` dependency and automatic `process.platform` detection from the core matcher, and documented the existing `windows` option ([#73](https://github.com/micromatch/picomatch/pull/73)).

## 2.3.2 (2026-03-23)

### Fixed

* Avoided an exception when a glob pattern contains `constructor` ([#144](https://github.com/micromatch/picomatch/pull/144), [3f4f10e](https://github.com/micromatch/picomatch/commit/3f4f10e)).

### Security

* Backported the extglob-quantifier ReDoS fix from 4.0.4. Risky repeated extglobs are now safely rewritten or treated as literals by default; positive numeric `maxExtglobRecursion` values allow limited nesting, while `false` disables the safeguard ([CVE-2026-33671](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj), [eec17ae](https://github.com/micromatch/picomatch/commit/eec17ae)).
* Prevented inherited object properties from being interpreted as POSIX character classes ([CVE-2026-33672](https://github.com/advisories/GHSA-3v7f-55p6-f55p), [fc1f6b6](https://github.com/micromatch/picomatch/commit/fc1f6b6)).

## 2.3.1 (2022-01-02)

### Fixed

* Fixes bug when a pattern containing an expression after the closing parenthesis (`/!(*.d).{ts,tsx}`) was incorrectly converted to regexp ([9f241ef](https://github.com/micromatch/picomatch/commit/9f241ef)).

### Changed

* Some documentation improvements ([f81d236](https://github.com/micromatch/picomatch/commit/f81d236), [421e0e7](https://github.com/micromatch/picomatch/commit/421e0e7)).

## 2.3.0 (2021-05-21)

### Fixed

* Fixes bug where file names with two dots were not being matched consistently with negation extglobs containing a star ([56083ef](https://github.com/micromatch/picomatch/commit/56083ef))

## 2.2.3 (2021-04-10)

### Fixed

* Do not skip pattern seperator for square brackets ([fb08a30](https://github.com/micromatch/picomatch/commit/fb08a30)).
* Set negatedExtGlob also if it does not span the whole pattern ([032e3f5](https://github.com/micromatch/picomatch/commit/032e3f5)).

## 2.2.2 (2020-03-21)

### Fixed

* Correctly handle parts of the pattern after parentheses in the `scan` method ([e15b920](https://github.com/micromatch/picomatch/commit/e15b920)).

## 2.2.1 (2020-01-04)

* Fixes [#49](https://github.com/micromatch/picomatch/issues/49), so that braces with no sets or ranges are now propertly treated as literals.

## 2.2.0 (2020-01-04)

* Disable fastpaths mode for the parse method ([5b8d33f](https://github.com/micromatch/picomatch/commit/5b8d33f))
* Add `tokens`, `slashes`, and `parts` to the object returned by `picomatch.scan()`.

## 2.1.0 (2019-10-31)

* add benchmarks for scan ([4793b92](https://github.com/micromatch/picomatch/commit/4793b92))
* Add eslint object-curly-spacing rule ([707c650](https://github.com/micromatch/picomatch/commit/707c650))
* Add prefer-const eslint rule ([5c7501c](https://github.com/micromatch/picomatch/commit/5c7501c))
* Add support for nonegate in scan API ([275c9b9](https://github.com/micromatch/picomatch/commit/275c9b9))
* Change lets to consts. Move root import up. ([4840625](https://github.com/micromatch/picomatch/commit/4840625))
* closes https://github.com/micromatch/picomatch/issues/21 ([766bcb0](https://github.com/micromatch/picomatch/commit/766bcb0))
* Fix "Extglobs" table in readme ([eb19da8](https://github.com/micromatch/picomatch/commit/eb19da8))
* fixes https://github.com/micromatch/picomatch/issues/20 ([9caca07](https://github.com/micromatch/picomatch/commit/9caca07))
* fixes https://github.com/micromatch/picomatch/issues/26 ([fa58f45](https://github.com/micromatch/picomatch/commit/fa58f45))
* Lint test ([d433a34](https://github.com/micromatch/picomatch/commit/d433a34))
* lint unit tests ([0159b55](https://github.com/micromatch/picomatch/commit/0159b55))
* Make scan work with noext ([6c02e03](https://github.com/micromatch/picomatch/commit/6c02e03))
* minor linting ([c2a2b87](https://github.com/micromatch/picomatch/commit/c2a2b87))
* minor parser improvements ([197671d](https://github.com/micromatch/picomatch/commit/197671d))
* remove eslint since it... ([07876fa](https://github.com/micromatch/picomatch/commit/07876fa))
* remove funding file ([8ebe96d](https://github.com/micromatch/picomatch/commit/8ebe96d))
* Remove unused funks ([cbc6d54](https://github.com/micromatch/picomatch/commit/cbc6d54))
* Run eslint during pretest, fix existing eslint findings ([0682367](https://github.com/micromatch/picomatch/commit/0682367))
* support `noparen` in scan ([3d37569](https://github.com/micromatch/picomatch/commit/3d37569))
* update changelog ([7b34e77](https://github.com/micromatch/picomatch/commit/7b34e77))
* update travis ([777f038](https://github.com/micromatch/picomatch/commit/777f038))
* Use eslint-disable-next-line instead of eslint-disable ([4e7c1fd](https://github.com/micromatch/picomatch/commit/4e7c1fd))

## 2.0.7 (2019-05-14)

* 2.0.7 ([9eb9a71](https://github.com/micromatch/picomatch/commit/9eb9a71))
* supports lookbehinds ([1f63f7e](https://github.com/micromatch/picomatch/commit/1f63f7e))
* update .verb.md file with typo change ([2741279](https://github.com/micromatch/picomatch/commit/2741279))
* fix: typo in README ([0753e44](https://github.com/micromatch/picomatch/commit/0753e44))

## 2.0.4 (2019-04-10)

### Fixed

- Readme link [fixed](https://github.com/micromatch/picomatch/pull/13/commits/a96ab3aa2b11b6861c23289964613d85563b05df) by @danez.
- `options.capture` now works as expected when fastpaths are enabled. See https://github.com/micromatch/picomatch/pull/12/commits/26aefd71f1cfaf95c37f1c1fcab68a693b037304. Thanks to @DrPizza.

## 2.0.0 (2019-04-10)

### Added

- Adds support for `options.onIgnore`. See the readme for details
- Adds support for `options.onResult`. See the readme for details

### Breaking changes

- The unixify option was renamed to `windows`
- caching and all related options and methods have been removed

## 1.0.0 (2018-11-05)

- adds `.onMatch` option
- improvements to `.scan` method
- numerous improvements and optimizations for matching and parsing
- better windows path handling

## 0.1.0 - 2017-04-13

First release.


[keep-a-changelog]: https://github.com/olivierlacan/keep-a-changelog
