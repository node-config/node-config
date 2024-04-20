var requireUncached = require('./_utils/requireUncached');
require('../parser');

'use strict';

var vows = require('vows'),
  assert = require('assert');

vows.describe('Tests for parsing binary data')
  .addBatch({
    'Using the YAML parser - Uint8Array': {
      topic: function() {
        process.env.NODE_CONFIG_DIR = __dirname + '/22-binary';
        return requireUncached(__dirname + '/../lib/config');
      },
      'reading !!binary returns a real Uint8Array': function(CONFIG) {
        assert.deepStrictEqual(CONFIG.get('auth'), {
					secret: new Uint8Array([0x10, 0x11, 0x12, 0x13, 0x14, 0x15])
				});
      },
    }
  })
  .export(module);
