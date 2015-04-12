var fs = require('fs');
var should = require('should');
var toml = require(__dirname + '/..');
var testDir = __dirname + '/fixtures';
var readline = require('readline');


var rl = readline.createInterface({
  input: fs.createReadStream(__dirname + '/fixtures/smoke.txt'),
  output: process.stdout,
  terminal: false
});
var records = [];  // [s, e, text]
var record = [1];
var bucket = [];
var lineno = 0;
var div = '-----------------------------------------------------------%';
rl.on('line', function (line) {
  lineno++;
  if (line === div) {
    record.push(lineno, bucket.join('\n'));
    records.push(record);
    record = [lineno + 1];
    bucket = [];
  } else {
    bucket.push(line);
  }
});
rl.on('close', function () {
  describe('Smoke tests', function () {
    records.forEach(function (record, i) {
      var title = '#' + (i + 1) +
          ': TOML[' + record[0] + ':0-' + record[1] + ':0]';
      it(title, function () {
        should(function () {
          toml.parse(record[2]);
        }).throw(Error);
      });
    });
  });
});
