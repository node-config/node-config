'use strict';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, before, beforeEach } = require('node:test');
const assert = require('assert');

process.env.NODE_CONFIG_DIR = __dirname + '/config';
process.env.NODE_ENV = 'test';
process.env.NODE_APP_INSTANCE = 'regexp';

var CONFIG = requireUncached(__dirname + '/../lib/config');

describe('Tests for regexp', function() {
  describe('Regexp tests Tests', function() {
    let config = CONFIG;

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
