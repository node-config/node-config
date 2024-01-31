const requireUncached = require("./_utils/requireUncached");

// Dependencies
const vows = require("vows");
const assert = require("assert");

/**
 * <p>Unit tests for the node-config library.  To run type:</p>
 * <pre>npm test</pre>
 * <p>Or, in a project that uses node-config:</p>
 * <pre>npm test config</pre>
 *
 * @class ConfigTest
 */

vows.describe("Test suite for node-config").addBatch({
  "Library initialization": {
    topic: function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + "/22-config";

      // Hard-code $NODE_ENV=test for testing
      process.env.NODE_ENV = "test";

      // Test for multi-instance applications
      process.env.NODE_APP_INSTANCE = "instance";

      CONFIG = requireUncached(__dirname + "/../lib/config");

      return CONFIG;
    },
    "Config files have been loaded in right order": function (CONFIG) {
      assert.equal(CONFIG.get("prop1"), "prop1FromDefault");
      assert.equal(CONFIG.get("prop2"), "prop2FromJsonInstance");
      assert.equal(CONFIG.get("prop3"), "prop3FromYmlInstance");
    },
  },
}).export(module);
