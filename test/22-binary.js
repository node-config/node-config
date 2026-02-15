'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/config';
process.env.NODE_ENV = 'test';
process.env.NODE_APP_INSTANCE = '3';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');

const { Buffer } = require('buffer')

describe('Tests for binary', function() {
  describe('Binary tests', function() {
    let config;

    beforeEach(function() {
      config = requireUncached(__dirname + '/../lib/config');
    });

    it('A binary value should be immutable', function() {
      assert.throws(() => {
        const auth = config.get('auth');
        auth.secret = new Uint8Array([ 1, 2, 3 ]);
      }, /Can not update runtime configuration/)
    });

    it('A binary value should remain unmangled', () => {
      const expectedSecret = new Uint8Array([ 0, 1, 2, 3, 4, 5 ]);
      const actualSecret = config.get('auth.secret');

      const expectedBuffer = Buffer.from(expectedSecret);
      const actualBuffer = Buffer.from(actualSecret);

      assert.deepEqual(expectedBuffer, actualBuffer);
    });
  });
});
