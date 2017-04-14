'use strict';

var cache = {};

function picomatch(list, patterns, options) {
  if (typeof patterns === 'string') {
    return picomatch.match.apply(null, arguments);
  }

  var len = patterns.length;
  var arr = arrayify(list);

  if (len === 0 || arr.length === 0) {
    return [];
  }

  if (len === 1) {
    return picomatch.match(arr, patterns[0], options);
  }

  var negated = false;
  var omit = [];
  var keep = [];
  var idx = -1;

  while (++idx < len) {
    var pattern = patterns[idx];
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

  var isMatch = picomatch.matcher(pattern, options);
  var arr = arrayify(list);
  var len = arr.length;
  var idx = -1;

  var matches = [];
  var negated = [];

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

  if (negated.length) {
    matches = diff(matches, negated);
  }

  return matches;
};

picomatch.isMatch = function(str, pattern, options) {
  return picomatch.matcher(pattern, options)(str);
};

picomatch.matcher = function(pattern, options) {
  return function fn(str) {
    if (str === pattern) {
      return true;
    }

    var hasSlash = pattern.slice(-1) === '/';
    var stripped;

    if (!hasSlash) {
      stripped = stripTrailing(str);
      if (stripped === pattern) {
        return true;
      }
    }

    if (typeof fn.regex === 'undefined') {
      fn.regex = picomatch.makeRe(pattern, options);
    }

    if (fn.regex.test(str)) {
      return true;
    }

    return stripped ? fn.regex.test(stripped) : false;
  };
};

picomatch.makeRe = function(pattern, options) {
  options = options || {};
  var flags = options.nocase ? 'i' : '';
  var key = pattern + flags + options.dot;

  if (cache[key]) {
    return cache[key];
  }

  if (pattern.slice(0, 2) === './') {
    pattern = pattern.slice(2);
  }

  var len = pattern.length;
  var idx = -1;
  var str = '';

  var firstChar;
  var star = '[^\\\\/]*?';
  var qmark = '[^\\\\/]';
  var prefix = '^(?:(?:^|\\.\\/)';
  var suffix = ')$';
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
      firstChar = char;
    }

    switch (char) {
      case '!':
        if (idx === 0) {
          prefix += '(?!^(?:';
          suffix = ')$).*' + suffix;
        } else {
          str += char;
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
        var lead = (!prev || prev === '/') ? '(?!\\.)(?=.)' : '';
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
          char = advance();
          inner += '(?:(?!(?:\\/|^)\\.).)*?';
          if (prevChar === '/' && idx === len - 1) {
            str += '?';
          }

          if (before === '' && char === '/') {
            lead = '';
          }
        } else {
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

  if (str.slice(-2) === '/?') {
    str = str.slice(0, str.length - 1);
  }

  if (firstChar === '/' || firstChar === '.') {
    prefix = '^(?:';
  }

  var regex = new RegExp(prefix + str + suffix, flags);
  return (cache[key] = regex);
};

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
  return str.replace(/[-[\]{}()^$|*+?.\\\/\s]/g, '\\$&');
}

/**
 * Expose picomatch
 */

module.exports = picomatch;
