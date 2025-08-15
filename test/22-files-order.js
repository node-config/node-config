'use strict';

const requireUncached = require("./_utils/requireUncached");
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

describe("Test suite for node-config", function() {
  describe("Library initialization", function() {
    let config;

    beforeEach(function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + "/22-config";

      // Hard-code $NODE_ENV=test for testing
      process.env.NODE_ENV = "test";

      // Test for multi-instance applications
      process.env.NODE_APP_INSTANCE = "instance";

      config = requireUncached(__dirname + "/../lib/config");
    });

    it("Config files have been loaded in right order", function () {
      assert.strictEqual(config.get("prop1"), "prop1FromDefault");
      assert.strictEqual(config.get("prop2"), "prop2FromJsonInstance");
      assert.strictEqual(config.get("prop3"), "prop3FromYmlInstance");
    });
  });
});
