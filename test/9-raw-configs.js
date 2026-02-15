'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/9-config';
process.env.NODE_ENV='test';
process.env.NODE_APP_INSTANCE='raw';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, before, beforeEach } = require('node:test');
const assert = require('assert');

const CONFIG = requireUncached(__dirname + '/../lib/config');

describe('Tests for raw config values', function() {
  describe('Configuration file Tests', function() {
    it('Objects wrapped with raw should be unmodified', function() {
      assert.strictEqual(CONFIG.get('circularReference'), process.stdout);
      assert.deepEqual(CONFIG.get('testObj'), { foo: 'bar' });
      assert.strictEqual(typeof CONFIG.get('yell'), 'function');
    });

    it('Inner configuration objects wrapped with raw should be unmodified', function() {
      assert.strictEqual(CONFIG.get('innerRaw').innerCircularReference, process.stdout);
      assert.strictEqual(CONFIG.get('innerRaw.innerCircularReference'), process.stdout);
    });

    it('Supports multiple levels of nesting', function() {
      assert.strictEqual(CONFIG.get('nestedRaw').nested.test, process.stdout);
      assert.strictEqual(CONFIG.get('nestedRaw.nested').test, process.stdout);
      assert.strictEqual(CONFIG.get('nestedRaw.nested.test'), process.stdout);
    });

// @lorenwest: I don't know how this ever worked
//  'Supports keeping promises raw by default': function(err, val) {
//    assert.strictEqual(val, 'this is a promise result');
//  }
  });
});
