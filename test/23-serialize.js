import { describe, it, before } from 'node:test';
import assert from 'assert';
import { requireUncached } from './_utils/requireUncached.mjs';

describe('Tests for serialization', function() {
  let CONFIG;

  before(async() => {
    process.env.NODE_CONFIG_DIR = import.meta.dirname + '/23-serialize';

    CONFIG = await requireUncached('./lib/config.mjs');
  });

  describe('Binary tests', function() {
    it('should be serializable with complex values', () => {
      assert.doesNotThrow(() => {
        const val = CONFIG.get('level1')
        JSON.stringify(val)
      })
    });
  });
});
