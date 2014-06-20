// Change the configuration directory for testing
process.env.NODE_CONFIG_DIR = __dirname + '/config';

// Hardcode $NODE_ENV=test for testing
process.env.NODE_ENV='test';

// Test for multi-instance applications
process.env.NODE_APP_INSTANCE='3';

// Test $NODE_CONFIG environment and --NODE_CONFIG command line parameter
process.env.NODE_CONFIG='{"EnvOverride":{"parm3":"overridden from $NODE_CONFIG","parm4":100}}'
process.argv.push('--NODE_CONFIG={"EnvOverride":{"parm5":"overridden from --NODE_CONFIG","parm6":101}}');

// Dependencies
var vows = require('vows');
    assert = require('assert'),
    CONFIG = require('../lib/config'),
    FileSystem = require('fs'),
    originalWatchedValue = CONFIG.watchThisValue,
    newWatchedValue = Math.floor(Math.random() * 100000),
    originalDynamicArray = CONFIG.dynamicArray,
    newDynamicArray = [Math.floor(Math.random() * 100000), Math.floor(Math.random() * 100000)];

/**
 * <p>Unit tests for the node-config library.  To run type:</p>
 * <pre>npm test</pre>
 * <p>Or, in a project that uses node-config:</p>
 * <pre>npm test config</pre>
 *
 * @class ConfigTest
 */
exports.ConfigTest = vows.describe('Test suite for node-config').addBatch({
  'Library initialization': {
    'Config library is available': function() {
      assert.isObject(CONFIG);
    },
    'Config extensions are included with the library': function() {
      assert.isFunction(CONFIG._cloneDeep);
    }
  },

  'Configuration file Tests': {
    topic: function() {
      return CONFIG;
    },

    'Loading configurations from a JS module is correct': function() {
      assert.equal(CONFIG.Customers.dbHost, 'base');
      assert.equal(CONFIG.TestModule.parm1, 'value1');
    },

    'Loading configurations from a JSON file is correct': function() {
      assert.equal(CONFIG.AnotherModule.parm1, 'value1');
    },

    'Loading configurations from a .yaml YAML file is correct': function() {
      assert.equal(CONFIG.AnotherModule.parm2, 'value2');
    },

    'Loading configurations from a .yml YAML file is correct': function() {
      assert.equal(CONFIG.AnotherModule.parm2yml, 'value2yml');
    },

    'Loading configurations from a Coffee-Script file is correct': function() {
      assert.equal(CONFIG.AnotherModule.parm3, 'value3');
    },

    'Loading configurations from an environment file is correct': function() {
      assert.equal(CONFIG.Customers.dbPort, '5999');
    },

    'Loading configurations from the local file is correct': function() {
      assert.equal(CONFIG.Customers.dbPassword, 'real password');
    },

    'Loading configurations from the local environment file is correct': function() {
      assert.equal(CONFIG.Customers.dbPassword2, 'another password');
      assert.deepEqual(CONFIG.Customers.lang, ['en','de','es']);
    }

  },

  'Configurations from the $NODE_CONFIG environment variable': {
    topic: function() {
      return CONFIG;
    },

    'Configuration can come from the $NODE_CONFIG environment': function() {
      assert.equal(CONFIG.EnvOverride.parm3, 'overridden from $NODE_CONFIG');
    },

    'Type correct configurations from $NODE_CONFIG': function() {
      assert.equal(CONFIG.EnvOverride.parm4, 100);
    }

  },

  'Configurations from the --NODE_CONFIG command line': {
    topic: function() {
      return CONFIG;
    },

    'Configuration can come from the --NODE_CONFIG command line argument': function() {
      assert.equal(CONFIG.EnvOverride.parm5, 'overridden from --NODE_CONFIG');
    },

    'Type correct configurations from --NODE_CONFIG': function() {
      assert.equal(CONFIG.EnvOverride.parm6, 101);
    }

  },

 'Assuring a configuration property can be hidden': {
    topic: function() {
      var object = {
        item1: 23,
        subObject: {
      	  item2: "hello"
        }
      };
      return object;
    },

    'The makeHidden() method is available': function() {
      assert.isFunction(CONFIG.makeHidden);
    },

    'The test object (before hiding) is correct': function(object) {
      assert.isTrue(JSON.stringify(object) == '{"item1":23,"subObject":{"item2":"hello"}}');
    },

    'The test object (after hiding) is correct': function(object) {
      CONFIG.makeHidden(object, 'item1');
      assert.isTrue(JSON.stringify(object) == '{"subObject":{"item2":"hello"}}');
    },

    'The hidden property is readable, and has not changed': function(object) {
      assert.isTrue(JSON.stringify(object) == '{"subObject":{"item2":"hello"}}');
      assert.isTrue(object.item1 == 23);
    }

  },

  'Assuring a configuration property can be made immutable': {
    topic: function() {

      CONFIG.makeImmutable(CONFIG.TestModule, 'parm1');
      CONFIG.TestModule.parm1 = "setToThis";
      return CONFIG.TestModule.parm1;
    },

    'The makeImmutable() method is available': function() {
      assert.isFunction(CONFIG.makeImmutable);
    },

    'Correctly unable to change an immutable configuration': function(value) {
      assert.isTrue(value != "setToThis");
    },

    'Left the original value intact after attempting the change': function(value) {
      assert.equal(value, "value1");
    }
  },

  'Configuration for module developers': {
    topic: function() {

      // Set some parameters for the test module
      return CONFIG.setModuleDefaults("TestModule", {
        parm1: 1000, parm2: 2000, parm3: 3000
      });
    },

    'The setModuleDefaults() method is available': function() {
      assert.isFunction(CONFIG.setModuleDefaults);
    },

    'The module config is in the CONFIG object': function(moduleConfig) {
      assert.isTrue(typeof(CONFIG.TestModule) != "undefined");
      assert.deepEqual(CONFIG.TestModule, moduleConfig);
    },

    'Local configurations are mixed in': function(moduleConfig) {
      assert.equal(moduleConfig.parm1, "value1");
    },

    'Defaults remain intact unless overridden': function(moduleConfig) {
      assert.equal(moduleConfig.parm2, 2000);
    }
  },

  'get() tests': {
    topic: function() {
      return CONFIG;
    },
    'The function exists': function(config) {
      assert.isFunction(config.get);
    },
    'A top level item is returned': function(config) {
      assert.isTrue(typeof config.get('TestModule') === 'object');
    },
    'A sub level item is returned': function(config) {
      assert.equal(config.get('Customers.dbHost'), 'base');
    },
    'get is attached deeply': function(config) {
      assert.equal(config.Customers.get('dbHost'), 'base');
    },
    'A proper exception is thrown on mis-spellings': function(config) {
      var didThrow = false;
      try {
        var topItem = config.get('mis.spelled');
        didThrow = false;
      } catch(e) {
        didThrow = true;
      }
      assert.isTrue(didThrow);
    },
    'An exception is thrown on non-objects': function(config) {
      var didThrow = false;
      try {
        var topItem = config.get('Testmodule.misspelled');
        didThrow = false;
      } catch(e) {
        didThrow = true;
      }
      assert.isTrue(didThrow);
    }
  },

  'has() tests': {
    topic: function() {
      return CONFIG;
    },
    'The function exists': function(config) {
      assert.isFunction(config.has);
    },
    'A top level item can be tested': function(config) {
      assert.isTrue(config.has('TestModule'));
    },
    'A sub level item can be tested': function(config) {
      assert.isTrue(config.has('Customers.dbHost'));
    },
    'has is attached deeply': function(config) {
      assert.isTrue(config.Customers.has('dbHost'));
    },
    'Correctly identifies not having element': function(config) {
      assert.isTrue(!config.Customers.has('dbHosx'));
    },
    'Correctly identifies not having element (deep)': function(config) {
      assert.isTrue(!config.has('Customers.dbHosx'));
    }
  }

});
