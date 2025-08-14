'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/23-serialize';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const CONFIG = requireUncached(__dirname + '/../lib/config');

describe('Tests for serialization', function() {
  describe('Binary tests', function() {
    it('should be serializable with complex values', () => {
      assert.doesNotThrow(() => {
        const val = CONFIG.get('level1')
        JSON.stringify(val)
      })
    });
  });
});
