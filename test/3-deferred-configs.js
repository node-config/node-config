import { describe, it, before } from 'node:test';
import assert from 'assert';
import { requireUncached } from './_utils/requireUncached.mjs';

// Test declaring deferred values.
describe('Tests for deferred values - JavaScript', function() {
  let CONFIG;

  before(async () => {
    // Change the configuration directory for testing
    process.env.NODE_CONFIG_DIR = import.meta.dirname + '/3-config';

    // Hard-code $NODE_ENV=test for testing
    process.env.NODE_ENV='test';

    // Test for multi-instance applications
    process.env.NODE_APP_INSTANCE='defer';

    CONFIG = await requireUncached('./lib/config.mjs');
  });

  describe('Configuration file Tests', function() {
    it('Using deferConfig() in a config file causes value to be evaluated at the end', function() {
      // The deferred function was declared in default-defer.js
      // Then local-defer.js is located which overloads the siteTitle mentioned in the function
      // Finally the deferred configurations, now referencing the 'local' siteTitle
      assert.strictEqual(CONFIG.welcomeEmail.subject, 'Welcome to New Instance!');
    });
  });
});
