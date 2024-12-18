'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/config';
process.env.NODE_ENV = 'test';
process.env.NODE_APP_INSTANCE = 'regexp';

var requireUncached = require('./_utils/requireUncached');

var CONFIG = requireUncached(__dirname + '/../lib/config');

var assert = require('assert');
var vows = require('vows');

vows.describe('Tests for regexp').addBatch({
  'Regexp tests Tests': {
    topic: function() {
      return CONFIG;
    },

    'A regexp should be immutable': function(config) {
      assert.throws(() => {
        const SomeMore = config.get('SomeMore');
        SomeMore.regexp1 = /new value/
      }, /Can not update runtime configuration/)
    },

    'A regexp should be able to call RegExp methods': function(config) {
      assert.doesNotThrow(() => {
        /** @type {RegExp} */
        const regExp = config.get('SomeMore.regexp1');
        regExp.exec();
      })
    },

    'A regexp should be able to access own props': function(config) {
      assert.doesNotThrow(() => {
        /** @type {RegExp} */
        const regExp = config.get('SomeMore.regexp1')
        assert.ok(regExp.source)
      })
    },

    'A regexp should be the correct source': function(config) {
      assert.equal(config.SomeMore.regexp1.source, /This is a Regexp/g.source);
    },

    'A regexp should be the replaced app instance value': function(config) {
      assert.equal(config.SomeMore.regexp2.source, /This is the replaced/g.source);
    }
  }
})
.export(module);
