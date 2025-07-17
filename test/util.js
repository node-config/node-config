var requireUncached = require('./_utils/requireUncached');

// Tests for config.util functions


// Dependencies
var vows = require('vows'),
    assert = require('assert'),
    path = require('path'),
    config = require('../lib/config');

vows.describe('Tests for config util functions')
.addBatch({
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
})
.export(module);

