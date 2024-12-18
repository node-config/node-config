'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/23-serialize';

var requireUncached = require('./_utils/requireUncached');

var CONFIG = requireUncached(__dirname + '/../lib/config');
var assert = require('assert');
var vows = require('vows');

vows.describe('Tests for serialization').addBatch({
  'Binary tests': {
    topic: function() {
      return CONFIG;
    },

    'should be serializable with complex values': (config) => {
      assert.doesNotThrow(() => {
        const val = config.get('level1')
        JSON.stringify(val)
      })
    }
  }
})
.export(module);
