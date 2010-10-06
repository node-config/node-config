var sys = require('sys');

var options = {};
var console = require('vows/console');
var stylize = console.stylize,
    puts = console.puts(options);
//
// Console reporter
//

this.name = 'spec';
this.report = function (data, s) {
    var event = data[1];

    options.stream = typeof(s) === 'object' ? s : process.stdout;
    buffer = [];

    switch (data[0]) {
        case 'subject':
            puts('\n♢ ' + stylize(event, 'bold') + '\n');
            break;
        case 'context':
            puts(this.contextText(event));
            break;
        case 'vow':
            puts(this.vowText(event));
            break;
        case 'end':
            sys.print('\n');
            break;
        case 'finish':
            puts(console.result(event).join('\n'));
            break;
        case 'error':
            puts(console.error(event));
            break;
    }
};

this.contextText = function (event) {
    return '  ' + event;
};

this.vowText = function (event) {
    var buffer = [];

    buffer.push('   ' + {
        honored: ' ✓ ',
        broken:  ' ✗ ',
        errored: ' ✗ ',
        pending: ' - '
    }[event.status] + stylize(event.title, ({
        honored: 'green',
        broken:  'yellow',
        errored: 'red',
        pending: 'cyan'
    })[event.status]));

    if (event.status === 'broken') {
        buffer.push('      » ' + event.exception);
    } else if (event.status === 'errored') {
        if (event.exception.type === 'promise') {
            buffer.push('      » ' + stylize("An unexpected error was caught: " +
                           stylize(event.exception.error, 'bold'), 'red'));
        } else {
            buffer.push('    ' + stylize(event.exception, 'red'));
        }
    }
    return buffer.join('\n');
};

this.print = function (str) {
    sys.print(str);
};
