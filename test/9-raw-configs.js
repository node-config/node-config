var requireUncached = require('./_utils/requireUncached');

'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/9-config';
process.env.NODE_ENV='test';
process.env.NODE_APP_INSTANCE='raw';

var CONFIG = requireUncached(__dirname + '/../lib/config');

// Dependencies
var vows = require('vows'),
    assert = require('assert');

vows.describe('Tests for raw config values').addBatch({
  'Configuration file Tests': {
    topic: function() {
      try { CONFIG.get('aPromise').then(val => this.callback(null, val)); }
      catch(err) { this.callback(); }
    },
    'Objects wrapped with raw should be unmodified': function() {
      assert.equal(CONFIG.get('circularReference'), process.stdout);
      assert.deepEqual(CONFIG.get('testObj'), { foo: 'bar' });
      assert.isFunction(CONFIG.get('yell'));
    },
    'Inner configuration objects wrapped with raw should be unmodified': function() {
      assert.equal(CONFIG.get('innerRaw').innerCircularReference, process.stdout);
      assert.equal(CONFIG.get('innerRaw.innerCircularReference'), process.stdout);
    },
    'Supports multiple levels of nesting': function() {
      assert.equal(CONFIG.get('nestedRaw').nested.test, process.stdout);
      assert.equal(CONFIG.get('nestedRaw.nested').test, process.stdout);
      assert.equal(CONFIG.get('nestedRaw.nested.test'), process.stdout);
    },
    'Supports keeping promises raw by default': function(err, val) {
      assert.equal(val, 'this is a promise result');
    }
  }
})
.export(module);
