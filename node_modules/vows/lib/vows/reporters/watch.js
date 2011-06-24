var sys = require('sys');

var options = {};
var console = require('vows/console');
var spec = require('vows/reporters/spec');
var stylize = console.stylize,
    puts = console.puts(options);
//
// Console reporter
//
var lastContext;

this.name = 'watch';
this.reset = function () {
    lastContext = null;
};
this.report = function (data) {
    var event = data[1];

    options.stream = process.stdout;

    switch (data[0]) {
        case 'vow':
            if (['honored', 'pending'].indexOf(event.status) === -1) {
                if (lastContext !== event.context) {
                    lastContext = event.context;
                    puts(spec.contextText(event.context));
                }
                puts(spec.vowText(event));
                puts('');
            }
            break;
        case 'error':
            puts(console.error(event));
            break;
    }
};
this.print = function (str) {};
