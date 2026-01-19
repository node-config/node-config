import { describe, it, before } from 'node:test';
import assert from 'assert';
import { requireUncached } from './_utils/requireUncached.mjs';

describe('Tests for date', function() {
  let CONFIG;

  before(async function() {
    process.env.NODE_CONFIG_DIR = import.meta.dirname + '/config';
    process.env.NODE_ENV = 'test';

    CONFIG = await requireUncached('./lib/config.mjs');
  });

  describe('Date tests Tests', function() {
    it('A date should be immutable', function() {
      assert.throws(() => {
        const SomeMore = CONFIG.get('SomeMore');
        SomeMore.date1 = new Date()
      }, /Can not update runtime configuration/)
    });

    it('A date should be able to call Date methods', function() {
      assert.doesNotThrow(() => {
        /** @type {Date} */
        const date1 = CONFIG.get('SomeMore.date1');
        date1.toISOString();
      })
    });

    it('A date should be the correct value', function() {
      /** @type {Date} */
      const date1 = CONFIG.get('SomeMore.date1');
      assert.strictEqual(date1.toISOString(), '2024-12-18T04:54:56.118Z');
    });
  });
});
