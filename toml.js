'use strict';

var parser = require('./lib/parser');
var toml = {
  parse: function (src) { return parser.parse(src); },
  SyntaxError: parser.SyntaxError
};

module.exports = toml;
