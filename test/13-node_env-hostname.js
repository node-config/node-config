var requireUncached = require('./_utils/requireUncached');

'use strict';

var NODE_CONFIG_DIR = __dirname + '/12-config'

// Dependencies
var vows = require('vows'),
    assert = require('assert');

vows.describe('Tests for HOSTNAME and HOST environment variables')
.addBatch({
    'When there is no HOSTNAME neither HOST env': {
      topic: function() {
        // Test HOST and HOSTNAME
        delete process.env.HOST;
        delete process.env.HOSTNAME;

        return requireUncached(__dirname + '/../lib/config');
      },
      'OS.hostname() is the winner': function(CONFIG) {
        assert.equal(typeof CONFIG.util.getEnv('HOSTNAME'), 'string');
      }
    }
})
.addBatch({
  'When HOSTNAME env is set': {
    topic: function() {
      // Test HOST and HOSTNAME
      delete process.env.HOST;
      process.env.HOSTNAME = 'some.machine';

      return requireUncached(__dirname + '/../lib/config');
    },
    'HOSTNAME env variable is the winner': function(CONFIG) {
      assert.equal(CONFIG.util.getEnv('HOSTNAME'), 'some.machine');
    }
  }
})
.addBatch({
  'When HOST env is set': {
    topic: function() {
      // Test HOST and HOSTNAME
      delete process.env.HOSTNAME;
      process.env.HOST = 'other.machine';

      return requireUncached(__dirname + '/../lib/config');
    },
    'HOST env variable is the winner': function(CONFIG) {
      assert.equal(CONFIG.util.getEnv('HOSTNAME'), 'other.machine');
    }
  }
})
.export(module);
