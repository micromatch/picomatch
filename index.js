'use strict';

const MAX_LENGTH = 1024 * 64;
const cache = {};

function picomatch(list, patterns, options) {
  if (typeof patterns === 'string') {
    return picomatch.match(list, patterns, options);
  }

  const len = patterns.length;
  const arr = arrayify(list);

  if (len === 0 || arr.length === 0) {
    return [];
  }

  if (len === 1) {
    return picomatch.match(arr, patterns[0], options);
  }

  let negated = false;
  let omit = [];
  let keep = [];

  for (const pattern of patterns) {
    if (typeof pattern !== 'string') {
      throw new TypeError('expected pattern to be a string');
    }

    if (pattern.charCodeAt(0) === 33 /* ! */) {
      omit.push.apply(omit, picomatch.match(list, pattern.slice(1), options));
      negated = true;
    } else {
      keep.push.apply(keep, picomatch.match(list, pattern, options));
    }
  }

  if (negated && keep.length === 0) {
    keep = list.slice();
  }

  if (omit.length) {
    keep = diff(keep, omit);
  }

  return keep;
}

picomatch.match = function(list, pattern, options) {
  if (typeof pattern !== 'string') {
    throw new TypeError('expected pattern to be a string');
  }

  var isMatch = memo('match', pattern, options, picomatch.matcher);
  var arr = arrayify(list);
  var len = arr.length;
  var idx = -1;

  var matches = [];
  var negated;

  while (++idx < len) {
    var ele = arr[idx];
    if (isMatch(ele)) {
      matches.push(ele);
    }
  }

  // if `options.ignore` was defined, diff ignored list
  if (options && options.ignore) {
    negated = picomatch(matches, options.ignore, options);
  }

  if (negated && negated.length) {
    matches = diff(matches, negated);
  }

  return matches;
};

picomatch.isMatch = function(str, pattern, options) {
  return memo('isMatch', pattern, options, picomatch.matcher)(str);
};

picomatch.matcher = function(pattern, options) {
  function matcher(str) {
    if (str === pattern) {
      return true;
    }

    if (pattern instanceof RegExp) {
      return pattern.test(str);
    }

    var hasSlash = pattern.slice(-1) === '/';
    var stripped;

    if (!hasSlash) {
      stripped = stripTrailing(str);
      if (stripped === pattern) {
        return true;
      }
    }

    if (typeof matcher.regex === 'undefined') {
      matcher.regex = picomatch.makeRe(pattern, options);
    }

    if (matcher.regex.test(str)) {
      return true;
    }

    return stripped ? matcher.regex.test(stripped) : false;
  }

  return memo('matcher', pattern, options, () => matcher);
};

picomatch.makeRe = function(pattern, options) {
  if (pattern instanceof RegExp) {
    return pattern;
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('expected pattern to be a string');
  }

  if (pattern.length > MAX_LENGTH) {
    throw new Error('expected pattern to be less than ' + MAX_LENGTH + ' characters');
  }

  function makeRe() {
    options = options || {};
    var flags = options.nocase ? 'i' : '';
    var tok = { string: pattern };

    if (pattern.slice(0, 2) === './') {
      pattern = pattern.slice(2);
    }

    var nodot = '(?=.)(?!\\.)';
    var qmark = '[^\\\\/]';
    var star = qmark + '*?';
    var prefix = '^(?:(?:^|\\.\\/)';
    var suffix = ')$';
    var firstChar;

    function convert() {
      var len = pattern.length;
      var idx = -1;
      var str = '';
      var bracket = 0;
      var brace = 0;
      var queue = [];
      var stack = [];
      var prev;
      var char;

      function next() {
        prev = pattern[idx];
        return pattern[++idx] || '';
      }

      function advance() {
        char = queue.shift() || next();
        return char;
      }

      function peek() {
        if (idx < len - 1) {
          var val = next();
          queue.push(val);
          return val;
        }
      }

      while (idx < len) {
        char = advance();

        if (idx === 0) {
          firstChar = tok.first = char;
        }

        switch (char) {
          case '!':
            if (idx === 0) {
              prefix += '(?!^(?:';
              suffix = ')$).*' + suffix;
              tok.negated = true;
            } else {
              str += '\\' + char;
            }
            break;
          case '\\':
            str += char + advance();
            break;
          case '{':
            if (bracket > 0) {
              str += char;
              break;
            }
            str += '(';
            stack.push(char);
            brace++;
            break;
          case '}':
            if (bracket > 0) {
              str += char;
              break;
            }
            if (brace === 0) {
              str += '\\';
            }
            str += ')';
            stack.pop();
            brace--;
            break;
          case '[':
            bracket++;
            stack.push(char);
            var val = char;
            var ch = peek();
            if (ch === ']' || ch === '[') {
              val += '\\' + advance();

              if (!str && idx === len - 1) {
                str = '\\' + val;
                idx++;
                break;
              }

            } else if (ch === '!' || ch === '^') {
              advance();
              val += '^\\/';
              ch = peek();
              if (ch === ']' || ch === '[') {
                val += '\\' + advance();
              }
            }
            str += val;
            break;
          case ']':
            if (bracket === 0) {
              str += '\\';
            }
            str += char;
            stack.pop();
            bracket--;
            break;
          case '"':
          case '\'':
            var closeIdx = getClose(pattern, char, idx + 1);
            if (closeIdx === -1) {
              str += char;
              break;
            }

            var rest = pattern.slice(idx + 1, closeIdx);
            idx += rest.length + 1;
            str += escapeRegex(rest);
            break;
          case '/':
            str += '\\/';
            break;
          case '.':
            str += '\\.';
            break;
          case ',':
            str += brace > 0 ? '|' : char;
            break;
          case '*':
            if (brace > 0) {
              str += star;
              break;
            }

            if (bracket > 0) {
              str += char;
              break;
            }

            var before = str;
            var prevChar = prev;
            var lead = (!prev || prev === '/') ? nodot : '';
            var inner = '';
            var stars = char;
            var n;

            if (lead && options.dot) {
              lead = '(?=.)';
            }

            while ((n = peek()) === '*') {
              stars += advance();
            }

            if (stars === '**' && (!n || n === '/')) {
              tok.globstar = true;
              char = advance();
              inner += '(?:(?!(?:\\/|^)\\.).)*?';
              if (prevChar === '/' && idx === len - 1) {
                str += '?';
              }

              if (before === '' && char === '/') {
                lead = '';
              }
            } else {
              tok.star = true;
              inner += star;
            }

            if (prevChar && prevChar !== '/' && prevChar !== '!') {
              inner = star;
            }

            if (n === '/') {
              inner += '\\/' + (pattern[idx + 1] !== '[' ? '?' : '');

            } else if (!n && stars === '**') {
              lead = '(?!\\.)';
            }

            str += lead + inner;
            break;
          case '?':
            if (prev === ']' || prev === ')' || prev === '(') {
              str += char;
            } else if (!prev || prev === '/') {
              str += !options.dot ? '[^\\\\/.]' : qmark;
            } else {
              str += qmark;
            }
            break;
          case '+':
            if (prev !== ']' && prev !== ')') {
              str += '\\';
            }
            str += char;
            break;
          default: {
            str += char;
            break;
          }
        }
      }

      if (bracket > 0) {
        str = str.split(/\\?\[/).join('\\[');
      }
      if (brace > 0) {
        str = str.split(/\\?\(/).join('\\(');
      }

      return str;
    }

    // var str = commonPatterns(pattern, tok);
    // if (str === pattern) {
    // }
    var str = convert();

    if (str.slice(-2) === '/?') {
      str = str.slice(0, str.length - 1);
    }

    if (firstChar === '/' || firstChar === '.') {
      prefix = '^(?:';
    }

    var source = prefix + str + suffix;
    tok.source = source;
    tok.regex = new RegExp(source, flags);
    return tok.regex;
  }

  return memo('makeRe', pattern, options, makeRe);
};

function commonPatterns(pattern, tok) {
  var globstar = '(?:(?!(?:\\/|^)\\.).)*?';
  var nodot = '(?=.)(?!\\.)';
  var star = '[^/]*?';
  switch (pattern) {
    case '**/*':
      tok.globstar = true;
      tok.star = true;
      return '(?:' + globstar + '\\/)?' + nodot + star;
    case '**/*.*':
      tok.globstar = true;
      tok.star = true;
      return globstar + '\\/' + nodot + star + '\\.' + star;
    case '**/.*':
      tok.globstar = true;
      tok.star = true;
      return globstar + '/\\.' + nodot + star;
    case '/**':
      tok.globstar = true;
      return '\\/(?!\\.)' + globstar;
    case '**/':
      tok.globstar = true;
      return globstar + '\\/';
    case '**':
      tok.globstar = true;
      return '(?!\\.)' + globstar;
    case '*/*':
      tok.star = true;
      return star + '/' + nodot + star;
    case '*/':
      tok.star = true;
      return star + '/';
    case '*.*':
      tok.star = true;
      return nodot + star + '\\.' + star;
    case '.*':
      tok.star = true;
      return '\\.' + star;
    case '*':
      tok.star = true;
      return nodot + star;
    default: {
      return pattern;
    }
  }
}

function getClose(str, ch, i) {
  var idx = str.indexOf(ch, i);
  if (str.charAt(idx - 1) === '\\') {
    return getClose(str, ch, idx + 1);
  }
  return idx;
}

function stripTrailing(str) {
  while (str.length > 1 && str.slice(-1) === '/') {
    str = str.slice(0, str.length - 1);
  }
  return str;
}

function arrayify(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
}

function diff(one, two) {
  if (!Array.isArray(two)) return one;
  var len = one.length;
  var idx = -1;
  var arr = [];
  while (++idx < len) {
    var ele = one[idx];
    if (two.indexOf(ele) === -1) {
      arr.push(ele);
    }
  }
  return arr;
}

/**
 * Escape regex characters in the given string
 */

function escapeRegex(str) {
  return str.replace(/[-[\]{}()^$|*+?.\\/\s]/g, '\\$&');
}

/**
 * Memoize a generated regex or function. A unique key is generated
 * from the `type` (usually method name), the `pattern`, and
 * user-defined options.
 */

function memo(type, pattern, options, fn) {
  var key = createKey(type + '=' + pattern, options);
  if (options && options.cache === false) {
    return fn(pattern, options);
  }

  if (cache.hasOwnProperty(type)) {
    if (cache[type].hasOwnProperty(key)) {
      return cache[type][key];
    }
  } else {
    cache[type] = {};
  }

  var val = fn(pattern, options);
  cache[type][key] = val;
  return val;
}

/**
 * Create the key to use for memoization. The key is generated
 * by iterating over the options and concatenating key-value pairs
 * to the pattern string.
 */

function createKey(pattern, options) {
  if (typeof options === 'undefined') {
    return pattern;
  }
  var keys = Object.keys(options);
  var key = pattern;
  for (var i = 0; i < keys.length; i++) {
    key += ';' + keys[i] + '=' + String(options[keys[i]]);
  }
  return key;
}

/**
 * Expose picomatch
 */

module.exports = picomatch;
