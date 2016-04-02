

// Dependencies
var vows   = require('vows'),
    assert = require('assert'),
    Path   = require('path');

vows.describe('Tests for loading config by parent chain resolution').addBatch({
  'fetch config from direct parent chain': {
    topic: function () {
      // Remove configuration directory
      delete process.env.NODE_CONFIG_DIR;
      delete process.env.NODE_ENV;
      process.env.NODE_CONFIG = '{ "test": "Hello" }';
      delete process.env.NODE_APP_INSTANCE;

      removeCache('../lib/config');

      // Ask submodule to load config module
      return require('./8-config/level-1/level-2/level-3/mock')();
    },

    'Config is loaded by merging immediate parent and NODE_CONFIG environment variable': function (topic) {
      assert.equal(topic.get('betterProject'), 'A better project must enforce node-config');
      assert.equal(topic.get('test'), 'Hello');
      assert.equal(topic.has('project'), false);
    },

  },
  'prefer NODE_CONFIG_DIR over parent chain': {
    topic: function () {
      // Remove configuration directory
      process.env.NODE_CONFIG_DIR = __dirname + '/8-config/config';
      delete process.env.NODE_ENV;
      process.env.NODE_CONFIG = '{ "test": "Hello" }';
      delete process.env.NODE_APP_INSTANCE;

      removeCache('../lib/config');

      // Ask submodule to load config module
      return require('./8-config/level-1/level-2/level-3/mock')();
    },

    'Config is loaded by merging NODE_CONFIG_DIR config and NODE_CONFIG environment variable': function (topic) {
      assert.equal(topic.has('betterProject'), false);
      assert.equal(topic.get('test'), 'Hello');
      assert.equal(topic.get('project'), 'A project must use node-config');
    },

  }
})
.export(module);

//
// Because require'ing config creates and caches a global singleton,
// We have to invalidate the cache to build new object based on the environment variables above
function removeCache(module){
   delete require.cache[require.resolve(module)];
}
