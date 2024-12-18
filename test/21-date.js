'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/config';
process.env.NODE_ENV = 'test';

var requireUncached = require('./_utils/requireUncached');

var CONFIG = requireUncached(__dirname + '/../lib/config');

var assert = require('assert');
var vows = require('vows');

vows.describe('Tests for date').addBatch({
  'Date tests Tests': {
    topic: function() {
      return CONFIG;
    },

    'A date should be immutable': function(config) {
      assert.throws(() => {
        const SomeMore = config.get('SomeMore');
        SomeMore.date1 = new Date()
      }, /Can not update runtime configuration/)
    },

    'A date should be able to call Date methods': function(config) {
      assert.doesNotThrow(() => {
        /** @type {Date} */
        const date1 = config.get('SomeMore.date1');
        date1.toISOString();
      })
    },

    'A date should be the correct value': function(config) {
      /** @type {Date} */
      const date1 = config.get('SomeMore.date1');
      assert.equal(date1.toISOString(), '2024-12-18T04:54:56.118Z');
    },
  }
})
.export(module);
