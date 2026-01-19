import { describe, it, beforeEach } from 'node:test';
import assert from 'assert';
import { requireUncached } from './_utils/requireUncached.mjs';

describe('Tests for regexp', function() {
  let config;

  beforeEach(async function() {
    process.env.NODE_CONFIG_DIR = import.meta.dirname + '/config';
    process.env.NODE_ENV = 'test';
    process.env.NODE_APP_INSTANCE = 'regexp';

    config = await requireUncached('./lib/config.mjs');
  });

  describe('Regexp tests Tests', function() {
    it('A regexp should be immutable', function() {
      assert.throws(() => {
        const SomeMore = config.get('SomeMore');
        SomeMore.regexp1 = /new value/
      }, /Can not update runtime configuration/)
    });

    it('A regexp should be able to call RegExp methods', function() {
      assert.doesNotThrow(() => {
        /** @type {RegExp} */
        const regExp = config.get('SomeMore.regexp1');
        regExp.exec();
      })
    });

    it('A regexp should be able to access own props', function() {
      assert.doesNotThrow(() => {
        /** @type {RegExp} */
        const regExp = config.get('SomeMore.regexp1')
        assert.ok(regExp.source)
      })
    });

    it('A regexp should be the correct source', function() {
      assert.strictEqual(config.SomeMore.regexp1.source, /This is a Regexp/g.source);
    });

    it('A regexp should be the replaced app instance value', function() {
      assert.strictEqual(config.SomeMore.regexp2.source, /This is the replaced/g.source);
    });
  });
});
