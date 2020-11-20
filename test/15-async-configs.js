var requireUncached = require('./_utils/requireUncached');

var resolveAsyncConfigs = require('../async').resolveAsyncConfigs;

// Test declaring async values.

// Change the configuration directory for testing
process.env.NODE_CONFIG_DIR = __dirname + '/15-config';

// Hard-code $NODE_ENV=test for testing
process.env.NODE_ENV='test';

// Test for multi-instance applications
process.env.NODE_APP_INSTANCE='async';

// Because require'ing config creates and caches a global singleton,
// We have to invalidate the cache to build new object based on the environment variables above
var CONFIG = requireUncached(__dirname + '/../lib/config');

// Dependencies
var vows = require('vows'),
    assert = require('assert');

vows.describe('Tests for async values - JavaScript').addBatch({
  'Configuration file Tests': {
    topic: function() {
      resolveAsyncConfigs(CONFIG).then(function(config) {
        this.callback(null, config);
      }.bind(this)).catch(function(err) {
        this.callback(err);
      }.bind(this));
    },

    'Using asyncConfig() in a config file causes value to be evaluated by resolveAsyncConfigs': function() {
      assert.equal(CONFIG.welcomeEmail.subject, 'Welcome to New Instance!');
    },

    'values which are functions remain untouched unless they are instance of AsyncConfig': function() {
      // If this had been treated as a async config value it would blow-up.
      assert.equal(CONFIG.welcomeEmail.aFunc(), 'Still just a function.');
    },

    // This async function didn't use args, but relied 'this' being bound to the main config object
    "async functions can simply refer to 'this'" : function () {
      assert.equal(CONFIG.welcomeEmail.justThis, 'Welcome to this New Instance!');
    },

    "async promises which return objects should still be treated as a single value." : function () {
      assert.deepEqual(CONFIG.get('map.centerPoint'), { lat: 3, lon: 4 });
    },

    "async promise return original value." : function () {
      assert.equal(CONFIG.original.original, 'an original value');
    },

    "second async promise return local value." : function () {
      assert.equal(CONFIG.original.originalPromise, 'not an original value');
    },

    "verify deferred functionality plays nicely with AsyncConfig." : function () {
      assert.equal(CONFIG.promiseSubject, 'New Instance! Welcome to New Instance!');
    },
  }
}).export(module);