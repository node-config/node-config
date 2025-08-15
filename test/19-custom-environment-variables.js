'use strict';

const Path = require('path');
const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');

describe('Testing custom environment variable overrides', function() {
  describe('with unset environment variables', function() {
    let config, configObject;

    beforeEach(function() {
      delete process.env.TEST_VALUE;
      delete process.env.TEST_JSON_VALUE;

      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = [__dirname + '/19-config'].join(Path.delimiter);

      config = requireUncached(__dirname + '/../lib/config');
      configObject = config.util.parseFile(Path.join(__dirname,'/19-config/default.js'))
    });

    it('should not override from the environment variables', function() {
      assert.strictEqual(config.testValue, configObject.testValue);
      assert.deepStrictEqual(config.testJSONValue, configObject.testJSONValue);
    });
  });

  describe('with empty string environment variables', function() {
    let config, configObject;

    beforeEach(function () {
      process.env.TEST_VALUE = '';
      process.env.TEST_JSON_VALUE = '';

      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = [__dirname + '/19-config'].join(Path.delimiter);

      config = requireUncached(__dirname + '/../lib/config');
      configObject = config.util.parseFile(Path.join(__dirname, '/19-config/default.js'))
    });

    it('should not override from the environment variables', function () {
      assert.strictEqual(config.testValue, configObject.testValue);
      assert.deepStrictEqual(config.testJSONValue, configObject.testJSONValue);
    });
  });

  describe('with string environment variables', function() {
    let config, testValue, jsonValue;

    beforeEach(function () {
      testValue = 'from env';
      jsonValue = {
          fromJS: false,
          type: 'stringified JSON'
      }
      process.env.TEST_VALUE = testValue;
      process.env.TEST_JSON_VALUE = JSON.stringify(jsonValue);

      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = [__dirname + '/19-config'].join(Path.delimiter);

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('should override from the environment variables', function() {
      assert.strictEqual(config.testValue, testValue);
      assert.deepStrictEqual(config.testJSONValue, jsonValue);
    });
  });

  describe('getCustomEnvVars()', function() {
    let testValue, jsonValue, config;

    beforeEach(function () {
      testValue = 'from env1';
      jsonValue = {
          fromJS: false,
          type: 'stringified JSON'
      }

      process.env.TEST_VALUE = testValue;
      process.env.TEST_JSON_VALUE = JSON.stringify(jsonValue);

      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + '/config';

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('should override from the environment variables', function() {
      let results = config.util.getCustomEnvVars(__dirname + '/19-config')
      assert.strictEqual(results.testValue, testValue);
      assert.deepStrictEqual(results.testJSONValue, jsonValue);
    });
  });
});
