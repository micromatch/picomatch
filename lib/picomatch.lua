--[[
The MIT License (MIT)

Copyright (c) 2017-present, Jon Schlinkert.
Lua port by Matt Hargett.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT ! LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
]]
--!strict

local Array = require(script.Parent.array)
local RegExp = require(script.Parent.regex)
type Object = { [string]: any }
type Array<T> = { [number]: T }

local scan = require(script.Parent.scan)
local parse = require(script.Parent.parse)
local utils = require(script.Parent.utils)
local constants = require(script.Parent.constants)
local function isObject(val)
  return not Array.isArray(val)
end

local picomatch
local picomatchCallableTable = setmetatable({ state = {} }, {
  __call = function(_self, glob, options: Object?, returnState: any?)
    return picomatch(glob, options, returnState)
  end,
})

--[[*
 * Creates a matcher function from one or more glob patterns. The
 * returned function takes a string to match as its first argument,
 * and returns true if the string is a match. The returned matcher
 * function also takes a boolean as the second argument that, when true,
 * returns an object with additional information.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch(glob[, options]);
 *
 * const isMatch = picomatch('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 * ```
 * @name picomatch
 * @param {String|Array} `globs` One or more glob patterns.
 * @param {Object=} `options`
 * @return {Function=} Returns a matcher function.
 * @api public
 ]]
function picomatch(glob: any, options: Object?, returnState_: boolean?): (string, boolean?) -> boolean | Object
  local returnState = if returnState_ ~= nil then returnState_ else false
  if Array.isArray(glob) then
    local arrayMatcher: (string) -> boolean | Object
    local arrayMatcherCallableTable = setmetatable({}, {
      __call = function(_self, input: string): boolean | Object
        return arrayMatcher(input)
      end,
    })
    local fns = Array.map(glob :: Array<string>, function(input): (string) -> boolean
      return picomatch(input, options, returnState) :: (string) -> boolean
    end)
    function arrayMatcher(str: string): boolean
      for _, isMatch in fns do
        local state = isMatch(str :: string)
        if state then
          return state
        end
      end
      return false
    end
    -- Lua FIXME? could not massage the types to compatibility here
    return arrayMatcherCallableTable :: any
  end
  local isState = isObject(glob) and glob.tokens and glob.input ~= nil and glob.input ~= ""
  if glob == "" or type(glob) ~= "string" and not isState then
    error("Expected pattern to be a non-empty string")
  end
  local opts = if options then options else {} :: Object
  local posix = utils.isWindows(opts)
  local regex = if isState
    then picomatchCallableTable.compileRe(glob, opts)
    else picomatchCallableTable.makeRe(glob, options, false, true)
  local state = regex.state
  regex.state = nil
  local function isIgnored(_: string): boolean
    return false
  end
  if opts.ignore then
    local ignoreOpts = table.clone(opts)
    ignoreOpts.ignore, ignoreOpts.onMatch, ignoreOpts.onResult = nil, nil, nil
    isIgnored = picomatch(opts.ignore, ignoreOpts, returnState) :: any
  end
  local function matcher(input, returnObject_: boolean?)
    local returnObject = if returnObject_ ~= nil then returnObject_ else false
    local isMatch, match, output
    do
      local testResult = picomatchCallableTable.test(input, regex, opts, { glob = glob, posix = posix })
      isMatch, match, output = testResult.isMatch, testResult.match, testResult.output
    end
    local result = {
      glob = glob,
      state = state,
      regex = regex,
      posix = posix,
      input = input,
      output = output,
      match = match,
      isMatch = isMatch,
    }
    if type(opts.onResult) == "function" then
      opts:onResult(result)
    end
    if isMatch == false then
      result.isMatch = false
      return if returnObject then result else false
    end
    if isIgnored(input) then
      if type(opts.onIgnore) == "function" then
        opts:onIgnore(result)
      end
      result.isMatch = false
      return if returnObject then result else false
    end
    if type(opts.onMatch) == "function" then
      opts:onMatch(result)
    end
    return if returnObject then result else true
  end
  if returnState then
    matcher.state = state
  end
  return matcher
end
-- Lua FIXME: make this a Lua code example
--[[*
 * Test `input` with the given `regex`. This is used by the main
 * `picomatch()` function to test the input string.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatchCallableTable.test(input, regex[, options]);
 *
 * console.log(picomatchCallableTable.test('foo/bar', /^(?:([^/]*?)\/([^/]*?))$/));
 * // { isMatch: true, match: [ 'foo/', 'foo', 'bar' ], output: 'foo/bar' }
 * ```
 * @param {String} `input` String to test.
 * @param {RegExp} `regex`
 * @return {Object} Returns an object with matching info.
 * @api public
 ]]
picomatchCallableTable.test = function(input, regex, options, more_: Object?)
  local more = if more_ ~= nil then options else {} :: Object
  local glob, posix = more.glob, more.posix
  if type(input) ~= "string" then
    error("Expected input to be a string")
  end
  if input == "" then
    return { isMatch = false, output = "" }
  end
  local opts = options or {} :: Object
  local format = opts.format or if posix then utils.toPosixSlashes else nil
  local match = input == glob
  local output = if match and format then format(input) else input
  if match == false then
    output = if format then format(input) else input
    match = output == glob
  end
  if match == false or opts.capture == true then
    if opts.matchBase == true or opts.basename == true then
      match = picomatchCallableTable.matchBase(input, regex, options, posix)
    else
      match = regex:exec(output)
    end
  end
  return { isMatch = not not match, match = match, output = output }
end
--[[*
 * Match the basename of a filepath.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatchCallableTable.matchBase(input, glob[, options]);
 * console.log(picomatchCallableTable.matchBase('foo/bar.js', '*.js'); // true
 * ```
 * @param {String} `input` String to test.
 * @param {RegExp|String} `glob` Glob pattern or regex created by [.makeRe](#makeRe).
 * @return {Boolean}
 * @api public
 ]]
picomatchCallableTable.matchBase = function(_input, _glob, options, posix_: boolean?)
  local _posix = if posix_ ~= nil then posix_ else utils.isWindows(options)
  -- local regex = if type(glob) == "table" then glob else picomatchCallableTable.makeRe(glob, options)
  -- Lua FIXME: we need the equiv of path.basename
  -- return regex:test(path:basename(input))
  error("Lua needs a cross-platform implementation of path.basename")
end
--[[*
 * Returns true if **any** of the given glob `patterns` match the specified `string`.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatchCallableTable.isMatch(string, patterns[, options]);
 *
 * console.log(picomatchCallableTable.isMatch('a.a', ['b.*', '*.a'])); //=> true
 * console.log(picomatchCallableTable.isMatch('a.a', 'b.*')); //=> false
 * ```
 * @param {String|Array} str The string to test.
 * @param {String|Array} patterns One or more glob patterns to use for matching.
 * @param {Object} [options] See available [options](#options).
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 ]]
picomatchCallableTable.isMatch = function(str, patterns, options): boolean
  return picomatch(patterns, options)(str) :: boolean
end
--[[*
 * Parse a glob pattern to create the source string for a regular
 * expression.
 *
 * ```js
 * const picomatch = require('picomatch');
 * const result = picomatchCallableTable.parse(pattern[, options]);
 * ```
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {Object} Returns an object with useful properties and output to be used as a regex source string.
 * @api public
 ]]
--Lua FIXME: ridiculous bogus error TypeError: Type '(Array<any> | string, Object) -> Array where Array = {Array}' could not be converted into '(a, Object) -> Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<Array<... *TRUNCATED*'
picomatchCallableTable.parse = function(pattern: any, options: Object?): any
  if Array.isArray(pattern) then
    return Array.map(pattern :: Array<any>, function(p)
      return picomatchCallableTable.parse(p, options)
    end)
  end
  local opts = if options then table.clone(options) else {} :: Object
  opts.fastpath = false
  return parse(pattern :: string, opts :: Object)
end
--[[*
 * Scan a glob pattern to separate the pattern into segments.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatchCallableTable.scan(input[, options]);
 *
 * const result = picomatchCallableTable.scan('!./foo/*.js');
 * console.log(result);
 * { prefix: '!./',
 *   input: '!./foo/*.js',
 *   start: 3,
 *   base: 'foo',
 *   glob: '*.js',
 *   isBrace: false,
 *   isBracket: false,
 *   isGlob: true,
 *   isExtglob: false,
 *   isGlobstar: false,
 *   negated: true }
 * ```
 * @param {String} `input` Glob pattern to scan.
 * @param {Object} `options`
 * @return {Object} Returns an object with
 * @api public
 ]]
picomatchCallableTable.scan = scan
--[[*
 * Compile a regular expression from the `state` object returned by the
 * [parse()](#parse) method.
 *
 * @param {Object} `state`
 * @param {Object} `options`
 * @param {Boolean} `returnOutput` Intended for implementors, this argument allows you to return the raw output from the parser.
 * @param {Boolean} `returnState` Adds the state to a `state` property on the returned regex. Useful for implementors and debugging.
 * @return {RegExp}
 * @api public
 ]]
picomatchCallableTable.compileRe = function(state, options, returnOutput_: boolean?, returnState_: boolean?)
  local returnOutput = if returnOutput_ ~= nil then returnOutput_ else false
  -- missing 'if' in if-expression below directs me to this correct line:  error parsing: error occurred while creating ast: unexpected token `then`. (starting from line 299, character 32 and ending on line 299, character 36) additional information: expected 'end'

  local returnState = if returnState_ ~= nil then returnState_ else false
  if returnOutput == true then
    return state.output
  end
  local opts = options or {} :: Object
  local prepend = if opts.contains then "" else "^"
  local append = if opts.contains then "" else "$"
  local source = `{prepend}(?:{state.output}){append}`
  if state and state.negated then
    source = `^(?!{source}).*$`
  end
  local regex = picomatchCallableTable.toRegex(source, options)
  if returnState == true then
    regex.state = state
  end
  return regex
end
--[[*
 * Create a regular expression from a parsed glob pattern.
 *
 * ```js
 * const picomatch = require('picomatch');
 * const state = picomatchCallableTable.parse('*.js');
 * // picomatchCallableTable.compileRe(state[, options]);
 *
 * console.log(picomatchCallableTable.compileRe(state));
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {String} `state` The object returned from the `.parse` method.
 * @param {Object} `options`
 * @param {Boolean} `returnOutput` Implementors may use this argument to return the compiled output, instead of a regular expression. This is not exposed on the options to prevent end-users from mutating the result.
 * @param {Boolean} `returnState` Implementors may use this argument to return the state from the parsed glob with the returned regular expression.
 * @return {RegExp} Returns a regex created from the given pattern.
 * @api public
 ]]
picomatchCallableTable.makeRe = function(input, options_: Object?, returnOutput_: boolean?, returnState_: boolean?)
  local options = options_ or {} :: Object
  local returnOutput = if returnOutput_ ~= nil then returnOutput_ else false
  local returnState = if returnState_ ~= nil then returnState_ else false
  if type(input) ~= "string" then
    error("Expected a non-empty string")
  end
  local parsed = { negated = false, fastpaths = true }
  if
    -- Lua TODO?: never use fastpaths so we avoid making parse a callable table
    -- options.fastpaths ~= false
    false and (input[1] == "." or input[1] == "*")
  then
    -- parsed.output = parse.fastpaths(input, options)
    parsed.output = nil
  end
  if parsed.output == nil or string.len(parsed.output) == 0 then
    parsed = parse(input, options)
  end
  return picomatchCallableTable.compileRe(parsed, options, returnOutput, returnState)
end
--[[*
 * Create a regular expression from the given regex source string.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatchCallableTable.toRegex(source[, options]);
 *
 * const { output } = picomatchCallableTable.parse('*.js');
 * console.log(picomatchCallableTable.toRegex(output));
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {String} `source` Regular expression source string.
 * @param {Object} `options`
 * @return {RegExp}
 * @api public
 ]]
picomatchCallableTable.toRegex = function(source: string, options: Object?)
  local opts = options or {} :: Object
  local ok, result = pcall(RegExp, source, if opts.flags then opts.flags else if opts.nocase then "i" else "")
  if not ok then
    local err = result
    if options ~= nil and options.debug == true then
      error(err)
    end
    return RegExp("$^")
  end
  return result
end
--[[*
 * Picomatch constants.
 * @return {Object}
 ]]
picomatchCallableTable.constants = constants
--[[*
 * Expose "picomatch"
 ]]
return picomatch
