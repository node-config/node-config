'use strict';

const path = require('path');
const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const { Util } = require(__dirname + '/../lib/util');

// Change the configuration directory for testing
process.env.NODE_CONFIG_DIR = __dirname + '/8-config';

// Hard-code $NODE_ENV=test for testing
delete process.env.NODE_ENV;

// Test for multi-instance applications
delete process.env.NODE_APP_INSTANCE;

process.env.NODE_CONFIG_STRICT_MODE = false;

var CONFIG = requireUncached(__dirname + '/../lib/config');

describe('Tests for config extending', function() {
  describe('Extending a base configuration with another configuration', function() {
    it('Extending a configuration with another configuration should work without error', function () {
      process.env.NODE_CONFIG_DIR = __dirname + '/8-config';
      var base_config = require(process.env.NODE_CONFIG_DIR + path.sep + 'base-config.json');
      CONFIG.util.attachProtoDeep(base_config);

      assert.doesNotThrow(function () {
          let result = Util.extendDeep(base_config, CONFIG);
      }, 'Extending a configuration with another configuration has an error');
    });
  });
});
