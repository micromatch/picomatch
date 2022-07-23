
import path from 'path';
export const WIN_SLASH = '\\\\/';
export const WIN_NO_SLASH = `[^${WIN_SLASH}]`;

/**
 * Posix glob regex
 */

export const DOT_LITERAL = '\\.';
export const PLUS_LITERAL = '\\+';
export const QMARK_LITERAL = '\\?';
export const SLASH_LITERAL = '\\/';
export const ONE_CHAR = '(?=.)';
export const QMARK = '[^/]';
export const END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
export const START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
export const DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
export const NO_DOT = `(?!${DOT_LITERAL})`;
export const NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
export const NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
export const NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
export const QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
export const STAR = `${QMARK}*?`;

export const POSIX_CHARS = {
  DOT_LITERAL,
  PLUS_LITERAL,
  QMARK_LITERAL,
  SLASH_LITERAL,
  ONE_CHAR,
  QMARK,
  END_ANCHOR,
  DOTS_SLASH,
  NO_DOT,
  NO_DOTS,
  NO_DOT_SLASH,
  NO_DOTS_SLASH,
  QMARK_NO_DOT,
  STAR,
  START_ANCHOR
};

/**
 * Windows glob regex
 */

export const WINDOWS_CHARS = {
  ...POSIX_CHARS,

  SLASH_LITERAL: `[${WIN_SLASH}]`,
  QMARK: WIN_NO_SLASH,
  STAR: `${WIN_NO_SLASH}*?`,
  DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
  NO_DOT: `(?!${DOT_LITERAL})`,
  NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
  NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
  NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
  QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
  START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
  END_ANCHOR: `(?:[${WIN_SLASH}]|$)`
};

/**
 * POSIX Bracket Regex
 */

export const POSIX_REGEX_SOURCE = {
  alnum: 'a-zA-Z0-9',
  alpha: 'a-zA-Z',
  ascii: '\\x00-\\x7F',
  blank: ' \\t',
  cntrl: '\\x00-\\x1F\\x7F',
  digit: '0-9',
  graph: '\\x21-\\x7E',
  lower: 'a-z',
  print: '\\x20-\\x7E ',
  punct: '\\-!"#$%&\'()\\*+,./:;<=>?@[\\]^_`{|}~',
  space: ' \\t\\r\\n\\v\\f',
  upper: 'A-Z',
  word: 'A-Za-z0-9_',
  xdigit: 'A-Fa-f0-9'
};

export const MAX_LENGTH = 1024 * 64;

// regular expressions
export const REGEX_BACKSLASH = /\\(?![*+?^${}(|)[\]])/g;
export const REGEX_NON_SPECIAL_CHARS = /^[^@![\].,$*+?^{}()|\\/]+/;
export const REGEX_SPECIAL_CHARS = /[-*+?.^${}(|)[\]]/;
export const REGEX_SPECIAL_CHARS_BACKREF = /(\\?)((\W)(\3*))/g;
export const REGEX_SPECIAL_CHARS_GLOBAL = /([-*+?.^${}(|)[\]])/g;
export const REGEX_REMOVE_BACKSLASH = /(?:\[.*?[^\\]\]|\\(?=.))/g;

// Replace globs with equivalent patterns to reduce parsing time.
export const REPLACEMENTS = {
  '***': '*',
  '**/**': '**',
  '**/**/**': '**'
};

// Digits
export const CHAR_0 = 48; /* 0 */
export const CHAR_9 = 57; /* 9 */

// Alphabet chars.
export const CHAR_UPPERCASE_A = 65; /* A */
export const CHAR_LOWERCASE_A = 97; /* a */
export const CHAR_UPPERCASE_Z = 90; /* Z */
export const CHAR_LOWERCASE_Z = 122; /* z */

export const CHAR_LEFT_PARENTHESES = 40; /* ( */
export const CHAR_RIGHT_PARENTHESES = 41; /* ) */
export const CHAR_ASTERISK = 42; /* * */

// Non-alphabetic chars.
export const CHAR_AMPERSAND = 38; /* & */
export const CHAR_AT = 64; /* @ */
export const CHAR_BACKWARD_SLASH = 92; /* \ */
export const CHAR_CARRIAGE_RETURN = 13; /* \r */
export const CHAR_CIRCUMFLEX_ACCENT = 94; /* ^ */
export const CHAR_COLON = 58; /*  = */
export const CHAR_COMMA = 44; /* ; */
export const CHAR_DOT = 46; /* . */
export const CHAR_DOUBLE_QUOTE = 34; /* " */
export const CHAR_EQUAL = 61; /* = */
export const CHAR_EXCLAMATION_MARK = 33; /* ! */
export const CHAR_FORM_FEED = 12; /* \f */
export const CHAR_FORWARD_SLASH = 47; /* / */
export const CHAR_GRAVE_ACCENT = 96; /* ` */
export const CHAR_HASH = 35; /* # */
export const CHAR_HYPHEN_MINUS = 45; /* - */
export const CHAR_LEFT_ANGLE_BRACKET = 60; /* < */
export const CHAR_LEFT_CURLY_BRACE = 123; /* { */
export const CHAR_LEFT_SQUARE_BRACKET = 91; /* [ */
export const CHAR_LINE_FEED = 10; /* \n */
export const CHAR_NO_BREAK_SPACE = 160; /* \u00A0 */
export const CHAR_PERCENT = 37; /* % */
export const CHAR_PLUS = 43; /* + */
export const CHAR_QUESTION_MARK = 63; /* ? */
export const CHAR_RIGHT_ANGLE_BRACKET = 62; /* > */
export const CHAR_RIGHT_CURLY_BRACE = 125; /* } */
export const CHAR_RIGHT_SQUARE_BRACKET = 93; /* ] */
export const CHAR_SEMICOLON = 59; /* ; */
export const CHAR_SINGLE_QUOTE = 39; /* ' */
export const CHAR_SPACE = 32; /*   */
export const CHAR_TAB = 9; /* \t */
export const CHAR_UNDERSCORE = 95; /* _ */
export const CHAR_VERTICAL_LINE = 124; /* | */
export const CHAR_ZERO_WIDTH_NOBREAK_SPACE = 65279; /* \uFEFF */

export const SEP = path.sep;

/**
   * Create EXTGLOB_CHARS
   */
export const extglobChars = chars => {
  return {
    '!': { type: 'negate', open: '(?:(?!(?:', close: `))${chars.STAR})` },
    '?': { type: 'qmark', open: '(?:', close: ')?' },
    '+': { type: 'plus', open: '(?:', close: ')+' },
    '*': { type: 'star', open: '(?:', close: ')*' },
    '@': { type: 'at', open: '(?:', close: ')' }
  };
};

/**
 * Create GLOB_CHARS
 */
export const globChars = win32 => {
  return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
};
