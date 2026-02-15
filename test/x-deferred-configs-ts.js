'use strict';

// Test declaring deferred values.

const requireUncached = require('./_utils/requireUncached');
const { describe, it, before, beforeEach } = require('node:test');
const assert = require('assert');

// Change the configuration directory for testing
process.env.NODE_CONFIG_DIR = __dirname + '/x-config-ts';

// Hard-code $NODE_ENV=test for testing
process.env.NODE_ENV='test';

// Test for multi-instance applications
process.env.NODE_APP_INSTANCE='defer';

// Because require'ing config creates and caches a global singleton,
// We have to invalidate the cache to build new object based on the environment variables above
var CONFIG = requireUncached(__dirname + '/../lib/config');

describe('Tests for deferred values - TypeScript', function() {
  describe('Configuration file Tests', function() {
    it('Using deferConfig() in a config file causes value to be evaluated at the end', function() {
        // The deferred function was declared in default-defer.js
        // Then local-defer.js is located which overloads the siteTitle mentioned in the function
        // Finally the deferred configurations, now referencing the 'local' siteTitle
        assert.strictEqual(CONFIG.welcomeEmail.subject, 'Welcome to New Instance!');
    });

    it('values which are functions remain untouched unless they are instance of DeferredConfig', function() {
        // If this had been treated as a deferred config value it would blow-up.
        assert.strictEqual(CONFIG.welcomeEmail.aFunc(), 'Still just a function.');
    });

    // This defer function didn't use args, but relied 'this' being bound to the main config object
    it("defer functions can simply refer to 'this'" , function () {
        assert.strictEqual(CONFIG.welcomeEmail.justThis, 'Welcome to this New Instance!');
    });

    it("defer functions which return objects should still be treated as a single value." , function () {
      assert.deepEqual(CONFIG.get('map.centerPoint'), { lat: 3, lon: 4 });
    });

    it("defer function return original value." , function () {
      assert.strictEqual(CONFIG.original.original, 'an original value');
    });

    it("second defer function return original value.", function () {
      assert.strictEqual(CONFIG.original.deferredOriginal, undefined);
    });
  });
});
