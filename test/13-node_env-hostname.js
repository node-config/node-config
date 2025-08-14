'use strict';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, before, beforeEach } = require('node:test');
const assert = require('assert');

describe('Tests for HOSTNAME and HOST environment variables', function() {
  describe('When there is no HOSTNAME neither HOST env', function() {
    let config;

    before(function() {
      // Test HOST and HOSTNAME
      delete process.env.HOST;
      delete process.env.HOSTNAME;

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('OS.hostname() is the winner', function() {
      assert.strictEqual(typeof config.util.getEnv('HOSTNAME'), 'string');
    });
  });

  describe('When HOSTNAME env is set', function() {
    let config;

    beforeEach(function() {
      // Test HOST and HOSTNAME
      delete process.env.HOST;
      process.env.HOSTNAME = 'some.machine';

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('HOSTNAME env variable is the winner', function() {
      assert.strictEqual(config.util.getEnv('HOSTNAME'), 'some.machine');
    });
  });

  describe('When HOST env is set', function() {
    let config;

    beforeEach(function() {
      // Test HOST and HOSTNAME
      delete process.env.HOSTNAME;
      process.env.HOST = 'other.machine';

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('HOST env variable is the winner', function() {
      assert.strictEqual(config.util.getEnv('HOSTNAME'), 'other.machine');
    });
  });
});
