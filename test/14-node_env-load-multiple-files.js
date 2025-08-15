'use strict';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');

describe('Tests for load multiple config files that match NODE_ENV values', function() {
  describe('When there is \'cloud\' and \'development\' values in NODE_ENV', function() {
    let config;

    beforeEach(function() {
      process.env.NODE_ENV = 'development,cloud'
      process.env.NODE_CONFIG_DIR = __dirname + '/14-config'

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('Values of the corresponding files are loaded', function() {
      assert.strictEqual(config.get('db.name'), 'development-config-env-provided');
      assert.strictEqual(config.get('db.port'), 3000);
    });

    it('Values of the corresponding local files are loaded', function() {
      assert.strictEqual(config.get('app.context'), 'local cloud');
      assert.strictEqual(config.get('app.message'), 'local development');
    });
  });

  describe('When there is \'cloud\' and \'bare-metal\' values in NODE_ENV and HOST is \'test\'', function() {
    let config;

    beforeEach(function() {
      process.env.NODE_ENV = 'development,bare-metal'
      process.env.NODE_CONFIG_DIR = __dirname + '/14-config'
      process.env.HOST = 'test'

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('Values of the corresponding files with host prefix are loaded', function()  {
      assert.strictEqual(config.get('host.os'), 'linux');
      assert.strictEqual(config.get('host.arch'), 'x86_64');
    });
  });

  describe('When there are conflicting values in the files', function() {
    let config;

    beforeEach(function() {
      process.env.NODE_ENV = 'cloud,bare-metal'
      process.env.NODE_CONFIG_DIR = __dirname + '/14-config'
      config = requireUncached(__dirname + '/../lib/config');
    });

    it('Priority of file values is merged by order that was defined in NODE_ENV', function(){
      assert.strictEqual(config.get('db.name'), 'bare-metal-config-env-provided');
    });
  });
});
