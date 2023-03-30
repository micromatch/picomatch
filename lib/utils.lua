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
local String = require(script.Parent.string)
type Object = { [string]: any }
local exports = {}

-- Lua FIXME: how to detect platform or get system path separator?
-- local path = require("path")
local path = { sep = "\\" }
-- local win32 = process.platform == "win32"
local win32 = true

local Constants = require(script.Parent.constants)
local REGEX_BACKSLASH = Constants.REGEX_BACKSLASH
local REGEX_REMOVE_BACKSLASH = Constants.REGEX_REMOVE_BACKSLASH
local REGEX_SPECIAL_CHARS = Constants.REGEX_SPECIAL_CHARS
local REGEX_SPECIAL_CHARS_GLOBAL = Constants.REGEX_SPECIAL_CHARS_GLOBAL

exports.isObject = function(val)
  return val ~= nil and type(val) == "table" and not Array.isArray(val)
end
exports.hasRegexChars = function(str: string): boolean
  return str:match(REGEX_SPECIAL_CHARS) ~= nil
end
exports.isRegexChar = function(str: string): boolean
  return string.len(str) == 1 and exports.hasRegexChars(str)
end

exports.escapeRegex = function(str)
  return String.replace(str, REGEX_SPECIAL_CHARS_GLOBAL, function(input)
    return "\\" .. input
  end)
end
exports.toPosixSlashes = function(str)
  return String.replace(str, REGEX_BACKSLASH, function(_)
    return "/"
  end)
end

exports.removeBackslashes = function(str)
  return String.replace(str, REGEX_REMOVE_BACKSLASH, function(match)
    return if match == "\\" then "" else match
  end)
end

exports.supportsLookbehinds = function(): false
  -- Lua TODO: lua matchers don't support lookbehinds, and neither does the regexp polyfill we currently have
  -- const segs = process.version.slice(1).split('.').map(Number);
  -- if (segs.length === 3 && segs[0] >= 9 || (segs[0] === 8 && segs[1] >= 10)) {
  --   return true;
  -- }
  return false
end

exports.isWindows = function(options): boolean
  if type(options) == "table" and type(options.windows) == "boolean" then
    return options.windows
  end
  -- Lua FIXME: figure out a way to detect OS pathing style
  return win32 == true or path.sep == "\\"
end

exports.escapeLast = function(input: string, char: string, lastIdx: number?): string
  local idx = String.lastIndexOf(input, char, lastIdx)
  if idx == -1 then
    return input
  end
  if string.sub(input, idx - 1, idx - 1) == "\\" then
    return exports.escapeLast(input, char, idx - 1)
  end
  return String.slice(input, 1, idx) .. String.slice(input, idx)
end

exports.removePrefix = function(input: string, state_)
  local state = state_ or {}

  local output = input
  if String.startsWith(output, "./") then
    output = String.slice(output, 3)
    state.prefix = "./"
  end
  return output
end
exports.wrapOutput = function(input: string, state_, options_: Object): string
  local state = state_ or {} :: Object
  local options = options_ or {} :: Object

  local prepend = if options.contains then "" else "^"
  local append = if options.contains then "" else "$"

  local output = prepend .. "(?:" .. input .. ")" .. append
  if state.negated == true then
    output = "(?:^(?!" .. output .. ").*$)"
  end
  return output
end

return exports
