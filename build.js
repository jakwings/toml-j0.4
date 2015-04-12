var fs = require('fs');
var browserify = require('browserify');
var UglifyJS = require('uglify-js');
var PEG = require('pegjs');


var grammar = fs.readFileSync(__dirname + '/toml.pegjs', {
  encoding: 'utf8'
}).toString();
var source = PEG.buildParser(grammar, {
  output: 'source',
  optimize: 'speed'
});
source = 'module.exports = ' + source;
fs.writeFileSync(__dirname + '/lib/parser.js', source, {
  encoding: 'utf8'
});
var bundle = browserify(__dirname + '/toml.js', {
  standalone: 'toml'
}).bundle(function (err, buf) {
  if (err) { throw err; }
  var code = UglifyJS.minify(buf.toString(), {
    fromString: true
  }).code;
  fs.writeFileSync(__dirname + '/dist/toml-browser.js', code, {
    encoding: 'utf8'
  });
});
