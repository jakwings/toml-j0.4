{
  function isFinite(n) {
    return Number.isFinite ? Number.isFinite(n) :
        (typeof n === 'number' && isFinite(n));
  }
  function isArray(obj) {
    return Array.isArray ? Array.isArray(obj) :
        Object.prototype.toString.call(obj) === '[object Array]';
  }
  function hasOwnProperty(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }
  function stringify(o) {
    return JSON.stringify(o);
  }
  function unescape(c) {
    switch (c) {
      case '"': case '\\': return c;
      case 'b': return '\b';
      case 'f': return '\f';
      case 'n': return '\n';
      case 'r': return '\r';
      case 't': return '\t';
      default: error('"' + c + '" cannot be escaped.');
    }
  }
  // See: punnycode.ucs2.encode from https://github.com/bestiejs/punycode.js
  function fromCodePoint(s) {
    s = s.replace(/^0+/, '');
    var maxCodePoint = '10FFFF';
    var codepoint = parseInt(s, 16);
    if (!isFinite(codepoint) ||
        s.length > maxCodePoint.length ||
        (s.length === maxCodePoint.length && s > '10FFFF')) {
      error('U+' + s + ' is not a valid Unicode code point.');
    }
    var c = '';
    if (codepoint > 0xFFFF) {
      codepoint -= 0x10000;
      c += String.fromCharCode((codepoint >>> 10) & 0x3FF | 0xD800);
      codepoint = 0xDC00 | codepoint & 0x3FF;
    }
    c += String.fromCharCode(codepoint);
    return c;
  }
  function pathToStr(path, begin, end) {
    begin = (begin != null) ? begin : 0;
    end = (end != null) ? end : path.length;
    var s = '';
    for (var i = begin; i < end; i++) {
      s += (s ? '.' : '') + stringify(path[i]);
    }
    return s;
  }
  function checkTableKey(table, k) {
    // TODO: Track the key path.
    if (hasOwnProperty(table, k)) {
      error('Key ' + stringify(k) + ' should not be defined twice in the same table.');
    }
  }
  function findContext(table, isTableArray, path) {
    var s = '';
    for (var i = 0, l = path.length; i < l; i++) {
      var k = path[i];
      s += (s ? '.' : '') + stringify(k);
      if (!hasOwnProperty(table, k)) {
        if (isTableArray && i + 1 === l) {
          var t = {};
          table[k] = [t];
          table = t;
          g_table_arrays[s] = true;
        } else {
          table = table[k] = {};
          g_tables[s] = true;
        }
      } else {
        if (isTableArray) {
          if (isArray(table[k])) {
            if (!g_table_arrays[s]) {
              error('Key ' + s + ' should not be defined twice.');
            }
            if (i + 1 === l) {
              var t = {};
              table[k].push(t);
              table = t;
            } else {
              table = table[k][table[k].length-1];
            }
          } else {
            if (!g_tables[s]) {
              error('Key ' + s + ' should not be defined twice.');
            }
            table = table[k];
          }
        } else {
          if (isArray(table[k])) {
            if (!g_table_arrays[s]) {
              error('Key ' + s + ' should not be defined twice.');
            }
            table = table[k][table[k].length-1];
          } else {
            if (!g_tables[s]) {
              error('Key ' + s + ' should not be defined twice.');
            }
            table = table[k];
          }
        }
      }
    }
    if (isTableArray) {
      if (!g_table_arrays[s]) {
        error('Key ' + s + ' should not be defined twice.');
      }
    } else {
      if (g_defined_tables[s]) {
        error('Key ' + s + ' should not be defined twice.');
      }
      g_defined_tables[s] = true;
    }
    return {
      table: table,
      path: path
    };
  }

  var g_root = {};             // TOML table
  var g_context = {            // current context
    table: g_root,
    path: []
  };
  var g_tables = {};           // paths to tables
  var g_defined_tables = {};   // paths to tables directly defined
  var g_table_arrays = {};     // paths to table arrays
}


expressions             "expressions"
    = spacing* ( expression spacing* expressions? )?
      {
        return g_root;
      }

expression              "expression"
    = path:table_array_header
      {
        g_context = findContext(g_root, true, path);
      }
    / path:table_header
      {
        g_context = findContext(g_root, false, path);
      }
    / kv:key_value
      {
        checkTableKey(g_context.table, kv[0]);
        g_context.table[kv[0]] = kv[1];
      }

spacing
    = whitespace
    / newline
    / comment

newline                 "newline"
    = "\n" / "\r\n"

whitespace              "whitespace"
    = [ \t]

comment                 "comment"
    = "#" ( !newline . )*

key_value               "key-value pair"
    = a_:key whitespace* "=" whitespace* b_:value
      {
        return [a_, b_];
      }

key                     "key"
    = unquoted_key
    / quoted_key

unquoted_key            "bare key"
    = [a-zA-Z0-9\-_]+
      {
        return text();
      }

quoted_key              "quoted key"
    = '"' a_:basic_char+ '"'
      {
        return a_.join('');
      }

value                   "value"
    = string
    / boolean
    / date_time
    / float
    / integer
    / array
    / inline_table

string                  "string"
    = ml_basic_string
    / basic_string
    / ml_literal_string
    / literal_string

basic_string            "basic string"
    = '"' a_:basic_char* '"'
      {
        return a_.join('');
      }

basic_char              "basic character"
    = unescaped_char
    / escaped_char

unescaped_char          "normal basic character"
    = !newline [^"\\]
      {
        return text();
      }

escaped_char            "escaped character"
    = "\\" ["\\bfnrt]
      {
        return unescape(text()[1]);
      }
    / "\\u" four_hex_digit
      {
        return fromCodePoint(text().substr(2));
      }
    / "\\U" eight_hex_digit
      {
        return fromCodePoint(text().substr(2));
      }

four_hex_digit          "four hexadecimal digits"
    = hex_digit hex_digit hex_digit hex_digit

eight_hex_digit         "eight hexadecimal digits"
    = hex_digit hex_digit hex_digit hex_digit hex_digit hex_digit hex_digit hex_digit

hex_digit               "hexadecimal digit"
    = [0-9A-F]

literal_string          "literal string"
    = "'" literal_char* "'"
      {
        var s = text();
        return s.substr(1, s.length - 2);
      }

literal_char            "literal character"
    = !newline [^']

ml_basic_string         "multi-line basic string"
    = '"""' newline? a_:ml_basic_text* '"""'
      {
        return a_.join('').replace(/\\\r?\n(?:\r?\n|[ \t])*/g, '');
      }

ml_basic_text           "multi-line basic text"
    = ml_basic_char
    / "\\" newline
      {
        return text();
      }
    / newline

ml_basic_char           "multi-line basic character"
    = !'"""' ml_unescaped_char
      {
        return text();
      }
    / escaped_char

ml_unescaped_char       "multi-line normal basic character"
    = !newline [^\\]

ml_literal_string       "multi-line literal string"
    = "'''" newline? a_:ml_literal_text* "'''"
      {
        return a_.join('');
      }

ml_literal_text         "multi-line literal text"
    = !"'''" ml_literal_char
      {
        return text();
      }
    / newline

ml_literal_char         "multi-line literal character"
    = !newline .

boolean                 "boolean value"
    = "true"
      {
        return true;
      }
    / "false"
      {
        return false;
      }

float                   "floating-point number"
    = integer ( fraction exponent? / exponent )
      {
        // A double-precision 64-bit floating-point number in IEEE 754 standard.
        var s = text();
        var number = parseFloat(s.replace(/_/g, ''));
        if (!isFinite(number)) {
          error(s + 'is not a 64-bit floating-point number.');
        }
        return number;
      }

fraction                "fractional part of floating-point number"
    = "." digit ( "_"? digit )*

exponent                "exponent"
    = ( "e" / "E" ) integer

integer                 "integer"
    = sign? int_digits
      {
        // Be careful of JavaScript limits:
        // 1) Number.MAX_SAFE_INTEGER = 9007199254740991
        // 2) Number.MIN_SAFE_INTEGER = -9007199254740991
        var s = text();
        var number = s.replace(/_/g, '');
        // Check if it is a 64-bit signed integer.
        var invalid = false;
        if (number[0] === '-') {
          var minInt = '-9223372036854775808';
          if (number.length > minInt.length ||
              (number.length === minInt.length && number > minInt)) {
            invalid = true;
          }
        } else {
          if (number[0] === '+') {
            number = number.substr(1);
          }
          var maxInt = '9223372036854775807';
          if (number.length > maxInt.length ||
              (number.length === maxInt.length && number > maxInt)) {
            invalid = true;
          }
        }
        if (invalid) {
          error(s + ' is not a 64-bit signed integer.');
        }
        number = parseInt(number, 10);
        if (!isFinite(number)) {
          error(s + ' is not a 64-bit signed integer.');
        }
        return number;
      }

sign                    "plus/minus sign"
    = "+"
    / "-"

int_digits              "digits of integer"
    = digit_1to9 ( "_"? digit )+
    / digit

digit_1to9              "digit from 1 to 9"
    = [1-9]

digit                   "decimal digit"
    = [0-9]

date_time               "date-time"  // RFC 3339
    = full_date "T" full_time
      {
        var s = text();
        var date = new Date(s);
        if (!isFinite(date.getTime())) {
          error('Date-time ' + s + ' does not conform to RFC 3339.');
        }
        return date;
      }

full_date               "full date"
    = year "-" month "-" mday

year                    "full year (XXXX)"
    = digit digit digit digit

month                   "month (XX)"
    = digit digit

mday                    "day of month (XX)"
    = digit digit

full_time               "full time (HH:MM:SS[offset])"
    = time time_offset?

time                    "time (HH:MM:SS[fraction])"
    = hour ":" minute ":" second second_fraction?

hour                    "hour (HH)"
    = digit digit

minute                  "minute (MM)"
    = digit digit

second                  "second (SS)"
    = digit digit

second_fraction         "fractional part of second"
    = "." digit+

time_offset             "offset of time"
    = "Z"
    / sign hour ":" minute

array                   "array"
    = "[" spacing*
          a_:( array_value
               spacing*
               ( "," spacing* )? )? "]"
      {
        return a_ ? a_[0] : [];
      }

array_value             "array value"
    = a_:value b_:( spacing* "," spacing* array_value )?
      {
        var array = [a_];
        if (b_) {
          var type = typeof a_;
          for (var i = 0, arr = b_[3], l = arr.length; i < l; i++) {
            if (type !== typeof arr[i]) {
              error(stringify(arr[i]) + ' should be of type "' + type + '".');
            }
            array.push(arr[i]);
          }
        }
        return array;
      }

inline_table            "inline table"
    = "{" whitespace*
          a_:( key_value
               ( whitespace* "," whitespace* key_value )*
               whitespace* )? "}"
      {
        var table = {};
        if (a_) {
          table[a_[0][0]] = a_[0][1];
          for (var i = 0, arr = a_[1], l = arr.length; i < l; i++) {
            var kv = arr[i][3];
            checkTableKey(table, kv[0]);
            table[kv[0]] = kv[1];
          }
        }
        return table;
      }

table_array_header      "header of table array"
    = "[" path:table_header "]"
    {
      return path;
    }

table_header            "header of table"
    = "[" whitespace*
          a_:key
          b_:( whitespace* "." whitespace* key )*
          whitespace* "]"
      {
        var path = [a_];
        for (var i = 0, l = b_.length; i < l; i++) {
          path.push(b_[i][3]);
        }
        return path;
      }
