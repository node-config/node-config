// Hardcode $NODE_ENV=test for testing
process.env.NODE_ENV='test';

// Dependencies
var vows = require('vows');
    assert = require('assert'),
    CONFIG = require('../lib/config'),
    FileSystem = require('fs'),
    originalWatchedValue = CONFIG.watchThisValue,
    newWatchedValue = Math.floor(Math.random() * 100000);

// These tests require the directory to be the root of the node-config project
process.chdir(__dirname + '/..');
var CONFIG_PATH = process.cwd() + '/config/',
    runtimeJsonFilename = CONFIG_PATH + 'runtime.json';

/**
 * <p>Unit tests for the node-config library.  To run type:</p>
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

    'Loading configurations from a YAML file is correct': function() {
      assert.equal(CONFIG.AnotherModule.parm2, 'value2');
    },

    'Loading prior runtime.json configurations is correct': function() {
      assert.equal(CONFIG.Customers.dbName, 'override_from_runtime_json');
    }
    
  },

  'Assuring a configuration can be made immutable': {
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
        parm1: 1000, parm2: 2000
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

  'Change Notification Tests': {
    topic: function() {
    	
      // Attach this topic as a watcher
      var cb = this.callback;
      CONFIG.watch(CONFIG, null, function(obj, prop, oldValue, newValue){
    	  cb(null, {obj:obj, prop:prop, oldValue:oldValue, newValue:newValue});
      });
      
      // Write the new watched value out to the runtime.json file
      CONFIG.watchThisValue = newWatchedValue;
    },

    'The watch() method is available': function() {
      assert.isFunction(CONFIG.watch);
    },

    'The change handler callback was fired': function(err, obj) {
      assert.isTrue(true);
    },

    'And it was called on the correct object': function(err, obj) {
      assert.isTrue(obj.obj === CONFIG);
    },

    'And it was called with the correct parameter': function(err, obj) {
      assert.equal(obj.prop, 'watchThisValue');
    },
    
    'And it has the correct prior value': function(err, obj) {
      assert.equal(obj.oldValue, originalWatchedValue);
    },
    
    'And it has the correct new value': function(err, obj) {
      assert.equal(obj.newValue, newWatchedValue);
    },

    'And the config value was correctly set': function(err, obj) {
      assert.equal(CONFIG.watchThisValue, newWatchedValue);
    },

    'waiting for O/S change notification...': function(err, obj) {
      // This is just a message for the next test
      assert.isTrue(true);
    }

  },

  'Runtime Configuration Changes are Persisted to runtime.json': {
    topic: function() {
      // Watch the file for changes
      var t = this;
      FileSystem.watchFile(runtimeJsonFilename, function(){
        t.callback(null, CONFIG._parseFile(runtimeJsonFilename));
      });
    },
    'The O/S notified us of the configuration file change': function(err, runtimeObj) {
      assert.isTrue(!err);
    },
    'Prior configuration values were kept intact': function(err, runtimeObj) {
      assert.equal(runtimeObj.Customers.dbName, "override_from_runtime_json");
    },
    'Changed configuration values were persisted': function(err, runtimeObj) {
      assert.equal(runtimeObj.watchThisValue, CONFIG.watchThisValue);
    }
  }

});
