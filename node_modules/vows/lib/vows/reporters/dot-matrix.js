
var sys = require('sys');

var options = {};
var console = require('vows/console');
var spec = require('vows/reporters/spec');
var stylize = console.stylize,
    puts = console.puts(options);
//
// Console reporter
//
var stream, messages = [], lastContext;

this.name = 'dot-matrix';
this.reset = function () {
    messages = [];
    lastContext = null;
};
this.report = function (data, s) {
    var event = data[1];

    options.stream = typeof(s) === 'object' ? s : process.stdout;

    switch (data[0]) {
        case 'subject':
            // messages.push(stylize(event, 'underline') + '\n');
            break;
        case 'context':
            break;
        case 'vow':
            if (event.status === 'honored') {
                sys.print(stylize('·', 'green'));
            } else if (event.status === 'pending') {
                sys.print(stylize('-', 'cyan'));
            } else {
                if (lastContext !== event.context) {
                    lastContext = event.context;
                    messages.push(spec.contextText(event.context));
                }
                if (event.status === 'broken') {
                    sys.print(stylize('✗', 'yellow'));
                    messages.push(spec.vowText(event));
                } else if (event.status === 'errored') {
                    sys.print(stylize('✗', 'red'));
                    messages.push(spec.vowText(event));
                }
                messages.push('');
            }
            break;
        case 'end':
            sys.print(' ');
            break;
        case 'finish':
            if (messages.length) {
                puts('\n\n' + messages.join('\n'));
            } else {
                sys.print('\n');
            }
            puts(console.result(event).join('\n'));
            break;
        case 'error':
            puts(console.error(event));
            break;
    }
};

this.print = function (str) {
    sys.print(str);
};
