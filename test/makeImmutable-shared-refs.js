/**
 * <p>Unit tests for makeImmutable shared reference cases</p>
 *
 * @module test
 */

const vows = require('vows');
const assert = require('assert');
const util = require('../lib/config.js').util;

vows.describe('Tests for makeImmutable shared reference handling')
  .addBatch({
    'makeImmutable with arrays containing shared objects': {
      topic: function() {
        // Create a object that will get get shared.
        const sharedNetworkObject = { 
          _id: "12345",
          name: "Test Network",
          capabilities: {
            primaryNetwork: true,
          }
        };
        
        // Pattern where same object appears in multiple arrays within the configuration
        return {
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
      },

      'Should not throw error with shared objects in arrays': function(topic) {
        assert.doesNotThrow(function() {
          util.makeImmutable(topic);
        }, /Cannot redefine property/);
      },

      'Shared objects in arrays should be immutable': function(topic) {
        const firstTask = topic.scheduledTasks[0];
        assert.throws(function() {
          firstTask.options.networks[0].capabilities.primaryNetwork = false;
        }, /Can not update runtime configuration property/);
      }
    },

    'makeImmutable idempotency': {
      topic: function() {
        return { 
          config: { name: "test" },
          capabilities: { setting: true } 
        };
      },

      'Should not throw error when called twice on same object': function(topic) {
        // First call
        util.makeImmutable(topic);
        
        // Second call should not throw "Cannot redefine property"
        assert.doesNotThrow(function() {
          util.makeImmutable(topic);
        }, /Cannot redefine property/);
      }
    }
  })
  .export(module);

