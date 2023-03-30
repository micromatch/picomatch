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
type Array<T> = Array.Array<T>
local String = require(script.Parent.string)
type Object = { [string]: any }
local RegExp = require(script.Parent.regex)

local constants = require(script.Parent.constants)
local utils = require(script.Parent.utils)

--[[*
 * Constants
 ]]

local MAX_LENGTH, POSIX_REGEX_SOURCE, REGEX_NON_SPECIAL_CHARS, REGEX_SPECIAL_CHARS_BACKREF, REPLACEMENTS =
  constants.MAX_LENGTH,
  constants.POSIX_REGEX_SOURCE,
  constants.REGEX_NON_SPECIAL_CHARS,
  constants.REGEX_SPECIAL_CHARS_BACKREF,
  constants.REPLACEMENTS

--[[*
 * Helpers
 ]]

local expandRange = function(args: Array<any>, options)
  if type(options.expandRange) == "function" then
    return options.expandRange(table.unpack(args), options)
  end

  Array.sort(args)
  local value = `[{Array.join(args, "-")}]`

  --[[ eslint-disable-next-line no-new ]]
  local ok = pcall(RegExp, value)
  if not ok then
    return Array.join(
      Array.map(args, function(v)
        return utils.escapeRegex(v)
      end),
      ".."
    )
  end

  return value
end

--[[*
 * Create the message for a syntax error
 ]]

local syntaxError = function(type, char)
  return `Missing {type}: "{char}" - use "\\\\{char}" to match literal characters`
end

--[[*
 * Parse the given input string.
 * @param {String} input
 * @param {Object} options
 * @return {Object}
 ]]

local function parse(input: string, options: Object): Object
  if type(input) ~= "string" then
    error("Expected a string")
  end

  input = REPLACEMENTS[input] or input

  local opts = table.clone(options)
  local max = if type(opts.maxLength) == "number" then math.min(MAX_LENGTH, opts.maxLength) else MAX_LENGTH

  -- Lua TODO: does this need to support utf8?
  local len = #input
  if len > max then
    error(`Input length: {len}, exceeds maximum allowed length: {max}`)
  end

  local bos = { type = "bos", value = "", output = opts.prepend or "" }
  local tokens = { bos }

  local capture = if opts.capture then "" else "?:"
  local win32 = utils.isWindows(options)

  -- create constants based on platform, for windows or posix
  local PLATFORM_CHARS = constants.globChars(win32)
  local EXTGLOB_CHARS = constants.extglobChars(PLATFORM_CHARS)

  local DOT_LITERAL, PLUS_LITERAL, SLASH_LITERAL, ONE_CHAR, DOTS_SLASH, NO_DOT, NO_DOT_SLASH, NO_DOTS_SLASH, QMARK, QMARK_NO_DOT, STAR, START_ANCHOR =
    PLATFORM_CHARS.DOT_LITERAL,
    PLATFORM_CHARS.PLUS_LITERAL,
    PLATFORM_CHARS.SLASH_LITERAL,
    PLATFORM_CHARS.ONE_CHAR,
    PLATFORM_CHARS.DOTS_SLASH,
    PLATFORM_CHARS.NO_DOT,
    PLATFORM_CHARS.NO_DOT_SLASH,
    PLATFORM_CHARS.NO_DOTS_SLASH,
    PLATFORM_CHARS.QMARK,
    PLATFORM_CHARS.QMARK_NO_DOT,
    PLATFORM_CHARS.STAR,
    PLATFORM_CHARS.START_ANCHOR

  local globstar = function(opts)
    return `({capture}(?:(?!{START_ANCHOR}{if opts.dot then DOTS_SLASH else DOT_LITERAL}).)*?)`
  end

  local nodot = if opts.dot then "" else NO_DOT
  local qmarkNoDot = if opts.dot then QMARK else QMARK_NO_DOT
  local star = if opts.bash == true then globstar(opts) else STAR

  if opts.capture then
    star = `({star})`
  end

  -- minimatch options support
  if type(opts.noext) == "boolean" then
    opts.noextglob = opts.noext
  end

  local state = {
    input = input,
    index = -1,
    start = 0,
    dot = opts.dot == true,
    consumed = "",
    output = "",
    prefix = "",
    backtrack = false,
    negated = false,
    brackets = 0,
    braces = 0,
    parens = 0,
    quotes = 0,
    globstar = false,
    tokens = tokens,
  }

  input = utils.removePrefix(input, state)
  -- Lua TODO: does this need to support utf8?
  len = #input

  local extglobs: Array<Object> = {}
  local braces: Array<Object> = {}
  local stack: Array<string> = {}
  local prev: Object = bos
  local value: string

  --[[*
   * Tokenizing helpers
   ]]

  local eos = function()
    return state.index == len
  end

  state.peek = function(n_: number?): string
    local n = if n_ ~= nil then n_ else 1
    return string.sub(input, state.index + n, state.index + n)
  end
  local peek = state.peek

  state.advance = function(): string
    state.index += 1
    return string.sub(input, state.index, state.index) or ""
  end
  local advance = state.advance

  local remaining = function(): string
    return string.sub(input, state.index + 1)
  end

  local consume = function(value_: string?, num_: number?): ()
    local value = value_ or ""
    local num = num_ or 0
    state.consumed ..= value
    state.index += num
  end

  local append = function(token: Object): ()
    state.output ..= if token.output ~= nil then token.output else token.value
    consume(token.value)
  end

  local negate = function()
    local count = 1

    while peek() == "!" and (peek(2) ~= "(" or peek(3) == "?") do
      advance()
      state.start += 1
      count += 1
    end

    if count % 2 == 0 then
      return false
    end

    state.negated = true
    state.start += 1
    return true
  end

  local function increment(type)
    state[type] += 1
    table.insert(stack, type)
  end

  local function decrement(type)
    state[type] -= 1
    table.remove(stack)
  end

  --[[*
   * Push tokens onto the tokens array. This helper speeds up
   * tokenizing by 1) helping us avoid backtracking as much as possible,
   * and 2) helping us avoid creating extra tokens when consecutive
   * characters are plain text. This improves performance and simplifies
   * lookbehinds.
   ]]

  local push = function(tok: Object): ()
    -- LUA NOTE: cache the length instead of re-querying it, Lua runtimes don't help optimize this
    local extGlobsLength = #extglobs
    if prev.type == "globstar" then
      local isBrace = state.braces > 0 and (tok.type == "comma" or tok.type == "brace")
      local isExtglob = tok.extglob == true or (extGlobsLength ~= 0 and (tok.type == "pipe" or tok.type == "paren"))

      if tok.type ~= "slash" and tok.type ~= "paren" and not isBrace and not isExtglob then
        state.output = String.slice(state.output, 0, -string.len(prev.output))
        prev.type = "star"
        prev.value = "*"
        prev.output = star
        state.output ..= prev.output
      end
    end

    if extGlobsLength ~= 0 and tok.type ~= "paren" then
      extglobs[extGlobsLength].inner ..= tok.value
    end

    if tok.value or tok.output then
      append(tok)
    end
    if prev and prev.type == "text" and tok.type == "text" then
      prev.value ..= tok.value
      -- LUA NOTE: minor change to avoid an unnecessary string concat if we don't need to
      prev.output = if prev.output then prev.output .. tok.value else tok.value
      return
    end

    tok.prev = prev
    table.insert(tokens, tok)
    prev = tok
  end

  local extglobOpen = function(type, value: string)
    -- LUA NOTE: manually unrolled Object.assign({}, ...) avoids unnecessary table re-hashing
    local token = table.clone(EXTGLOB_CHARS[value]) :: Object
    token.conditions = 1
    token.inner = ""

    token.prev = prev
    token.parens = state.parens
    token.output = state.output
    -- LUA NOTE: minor change to avoid an unnecessary string concat if we don't need to
    local output = if opts.capture then "(" .. token.open else token.open

    increment("parens")
    push({ type = type, value = value, output = if state.output then "" else ONE_CHAR })
    push({ type = "paren", extglob = true, value = advance(), output = output })
    table.insert(extglobs, token)
  end

  local extglobClose = function(token: Object): ()
    local output = if opts.capture then token.close .. ")" else token.close
    local rest

    if token.type == "negate" then
      local extglobStar = star

      if token.inner ~= nil and string.len(token.inner) > 1 and string.find(token.inner, "/", 1, true) ~= nil then
        extglobStar = globstar(opts)
      end

      if extglobStar ~= star or eos() or RegExp("^\\)+$"):test(remaining()) then
        token.close = `)$)){extglobStar}`
        output = token.close
      end

      if string.find(token.inner, "*", 1, true) ~= nil then
        rest = remaining()
        if rest and RegExp("^\\.[^\\\\/.]+$"):test(rest) then
          -- Any non-magical string (`.ts`) or even nested expression (`.{ts,tsx}`) can follow after the closing parenthesis.
          -- In this case, we need to parse the string and use it in the output of the original pattern.
          -- Suitable patterns: `/!(*.d).ts`, `/!(*.d).{ts,tsx}`, `**/!(*-dbg).@(js)`.
          --
          -- Disabling the `fastpaths` option due to a problem with parsing strings as `.ts` in the pattern like `**/!(*.d).ts`.
          -- Lua NOTE: use table.clone instead of Object.assign({},...) for efficiency
          local optionsClone = table.clone(options)
          optionsClone.fastpaths = false
          local expression = parse(rest, optionsClone).output

          token.close = `){expression}){extglobStar})`
          output = token.close
        end
      end

      if token.prev.type == "bos" then
        state.negatedExtglob = true
      end
    end

    push({ type = "paren", extglob = true, value = value, output = output })
    decrement("parens")
  end

  --[[*
   * Fast paths
   ]]

  if opts.fastpaths ~= false and not RegExp('(^[*!]|[/()[\\]{}"])'):test(input) then
    local backslashes = false

    local output = String.replace(input, REGEX_SPECIAL_CHARS_BACKREF, function(m, esc, chars, first, rest, index)
      if first == "\\" then
        backslashes = true
        return m
      end

      -- Lua NOTE: cache string.len(rest) instead of re-querying it, Lua runtimes don't help optimize this
      local restLength = string.len(rest)
      local charsLength = string.len(chars)
      if first == "?" then
        if esc ~= nil and esc ~= "" then
          -- Lua NOTE: avoid concat of '' if we don't need to
          return if rest == nil then esc .. first else esc .. first .. string.rep(QMARK, restLength)
        end
        if index == 0 then
          return if rest ~= nil then qmarkNoDot .. string.rep(QMARK, restLength) else qmarkNoDot
        end
        return string.rep(QMARK, charsLength)
      end

      if first == "." then
        return string.rep(DOT_LITERAL, charsLength)
      end

      if first == "*" then
        if esc ~= nil and esc ~= "" then
          -- Lua NOTE: avoid concat of '' if we don't need to
          return if rest ~= nil then esc .. first .. star else esc .. first
        end
        return star
      end
      return if esc ~= nil and esc ~= "" then m else `"\\{m}`
    end)

    if backslashes == true then
      if opts.unescape == true then
        output = String.replace(output, RegExp("\\", "g"), function(_)
          return ""
        end)
      else
        output = String.replace(output, RegExp("\\", "g"), function(m)
          return if string.len(m) % 2 == 0 then "\\\\" else (if m ~= nil and m ~= "" then "\\" else "")
        end)
      end
    end

    if output == input and opts.contains == true then
      state.output = input
      return state
    end

    state.output = utils.wrapOutput(output, state, options)
    return state
  end

  --[[*
   * Tokenize input until we reach end-of-string
   ]]

  while not eos() do
    value = advance()

    if value == "\u{0000}" then
      continue
    end

    --[[*
     * Escaped characters
     ]]

    if value == "\\" :: string then
      local next = peek()

      if next == "/" and opts.bash ~= true then
        continue
      end

      if next == "." or next == ";" then
        continue
      end

      if not next or next == "" then
        value ..= "\\"
        push({ type = "text", value = value })
        continue
      end

      -- collapse slashes to reduce potential for exploits
      local match = RegExp("^\\\\+"):exec(remaining())
      local slashes = 0

      -- Lua BUG: it thinks match isn't a type table
      local firstMatchLength = if match ~= nil then string.len((match :: any)[1]) else 0
      if firstMatchLength > 2 then
        slashes = firstMatchLength
        state.index += slashes
        if slashes % 2 ~= 0 then
          value ..= "\\"
        end
      end

      if opts.unescape == true then
        value = advance()
      else
        value ..= advance()
      end

      if state.brackets == 0 then
        push({ type = "text", value = value })
        continue
      end
    end

    --[[*
     * If we're inside a regex character class, continue
     * until we reach the closing bracket.
     ]]

    if state.brackets > 0 and (value ~= "]" or prev.value == "[" or prev.value == "[^") then
      if opts.posix ~= false and value == ":" then
        local inner = String.slice(prev.value, 1)
        if string.find(inner, "[", 1, true) ~= nil then
          prev.posix = true

          if string.find(inner, ":", 1, true) ~= nil then
            local idx = String.lastIndexOf(prev.value, "[")
            local pre = String.slice(prev.value, 1, idx)
            local rest = String.slice(prev.value, idx + 2)
            local posix = POSIX_REGEX_SOURCE[rest]
            if posix then
              prev.value = pre .. posix
              state.backtrack = true
              advance()

              if not (bos.output == nil or bos.output == "") and Array.indexOf(tokens, prev) == 2 then
                bos.output = ONE_CHAR
              end
              continue
            end
          end
        end
      end

      if value == "[" and peek() ~= ":" or value == "-" and peek() == "]" then
        value = `\\{value}`
      end

      if value == "]" and (prev.value == "[" or prev.value == "[^") then
        value = `\\{value}`
      end

      if opts.posix == true and value == "!" and prev.value == "[" then
        value = "^"
      end

      -- Lua BUG: totally bogus TypeError: Type 'string' could not be converted into '"[" | "[^"'; none of the union options are compatible
      prev.value ..= value :: any
      append({ value = value :: string })
      continue
    end

    --[[*
     * If we're inside a quoted string, continue
     * until we reach the closing double quote.
     ]]

    if state.quotes == 1 and value ~= '"' then
      value = utils.escapeRegex(value :: string)
      prev.value ..= value
      append({ value = value })
      continue
    end

    --[[*
     * Double quotes
     ]]

    if value == '"' then
      state.quotes = if state.quotes == 1 then 0 else 1
      if opts.keepQuotes == true then
        push({ type = "text", value = value })
      end
      continue
    end
    --[[*
     * Parentheses
     ]]

    if value == "(" then
      increment("parens")
      push({ type = "paren", value = value })
      continue
    end

    if value == ")" then
      if state.parens == 0 and opts.strictBrackets == true then
        error("SyntaxError: " .. syntaxError("opening", "("))
      end

      local extglob = extglobs[#extglobs]
      if extglob ~= nil and state.parens == extglob.parens + 1 then
        -- Lua note: type solver doesn't know that extglob non-nil at index of table lenth means table.remove() is guaranteed non-nil
        extglobClose(table.remove(extglobs) :: Object)
        continue
      end

      push({
        type = "paren",
        value = value,
        output = if state.parens ~= 0 then ")" else "\\)",
      })
      decrement("parens")
      continue
    end
    --[[*
     * Square brackets
     ]]

    if value == "[" then
      if opts.nobracket == true or string.find(remaining(), "]", 1, true) == nil then
        if opts.nobracket ~= true and opts.strictBrackets == true then
          error("SyntaxError: " .. syntaxError("closing", "]"))
        end

        value = `\\{value}`
      else
        increment("brackets")
      end

      push({ type = "bracket", value = value })
      continue
    end
    if value == "]" then
      if opts.nobracket == true or (prev ~= nil and prev.type == "bracket" and #prev.value == 1) then
        push({ type = "text", value = value, output = `\\{value}` })
        continue
      end
      if state.brackets == 0 then
        if opts.strictBrackets == true then
          error(syntaxError("opening", "["))
        end

        push({ type = "text", value = value, output = `\\{value}` })
        continue
      end

      decrement("brackets")

      local prevValue = String.slice(prev.value, 2)
      if prev.posix ~= true and string.sub(prevValue, 1, 1) == "^" and string.find(prevValue, "/", 1, true) == nil then
        value = `/{value}`
      end

      prev.value ..= value
      append({ value = value })

      -- when literal brackets are explicitly disabled
      -- assume we should match with a regex character class
      if opts.literalBrackets == false or utils.hasRegexChars(prevValue) then
        continue
      end

      local escaped = utils.escapeRegex(prev.value)
      state.output = String.slice(state.output, 1, -#prev.value)

      -- when literal brackets are explicitly enabled
      -- assume we should escape the brackets to match literal characters
      if opts.literalBrackets == true then
        state.output ..= escaped
        prev.value = escaped
        continue
      end

      local escaped = utils.escapeRegex(prev.value)
      state.output = String.slice(state.output, 1, -#prev.value)

      -- when literal brackets are explicitly enabled
      -- assume we should escape the brackets to match literal characters
      if opts.literalBrackets == true then
        state.output ..= escaped
        prev.value = escaped
        continue
      end

      -- when the user specifies nothing, try to match both
      prev.value = `({capture}{escaped}|{prev.value})`
      state.output ..= prev.value
      continue
    end

    --[[*
     * Braces
     ]]

    if value == "{" and opts.nobrace ~= true then
      increment("braces")

      local open = {
        type = "brace",
        value = value,
        output = "(",
        -- Lua TODO? should this be utf8?
        outputIndex = string.len(state.output),
        tokensIndex = #state.tokens,
      }

      table.insert(braces, open)
      push(open)
      continue
    end
    if value == "}" then
      local brace = braces[#braces]

      if opts.nobrace == true or not brace then
        push({ type = "text", value = value, output = value })
        continue
      end

      local output = ")"

      if brace.dots == true then
        local arr = Array.slice(tokens)
        local range = {}

        for i = #arr, 1, -1 do
          table.remove(tokens)
          if arr[i].type == "brace" then
            break
          end
          if arr[i].type ~= "dots" then
            table.insert(range, 1, arr[i].value)
          end
        end

        output = expandRange(range, opts)
        state.backtrack = true
      end

      if brace.comma ~= true and brace.dots ~= true then
        local out = String.slice(state.output, 1, brace.outputIndex)
        local toks = Array.slice(state.tokens, brace.tokensIndex)
        brace.output = "\\{"
        brace.value = brace.output
        output = "\\}"
        value = output
        state.output = out
        for _, t in ipairs(toks) do
          state.output ..= if t.output ~= nil and string.len(t.output) ~= 0 then t.output else t.value
        end
      end

      push({ type = "brace", value = value, output = output })
      decrement("braces")
      table.remove(braces)
      continue
    end

    --[[*
     * Pipes
     ]]

    if value == "|" then
      if #extglobs > 0 then
        extglobs[#extglobs].conditions += 1
      end
      push({ type = "text", value = value })
      continue
    end

    --[[*
     * Commas
     ]]

    if value == "," then
      local output = value

      local brace = braces[#braces]
      if brace ~= nil and stack[#stack] == "braces" then
        brace.comma = true
        output = "|"
      end

      push({ type = "comma", value = value, output = output })
      continue
    end

    --[[*
     * Slashes
     ]]

    if value == "/" then
      -- if the beginning of the glob is "./", advance the start
      -- to the current index, and don't add the "./" characters
      -- to the state. This greatly simplifies lookbehinds when
      -- checking for BOS characters like "!" and "." (not "./")
      if prev.type == "dot" and state.index == state.start + 1 then
        state.start = state.index + 1
        state.consumed = ""
        state.output = ""
        table.remove(tokens)
        prev = bos -- reset "prev" to the first token
        continue
      end

      push({ type = "slash", value = value, output = SLASH_LITERAL })
      continue
    end

    --[[*
     * Dots
     ]]

    if value == "." then
      if state.braces > 0 and prev.type == "dot" then
        if prev.value == "." then
          prev.output = DOT_LITERAL
        end
        local brace = braces[#braces]
        prev.type = "dots"
        prev.output ..= value
        prev.value ..= value
        brace.dots = true
        continue
      end

      if state.braces + state.parens == 0 and prev.type ~= "bos" and prev.type ~= "slash" then
        push({ type = "text", value = value, output = DOT_LITERAL })
        continue
      end

      push({ type = "dot", value = value, output = DOT_LITERAL })
      continue
    end

    --[[*
     * Question marks
     ]]

    if value == "?" then
      local isGroup = prev ~= nil and prev.value == "("
      if not isGroup and opts.noextglob ~= true and peek() == "(" and peek(2) ~= "?" then
        extglobOpen("qmark", value)
        continue
      end

      if prev ~= nil and prev.type == "paren" then
        local next = peek()
        local output = value

        if next == "<" and not utils.supportsLookbehinds() then
          error("Lua does not support regex lookbehinds")
        end

        if
          (prev.value == "(" and not RegExp("[!=<:]"):test(next))
          or (next == "<" and not RegExp("<([!=]|\\w+>)"):test(remaining()))
        then
          output = `\\{value}`
        end

        push({ type = "text", value = value, output = output })
        continue
      end

      if opts.dot ~= true and (prev.type == "slash" or prev.type == "bos") then
        push({ type = "qmark", value = value, output = QMARK_NO_DOT })
        continue
      end

      push({ type = "qmark", value = value, output = QMARK })
      continue
    end

    --[[*
     * Exclamation
     ]]

    if value == "!" then
      if opts.noextglob ~= true and peek() == "(" then
        if peek(2) ~= "?" or not RegExp("[!=<:]"):test(peek(3)) then
          extglobOpen("negate", value)
          continue
        end
      end

      if opts.nonegate ~= true and state.index == 1 then
        negate()
        continue
      end
    end

    --[[*
     * Plus
     ]]

    if value == "+" then
      if opts.noextglob ~= true and peek() == "(" and peek(2) ~= "?" then
        extglobOpen("plus", value)
        continue
      end

      if prev ~= nil and prev.value == "(" or opts.regex == false then
        push({ type = "plus", value = value, output = PLUS_LITERAL })
        continue
      end

      if
        (prev ~= nil and (prev.type == "bracket" or prev.type == "paren" or prev.type == "brace"))
        or state.parens > 0
      then
        push({ type = "plus", value = value })
        continue
      end

      push({ type = "plus", value = PLUS_LITERAL })
      continue
    end

    --[[*
     * Plain text
     ]]

    if value == "@" then
      if opts.noextglob ~= true and peek() == "(" and peek(2) ~= "?" then
        push({ type = "at", extglob = true, value = value, output = "" })
        continue
      end

      push({ type = "text", value = value })
      continue
    end

    --[[*
     * Plain text
     ]]

    if value ~= "*" then
      if value == "$" or value == "^" then
        value = `\\{value}`
      end

      local match = REGEX_NON_SPECIAL_CHARS:exec(remaining())
      if match ~= nil then
        -- Lua note: Luau type solver gives bogus error here
        value ..= (match :: Array<string>)[1]
        state.index += string.len((match :: Array<string>)[1])
      end

      push({ type = "text", value = value })
      continue
    end

    --[[*
     * Stars
     ]]

    if prev ~= nil and (prev.type == "globstar" or prev.star == true) then
      prev.type = "star"
      prev.star = true
      prev.value ..= value
      prev.output = star
      state.backtrack = true
      state.globstar = true
      consume(value)
      continue
    end

    local rest = remaining()
    if opts.noextglob ~= true and RegExp("^\\([^?]"):test(rest) then
      extglobOpen("star", value)
      continue
    end

    if prev.type == "star" then
      if opts.noglobstar == true then
        consume(value)
        continue
      end

      local prior = prev.prev
      local before = prior.prev
      local isStart = prior.type == "slash" or prior.type == "bos"
      local afterStar = before ~= nil and (before.type == "star" or before.type == "globstar")

      if opts.bash == true and (not isStart or (string.len(rest) > 0 and string.sub(rest, 1, 1) ~= "/")) then
        push({ type = "star", value = value, output = "" })
        continue
      end

      local isBrace = state.braces > 0 and (prior.type == "comma" or prior.type == "brace")
      local isExtglob = #extglobs > 0 and (prior.type == "pipe" or prior.type == "paren")
      if not isStart and prior.type ~= "paren" and not isBrace and not isExtglob then
        push({ type = "star", value = value, output = "" })
        continue
      end

      -- strip consecutive `/**/`
      while String.slice(rest, 1, 4) == "/**" do
        local after = string.sub(input, state.index + 4, state.index + 4)
        if after ~= nil and after ~= "" and after ~= "/" then
          break
        end
        rest = String.slice(rest, 4)
        consume("/**", 3)
      end

      if prior.type == "bos" and eos() then
        prev.type = "globstar"
        prev.value ..= value
        prev.output = globstar(opts)
        state.output = prev.output
        state.globstar = true
        consume(value)
        continue
      end

      -- Lua BUG: afterStar not syntax highlighted correctly here
      if prior.type == "slash" and prior.prev.type ~= "bos" and not afterStar and eos() then
        state.output = String.slice(state.output, 1, -#(prior.output .. prev.output))
        prior.output = `?:{prior.output}`

        prev.type = "globstar"
        prev.output = globstar(opts) .. (if opts.strictSlashes then ")" else "|$)")
        prev.value ..= value
        state.globstar = true
        state.output ..= prior.output .. prev.output
        consume(value)
        continue
      end

      if prior.type == "slash" and prior.prev.type ~= "bos" and string.sub(rest, 1, 1) == "/" then
        local end_ = if string.sub(rest, 2, 2) ~= nil then "|$" else ""

        state.output = String.slice(state.output, 1, -#(prior.output .. prev.output))
        prior.output = `(?:{prior.output}`

        prev.type = "globstar"
        prev.output = `{globstar(opts)}{SLASH_LITERAL}|{SLASH_LITERAL}{end_})`
        prev.value ..= value

        state.output ..= prior.output .. prev.output
        state.globstar = true

        consume(value .. advance())

        push({ type = "slash", value = "/", output = "" })
        continue
      end

      if prior.type == "bos" and string.sub(rest, 1, 1) == "/" then
        prev.type = "globstar"
        prev.value ..= value
        prev.output = `(?:^|{SLASH_LITERAL}|{globstar(opts)}{SLASH_LITERAL})`
        state.output = prev.output
        state.globstar = true
        consume(value .. advance())
        push({ type = "slash", value = "/", output = "" })
        continue
      end

      -- remove single star from output
      -- Lua TODO? should we use utg8.len here?
      state.output = String.slice(state.output, 1, -string.len(prev.output))

      -- reset previous token to globstar
      prev.type = "globstar"
      prev.output = globstar(opts)
      prev.value ..= value

      -- reset output with globstar
      state.output ..= prev.output
      state.globstar = true
      consume(value)
      continue
    end

    local token = { type = "star", value = value, output = star }

    if opts.bash == true then
      token.output = ".*?"
      if prev.type == "bos" or prev.type == "slash" then
        token.output = nodot .. token.output
      end
      push(token)
      continue
    end

    if prev ~= nil and (prev.type == "bracket" or prev.type == "paren") and opts.regex == true then
      token.output = value
      push(token)
      continue
    end

    if state.index == state.start or prev.type == "slash" or prev.type == "dot" then
      if prev.type == "dot" then
        state.output ..= NO_DOT_SLASH
        prev.output ..= NO_DOT_SLASH
      elseif opts.dot == true then
        state.output ..= NO_DOTS_SLASH
        prev.output ..= NO_DOTS_SLASH
      else
        state.output ..= nodot
        prev.output ..= nodot
      end

      if peek() ~= "*" then
        state.output ..= ONE_CHAR
        prev.output ..= ONE_CHAR
      end
    end

    push(token)
  end

  while state.brackets > 0 do
    if opts.strictBrackets == true then
      error(syntaxError("closing", "]"))
    end
    state.output = utils.escapeLast(state.output, "[")
    decrement("brackets")
  end

  while state.parens > 0 do
    if opts.strictBrackets == true then
      error(syntaxError("closing", ")"))
    end
    state.output = utils.escapeLast(state.output, "(")
    decrement("parens")
  end

  while state.braces > 0 do
    if opts.strictBrackets == true then
      error(syntaxError("closing", "}"))
    end
    state.output = utils.escapeLast(state.output, "{")
    decrement("braces")
  end

  if opts.strictSlashes ~= true and (prev.type == "star" or prev.type == "bracket") then
    push({ type = "maybe_slash", value = "", output = `{SLASH_LITERAL}?` })
  end

  -- rebuild the output if we had to backtrack at any point
  if state.backtrack == true then
    state.output = ""

    for _, token in state.tokens do
      state.output ..= token.output or token.value

      if token.suffix then
        state.output ..= token.suffix
      end
    end
  end
  return state
end

--[[*
 * Fast paths for creating regular expressions for common glob patterns.
 * This can significantly speed up processing and has very little downside
 * impact when none of the fast paths match.
 ]]

-- parse.fastpaths = function(input: string, options)
--   local opts = table.clone(options) or {}
--   local max = if type(opts.maxLength) == 'number' then math.min(MAX_LENGTH, opts.maxLength) else MAX_LENGTH
-- 	local len = #input
-- 	if len > max then
-- 		error(
-- 			Error.new(
-- 				("SyntaxError: Input length: %s, exceeds maximum allowed length: %s"):format(
-- 					tostring(len),
-- 					tostring(max)
-- 				)
-- 			)
-- 		)
-- 	end

-- 	input = if REPLACEMENTS[input] then and REPLACEMENTS[input] else input
-- 	local win32 = utils.isWindows(options)

-- 	-- create constants based on platform, for windows or posix

-- 	local ref = constants.globChars(win32)
-- 	local DOT_LITERAL, SLASH_LITERAL, ONE_CHAR, DOTS_SLASH, NO_DOT, NO_DOTS, NO_DOTS_SLASH, STAR, START_ANCHOR =
-- 		ref.DOT_LITERAL,
-- 		ref.SLASH_LITERAL,
-- 		ref.ONE_CHAR,
-- 		ref.DOTS_SLASH,
-- 		ref.NO_DOT,
-- 		ref.NO_DOTS,
-- 		ref.NO_DOTS_SLASH,
-- 		ref.STAR,
-- 		ref.START_ANCHOR

--   local nodot = opts.dot ? NO_DOTS : NO_DOT
--   local slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT
--   local capture = opts.capture ? '' : '?:'
--   local state = { negated: false, prefix: '' }
--   local star = opts.bash == true ? '.*?' : STAR

--   if (opts.capture) {
--     star = `({star})`
--   }

--   local globstar = opts => {
--     if (opts.noglobstar == true) return star
--     return `({capture}(?:(?!{START_ANCHOR}{opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`
--   }

--   local create = str => {
--     switch (str) {
--       case '*':
--         return `{nodot}{ONE_CHAR}{star}`

--       case '.*':
--         return `{DOT_LITERAL}{ONE_CHAR}{star}`

--       case '*.*':
--         return `{nodot}{star}{DOT_LITERAL}{ONE_CHAR}{star}`

--       case '*--[[':
--         return `{nodot}{star}{SLASH_LITERAL}{ONE_CHAR}{slashDot}{star}`

--       case '**':
--         return nodot + globstar(opts)

--       case '**--[[':
--         return `(?:{nodot}{globstar(opts)}{SLASH_LITERAL})?{slashDot}{ONE_CHAR}{star}`

--       case '**--[[.*':
--         return `(?:{nodot}{globstar(opts)}{SLASH_LITERAL})?{slashDot}{star}{DOT_LITERAL}{ONE_CHAR}{star}`

--       case '*]].*':
--         return `(?:{nodot}{globstar(opts)}{SLASH_LITERAL})?{DOT_LITERAL}{ONE_CHAR}{star}`

--       default: {
--         local match = /^(.*?)\.(\w+)$/.exec(str)
--         if (!match) return

--         local source = create(match[1])
--         if (!source) return

--         return source + DOT_LITERAL + match[2]
--       }
--     }
--   }

--   local output = utils.removePrefix(input, state)
--   local source = create(output)

--   if (source and opts.strictSlashes ~= true) {
--     source += `{SLASH_LITERAL}?`
--   }

--   return source
-- }

return parse
