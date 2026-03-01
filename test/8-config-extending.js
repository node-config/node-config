import path from 'path';
import FileSystem from 'node:fs';
import { describe, it, before } from 'node:test';
import assert from 'assert';
import { requireUncached } from './_utils/requireUncached.mjs';
import { Util } from '../lib/util.js';

describe('Tests for config extending', function() {
  let CONFIG;

  before(async() => {
    // Change the configuration directory for testing
    process.env.NODE_CONFIG_DIR = import.meta.dirname + '/8-config';

    // Hard-code $NODE_ENV=test for testing
    delete process.env.NODE_ENV;

    // Test for multi-instance applications
    delete process.env.NODE_APP_INSTANCE;

    delete process.env.NODE_CONFIG_STRICT_MODE;

    CONFIG = await requireUncached('./lib/config.mjs');
  });

  describe('Extending a base configuration with another configuration', function() {
    it('Extending a configuration with another configuration should work without error', function () {
      process.env.NODE_CONFIG_DIR = import.meta.dirname + '/8-config';
      let filename = path.join(process.env.NODE_CONFIG_DIR,'base-config.json');
      let base_config = JSON.parse(FileSystem.readFileSync(filename, 'utf-8'));
      CONFIG.util.attachProtoDeep(base_config);

      assert.doesNotThrow(function () {
          let result = Util.extendDeep(base_config, CONFIG);
      }, 'Extending a configuration with another configuration has an error');
    });
  });
});
