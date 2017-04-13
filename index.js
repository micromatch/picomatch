'use strict';

var normalize = require('normalize-path');
var unique = require('array-unique');
var diff = require('arr-diff');
var pathCache = {};
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

  return unique(keep);
}

picomatch.match = function(list, pattern, options) {
  if (typeof pattern !== 'string') {
    throw new TypeError('expected pattern to be a string');
  }

  var arr = arrayify(list);
  var len = arr.length;
  var idx = -1;

  var regex = picomatch.makeRe(pattern, options);
  var matches = [];
  var negated = [];

  while (++idx < len) {
    var ele = arr[idx];
    var posix = normalize(ele);

    if (pattern === ele || pattern === posix) {
      matches.push(ele);
      continue;
    }

    if (regex.test(ele) || regex.test(posix)) {
      matches.push(ele);
    }
  }

  // if `opts.ignore` was defined, diff ignored list
  if (options && options.ignore) {
    negated = picomatch(matches, options.ignore, options);
  }

  if (negated.length) {
    matches = diff(matches, negated);
  }

  return unique(matches);
};

picomatch.isMatch = function(str, pattern, options) {
  return str === pattern || picomatch.makeRe(pattern, options).test(str);
};

picomatch.matcher = function(pattern, options) {
  var regex;
  return function(str) {
    if (pattern === str) {
      return true;
    }
    var posix = toPosix(str);
    if (posix === pattern) {
      return true;
    }
    if (typeof regex === 'undefined') {
      regex = picomatch.makeRe(pattern, options);
    }
    return regex.test(str) || regex.test(posix);
  };
};

picomatch.makeRe = function(pattern, options) {
  if (cache[pattern]) {
    return cache[pattern];
  }

  if (pattern.slice(0, 2) === './') {
    pattern = pattern.slice(2);
  }

  options = options || {};
  var flags = options.nocase ? 'i' : '';
  var len = pattern.length;
  var idx = -1;
  var str = '';

  var star = '[^\\/]*?';
  var prefix = '^(?:(\\.\\/)?';
  var suffix = ')$';
  var queue = [];
  var stack = [];
  var bracket = [];
  var paren = [];
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
      case '[':
        bracket.push(char);
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
        bracket.pop();
        stack.pop();
        str += char;
        break;
      case '"':
      case '\'':
        var closeIdx = getClose(pattern, char, idx + 1);
        if (closeIdx === -1) {
          str += char;
          break;
        }

        var val = pattern.slice(idx + 1, closeIdx);
        idx += val.length + 1;
        str += escapeRegex(val);
        break;
      case '/':
        str += '\\/';
        break;
      case '.':
        str += '\\.';
        break;
      case '{':
        if (bracket.length) {
          str += char;
          break;
        }
        paren.push(char);
        stack.push(char);
        str += '(';
        break;
      case '}':
        if (bracket.length) {
          str += char;
          break;
        }
        paren.pop();
        stack.pop();
        str += ')';
        break;
      case ',':
        str += paren.length ? '|' : char;
        break;
      case '*':
        if (paren.length) {
          str += star;
          break;
        }

        if (bracket.length) {
          str += char;
          break;
        }

        var ch = prev;
        var val = (!prev || prev === '/') ? '(?!\\.)(?=.)' : '';
        var stars = char;
        var n;

        while ((n = peek()) === '*') {
          stars += advance();
        }

        if (stars === '**' && (!n || n === '/')) {
          char = advance();
          val += '(?:(?!(?:\\/|^)\\.).)*?';
          if (ch === '/' && idx === len - 1) {
            str += '?';
          }
        } else {
          val += star;
        }

        if (ch && ch !== '/' && ch !== '!') {
          val = star;
        }

        if (n === '/') {
          val += n + '?';
        } else if (!n && stars === '**') {
          val = '(?:' + val + '|)';
        }

        str += val;
        break;
      case '?':
        if (prev === ']' || prev === ')' || prev === '(') {
          str += char;
        } else if (!prev || prev === '/') {
          str += '[^\\\\/.]';
        } else {
          str += '[^\\\\/]';
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

  if (bracket.length) {
    str = str.split(/\\?\[/).join('\\[');
  }

  // console.log(str);
  var regex = new RegExp(prefix + str + suffix, flags);
  cache[pattern] = regex;
  return regex;
};

function getClose(str, ch, i) {
  var idx = str.indexOf(ch, i);
  if (str.charAt(idx - 1) === '\\') {
    return getClose(str, ch, idx + 1);
  }
  return idx;
}

function toPosix(str) {
  return pathCache[str] || (pathCache[str] = normalize(str));
}

function arrayify(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
}

/**
 * Escape regex characters in the given string
 */

function escapeRegex(str) {
  return str.replace(/[-[\]{}()^$|*+?.\\\/\s]/g, '\\$&');
}

/**
 * Combines duplicate characters in the provided string.
 * @param {String} `str`
 * @returns {String}
 */

function combineDuplicates(str, substr) {
  if (typeof substr === 'string') {
    var inner = '(' + substr + ')(?=(?:' + substr + ')*\\1)';
    return str.replace(new RegExp(inner, 'g'), '');
  }
  return str.replace(/(.)(?=.*\1)/g, '');
}

/**
 * Expose picomatch
 */

module.exports = picomatch;
