'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/config';
process.env.NODE_ENV = 'test';
process.env.NODE_APP_INSTANCE = '3';

var requireUncached = require('./_utils/requireUncached');

var CONFIG = requireUncached(__dirname + '/../lib/config');
var { Buffer } = require('buffer')
var assert = require('assert');
var vows = require('vows');

vows.describe('Tests for binary').addBatch({
  'Binary tests': {
    topic: function() {
      return CONFIG;
    },

    'A binary value should be immutable': function(config) {
      assert.throws(() => {
        const auth = config.get('auth');
        auth.secret = new Uint8Array([ 1, 2, 3 ]);
      }, /Can not update runtime configuration/)
    },

    'A binary value should remain unmangled': (config) => {
      const expectedSecret = new Uint8Array([ 0, 1, 2, 3, 4, 5 ]);
      const actualSecret = config.get('auth.secret');

      const expectedBuffer = Buffer.from(expectedSecret);
      const actualBuffer = Buffer.from(actualSecret);

      assert.deepEqual(expectedBuffer, actualBuffer);
    }
  }
})
.export(module);
