var requireUncached = require('./_utils/requireUncached');
var Parser = require('../parser');

'use strict';

var vows = require('vows'),
  assert = require('assert');

vows.describe('Tests for parsing TOML files')
  .addBatch({
    'Using the default parser - Array of Tables': {
      topic: function() {
        process.env.NODE_CONFIG_DIR = __dirname + '/17-config';
        return requireUncached(__dirname + '/../lib/config');
      },
      'validate array of tables is supported': function(CONFIG) {
        assert.deepStrictEqual(CONFIG.get('messages'), [
          {
            field1: '1',
            field2: '2'
          },
          {
            field1: 'a',
            field3: '3'
          }
        ]);
      },
    }
  })
  .export(module);
