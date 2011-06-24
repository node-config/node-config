//
// Vows.js - asynchronous event-based BDD for node.js
//
//   usage:
//
//       var vows = require('vows');
//
//       vows.describe('Deep Thought').addBatch({
//           "An instance of DeepThought": {
//               topic: new DeepThought,
//
//               "should know the answer to the ultimate question of life": function (deepThought) {
//                   assert.equal (deepThought.question('what is the answer to the universe?'), 42);
//               }
//           }
//       }).run();
//
var sys = require('sys'),
    path = require('path'),
    events = require('events'),
    vows = exports;

require.paths.unshift(__dirname);

// Options
vows.options = {
    Emitter: events.EventEmitter,
    reporter: require('vows/reporters/dot-matrix'),
    matcher: /.*/,
    error: true // Handle "error" event
};

vows.__defineGetter__('reporter', function () {
    return vows.options.reporter;
});

var stylize = require('vows/console').stylize;
var console = require('vows/console');

vows.inspect = require('vows/console').inspect;
vows.prepare = require('vows/extras').prepare;
vows.tryEnd = require('vows/suite').tryEnd;

//
// Assertion Macros & Extensions
//
require('./assert/error');
require('./assert/macros');

//
// Suite constructor
//
var Suite = require('vows/suite').Suite;

//
// This function gets added to events.EventEmitter.prototype, by default.
// It's essentially a wrapper around `on`, which adds all the specification
// goodness.
//
function addVow(vow) {
    var batch = vow.batch;

    batch.total ++;
    batch.vows.push(vow);

    return this.on("success", function () {
        var args = Array.prototype.slice.call(arguments);
        // If the callback is expecting two or more arguments,
        // pass the error as the first (null) and the result after.
        if (vow.callback.length >= 2 && batch.suite.options.error) {
            args.unshift(null);
        }
        runTest(args, this.ctx);
        vows.tryEnd(batch);

    }).on("error", function (err) {
        if (vow.callback.length >= 2 || !batch.suite.options.error) {
            runTest([err], this.ctx);
        } else {
            output('errored', { type: 'promise', error: err.stack || err.message || JSON.stringify(err) });
        }
        vows.tryEnd(batch);
    });

    function runTest(args, ctx) {
        var topic, status;

        if (vow.callback instanceof String) {
            return output('pending');
        }

        // Run the test, and try to catch `AssertionError`s and other exceptions;
        // increment counters accordingly.
        try {
            vow.callback.apply(ctx === global || !ctx ? vow.binding : ctx, args);
            output('honored');
        } catch (e) {
            if (e.name && e.name.match(/AssertionError/)) {
                output('broken', e.toString());
            } else {
                output('errored', e.stack || e.message || e);
            }
        }
    }

    function output(status, exception) {
        batch[status] ++;
        vow.status = status;

        if (vow.context && batch.lastContext !== vow.context) {
            batch.lastContext = vow.context;
            batch.suite.report(['context', vow.context]);
        }
        batch.suite.report(['vow', {
            title: vow.description,
            context: vow.context,
            status: status,
            exception: exception || null
        }]);
    }
};

//
// On exit, check that all promises have been fired.
// If not, report an error message.
//
process.on('exit', function () {
    var results = { honored: 0, broken: 0, errored: 0, pending: 0, total: 0 }, failure;

    vows.suites.forEach(function (s) {
        if ((s.results.total > 0) && (s.results.time === null)) {
            s.reporter.print('\n\n');
            s.reporter.report(['error', { error: "Asynchronous Error", suite: s }]);
        }
        s.batches.forEach(function (b) {
            var unFired = [];

            b.vows.forEach(function (vow) {
                if (! vow.status) {
                    if (unFired.indexOf(vow.context) === -1) {
                        unFired.push(vow.context);
                    }
                }
            });

            if (unFired.length > 0) { sys.print('\n') }

            unFired.forEach(function (title) {
                s.reporter.report(['error', {
                    error: "callback not fired",
                    context: title,
                    batch: b,
                    suite: s
                }]);
            });

            if (b.status === 'begin') {
                failure = true;
                results.errored ++;
                results.total ++;
            }
            Object.keys(results).forEach(function (k) { results[k] += b[k] });
        });
    });
    if (failure) {
        sys.puts(console.result(results));
    }
});

vows.suites = [];

//
// Create a new test suite
//
vows.describe = function (subject) {
    var suite = new(Suite)(subject);

    this.options.Emitter.prototype.addVow = addVow;
    this.suites.push(suite);

    //
    // Add any additional arguments as batches if they're present
    //
    if (arguments.length > 1) {
        for (var i = 1, l = arguments.length; i < l; ++i) {
            suite.addBatch(arguments[i]);
        }
    }

    return suite;
};


vows.version = require('fs').readFileSync(path.join(__dirname, '..', 'package.json'))
                            .toString().match(/"version"\s*:\s*"([\d.]+)"/)[1];
