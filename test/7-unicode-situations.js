'use strict';

const path = require('path');
const requireUncached = require('./_utils/requireUncached');
const { describe, it, before, beforeEach } = require('node:test');
const assert = require('assert');

// Change the configuration directory for testing
process.env.NODE_CONFIG_DIR = __dirname + '/7-config';

// Hard-code $NODE_ENV=test for testing
delete process.env.NODE_ENV;

// Test for multi-instance applications
delete process.env.NODE_APP_INSTANCE;

process.env.NODE_CONFIG_STRICT_MODE = false;

var CONFIG = requireUncached(__dirname + '/../lib/config');


describe('Tests for Unicode situations', function() {
  describe('Parsing of BOM related files', function() {
    it('A standard config file having no BOM should continue to parse without error', function () {
      var result = null,
          standardNoBomConfigFile = process.env.NODE_CONFIG_DIR + path.sep + 'defaultNoBOM.json';

      assert.doesNotThrow(function () {
          result = CONFIG.util.parseFile(standardNoBomConfigFile);
      }, 'standard config file with no BOM has a parse error');
    });

    it('A config file with a BOM should parse without error', function () {
      var result = null,
          configFileWithBom = process.env.NODE_CONFIG_DIR + path.sep + 'defaultWithUnicodeBOM.json';

      assert.doesNotThrow(function () {
          result = CONFIG.util.parseFile(configFileWithBom);
      }, 'config file with BOM has a parse error');
    });
  });
});
