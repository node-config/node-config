'use strict';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach, after } = require('node:test');
const assert = require('assert');

const NODE_CONFIG_DIR = __dirname + '/12-config'

describe('Tests for NODE_*_ENV load order', function() {
  describe('Library initialization', function () {
    let config;

    beforeEach(function () {
      // other test suites modify process.env, let's reset
      // the following batches with known values and
      // make sure we have a valid CONFIG object.
      delete process.env.NODE_ENV;
      delete process.env.NODE_CONFIG_ENV;

      process.env.NODE_CONFIG_DIR = NODE_CONFIG_DIR;

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('Library is available', function () {
      assert.strictEqual(typeof config, 'object');
    });
  });

  describe('Verify behavior of undefined NODE_CONFIG_ENV and undefined NODE_ENV', function () {
    let config;

    beforeEach(function () {
      delete process.env.NODE_ENV;
      delete process.env.NODE_CONFIG_ENV;

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('default \'development\' deployment should be used', function () {
      assert.equal(config.util.getEnv('NODE_ENV'), 'development');
      assert.equal(config.get('deploymentUsed'), 'default');
    });
  });

  describe('Verify behavior of undefined NODE_CONFIG_ENV with defined NODE_ENV', function () {
    let config;

    beforeEach(function () {
      process.env.NODE_ENV = 'apollo';

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('NODE_CONFIG_ENV by itself should be used', function () {
      assert.equal(config.util.getEnv('NODE_CONFIG_ENV'), 'apollo');
      assert.equal(config.get('deploymentUsed'), 'node-config-env-provided');
    });

    after(function () {
      delete process.env.NODE_ENV;
    });
  });

  describe('Verify behavior of a defined NODE_CONFIG_ENV and undefined NODE_ENV', function () {
    let config;

    beforeEach(function () {
      process.env.NODE_CONFIG_ENV = 'mercury';

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('NODE_ENV by itself should be used', function () {
      assert.equal(config.util.getEnv('NODE_CONFIG_ENV'), 'mercury');
      assert.equal(config.get('deploymentUsed'), 'node-env-provided');
    });

    after(function () {
      delete process.env.NODE_CONFIG_ENV;
      delete process.env.NODE_ENV;
    });
  });

  describe('Verify behavior of specified NODE_CONFIG_ENV overriding NODE_ENV', function () {
    let config;

    beforeEach(function () {
      process.env.NODE_CONFIG_ENV = 'apollo';
      process.env.NODE_ENV = 'mercury';

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('NODE_CONFIG_ENV value should be used', function () {
      assert.equal(config.get('deploymentUsed'), 'node-config-env-provided');
    });

    after(function () {
      delete process.env.NODE_CONFIG_ENV;
      delete process.env.NODE_ENV;
    });
  });

  after(function() {
    delete process.env.NODE_CONFIG_DIR;
    delete process.env.NODE_CONFIG_ENV;
    delete process.env.NODE_ENV;
  });
});
