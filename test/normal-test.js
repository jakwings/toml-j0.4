'use strict';

var should = require('should');
var toml = require(__dirname + '/..');

var stringify = JSON.stringify;
var typeRegexp = /^(?:String|Object|Number|Boolean|Array|Date)$/;

function parse(src) {
  try {
    return toml.parse(src);
  } catch (err) {
    return {
      ERROR: 'Line ' + err.line + ', column ' + err.column + ': ' + err
    };
  }
}

function typeOf(obj) {
  var match = Object.prototype.toString.call(obj).match(/^\[object (\S+)\]$/);
  return match ? match[1] : null;
}

function checkObject(obj) {
  should(typeOf(obj)).equal('Object');
  for (var key in obj) {
    should(obj).have.ownProperty(key);
    var type = typeOf(obj[key]);
    should(typeRegexp.test(type)).be.true;
    if (type === 'Object') {
      checkObject(obj[key]);
    } else if (type === 'Array') {
      checkArray(obj[key]);
    }
  }
}

function checkArray(arr) {
  should(typeOf(arr)).equal('Array');
  for (var i = 0; i < arr.length; i++) {
    var type = typeOf(arr[i]);
    should(typeRegexp.test(type)).be.true;
    if (type === 'Object') {
      checkObject(arr[i]);
    } else if (type === 'Array') {
      checkArray(arr[i]);
    }
  }
}

function replaceNL(s) {
  return s.replace(/\r?\n/g, function (m) {
    return m.length < 2 ? '<LF>' : '<CRLF>';
  });
}


describe('No data', function () {
  [ ''
  , ' '
  , '\t'
  , '\n'
  , '\r\n'
  , '# comment'
  , ' \n \t  # hsfi \r\n \n\n \t  #\n'
  ].forEach(function (a, i) {
    var key = 'empty_' + (i + 1);
    var data = parse(a);
    it(key + ': "' + replaceNL(a) + '" => {}', function () {
      checkObject(data);
      should(data).have.keys();  // no keys
    });
  });
});


describe('Simple key-value pairs', function () {

  describe('Basic strings', function () {
    [ ['""', '']
    , ['"a b"', 'a b']
    , ['"a b#keep"', 'a b#keep']
    , ['"a\\"b"', 'a"b']
    , ['"a\\\\b"', 'a\\b']
    , ['"a\\fb"', 'a\fb']
    , ['"a\\nb"', 'a\nb']
    , ['"a\\rb"', 'a\rb']
    , ['"a\\tb"', 'a\tb']
    , ['"a\\u0022b"', 'a"b']
    , ['"a\\U00000022b"', 'a"b']
    , ['"a\\U0001F600b"', 'a😀b']
    , ['"a\\U0001f600b"', 'a😀b']
    ].forEach(function (a, i) {
      var key = 'basic-str_' + (i + 1);
      var title = stringify(key) + ' =\t' + a[0] + ' => ' + stringify(a[1]);
      var data = parse(stringify(key) + ' =\t' + a[0]);
      it(title, function () {
        checkObject(data);
        should(data).have.keys(key);  // only
        should(data[key]).equal(a[1]);
      });
    });
  });

  describe('Literal strings', function () {
    [ ["''", '']
    , ["'a b'", 'a b']
    , ["'a b#keep'", 'a b#keep']
    , ["'a\\\"b'", 'a\\"b']
    , ["'a\\\\b'", 'a\\\\b']
    , ["'a\\fb'", 'a\\fb']
    , ["'a\\nb'", 'a\\nb']
    , ["'a\\rb'", 'a\\rb']
    , ["'a\\tb'", 'a\\tb']
    , ["'a\\u0022b'", 'a\\u0022b']
    , ["'a\\U00000022b'", 'a\\U00000022b']
    , ["'a\\U0001F600b'", 'a\\U0001F600b']
    , ["'a\\U0001f600b'", 'a\\U0001f600b']
    ].forEach(function (a, i) {
      var key = 'literal-str_' + (i + 1);
      var title = key + ' =\t' + a[0] + ' => ' + stringify(a[1]);
      var data = parse(key + ' =\t' + a[0]);
      it(title, function () {
        checkObject(data);
        should(data).have.keys(key);  // only
        should(data[key]).equal(a[1]);
      });
    });
  });

  describe('Basic multi-line basic strings', function () {
    [ ['"""a\n#keep \n\nb"""', 'a\n#keep \n\nb']
    , ['"""a\n \n\n\\"b"""', 'a\n \n\n"b']
    , ['"""a\n \n\n\\\\b"""', 'a\n \n\n\\b']
    , ['"""a\n \n\n\\fb"""', 'a\n \n\n\fb']
    , ['"""a\n \n\n\\nb"""', 'a\n \n\n\nb']
    , ['"""a\n \n\n\\rb"""', 'a\n \n\n\rb']
    , ['"""a\n \n\n\\tb"""', 'a\n \n\n\tb']
    , ['"""a\n \n\n\\u0022b"""', 'a\n \n\n"b']
    , ['"""a\n \n\n\\U00000022b"""', 'a\n \n\n"b']
    , ['"""a\n \n\n\\U0001F600b"""', 'a\n \n\n😀b']
    , ['"""a\n \n\n\\U0001f600b"""', 'a\n \n\n😀b']
    , ['"""\na\n \n\nb"""', 'a\n \n\nb']
    , ['"""\n\na\n \n\nb"""', '\na\n \n\nb']
    , ['"""a\n \n\nb\n"""', 'a\n \n\nb\n']
    , ['"""a\\\n \n\nb"""', 'ab']
    , ['"""a\\\r\n \r\n\r\nb"""', 'ab']
    ].forEach(function (a, i) {
      var key = 'multiline-basic-str_' + (i + 1);
      var title = key + ' =\t' + replaceNL(a[0]) + ' => ' + stringify(a[1]);
      var data = parse(key + ' =\t' + a[0]);
      it(title, function () {
        checkObject(data);
        should(data).have.keys(key);  // only
        should(data[key]).equal(a[1]);
      });
    });
  });

  describe('Basic multi-line literal strings', function () {
    [ ["'''a\n#keep \n\nb'''", 'a\n#keep \n\nb']
    , ["'''a\n \n\n\\\"b'''", 'a\n \n\n\\"b']
    , ["'''a\n \n\n\\\\b'''", 'a\n \n\n\\\\b']
    , ["'''a\n \n\n\\fb'''", 'a\n \n\n\\fb']
    , ["'''a\n \n\n\\nb'''", 'a\n \n\n\\nb']
    , ["'''a\n \n\n\\rb'''", 'a\n \n\n\\rb']
    , ["'''a\n \n\n\\tb'''", 'a\n \n\n\\tb']
    , ["'''a\n \n\n\\u0022b'''", 'a\n \n\n\\u0022b']
    , ["'''a\n \n\n\\U00000022b'''", 'a\n \n\n\\U00000022b']
    , ["'''a\n \n\n\\U0001F600b'''", 'a\n \n\n\\U0001F600b']
    , ["'''a\n \n\n\\U0001f600b'''", 'a\n \n\n\\U0001f600b']
    , ["'''\na\n \n\nb'''", 'a\n \n\nb']
    , ["'''\n\na\n \n\nb'''", '\na\n \n\nb']
    , ["'''a\n \n\nb\n'''", 'a\n \n\nb\n']
    , ["'''a\\\n \n\nb'''", 'a\\\n \n\nb']
    , ["'''a\\\r\n \r\n\r\nb'''", 'a\\\r\n \r\n\r\nb']
    ].forEach(function (a, i) {
      var key = 'multiline-literal-str_' + (i + 1);
      var title = key + ' =\t' + replaceNL(a[0]) + ' => ' + stringify(a[1]);
      var data = parse(key + ' =\t' + a[0]);
      it(title, function () {
        checkObject(data);
        should(data).have.keys(key);  // only
        should(data[key]).equal(a[1]);
      });
    });
  });

  describe('Boolean values', function () {
    [ ['true', true]
    , ['false', false]
    ].forEach(function (a, i) {
      var key = 'boolean_' + (i + 1);
      var title = key + ' =\t' + a[0] + ' => ' + stringify(a[1]);
      var data = parse(key + ' =\t' + a[0]);
      it(title, function () {
        checkObject(data);
        should(data).have.keys(key);  // only
        should(data[key]).equal(a[1]);
      });
    });
  });

  describe('Integers', function () {
    [ ['0', 0]
    , ['+0', 0]
    , ['-0', 0]
    // In fact, the result numbers are not correct due to damn JavaScript.
    , ['+9223372036854775807', 9223372036854775807]
    , ['+9_223_372_036_854_775_807', 9223372036854775807]
    , ['-9223372036854775808', -9223372036854775808]
    , ['-9_223_372_036_854_775_808', -9223372036854775808]
    ].forEach(function (a, i) {
      var key = 'integer_' + (i + 1);
      var title = key + ' =\t' + a[0] + ' => ' + stringify(a[1]);
      var data = parse(key + ' =\t' + a[0]);
      it(title, function () {
        checkObject(data);
        should(data).have.keys(key);  // only
        should(data[key]).equal(a[1]);
      });
    });
  });

  describe('Floating-point numbers (double-precision)', function () {
    [ ['0.0', 0.0]
    , ['+0.0', 0.0]
    , ['-0.0', 0.0]
    , ['-0.0e0', 0.0]
    , ['-0.0e+0', 0.0]
    , ['-0.0e-0', 0.0]
    , ['+1.7976931348623157e+308', Number.MAX_VALUE]
    , ['+1.797_693_134_862_315_7e+3_0_8', Number.MAX_VALUE]
    , ['5e-324', Number.MIN_VALUE]
    , ['5e-3_2_4', Number.MIN_VALUE]
    ].forEach(function (a, i) {
      var key = 'float_' + (i + 1);
      var title = key + ' =\t' + a[0] + ' => ' + stringify(a[1]);
      var data = parse(key + ' =\t' + a[0]);
      it(title, function () {
        checkObject(data);
        should(data).have.keys(key);  // only
        should(data[key]).equal(a[1]);
      });
    });
  });

  describe('Date-times (RFC 3339)', function () {
    var dt = new Date();
    [ ['0000-01-01T00:00:00', new Date(-62167219200000)]
    , ['9999-12-31T23:59:59', new Date(253402300799000)]
    , ['1970-01-01T00:00:00', new Date(0)]
    , ['1970-01-01T00:00:00Z', new Date(0)]
    , ['1970-01-01T00:00:00+00:00', new Date(0)]
    , ['1970-01-01T00:00:00-00:00', new Date(0)]
    , ['1970-01-01T00:00:00.0000Z', new Date(0)]
    , ['1970-01-01T00:00:00.00+00:00', new Date(0)]
    , ['1970-01-01T00:00:00.00-00:00', new Date(0)]
    , [dt.toISOString(), new Date(dt.getTime())]
    ].forEach(function (a, i) {
      var key = 'date-time_' + (i + 1);
      var title = key + ' =\t' + a[0] + ' => ' + stringify(a[1]);
      var data = parse(key + ' =\t' + a[0]);
      it(title, function () {
        checkObject(data);
        should(data).have.keys(key);  // only
        should(data[key]).be.Date;
        should(data[key].getTime()).equal(a[1].getTime());
      });
    });
  });

});


describe('Arrays', function () {

  describe('Empty arrays and arrays of arrays', function () {
    [ ['[]', []]
    , ['[ ]', []]
    , ['[ \n \n\n ]', []]
    , ['[ \r\n \r\n\r\n ]', []]
    , ['[ # comment\n ]', []]
    , ['[[[]]]', [[[]]]]
    , ['[[[],], [], ]', [[[]], []]]
    , ['[\n[\n[\n]\n]\n, \n[\n]\n, \n]', [[[]], []]]
    ].forEach(function (a, i) {
      var key = 'array_' + (i + 1);
      var title = key + ' =\t' + replaceNL(a[0]) + ' => ' + stringify(a[1]);
      var data = parse(key + ' =\t' + a[0]);
      it(title, function () {
        checkObject(data);
        should(data).have.keys(key);  // only
        should(data[key]).eql(a[1]);
      });
    });
  });

  describe('Arrays of strings', function () {
    [ ['[ "" ]', ['']]
    , ["[ '' ]", ['']]
    , ['[ "\\n" ]', ['\n']]
    , ["[ '\\n' ]", ['\\n']]
    , ['[ """\n#keep""" ]', ['#keep']]
    , ["[ '''\n#keep''' ]", ['#keep']]
    , ['[ """\n""", """\n""", """\n""" ]', ['', '', '']]
    , ["[ '''''', '''''', '''''' ]", ['', '', '']]
    , ['[ [""], ["", ""] ]', [[''], ['', '']]]
    , ["[ [''], ['', ''] ]", [[''], ['', '']]]
    ].forEach(function (a, i) {
      var key = 'array_' + (i + 1);
      var title = key + ' =\t' + replaceNL(a[0]) + ' => ' + stringify(a[1]);
      var data = parse(key + ' =\t' + a[0]);
      it(title, function () {
        checkObject(data);
        should(data).have.keys(key);  // only
        should(data[key]).eql(a[1]);
      });
    });
  });

  describe('Arrays of booleans', function () {
    [ ['[ true ]', [true]]
    , ['[ false ]', [false]]
    , ['[ true, false, true ]', [true, false, true]]
    , ['[ false, true, true ]', [false, true, true]]
    , ['[ [true], [true, false], ]', [[true], [true, false]]]
    ].forEach(function (a, i) {
      var key = 'array_' + (i + 1);
      var title = key + ' =\t' + a[0] + ' => ' + stringify(a[1]);
      var data = parse(key + ' =\t' + a[0]);
      it(title, function () {
        checkObject(data);
        should(data).have.keys(key);  // only
        should(data[key]).eql(a[1]);
      });
    });
  });

  describe('Arrays of integers', function () {
    [ ['[ 5 ]', [5]]
    , ['[ 8, -8 ]', [8, -8]]
    , ['[ 13, 0, -3 ]', [13, 0, -3]]
    , ['[ 2_1, 13, -3, -1_1]', [21, 13, -3, -11]]
    , ['[ [1], [+1, -1], [ [1], ], ]', [[1], [1, -1], [[1]]]]
    ].forEach(function (a, i) {
      var key = 'array_' + (i + 1);
      var title = key + ' =\t' + a[0] + ' => ' + stringify(a[1]);
      var data = parse(key + ' =\t' + a[0]);
      it(title, function () {
        checkObject(data);
        should(data).have.keys(key);  // only
        should(data[key]).eql(a[1]);
      });
    });
  });

  describe('Arrays of floating-point numbers', function () {
    [ ['[ 5.0 ]', [5.0]]
    , ['[ 8e0, -8.0e0 ]', [8.0, -8.0]]
    , ['[ +13.0, 0.0e10_0, -3.000 ]', [13.0, 0.0, -3.0]]
    , ['[ 2.1, -0.13e2, -3e-1, -1_1e-1_0]', [2.1, -13.0, -0.3, -0.0000000011]]
    , ['[ [+1_0e-2], [+1.0, -1e1], [ [1e-4], ], ]', [[0.1], [1.0, -10], [[0.0001]]]]
    ].forEach(function (a, i) {
      var key = 'array_' + (i + 1);
      var title = key + ' =\t' + a[0] + ' => ' + stringify(a[1]);
      var data = parse(key + ' =\t' + a[0]);
      it(title, function () {
        checkObject(data);
        should(data).have.keys(key);  // only
        should(data[key]).eql(a[1]);
      });
    });
  });

  describe('Arrays of date-times', function () {
    var dt = new Date();
    var d = [ '0000-01-01T00:00:00'
            , '9999-12-31T23:59:59'
            , '1970-01-01T00:00:00'
            , '1970-01-01T00:00:00Z'
            , '1970-01-01T00:00:00+00:00'
            , '1970-01-01T00:00:00-00:00'
            , '1970-01-01T00:00:00.0000Z'
            , '1970-01-01T00:00:00.00+00:00'
            , '1970-01-01T00:00:00.00-00:00'
            , dt.toISOString() ];
    var t = [ new Date(-62167219200000)
            , new Date(253402300799000)
            , new Date(0)
            , new Date(0)
            , new Date(0)
            , new Date(0)
            , new Date(0)
            , new Date(0)
            , new Date(0)
            , new Date(dt.getTime()) ];
    var m = function (template, alt) {
      if (alt) {
        return {
          t: template,
          v: JSON.parse(template, function (key, val) {
            if (typeof val === 'number') {
              return t[val];
            }
            return val;
          })
        };
      }
      return {
        t: template,
        v: template.replace(/\d+/g, function (m) {
          return d[parseInt(m, 10)];
        })
      };
    };
    [ [m('[ 0, ]'), m('[0]', true)]
    , [m('[ 0, 1 ]'), m('[0, 1]', true)]
    , [m('[ [2], [3,] ]'), m('[[2], [3]]', true)]
    , [m('[ [4, 5], [] ]'), m('[[4, 5], []]', true)]
    , [m('[ [6,], [7,], [8], 9 ]'), m('[[6], [7], [8], 9]', true)]
    , [m('[ [[[3]]] ]'), m('[[[[3]]]]', true)]
    , [m('[ [#\n [[3]]] ]'), m('[[[[3]]]]', true)]
    , [m('[ [[[3], #\n]] ]'), m('[[[[3]]]]', true)]
    ].forEach(function (a, i) {
      var key = 'array_' + (i + 1);
      var title = key + ' =\t' + replaceNL(a[0].t) + ' => ' + replaceNL(a[1].t);
      var data = parse(key + ' =\t' + a[0].v);
      it(title, function () {
        checkObject(data);
        should(data).have.keys(key);  // only
        should(data[key]).eql(a[1].v);
      });
    });
  });

});


describe('Inline tables', function () {
  [ ['{ }', {}]
  , ["{ a = '' }", {a:''}]
  , ['{ a = 1, b = 2023-12-02T01:03:34+03:34 }', {a:1,b:new Date(1701466174000)}]
  , ['{ a = -1.2_0e+2, b = "", c = [{}] }', {a:-120,b:'',c:[{}]}]
  , ['{ a = """\r\n""", b = \'\'\'\n\'\'\', c = [#\n true, \nfalse,] }', {a:'',b:'',c:[true,false]}]
  ].forEach(function (a, i) {
    var key = 'table_' + (i + 1);
    var title = key + ' =\t' + replaceNL(a[0]) + ' => ' + stringify(a[1]);
    var data = parse(key + ' =\t' + a[0]);
    it(title, function () {
      checkObject(data);
      should(data).have.keys(key);  // only
      should(data[key]).eql(a[1]);
    });
  });
});


describe('Tables', function () {
  [ ['[a]', {a:{}}]
  , ['[ a ]', {a:{}}]
  , ['[a.b.c]', {a:{b:{c:{}}}}]
  , ['[ a . b . c ]', {a:{b:{c:{}}}}]
  , ['["a"]', {a:{}}]
  , ['[ "a" ]', {a:{}}]
  , ['["a".b."c"]', {a:{b:{c:{}}}}]
  , ['[ a . "b" . "\\u0063" ]', {a:{b:{c:{}}}}]
  , ['["1"."1.1"."1.1.1"]', {'1':{'1.1':{'1.1.1':{}}}}]
  ].forEach(function (a, i) {
    var title = 'table_' + (i + 1) + ': ' +
        replaceNL(a[0]) + ' => ' + stringify(a[1]);
    var data = parse(a[0]);
    it(title, function () {
      checkObject(data);
      should(data).eql(a[1]);
    });
  });
});


describe('Arrays of Tables', function () {
  [ ['[[a]]', {a:[{}]}]
  , ['[[ a ]]', {a:[{}]}]
  , ['[[a.b.c]]', {a:{b:{c:[{}]}}}]
  , ['[[ a . b . c ]]', {a:{b:{c:[{}]}}}]
  , ['[["a"]]', {a:[{}]}]
  , ['[[ "a" ]]', {a:[{}]}]
  , ['[["a".b."c"]]', {a:{b:{c:[{}]}}}]
  , ['[[ a . "b" . "\\u0063" ]]', {a:{b:{c:[{}]}}}]
  , ['[["1"."1.1"."1.1.1"]]', {'1':{'1.1':{'1.1.1':[{}]}}}]
  ].forEach(function (a, i) {
    var title = 'table_array_' + (i + 1) + ': ' +
        replaceNL(a[0]) + ' => ' + stringify(a[1]);
    var data = parse(a[0]);
    it(title, function () {
      checkObject(data);
      should(data).eql(a[1]);
    });
  });
});


describe('Complicated data', function () {
  var fs = require('fs');
  var path = require('path');
  var readline = require('readline');
  var yaml = require('js-yaml');
  var testDir = __dirname + '/fixtures';

  var parseYAML = function (src) {
    var data = yaml.safeLoad(src);
    return data !== undefined ? data : {};
  };

  describe('Testing with official examples', function () {

    [ ['/example-normal-01.toml', '/example-normal-01.yaml']
    , ['/example-hard-01.toml', '/example-hard-01.yaml']
    ].forEach(function (files, i) {
      var title = '#' + (i + 1) + ': ' + path.basename(files[0], '.toml');
      var from = fs.readFileSync(testDir + files[0], {encoding: 'utf8'});
      var to = fs.readFileSync(testDir + files[1], {encoding: 'utf8'});
      it(title, function () {
        should(parse(from)).eql(parseYAML(to));
      });
    });

  });

  after(function (done) {
    var records = [];  // [s, e, from, s, e, to]
    var rl = readline.createInterface({
      input: fs.createReadStream(__dirname + '/fixtures/snippets.txt'),
      output: process.stdout,
      terminal: false
    });
    var lineno = 0;
    var record = [1];
    var bucket = [];
    var div1 = '-----------------------------%';
    var div2 = '-----------------------------------------------------------%';
    rl.on('line', function (line) {
      lineno++;
      if (line === div1) {
        record.push(lineno, bucket.join('\n'), lineno + 1);
        bucket = [];
      } else if (line === div2) {
        record.push(lineno, bucket.join('\n'));
        records.push(record);
        record = [lineno + 1];
        bucket = [];
      } else {
        bucket.push(line);
      }
    });
    rl.on('close', function () {
      describe('Testing with snippets', function () {
        records.forEach(function (record, i) {
          var title = '#' + (i + 1) +
              ': TOML[' + record[0] + ':0-' + record[1] + ':0]' +
              ' YAML[' + record[3] + ':0-' + record[4] + ':0]';
          it(title, function () {
            should(parse(record[2])).eql(parseYAML(record[5]));
          });
        });
        done();
      });
    });
  });

});
