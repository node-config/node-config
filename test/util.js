import path from 'node:path';
import { describe, it, beforeEach } from 'node:test';
import assert from 'assert';
import { requireUncached } from './_utils/requireUncached.mjs';

describe('Tests for config util functions', function() {
  describe('Tests for util.getEnv()', function() {
    let util;

    beforeEach(async function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = import.meta.dirname + '/config';

      // Hard-code $NODE_CONFIG_ENV=test for testing
      delete process.env.NODE_APP_INSTANCE;
      process.env.NODE_CONFIG_ENV = 'test';

      let config = await requireUncached('./lib/config.mjs');
      util = config.util;
    });

    it('values used in initialization are reflected in getEnv()', function () {
      assert.strictEqual(util.getEnv('NODE_CONFIG_ENV'), 'test');
    });
  });

  describe('Tests for util.loadFileConfigs', function () {
    let util;

    beforeEach(async function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = import.meta.dirname + '/config';

      // Hard-code $NODE_CONFIG_ENV=test for testing
      delete process.env.NODE_APP_INSTANCE;
      process.env.NODE_CONFIG_ENV = 'test';

      let config = await requireUncached('./lib/config.mjs');
      util = config.util;
    });

    it('can load data from a given directory', function () {
      let result = util.loadFileConfigs(path.join(import.meta.dirname, '5-config'));
      assert.strictEqual(result.number, 5);
    });

    it('ignores NODE_CONFIG when loading from directory', function () {
      let prev = process.env.NODE_CONFIG;
      process.env.NODE_CONFIG = '{"number":4}';
      let result = util.loadFileConfigs(path.join(import.meta.dirname, '5-config'));
      assert.strictEqual(result.number, 5);
      process.env.NODE_CONFIG = prev;
    });
  });
});
