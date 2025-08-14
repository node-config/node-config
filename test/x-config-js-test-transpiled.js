'use strict';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, before } = require('node:test');
const assert = require('assert');

var CONFIG;

describe('Test suite for node-config transpiled JS files', function() {
  describe('Library initialization with transpiled JavaScript ES6 config files', function() {
    before(function () {
      // Clear after previous tests
      process.env.NODE_APP_INSTANCE = '';
      process.env.NODE_ENV = '';
      process.env.NODE_CONFIG = '';

      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + '/x-config-js-transpiled';

      // Disable after previous tests
      process.env.NODE_CONFIG_STRICT_MODE = false;

      CONFIG = requireUncached(__dirname + '/../lib/config');
    });

    it('Config library is available', function() {
      assert.strictEqual(typeof CONFIG, 'object');
    });
  });

  describe('Configuration file Tests', function() {
    it('Loading configurations from a transpiled JS file is correct', function() {
      assert.strictEqual(CONFIG.title, 'Hello config!');
    });
  });
});



