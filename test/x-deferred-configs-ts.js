// Test declaring deferred values.

import { describe, it, before } from 'node:test';
import assert from 'assert';
import { requireUncached } from './_utils/requireUncached.mjs';

describe('Tests for deferred values - TypeScript', function() {
  let CONFIG;

  before(async() => {
    // Change the configuration directory for testing
    process.env.NODE_CONFIG_DIR = import.meta.dirname + '/x-config-ts';

    // Hard-code $NODE_ENV=test for testing
    process.env.NODE_ENV='test';

    // Test for multi-instance applications
    process.env.NODE_APP_INSTANCE='defer';

    CONFIG = await requireUncached('./lib/config.mjs');  });

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
