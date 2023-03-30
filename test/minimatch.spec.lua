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

return function()
  local function format(input)
    return string.gsub(input, "^%./", "", 1)
  end
  local picomatch = require(script.Parent.picomatch)
  local isMatch, makeRe = picomatch.isMatch, picomatch.makeRe

  describe("minimatch parity:", function()
    describe("minimatch issues (as of 12/7/2016)", function()
      it("https://github.com/isaacs/minimatch/issues/29", function()
        assert(isMatch("foo/bar.txt", "foo/**/*.txt"))
        assert(makeRe("foo/**/*.txt"):test("foo/bar.txt"))
        assert(not isMatch("n/!(axios)/**", "n/axios/a.js"))
        assert(not makeRe("n/!(axios)/**"):test("n/axios/a.js"))
      end)

      it("https://github.com/isaacs/minimatch/issues/30", function()
        assert(isMatch("foo/bar.js", "**/foo/**", { format = format }))
        assert(isMatch("./foo/bar.js", "./**/foo/**", { format = format }))
        assert(isMatch("./foo/bar.js", "**/foo/**", { format = format }))
        assert(isMatch("./foo/bar.txt", "foo/**/*.txt", { format = format }))
        assert(makeRe("./foo/**/*.txt"):test("foo/bar.txt"))
        assert(not isMatch("./foo/!(bar)/**", "foo/bar/a.js", { format = format }))
        assert(not makeRe("./foo/!(bar)/**"):test("foo/bar/a.js"))
      end)

      -- Lua note: this test doesn't work in Lua, but jest doesn't rely on the behavior
      -- it('https://github.com/isaacs/minimatch/issues/50', () => {
      --   assert(isMatch('foo/bar-[ABC].txt', 'foo/**/*-\\[ABC\\].txt'));
      --   assert(!isMatch('foo/bar-[ABC].txt', 'foo/**/*-\\[abc\\].txt'));
      --   assert(isMatch('foo/bar-[ABC].txt', 'foo/**/*-\\[abc\\].txt', { nocase: true }));
      -- });

      -- it('https://github.com/isaacs/minimatch/issues/67 (should work consistently with `makeRe` and matcher functions)', () => {
      --   const re = makeRe('node_modules/foobar/**/*.bar');
      --   assert(re.test('node_modules/foobar/foo.bar'));
      --   assert(isMatch('node_modules/foobar/foo.bar', 'node_modules/foobar/**/*.bar'));
      -- });

      it("https://github.com/isaacs/minimatch/issues/75", function()
        assert(isMatch("foo/baz.qux.js", "foo/@(baz.qux).js"))
        assert(isMatch("foo/baz.qux.js", "foo/+(baz.qux).js"))
        assert(isMatch("foo/baz.qux.js", "foo/*(baz.qux).js"))
        assert(not isMatch("foo/baz.qux.js", "foo/!(baz.qux).js"))
        assert(not isMatch("foo/bar/baz.qux.js", "foo/*/!(baz.qux).js"))
        assert(not isMatch("foo/bar/bazqux.js", "**/!(bazqux).js"))
        assert(not isMatch("foo/bar/bazqux.js", "**/bar/!(bazqux).js"))
        assert(not isMatch("foo/bar/bazqux.js", "foo/**/!(bazqux).js"))
        assert(not isMatch("foo/bar/bazqux.js", "foo/**/!(bazqux)*.js"))
        assert(not isMatch("foo/bar/baz.qux.js", "foo/**/!(baz.qux)*.js"))
        assert(not isMatch("foo/bar/baz.qux.js", "foo/**/!(baz.qux).js"))
        assert(not isMatch("foobar.js", "!(foo)*.js"))
        assert(not isMatch("foo.js", "!(foo).js"))
        assert(not isMatch("foo.js", "!(foo)*.js"))
      end)

      -- Lua note: doesn't work in Lua, but jest doesn't rely on the behavior
      -- it('https://github.com/isaacs/minimatch/issues/78', () => {
      --   assert(isMatch('a\\b\\c.txt', 'a/**/*.txt', { windows: true }));
      --   assert(isMatch('a/b/c.txt', 'a/**/*.txt', { windows: true }));
      -- });
  
      it("https://github.com/isaacs/minimatch/issues/82", function()
        assert(isMatch("./src/test/a.js", "**/test/**", { format = format }))
        assert(isMatch("src/test/a.js", "**/test/**"))
      end)

      it("https://github.com/isaacs/minimatch/issues/83", function()
        assert(not makeRe("foo/!(bar)/**"):test("foo/bar/a.js"))
        assert(not isMatch("foo/!(bar)/**", "foo/bar/a.js"))
      end)
    end)
  end)
end
