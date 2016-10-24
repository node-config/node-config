'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/9-config';
process.env.NODE_ENV='test';
process.env.NODE_APP_INSTANCE='raw';

var CONFIG = requireUncached('../lib/config');

// Dependencies
var vows = require('vows'),
    assert = require('assert');

vows.describe('Tests for raw config values').addBatch({
  'Configuration file Tests': {
    'Objects wrapped with raw should be unmodified': function() {
        assert.equal(CONFIG.get('circularReference'), process.stdout);
        assert.deepEqual(CONFIG.get('testObj'), { foo: 'bar' })
        assert.isFunction(CONFIG.get('yell'));
    }
  }
})
.export(module);


function requireUncached(module){
   delete require.cache[require.resolve(module)];
   return require(module);
}
