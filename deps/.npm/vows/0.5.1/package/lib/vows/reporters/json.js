var sys = require('sys');
//
// Console JSON reporter
//
this.name = 'json';
this.report = function (obj) {
    sys.puts(JSON.stringify(obj));
};

this.print = function (str) {};
