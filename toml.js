'use strict';

function subclass(child, parent) {
  function ctor() {
    this.constructor = child;
  }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
}

function TomlSyntaxError(message, offset, line, column) {
  this.message = message;
  this.offset = offset;
  this.line = line;
  this.column = column;
}

subclass(TomlSyntaxError, SyntaxError);

var parser = require('./lib/parser');
var toml = {
  parse: function (src) {
    try {
      return parser.parse(src);
    } catch (err) {
      if (err instanceof parser.SyntaxError) {
        err.line = err.location.start.line;
        err.column = err.location.start.column;
        err.offset = err.location.start.offset;
        throw new TomlSyntaxError(
          err.message,
          err.location.start.offset,
          err.location.start.line,
          err.location.start.column);
      } else {
        throw err;
      }
    }
  },
  SyntaxError: TomlSyntaxError
};

module.exports = toml;
