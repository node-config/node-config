var requireUncached = require('./_utils/requireUncached');

// Tests for config.util functions


// Dependencies
var vows = require('vows'),
    assert = require('assert'),
    path = require('path'),
    config = require('../lib/config'),
    initParam = config.util.initParam;

vows.describe('Tests for config util functions')
.addBatch({
    'Tests for util.initParam': {
        'When no command line or env var is set, default value is returned.': function () {
          assert(initParam('EMPTY','mydefault'),'mydefault');
        },
        'When process.env is set and cmdline is not, process.env is used ': function () {
          process.env.ENV_ONLY = 'in-the-env';
          assert(initParam('ENV_ONLY','mydefault'),'in-the-env');
        },
        'When process.env is set and cmdline *is* set, cmd-line is used ': function () {
          process.env.BOTH = 'in-the-env';
          process.argv=['--BOTH=in-the-argv'];
          assert(initParam('BOTH','mydefault'),'in-the-argv');
        },
        'After calling initParam, value is reflected in getEnv() even if it did not come from process.env': function () {
          process.argv=['ignore','ignore','--FROMARG=in-the-argv'];
          assert(initParam('FROMARG','mydefault'),'in-the-argv');
          assert(config.util.getEnv('FROMARG'),'in-the-argv');
        },
        'Setting a zero value in the process.env works (process.env inherently casts values to strings)': function () {
          process.env.ENV_ONLY = '0';
          assert.strictEqual(initParam('ENV_ONLY','mydefault'),'0');
        },
        'Setting a zero value on the command line works. ': function () {
          process.argv=['ignore','ignore','--FROMARG=0'];
          assert.strictEqual(initParam('FROMARG','mydefault'),'0');
        },
    },
    'Tests for util.loadFileConfigs': {
        topic: function () {
            // Change the configuration directory for testing
            process.env.NODE_CONFIG_DIR = __dirname + '/config';

            // Hard-code $NODE_CONFIG_ENV=test for testing
            delete process.env.NODE_APP_INSTANCE;
            process.env.NODE_CONFIG_ENV='test';

            return requireUncached(__dirname + '/../lib/config').util;
        },
        'It can load data from a given directory': function (util) {
          var result = util.loadFileConfigs(path.join(__dirname, '5-config'));
          assert.strictEqual(result.number, 5);
        },
        'It ignores NODE_CONFIG when loading from directory': function (util) {
          var prev = process.env.NODE_CONFIG;
          process.env.NODE_CONFIG = '{"number":4}';
          var result = util.loadFileConfigs(path.join(__dirname, '5-config'));
          assert.strictEqual(result.number, 5);
          process.env.NODE_CONFIG = prev;
        },
        'It can handle recursion': function(util) {
          var result = util.loadFileConfigs(path.join(__dirname, '21-reentrant'));
          assert.ok(result.nested, "did not load nested values");
        }
    },
    'Tests for util.isPromise': {
      'It can identify a new Promise': function () {
        assert.isTrue(config.util.isPromise(new Promise(() => {})));
      },
      'It can identify a resolved Promise': function () {
        assert.isTrue(config.util.isPromise(Promise.resolve()));
      },
      'It can identify a rejected Promise': function () {
        // Use .catch to avoid `UnhandledPromiseRejectionWarning`, DO NOT REMOVE
        assert.isTrue(config.util.isPromise(Promise.reject().catch(function () {})));
      },
      'It can identify other things different as no promises': function () {
        var testCases = [
          new Function(),
          function () {},
          true,
          false,
          new Boolean(),
          class {},
          '',
          new String(),
          [],
          {},
          Object.create(null),
          new Map(),
          null,
          undefined,
          NaN,
          Infinity,
          0,
          1.1
          -1,
        ];
        testCases.forEach(function (testCase) {
          assert.isFalse(config.util.isPromise(testCase));
        });
      }
    }
})
.export(module);

