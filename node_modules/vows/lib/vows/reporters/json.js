var options = { tail: '\n', raw: true };
var console = require('../../vows/console');
var puts = console.puts(options);

//
// Console JSON reporter
//
this.name = 'json';
this.setStream = function (s) {
    options.stream = s;
};
this.report = function (obj) {
    puts(JSON.stringify(obj));
};

this.print = function (str) {};
