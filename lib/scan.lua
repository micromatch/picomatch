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

local utils = require(script.Parent.utils)
local constants = require(script.Parent.constants)

local CHAR_ASTERISK, CHAR_AT, CHAR_BACKWARD_SLASH, CHAR_COMMA, CHAR_DOT, CHAR_EXCLAMATION_MARK, CHAR_FORWARD_SLASH, CHAR_LEFT_CURLY_BRACE, CHAR_LEFT_PARENTHESES, CHAR_LEFT_SQUARE_BRACKET, CHAR_PLUS, CHAR_QUESTION_MARK, CHAR_RIGHT_CURLY_BRACE, CHAR_RIGHT_PARENTHESES, CHAR_RIGHT_SQUARE_BRACKET =
  constants.CHAR_ASTERISK,             --[*]
  constants.CHAR_AT,                   --[@]
  constants.CHAR_BACKWARD_SLASH,       --[\]
  constants.CHAR_COMMA,                --[,]
  constants.CHAR_DOT,                  --[.]
  constants.CHAR_EXCLAMATION_MARK,     --[!]
  constants.CHAR_FORWARD_SLASH,        --[/]
  constants.CHAR_LEFT_CURLY_BRACE,     --[{]
  constants.CHAR_LEFT_PARENTHESES,     --[(]
  constants.CHAR_LEFT_SQUARE_BRACKET,  --[ \[ ]
  constants.CHAR_PLUS,                 --[+]
  constants.CHAR_QUESTION_MARK,        --[?]
  constants.CHAR_RIGHT_CURLY_BRACE,    --[}]
  constants.CHAR_RIGHT_PARENTHESES,    --[)]
  constants.CHAR_RIGHT_SQUARE_BRACKET  --[\]]

local isPathSeparator = function(code)
  return code === CHAR_FORWARD_SLASH or code === CHAR_BACKWARD_SLASH
end

local depth = function(token)
  if (token.isPrefix ~= true) then
    token.depth = if token.isGlobstar then math.huge else 1
  end
end

-[[*
 * Quickly scans a glob pattern and returns an object with a handful of
 * useful properties, like `isGlob`, `path` (the leading non-glob, if it exists),
 * `glob` (the actual pattern), `negated` (true if the path starts with `!` but not
 * with `!(`) and `negatedExtglob` (true if the path starts with `!(`).
 *
 * ```js
 * const pm = require('picomatch');
 * console.log(pm.scan('foo/bar/*.js'));
 * { isGlob: true, input: 'foo/bar/*.js', base: 'foo/bar', glob: '*.js' }
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {Object} Returns an object with tokens and regex source string.
 * @api public
]]

const scan = function(input, options)
  local opts: Object = options or {}

  local length = #input + 1
  local scanToEnd = opts.parts == true or opts.scanToEnd == true
  local slashes = {}
  local tokens = {}
  local parts = {}

  local str = input
  local index = 0
  local start = 1
  local lastIndex = 1
  local isBrace = false
  local isBracket = false
  local isGlob = false
  local isExtglob = false
  local isGlobstar = false
  local braceEscaped = false
  local backslashes = false
  local negated = false
  local negatedExtglob = false
  local finished = false
  local braces = 0
  local prev
  local code
  local token = { value = "", depth = 0, isGlob = false }

  local function eos()
          return index >= length
  end
  local function peek()
          return String.charCodeAt(str, index + 1)
  end
  local function advance()
          prev = code
          index += 1
          return String.charCodeAt(str, index)
  end

  local function advanceAndAssignCode()
          code = advance()
          return code
  end

  while index < length do
    advanceAndAssignCode()
    local next

    if code == CHAR_BACKWARD_SLASH then
            token.backslashes = true
            backslashes = token.backslashes
            advanceAndAssignCode()

            if code == CHAR_LEFT_CURLY_BRACE then
                    braceEscaped = true
            end
            continue
    end

    if braceEscaped == true or code == CHAR_LEFT_CURLY_BRACE then
            braces += 1
            while eos() ~= true and advanceAndAssignCode() ~= nil) do
                    if code == CHAR_BACKWARD_SLASH then
                            token.backslashes = true
                            backslashes = token.backslashes
                            advance()
                            continue
                    end

                    if code == CHAR_LEFT_CURLY_BRACE then
                            braces += 1
                            continue
                    end

                    if
                            braceEscaped ~= true
                            and code == CHAR_DOT
                            and advanceAndAssignCode() == CHAR_DOT
                    then
                            token.isBrace = true
                            isBrace = token.isBrace
                            token.isGlob = true
                            isGlob = token.isGlob
                            finished = true

                            if scanToEnd == true then
                                    continue
                            end

          break
                          end


                          if braceEscaped ~= true and code == CHAR_COMMA then
                            token.isBrace = true
                            isBrace = token.isBrace
                            token.isGlob = true
                            isGlob = token.isGlob
                            finished = true

                            if scanToEnd == true then
                                    continue
                            end

                            break
                    end

                    if code == CHAR_RIGHT_CURLY_BRACE then
                            braces -= 1

                            if braces == 0 then
                                    braceEscaped = false
                                    token.isBrace = true
                                    isBrace = token.isBrace
                                    finished = true
                                    break
                            end
                    end
            end

            if scanToEnd == true then
                    continue
            end

            break
    end

    if code == CHAR_FORWARD_SLASH then
      table.insert(slashes, index)
      table.insert(tokens, token)
      token = { value = "", depth = 0, isGlob = false }

      if finished == true then
              continue
      end
      if prev == CHAR_DOT and index == (start + 1) then
              start += 2
              continue
      end

      lastIndex = index + 1
      continue
end

if opts.noext ~= true then
  local isExtglobChar = code == CHAR_PLUS
          or code == CHAR_AT
          or code == CHAR_ASTERISK
          or code == CHAR_QUESTION_MARK
          or code == CHAR_EXCLAMATION_MARK

  if isExtglobChar == true and peek() == CHAR_LEFT_PARENTHESES then
          token.isGlob = true
          isGlob = token.isGlob
          token.isExtglob = true
          isExtglob = token.isExtglob
          finished = true
          if code == CHAR_EXCLAMATION_MARK and index == start then
                  negatedExtglob = true
          end

          if scanToEnd == true then
                  while
                          eos() ~= true
                          and advanceAndAssignCode()
                  do
                          if code == CHAR_BACKWARD_SLASH then
                                  token.backslashes = true
                                  backslashes = token.backslashes
                                  advanceAndAssignCode()
                                  continue
                          end

                          if code == CHAR_RIGHT_PARENTHESES then
                                  token.isGlob = true
                                  isGlob = token.isGlob
                                  finished = true
                                  break
                          end
                  end
                  continue
          end
          break
  end
end

if code == CHAR_ASTERISK then
  if prev == CHAR_ASTERISK then
          token.isGlobstar = true
          isGlobstar = token.isGlobstar
  end
  token.isGlob = true
  isGlob = token.isGlob
  finished = true

  if scanToEnd == true then
          continue
  end
  break
end

if code == CHAR_QUESTION_MARK then
  token.isGlob = true
  isGlob = token.isGlob
  finished = true

  if scanToEnd == true then
          continue
  end
  break
end

if code == CHAR_LEFT_SQUARE_BRACKET then
  next = advance()
  while eos() ~= true and next ~= nil do
          if next == CHAR_BACKWARD_SLASH then
                  token.backslashes = true
                  backslashes = token.backslashes
                  advance()
                  if eos() ~= true then
                    next = advance()
                  end
                  continue
          end

          if next == CHAR_RIGHT_SQUARE_BRACKET then
                  token.isBracket = true
                  isBracket = token.isBracket
                  token.isGlob = true
                  isGlob = token.isGlob
                  finished = true
                  break
          end
  end

  if scanToEnd == true then
          continue
  end

  break
end

if opts.nonegate ~= true and code == CHAR_EXCLAMATION_MARK and index == start then
  token.negated = true
  negated = token.negated
  start += 1
  continue
end

if opts.noparen ~= true and code == CHAR_LEFT_PARENTHESES then
  token.isGlob = true
  isGlob = token.isGlob

  if scanToEnd == true then
          while
                  eos() ~= true
                  and advanceAndAssignCode())
          do
                  if code == CHAR_LEFT_PARENTHESES then
                          token.backslashes = true
                          backslashes = token.backslashes
                          advanceAndAssignCode()
                          continue
                  end

                  if code == CHAR_RIGHT_PARENTHESES then
                          finished = true
                          break
                  end
          end
          continue
  end
  break
end

if isGlob == true then
  finished = true

  if scanToEnd == true then
          continue
  end

  break
end
end

if opts.noext == true then
isExtglob = false
isGlob = false
end

local base = str
local prefix = ""
local glob = ""

if start > 1 then
  prefix = String.slice(str, 1, start)
  str = String.slice(str, start)
  lastIndex -= start
end

if base ~= nil and string.len(base) ~= 0 and isGlob == true and lastIndex > 1 then
  base = String.slice(str, 1, lastIndex)
  glob = String.slice(str, lastIndex)
elseif isGlob == true then
  base = ""
  glob = str
else
  base = str
end

if base ~= nil and base ~= "" and base ~= "/" and base ~= str then
  if isPathSeparator(String.charCodeAt(base, string.len(base))) then
          base = String.slice(base, 1, -1)
  end
end

if opts.unescape == true then
  if glob ~= nil and string.len(glob) ~= 0 then
          glob = utils.removeBackslashes(glob)
  end

  if base ~= nil and string.len(base) ~= 0 and backslashes == true then
          base = utils.removeBackslashes(base)
  end
end

local state = {
  prefix = prefix,
  input = input,
  start = start,
  base = base,
  glob = glob,
  isBrace = isBrace,
  isBracket = isBracket,
  isGlob = isGlob,
  isExtglob = isExtglob,
  isGlobstar = isGlobstar,
  negated = negated,
  negatedExtglob = negatedExtglob,
}


if opts.tokens == true then
  state.maxDepth = 0
  if not isPathSeparator(code) then
          table.insert(tokens, token)
  end
  state.tokens = tokens
end

if opts.parts == true or opts.tokens == true then
  local prevIndex

  for idx = 1, #slashes do
          local n = if prevIndex ~= nil and prevIndex ~= 0 then prevIndex + 1 else start
          local i = slashes[idx]
          local value = String.slice(input, n, i)
          if opts.tokens then
                  if idx == 1 and start ~= 1 then
                          tokens[idx].isPrefix = true
                          tokens[idx].value = prefix
                  else
                          tokens[idx].value = value
                  end
                  depth(tokens[idx])
                  state.maxDepth += tokens[idx].depth
          end
          if idx ~= 1 or value ~= "" then
                  table.insert(parts, value)
          end
          prevIndex = i
  end

  if prevIndex ~= nil and prevIndex ~= 0 and prevIndex + 1 < string.len(input) then
          local value = String.slice(input, prevIndex + 1)
          table.insert(parts, value)

          if opts.tokens then
                  tokens[#tokens].value = value
                  depth(tokens[#tokens])
                  state.maxDepth += tokens[#tokens].depth
          end
  end

  state.slashes = slashes
  state.parts = parts
end

return state
end

return scan
