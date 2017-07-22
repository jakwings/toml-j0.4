var fs = require('fs');
var cursor = require('ansi')(process.stdout);
var Benchmark = require('benchmark');


var read = function (path) {
  return fs.readFileSync(path, {encoding: 'utf8'});
};
var dir = 'test/fixtures/';
var fixtures = [
, 'example-normal-01'
, 'example-hard-01'
].map(function (s) {
  return read(dir + s + '.toml');
});

var suite = new Benchmark.Suite({
  onStart: function () {
    console.log('Benchmarking...');
  },
  onComplete: function () {
    console.log('Successful:\n\t' +
        this.filter('successful').map('name').join(', '));
    console.log('Fastest:\n\t' +
        this.filter('fastest').map('name').join(', '));
  },
  onError: function (event) {
    console.error(event.target.error);
  }
});

var onCycle = function (event) {
  cursor.horizontalAbsolute();
  cursor.eraseLine();
  cursor.write('\t' + event.target);
};
var onComplete = function () {
  cursor.write('\n');
};

suite.add('require("toml").parse', {
  fn: function () {
    var parse = require('toml').parse;
    fixtures.map(parse);
  },
  onCycle: onCycle,
  onComplete: onComplete
});

suite.add('require("toml-j0.4").parse', {
  fn: function () {
    var parse = require('./').parse;
    fixtures.map(parse);
  },
  onCycle: onCycle,
  onComplete: onComplete
});

suite.run();
