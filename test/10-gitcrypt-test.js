'use strict';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');

describe('Test git-crypt integration', function() {
  describe('initialization with CONFIG_SKIP_GITCRYPT', function() {
    let config;

    beforeEach(function () {
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

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('Config library is available', function() {
      assert.strictEqual(typeof config, 'object');
    });

    it('Loading configurations from a JSON file is correct', function() {
      assert.strictEqual(config.Customers.dbPassword, 'password will be overwritten.');
    });
  });

  describe('initialization with encrypted files without CONFIG_SKIP_GITCRYPT', function() {
    it('An exception is thrown if CONFIG_SKIP_GITCRYPT is not set', function() {
      // Hard-code $NODE_ENV=encrypted for testing
      process.env.NODE_ENV='encrypted';

      // Test Environment Variable Substitution
      process.env.CONFIG_SKIP_GITCRYPT = 0;
      delete process.env["CONFIG_SKIP_GITCRYPT"];

      assert.throws(
        function () {
          let config = requireUncached(__dirname + '/../lib/config');
        },
        /Cannot parse config file/
      );
    });
  });
});
