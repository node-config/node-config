'use strict';

const path = require('path');
const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const config = require('../lib/config');
const initParam = config.util.initParam;

describe('Tests for config util functions', function() {
  describe('Tests for util.loadFileConfigs', function () {
    let util;

    beforeEach(function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + '/config';

      // Hard-code $NODE_CONFIG_ENV=test for testing
      delete process.env.NODE_APP_INSTANCE;
      process.env.NODE_CONFIG_ENV = 'test';

      util = requireUncached(__dirname + '/../lib/config').util;
    });

    it('can load data from a given directory', function () {
      let result = util.loadFileConfigs(path.join(__dirname, '5-config'));
      assert.strictEqual(result.number, 5);
    });

    it('ignores NODE_CONFIG when loading from directory', function () {
      let prev = process.env.NODE_CONFIG;
      process.env.NODE_CONFIG = '{"number":4}';
      let result = util.loadFileConfigs(path.join(__dirname, '5-config'));
      assert.strictEqual(result.number, 5);
      process.env.NODE_CONFIG = prev;
    });

    it('can handle recursion', function () {
      var result = util.loadFileConfigs(path.join(__dirname, '21-reentrant'));
      assert.ok(result.nested, "did not load nested values");
    });
  });
});
