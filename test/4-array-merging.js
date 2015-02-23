
// Test declaring deferred values.
// The key config files involved here are:
//      test/config/default-array-merge.js
//      test/config/local-array-merge.js


// Change the configuration directory for testing
process.env.NODE_CONFIG_DIR = __dirname + '/config';

// Hardcode $NODE_ENV=test for testing
process.env.NODE_ENV='test';

// Test for multi-instance applications
process.env.NODE_APP_INSTANCE='array-merge';

// Because require'ing config creates and caches a global singleton,
// We have to invalidate the cache to build new object based on the environment variables above
var CONFIG = requireUncached('../lib/config');

// Dependencies
var vows = require('vows'),
    assert = require('assert');

vows.describe('Tests for merging arrays').addBatch({
  'Array merging tests Tests': {
    topic: function() {
      return CONFIG;
    },

    'An empty array replaced by a full array should be replaced': function() {
        assert.deepEqual(CONFIG.arrayMerging.emptyArray, ['not empty anymore']);
    },

    'An array with one value should be replaced wholeshole': function() {
        assert.deepEqual(CONFIG.arrayMerging.oneItem, ['replaced']);
    },

    "An array replaced by an empty array should be replaced wholesale" : function () {
        assert.deepEqual(CONFIG.arrayMerging.removeMe, []);
    }

  }
})
.export(module);


function requireUncached(module){
   delete require.cache[require.resolve(module)];
   return require(module);
}
