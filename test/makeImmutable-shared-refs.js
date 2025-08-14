'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const util = require('../lib/config.js').util;

/**
 * <p>Unit tests for makeImmutable shared reference cases</p>
 *
 * @module test
 */

describe('Tests for makeImmutable shared reference handling', function() {
  describe('makeImmutable with arrays containing shared objects', function() {
    let data;

    beforeEach(function () {
      // Create a object that will get get shared.
      const sharedNetworkObject = {
        _id: "12345",
        name: "Test Network",
        capabilities: {
          primaryNetwork: true,
        }
      };

      // Pattern where same object appears in multiple arrays within the configuration
      data = {
        // This simulates scheduled tasks with shared network references
        scheduledTasks: [
          {
            name: 'task1',
            options: {
              networks: [sharedNetworkObject]  // First reference
            }
          },
          {
            name: 'task2',
            options: {
              networks: [sharedNetworkObject]  // Same object, second reference!
            }
          }
        ]
      };
    });

    it('Should not throw error with shared objects in arrays', function () {
      assert.doesNotThrow(function () {
        util.makeImmutable(data);
      }, /Cannot redefine property/);
    });

    it('Shared objects in arrays should be immutable', function () {
      util.makeImmutable(data);

      const firstTask = data.scheduledTasks[0];
      assert.throws(function () {
        firstTask.options.networks[0].capabilities.primaryNetwork = false;
      }, /Can not update runtime configuration property/);
    });
  });

  describe('makeImmutable idempotency', function() {
    let data;

    beforeEach(function() {
      data = {
        config: { name: "test" },
        capabilities: { setting: true }
      };
    });

    it('Should not throw error when called twice on same object', function() {
      // First call
      util.makeImmutable(data);

      // Second call should not throw "Cannot redefine property"
      assert.doesNotThrow(function() {
        util.makeImmutable(data);
      }, /Cannot redefine property/);
    });
  });
});

