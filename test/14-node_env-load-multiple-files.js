var requireUncached = require('./_utils/requireUncached');

'use strict';

var vows = require('vows'),
    assert = require('assert');

vows.describe('Tests for load multiple config files that match NODE_ENV values')
.addBatch({
    'When there is \'cloud\' and \'development\' values in NODE_ENV': {
      topic: function() {
        process.env.NODE_ENV = 'development,cloud'
        process.env.NODE_CONFIG_DIR = __dirname + '/14-config'

        return requireUncached(__dirname + '/../lib/config');
      },
      'Values ​​of the corresponding files are loaded': function(CONFIG) {
        assert.equal(CONFIG.get('db.name'), 'development-config-env-provided');
        assert.equal(CONFIG.get('db.port'), 3000);
      },
      'Values ​​of the corresponding local files are loaded': function(CONFIG) {
        assert.equal(CONFIG.get('app.context'), 'local cloud');
        assert.equal(CONFIG.get('app.message'), 'local development');
      },
    }
})
.addBatch({
  'When there is \'cloud\' and \'bare-metal\' values in NODE_ENV and HOST is \'test\'': {
    topic: function() {
      process.env.NODE_ENV = 'development,bare-metal'
      process.env.NODE_CONFIG_DIR = __dirname + '/14-config'
      process.env.HOST = 'test'

      return requireUncached(__dirname + '/../lib/config');
    },
    'Values ​​of the corresponding files with host prefix are loaded': function(CONFIG) {
      assert.equal(CONFIG.get('host.os'), 'linux');
      assert.equal(CONFIG.get('host.arch'), 'x86_64');
    }
  }
})
.addBatch({
  'When there are conflicting values ​​in the files': {
    topic: function() {
      process.env.NODE_ENV = 'cloud,bare-metal'
      process.env.NODE_CONFIG_DIR = __dirname + '/14-config'
      return requireUncached(__dirname + '/../lib/config');
    },
    'Priority of file values is merged by order that was defined in NODE_ENV': function(CONFIG){
      assert.equal(CONFIG.get('db.name'), 'bare-metal-config-env-provided');
    }
  }
})
.export(module);
