<h1 align="center">Picomatch</h1>

<p align="center">
<a href="https://npmjs.org/package/picomatch">
<img src="https://img.shields.io/npm/v/picomatch.svg" alt="version" />
</a>
<a href="https://travis-ci.org/micromatch/picomatch">
<img src="https://img.shields.io/travis/micromatch/picomatch.svg" alt="travis" />
</a>
<a href="https://npmjs.org/package/picomatch">
<img src="https://img.shields.io/npm/dm/picomatch.svg" alt="downloads" />
</a>
</p>

<br>
<br>

<p align="center">
<strong>Blazing fast and accurate glob matcher written in JavaScript.</strong></br>
<em>No dependencies and full support for standard and extended Bash glob features, including braces, extglobs, POSIX brackets, and regular expressions.<em>
</p>

<br>
<br>

## Why picomatch?

* **Lightweight** - No dependencies
* **Minimal** - Tiny API surface. Main export is a function that takes a glob pattern and returns a matcher function.
* **Fast** - Loads in about 2ms (that's several times faster than a [single frame of a HD movie](http://www.endmemo.com/sconvert/framespersecondframespermillisecond.php) at 60fps)
* **Performant** - Optional precompiling to speed up repeat matching (like when watching files)
* **Accurate matching** - Using wildcards (`*` and `?`), globstars (`**`) for nested directories, [advanced globbing](#advanced-globbing) with extglobs, braces, and POSIX brackets, and support for escaping special characters with `\` or quotes.
* **Well tested** - Thousands of unit tests

See the [feature comparison](#feature-comparison) to other libraries.

<br>
<br>

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save picomatch
```

<br>
<br>

## Usage

The main export is a function that takes a glob pattern and an options object and returns a function for matching strings.

```js
const pm = require('picomatch');
const isMatch = pm('*.js');

console.log(isMatch('abcd')); //=> false
console.log(isMatch('a.js')); //=> true
console.log(isMatch('a.md')); //=> false
console.log(isMatch('a/b.js')); //=> false
```

<br>
<br>

## Options

| **Option** | **Type** | **Default value** | **Description** |
| --- | --- | --- | --- |
| `bash`           | `boolean`      | `false`     | Follow bash matching rules more strictly - disallows backslashes as escape characters. |
| `dot`            | `boolean`      | `false`     | Enable dotfile matching. By default, dotfiles are ignored unless a `.` is explicitly defined in the pattern, or `options.dot` is true |
| `expandBrace`    | `function`     | `undefined` | Function to be called on brace patterns as an alternative to the built-in functionality. The function receives the entire brace pattern including the enclosing braces as its only argument, and it must return a string to be used in the generated regex. |
| `expandRange`    | `function`     | `undefined` | Custom function for expanding ranges in brace patterns, such as `{a..z}`. The function receives the range values as two arguments, and it must return a string to be used in the generated regex. It's recommended that returned strings be wrapped in parentheses. This option is overridden by the `braces` option. |
| `failglob`       | `boolean`      | `false`     | Throws an error if no matches are found. Based on the bash option of the same name. |
| `flags`          | `boolean`      | `undefined` | Regex flags to use in the generated regex. If defined, the `nocase` option will be overridden. |
| `ignore`         | `array\|string` | `undefined` | One or more glob patterns for excluding strings that should not be matched from the result. |
| `keepQuotes`     | `boolean`      | `false`     | Retain quotes in the generated regex, since quotes may also be used as an alternative to backslashes.  |
| `lookbehinds`    | `boolean`      | `true`      | Support regex positive and negative lookbehinds. Note that you must be using Node 8.1.10 or higher to enable regex lookbehinds. |
| `matchBase`      | `boolean`      | `false`     | If set, then patterns without slashes will be matched against the basename of the path if it contains slashes.  For example, `a?b` would match the path `/xyz/123/acb`, but not `/xyz/acb/123`. |
| `maxLength`      | `boolean`      | `65536`     | Limit the max length of the input string. An error is thrown if the input string is longer than this value. |
| `nobrace`        | `boolean`      | `false`     | Disabled brace matching. Thus, `{a,b}` and `{1..3}` would be treated as literals. |
| `nocase`         | `boolean`      | `false`     | Make matching case-insensitive. Equivalent to the regex `i` flag. Note that this option is overridden by the `flags` option. |
| `nodupes`        | `boolean`      | `true`      | Deprecated, use `nounique` instead. This option will be removed in a future major release. By default duplicates are removed. Disable uniquification by setting this option to false. |
| `noextglob`      | `boolean`      | `false`     | Disable support for matching with extglobs (like `+(a\|b)`) |
| `noglobstar`     | `boolean`      | `false`     | Disable support for matching nested directories with globstars (`**`) |
| `nonegate`       | `boolean`      | `false`     | Disable support for negating with leading `!` |
| `noquantifiers`  | `boolean`      | `false`     | Disable support for regex quantifiers (like `a{1,2}`) and treat them as brace patterns to be expanded. |
| `normalize`      | `boolean`      | `false`     | Normalize returned paths to remove leading `./` |
| `posix`          | `boolean`      | `false`     | Support POSX character classes ("posix brackets"). |
| `prepend`        | `boolean`      | `undefined` | String to prepend to the generated regex used for matching. |
| `strictBrackets` | `boolean`      | `undefined` | Throw an error if brackets, braces, or parens are imbalanced. |
| `strictSlashes`  | `boolean`      | `undefined` | Strictly enforce leading and trailing slashes. |
| `unescapeRegex`  | `boolean`      | `undefined` | Remove backslashes preceding escaped characters in the returned regular expression. By default, backslashes are retained. |
| `unixify`        | `boolean`      | `undefined` | Convert all slashes in the list to match (not in the glob pattern itself) to forward slashes. |

<br>
<br>

# Globbing features

* Basic globbing (Wildcard matching)
* Advanced globbing (extglobs, posix brackets, brace matching)

## Basic globbing

| **Character** | **Description** | 
| --- | --- | 
| `*` | Matches any character zero or more times, excluding path separators. Does _not match_ path separators or hidden files or directories ("dotfiles"), unless explicitly enabled by setting the `dot` option to `true`. | 
| `**` | Matches any character zero or more times, including path separators. Note that `**` will only match path separators (`/`, and `\\` on Windows) when they are the only characters in a path segment. Thus, `foo**/bar` is equivalent to `foo*/bar`, and `foo/a**b/bar` is equivalent to `foo/a*b/bar`, and _more than two_ consecutive stars in a glob path segment are regarded as _a single star_. Thus, `foo/***/bar` is equivalent to `foo/*/bar`. | 
| `?` | Matches any character excluding path separators one time. Does _not match_ path separators or leading dots.  | 
| `[abc]` | Matches any characters inside the brackets. For example, `[abc]` would match the characters `a`, `b` or `c`, and nothing else. | 

### Matching behavior vs. Bash

Picomatch's matching features and expected results in unit tests are based on Bash's unit tests and the Bash 4.3 specification, with the following exceptions:

* Bash will match `foo/bar/baz` with `*`. Picomatch only matches nested directories with `**`.
* Bash greedily matches with negated extglobs. For example, Bash 4.3 says that `!(foo)*` should match `foo` and `foobar`, since the trailing `*` bracktracks to match the preceding pattern. This is very memory-inefficient, and IMHO, also incorrect. Picomatch would return `false` for both `foo` and `foobar`.

<br>
<br>

## Advanced globbing

* extglobs (todo)
* POSIX brackets
* brace expansion (todo)
* regular expressions (todo)

### POSIX brackets

POSIX classes are disabled by default. Enable this feature by setting the `posix` option to true.

**Enable POSIX bracket support**

```js
console.log(pm.makeRe('[[:word:]]+', { posix: true }));
//=> /^(?:(?=.)[A-Za-z0-9_]+\/?)$/
```

**Supported POSIX classes**

The following named POSIX bracket expressions are supported:

* `[:alnum:]` - Alphanumeric characters, equ `[a-zA-Z0-9]`
* `[:alpha:]` - Alphabetical characters, equivalent to `[a-zA-Z]`.
* `[:ascii:]` - ASCII characters, equivalent to `[\\x00-\\x7F]`.
* `[:blank:]` - Space and tab characters, equivalent to `[ \\t]`.
* `[:cntrl:]` - Control characters, equivalent to `[\\x00-\\x1F\\x7F]`.
* `[:digit:]` - Numerical digits, equivalent to `[0-9]`.
* `[:graph:]` - Graph characters, equivalent to `[\\x21-\\x7E]`.
* `[:lower:]` - Lowercase letters, equivalent to `[a-z]`.
* `[:print:]` - Print characters, equivalent to `[\\x20-\\x7E ]`.
* `[:punct:]` - Punctuation and symbols, equivalent to `[\\-!"#$%&\'()\\*+,./:;<=>?@[\\]^_`{|}~]`.
* `[:space:]` - Extended space characters, equivalent to `[ \\t\\r\\n\\v\\f]`.
* `[:upper:]` - Uppercase letters, equivalent to `[A-Z]`.
* `[:word:]` -  Word characters (letters, numbers and underscores), equivalent to `[A-Za-z0-9_]`.
* `[:xdigit:]` - Hexadecimal digits, equivalent to `[A-Fa-f0-9]`.

See the [Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Pattern-Matching.html) for more information.

## Matching special characters as literals

If you wish to match the following special characters in a filepath, and you want to use these characters in your glob pattern, they must be escaped with backslashes or quotes:

**Special Characters**

Some characters that are used for matching in regular expressions are also regarded as valid file path characters on some platforms.

To match any of the following characters as literals: `$^*+?()[]

Examples:

```js
console.log(pm.makeRe('foo/bar \\(1\\)'));
console.log(pm.makeRe('foo/bar \\(1\\)'));
```

<br>
<br>

## Library Comparisons

Comparison to other libraries.

### Feature comparison

The following table shows which features are supported by [minimatch](https://github.com/isaacs/minimatch), [micromatch](https://github.com/micromatch/micromatch), [picomatch](https://github.com/folder/picomatch), [nanomatch](https://github.com/micromatch/nanomatch), [extglob](https://github.com/micromatch/extglob), [braces](https://github.com/micromatch/braces), and [expand-brackets](https://github.com/micromatch/expand-brackets).

| **Feature** | `minimatch` | `micromatch` | `picomatch` | `nanomatch` | `extglob` | `braces` | `expand-brackets` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| wildcard matching (`*?+`) | ✔ | ✔ | ✔ | ✔ | - | - | - |
| advancing globbing     | ✔ | ✔ | ✔ | - | - | - | - |
| brace _matching_       | ✔ | ✔ | ✔ | - | - | ✔ | - |
| brace _expansion_      | ✔ | ✔ | - | - | - | ✔ | - |
| extglobs               | partial | ✔ | ✔ | - | ✔ | - | - |
| posix brackets         | - | ✔ | ✔ | - | - | - | ✔ |
| regular expression syntax | - | ✔ | ✔ | ✔ | ✔ | - | ✔ |
| file system operations | - | - | - | - | - | - | - |

<br>
<br>

## Performance comparison

### Load time

```
minimatch: 4.230ms
picomatch: 2.123ms
```

### First match

Time it takes to return the first match, including `require()` time:

```js
console.log(require('minimatch').makeRe('**/*').test('foo/bar/baz/qux.js'));
// 9.275ms
console.log(require('picomatch').makeRe('**/*').test('foo/bar/baz/qux.js'));
// 7.429ms
```

<br>
<br>

## About

<details>
<summary><strong>Contributing</strong></summary>

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

Please read the [contributing guide](.github/contributing.md) for advice on opening issues, pull requests, and coding standards.

</details>

<details>
<summary><strong>Running Tests</strong></summary>

Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:

```sh
$ npm install && npm test
```

</details>

<details>
<summary><strong>Building docs</strong></summary>

_(This project's readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don't edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_

To generate the readme, run the following command:

```sh
$ npm install -g verbose/verb#dev verb-generate-readme && verb
```

</details>

### Author

**Jon Schlinkert**

* [GitHub Profile](https://github.com/jonschlinkert)
* [Twitter Profile](https://twitter.com/jonschlinkert)
* [LinkedIn Profile](https://linkedin.com/in/jonschlinkert)

### License

Copyright © 2018, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT License](LICENSE).