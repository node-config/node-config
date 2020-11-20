var requireUncached = require('./_utils/requireUncached');

// Dependencies
var vows = require('vows'),
    assert = require('assert'),
    FileSystem = require('fs');

/**
 * <p>Unit tests for the node-config library.  To run type:</p>
 * <pre>npm test</pre>
 * <p>Or, in a project that uses node-config:</p>
 * <pre>npm test config</pre>
 *
 * @class ConfigTest
 */

var CONFIG, override;
vows.describe('Test suite for node-config TypeScript support with default export')
.addBatch({
  'Library initialization with TypeScript config files': {
    topic : function () {

      // Clear after previous tests
      process.env.NODE_APP_INSTANCE = '';
      process.env.NODE_ENV = '';
      process.env.NODE_CONFIG = '';

      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + '/x-config-ts';

      // Disable after previous tests
      process.env.NODE_CONFIG_STRICT_MODE = false;

      CONFIG = requireUncached(__dirname + '/../lib/config');

      return CONFIG;

    },
    'Config library is available': function() {
      assert.isObject(CONFIG);
    }
  },
})
.addBatch({
  'Configuration file Tests': {
    'Loading configurations from a TypeScript file is correct': function() {
      assert.equal(CONFIG.siteTitle, 'New Instance!');
    }
  },
})
.addBatch({
    'Start in the environment with existing .ts extension handler': {
      'Library reuses existing .ts file handler': function() {
        var existingHandler = require.extensions['.ts'];
        assert.ok(existingHandler, 'Existing handler is defined by the environment');
        CONFIG = requireUncached(__dirname + '/../lib/config');
        assert.strictEqual(require.extensions['.ts'], existingHandler, 'Should not overwrite existing handler');
      }
    },
  })
.export(module);



