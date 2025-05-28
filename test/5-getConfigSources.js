var requireUncached = require('./_utils/requireUncached');

// Dependencies
var vows   = require('vows'),
    assert = require('assert'),
    Path   = require('path');

vows.describe('Tests config.util.getConfigSources').addBatch({
  'tests with NODE_CONFIG env set, and --NODE_CONFIG command line flag': {
    topic: function () {
     // Change the configuration directory for testing
     process.env.NODE_CONFIG_DIR = [__dirname + '/5-config', __dirname + '/5-extra-config'].join(Path.delimiter);

      delete process.env.NODE_ENV;
      process.env.NODE_CONFIG = '{}';
      delete process.env.NODE_APP_INSTANCE;
      process.env.NODE_CONFIG_STRICT_MODE=0;
      process.argv = ["node","path/to/some.js","--NODE_CONFIG='{}'"]; //TODO: This is a parse error so not testing the right thing
      var config = requireUncached(__dirname + '/../lib/config');
      return config.util.getConfigSources();
    },

    'Two files plus NODE_CONFIG in env and as command line args should result in four entries': function(topic) {
        assert.equal(topic.length,6);
    },

    "The environment variable and command line args are the last two overrides": function (topic) {
      assert.equal(topic[2].name,'$NODE_CONFIG');
      assert.equal(topic[3].name,"--NODE_CONFIG argument");
    },

  },

  'tests without NODE_ENV set': {
    topic: function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + '/5-config';

      delete process.env.NODE_ENV;
      delete process.env.NODE_CONFIG;
      delete process.env.NODE_APP_INSTANCE;
      process.env.NODE_CONFIG_STRICT_MODE=0;
      process.argv = [];
      var config = requireUncached(__dirname + '/../lib/config');
      return config.util.getConfigSources();
    },

    'Three files should result in three entries': function(topic) {
        assert.equal(topic.length,3);
    },

    "The keys for each object are 'name', 'original', and 'parsed'": function(topic) {
        assert.deepEqual(Object.keys(topic[0]).sort(), ['name','original','parsed']);
    },


 },

  'tests with NODE_ENV set': {
    topic: function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + '/5-config';

      process.env.NODE_ENV='test';
      delete process.env.NODE_CONFIG;
      delete process.env.NODE_APP_INSTANCE;
      process.argv = [];
      var config = requireUncached(__dirname + '/../lib/config');
      return config.util.getConfigSources();
    },

    'Three files should result in three entries': function(topic) {
        assert.equal(topic.length,3);
    },

    "The keys for each object are 'name', 'original', and 'parsed'": function(topic) {
        assert.deepEqual(Object.keys(topic[0]).sort(), ['name','original','parsed']);
    },
 },


 'Files which return empty objects still end up in getConfigSources()': {
    topic: function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + '/5-config';

      process.env.NODE_ENV='empty';
      delete process.env.NODE_CONFIG;
      delete process.env.NODE_APP_INSTANCE;
      process.argv = [];
      var config = requireUncached(__dirname + '/../lib/config');
      return config.util.getConfigSources();
    },

    'Three files should result in 3 entries': function(topic) {
        assert.equal(topic.length,4);
    },

    'Second file is named empty': function (topic) {
      assert.equal(Path.basename(topic[1].name), 'empty.json');
    },

 }
})
.export(module);
