'use strict';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');

// Test declaring deferred values.

// Change the configuration directory for testing
process.env.NODE_CONFIG_DIR = __dirname + '/3-config';

// Hard-code $NODE_ENV=test for testing
process.env.NODE_ENV='test';

// Test for multi-instance applications
process.env.NODE_APP_INSTANCE='defer';

// Because require'ing config creates and caches a global singleton,
// We have to invalidate the cache to build new object based on the environment variables above
var CONFIG = requireUncached(__dirname + '/../lib/config');

describe('Tests for deferred values - JavaScript', function() {
  describe('Configuration file Tests', function() {
    it('Using deferConfig() in a config file causes value to be evaluated at the end', function() {
      // The deferred function was declared in default-defer.js
      // Then local-defer.js is located which overloads the siteTitle mentioned in the function
      // Finally the deferred configurations, now referencing the 'local' siteTitle
      assert.strictEqual(CONFIG.welcomeEmail.subject, 'Welcome to New Instance!');
    });
  });
});
