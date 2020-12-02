var requireUncached = require('./_utils/requireUncached');

// Dependencies
var vows = require('vows'),
    assert = require('assert'),
        path = require('path');


var CONFIG;
vows.describe('Test git-crypt integration')
.addBatch({
  'initialization with CONFIG_SKIP_GITCRYPT': {
    topic : function () {

      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + '/10-config';

      // Test for multi-instance applications
      delete process.env.NODE_APP_INSTANCE;

      process.env.NODE_CONFIG_STRICT_MODE = false;

      // Hard-code $NODE_ENV=encrypted for testing
      process.env.NODE_ENV='encrypted';

      // Test Environment Variable Substitution
      process.env.CONFIG_SKIP_GITCRYPT = 1;
      delete process.env["NODE_CONFIG"]
      delete process.env["CUSTOM_JSON_ENVIRONMENT_VAR"];

      CONFIG = requireUncached(__dirname + '/../lib/config');

      return CONFIG;

    },
    'Config library is available': function() {
      assert.isObject(CONFIG);
    },
    'Loading configurations from a JSON file is correct': function() {
      assert.equal(CONFIG.Customers.dbPassword, 'password will be overwritten.');
    }
  },
})
.addBatch({
  'initialization with encrypted files without CONFIG_SKIP_GITCRYPT': {
    'An exception is thrown if CONFIG_SKIP_GITCRYPT is not set': function() {
      // Hard-code $NODE_ENV=encrypted for testing
      process.env.NODE_ENV='encrypted';

      // Test Environment Variable Substitution
      process.env.CONFIG_SKIP_GITCRYPT = 0;
      delete process.env["CONFIG_SKIP_GITCRYPT"];

      assert.throws(
        function () { 
          CONFIG = requireUncached(__dirname + '/../lib/config');
        },
        /Cannot parse config file/
      );
    }
  }
})
.export(module);