'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/config';
process.env.NODE_ENV = 'test';
process.env.NODE_APP_INSTANCE = 'regexp';

var requireUncached = require('./_utils/requireUncached');

var CONFIG = requireUncached(__dirname + '/../lib/config');

var assert = require('assert');
var vows = require('vows');

vows.describe('Tests for regexp').addBatch({
  'Regexp tests Tests': {
    topic: function() {
      return CONFIG;
    },

    'A regexp should not be proxified': function() {
      const regExp = CONFIG.get('SomeMore.regexp1')
      assert(regExp instanceof RegExp && !require('util').types.isProxy(regExp))
    },

    'A regexp should not be replaced': function() {
      assert.deepEqual(CONFIG.SomeMore.regexp1, /This is a Regexp/g);
    },

    'A regexp should be replaced': function() {
      assert.deepEqual(CONFIG.SomeMore.regexp2, /This is the replaced/g);
    }
  }
})
.export(module);
