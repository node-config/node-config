'use strict';

const path = require('path');
const requireUncached = require('./_utils/requireUncached');
const { describe, it, before, beforeEach } = require('node:test');
const assert = require('assert');
const { Load } = require(__dirname + '/../lib/util');

process.env.NODE_CONFIG_STRICT_MODE = false;

const LOAD = new Load({});

describe('Tests for Unicode situations', function() {
  describe('Parsing of BOM related files', function() {
    it('A standard config file having no BOM should continue to parse without error', function () {
      let result = null;
      let standardNoBomConfigFile = process.env.NODE_CONFIG_DIR + path.sep + 'defaultNoBOM.json';

      assert.doesNotThrow(function () {
        result = LOAD.loadFile(standardNoBomConfigFile);
      }, 'standard config file with no BOM has a parse error');
    });

    it('A config file with a BOM should parse without error', function () {
      let result = null;
      let configFileWithBom = process.env.NODE_CONFIG_DIR + path.sep + 'defaultWithUnicodeBOM.json';

      assert.doesNotThrow(function () {
        result = LOAD.loadFile(configFileWithBom);
      }, 'config file with BOM has a parse error');
    });
  });
});
