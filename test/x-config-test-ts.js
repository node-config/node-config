'use strict';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');

/**
 * <p>Unit tests for the node-config library.  To run type:</p>
 * <pre>npm test</pre>
 * <p>Or, in a project that uses node-config:</p>
 * <pre>npm test config</pre>
 *
 * @class ConfigTest
 */

describe('Test suite for node-config TypeScript support with default export', function() {
  let config;

  beforeEach(function () {
    // Clear after previous tests
    process.env.NODE_APP_INSTANCE = '';
    process.env.NODE_ENV = '';
    process.env.NODE_CONFIG = '';

    // Change the configuration directory for testing
    process.env.NODE_CONFIG_DIR = __dirname + '/x-config-ts';

    // Disable after previous tests
    process.env.NODE_CONFIG_STRICT_MODE = false;

    config = requireUncached(__dirname + '/../lib/config');
  });

  describe('Library initialization with TypeScript config files', function() {
    it('Config library is available', function() {
      assert.strictEqual(typeof config, 'object');
    });
  });

  describe('Configuration file Tests', function() {
    it('Loading configurations from a TypeScript file is correct', function() {
      assert.strictEqual(config.siteTitle, 'New Instance!');
    });
  });

  describe('Start in the environment with existing .ts extension handler', function() {
    it('Library reuses existing .ts file handler', function() {
      let existingHandler = require.extensions['.ts'];
      assert.ok(existingHandler, 'Existing handler is defined by the environment');

      let config = requireUncached(__dirname + '/../lib/config');
      assert.strictEqual(require.extensions['.ts'], existingHandler, 'Should not overwrite existing handler');
    });
  });
});



