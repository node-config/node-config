import { describe, it, before } from 'node:test';
import assert from 'assert';
import { Util } from '../lib/util.mjs';
import { requireUncached } from './_utils/requireUncached.mjs';

// Test resolving async values on the exported config object.
//
// Regression test: the exported config is a copy of the internally loaded config,
// so async deferred values must be resolved onto the exported object itself.
// Resolving them only on the internal object leaves promises behind in config.get().
describe('Tests for async values on the exported config', function() {
  let CONFIG;

  before(async () => {
    // Change the configuration directory for testing
    process.env.NODE_CONFIG_DIR = import.meta.dirname + '/31-config';

    // Hard-code $NODE_ENV=test for testing
    process.env.NODE_ENV = 'test';

    process.env.NODE_APP_INSTANCE = '';

    CONFIG = await requireUncached('./lib/config.mjs');

    await Util.resolveAsyncConfigs(CONFIG);
  });

  describe('Util.resolveAsyncConfigs() on the exported config', function() {
    it('config.get() returns the resolved value of an async defer, not a promise', function() {
      assert.strictEqual(CONFIG.get('fromAsyncDefer'), 'async defer value');
    });

    it('config.get() returns the resolved value of a plain promise', function() {
      assert.strictEqual(CONFIG.get('fromPromise'), 'plain promise value');
    });

    it('async defer functions can compose other async values', function() {
      assert.strictEqual(CONFIG.get('composed'), 'async defer value and static');
    });

    it('resolves async values in nested objects', function() {
      assert.strictEqual(CONFIG.get('nested.fromAsyncDefer'), 'nested value');
    });

    it('resolves async values in arrays', function() {
      assert.deepStrictEqual([...CONFIG.get('list')], ['first', 'second']);
    });

    it('leaves unrelated values untouched', function() {
      assert.strictEqual(CONFIG.get('staticValue'), 'static');
    });
  });
});
