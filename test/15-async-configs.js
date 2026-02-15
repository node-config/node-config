'use strict';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');

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

describe('Tests for async values - JavaScript', function() {
  describe('Configuration file Tests', function() {
    let config;

    beforeEach(async function() {
      config = await resolveAsyncConfigs(CONFIG);
    });

    it ('Using asyncConfig() in a config file causes value to be evaluated by resolveAsyncConfigs', function() {
      assert.strictEqual(config.welcomeEmail.subject, 'Welcome to New Instance!');
    });

    it('values which are functions remain untouched unless they are instance of AsyncConfig', function() {
      // If this had been treated as a async config value it would blow-up.
      assert.strictEqual(config.welcomeEmail.aFunc(), 'Still just a function.');
    });

    // This async function didn't use args, but relied 'this' being bound to the main config object
    it("async functions can simply refer to 'this'", function () {
      assert.strictEqual(config.welcomeEmail.justThis, 'Welcome to this New Instance!');
    });

    it("async promises which return objects should still be treated as a single value.", function () {
      assert.deepEqual(config.get('map.centerPoint'), { lat: 3, lon: 4 });
    });

    it("async promise return original value.", function () {
      assert.strictEqual(config.original.original, 'an original value');
    });

    it("second async promise return local value.", function () {
      assert.strictEqual(config.original.originalPromise, 'not an original value');
    });

    it("verify deferred functionality plays nicely with AsyncConfig.", function () {
      assert.strictEqual(config.promiseSubject, 'New Instance! Welcome to New Instance!');
    });
  });
});
