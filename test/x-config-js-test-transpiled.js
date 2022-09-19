var requireUncached = require('./_utils/requireUncached');

var vows = require('vows'),
    assert = require('assert')

var CONFIG;
vows.describe('Test suite for node-config transpiled JS files')
.addBatch({
  'Library initialization with transpiled JavaScript ES6 config files': {
    topic : function () {

      // Clear after previous tests
      process.env.NODE_APP_INSTANCE = '';
      process.env.NODE_ENV = '';
      process.env.NODE_CONFIG = '';

      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + '/x-config-js-transpiled';

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
    'Loading configurations from a transpiled JS file is correct': function() {
      assert.equal(CONFIG.title, 'Hello config!');
    }
  },
})
.export(module);



