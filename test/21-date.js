'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/config';
process.env.NODE_ENV = 'test';
process.env.NODE_APP_INSTANCE = 'date';

var requireUncached = require('./_utils/requireUncached');

var CONFIG = requireUncached(__dirname + '/../lib/config');

var assert = require('assert');
var vows = require('vows');

vows.describe('Tests for date').addBatch({
  'Date tests Tests': {
    topic: function() {
      return CONFIG;
    },

    'A date should not be proxified': function() {
      const date1 = CONFIG.get('SomeMore.date1')
      assert(date1 instanceof Date && !require('util').types.isProxy(date1))
    },
  }
})
.export(module);
