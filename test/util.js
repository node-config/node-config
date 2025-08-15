'use strict';

const path = require('path');
const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const config = require('../lib/config');
const initParam = config.util.initParam;

describe('Tests for config util functions', function() {
  describe('Tests for util.initParam', function () {
    it('When no command line or env var is set, default value is returned.', function () {
      assert.strictEqual(initParam('EMPTY', 'mydefault'), 'mydefault');
    });

    it('When process.env is set and cmdline is not, process.env is used', function () {
      process.env.ENV_ONLY = 'in-the-env';
      assert.strictEqual(initParam('ENV_ONLY', 'mydefault'), 'in-the-env');
    });

    it('When process.env is set and cmdline *is* set, cmd-line is used', function () {
      process.env.BOTH = 'in-the-env';
      process.argv = ['ignore', 'ignore', '--BOTH=in-the-argv'];
      assert.strictEqual(initParam('BOTH', 'mydefault'), 'in-the-argv');
    });

    it('After calling initParam, value is reflected in getEnv() even if it did not come from process.env', function () {
      process.argv = ['ignore', 'ignore', '--FROMARG=in-the-argv'];
      assert.strictEqual(initParam('FROMARG', 'mydefault'), 'in-the-argv');
      assert.strictEqual(config.util.getEnv('FROMARG'), 'in-the-argv');
    });

    it('Setting a zero value in the process.env works (process.env inherently casts values to strings)', function () {
      process.env.ENV_ONLY = '0';
      assert.strictEqual(initParam('ENV_ONLY', 'mydefault'), '0');
    });

    it('Setting a zero value on the command line works.', function () {
      process.argv = ['ignore', 'ignore', '--FROMARG=0'];
      assert.strictEqual(initParam('FROMARG', 'mydefault'), '0');
    });
  });

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

  describe('Tests for util.isPromise', function () {
    it('can identify a new Promise', function () {
      assert.strictEqual(config.util.isPromise(new Promise(() => {
      })), true);
    });

    it('can identify a resolved Promise', function () {
      assert.strictEqual(config.util.isPromise(Promise.resolve()), true);
    });

    it('can identify a rejected Promise', function () {
      // Use .catch to avoid `UnhandledPromiseRejectionWarning`, DO NOT REMOVE
      assert.strictEqual(config.util.isPromise(Promise.reject().catch(function () {
      })), true);
    });

    it('can identify other things different as no promises', function () {
      let testCases = [
        new Function(),
        function () {
        },
        true,
        false,
        new Boolean(),
        class {
        },
        '',
        new String(),
        [],
        {},
        Object.create(null),
        new Map(),
        null,
        undefined,
        NaN,
        Infinity,
        0,
        1.1
        -1,
      ];

      testCases.forEach(function (testCase) {
        assert.strictEqual(config.util.isPromise(testCase), false);
      });
    });
  });
});
