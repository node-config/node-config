// Change the configuration directory for testing
process.env.NODE_CONFIG_DIR = __dirname + '/config';

// Hardcode $NODE_ENV=test for testing
process.env.NODE_ENV='test';

// Test for multi-instance applications
process.env.NODE_APP_INSTANCE='3';

// Test for old style environment variable overrides
process.env.CONFIG_EnvOverride_parm__number__1 = 'overridden from test';
process.env.CONFIG_EnvOverride_parm2 = 13;

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

var runtimeJsonFilename = __dirname + '/config/runtime.json';
var runtimeJsonFilenameBak = runtimeJsonFilename+'.bak';

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
    },

    'Loading prior runtime.json configurations is correct': function() {
      assert.equal(CONFIG.Customers.dbName, 'override_from_runtime_json');
    },

    'Multi-instance default.json override is correct': function() {
      assert.equal(CONFIG.Customers.altDbPort, 4400);
    },

    'Multi-instance local.yaml override is correct': function() {
      assert.equal(CONFIG.Customers.altDbPort1, 2209);
    }

  },

  'Old-Style Configurations from environment variables (deprecated)': {
    topic: function() {
      return CONFIG;
    },

    'Configuration can come from environment variables': function() {
      assert.equal(CONFIG.EnvOverride.parm2, 13);
    },

    'Double__underscores escape to single_underscores': function() {

      JSON.stringify(CONFIG, null, 2);
      assert.equal(CONFIG.EnvOverride.parm_number_1, 'overridden from test');
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

  'Internal Change Notification Tests': {
    topic: function() {

      // Attach this topic as a watcher
      var cb = this.callback;
      CONFIG.watch(CONFIG, null, function(obj, prop, oldValue, newValue){
        // Don't process the submodule test - that's for later
        if (prop == 'parm3') return;
        if (prop == 'dynamicArray') return;
        if (prop == 'staticArray') {
          cb('Watch callback should not have been called for staticArray');
          return false;
        }

        cb(null, {obj:obj, prop:prop, oldValue:oldValue, newValue:newValue});
      });

      // Write the new watched value out to the runtime.json file
      CONFIG.watchThisValue = newWatchedValue;

      // Test that submodule configurations are persisted
      CONFIG.TestModule.parm3 = 1234;

      // Write the new array value out to the runtime.json file
      CONFIG.dynamicArray = newDynamicArray;

      // Test that changing an array d
      CONFIG.staticArray = [2,1,3];
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

    'Waiting for the O/S to notify us of changes...': function(err, obj) {
      // This is just a message for the next test
      assert.isTrue(true);
    }

  },

  'Runtime Configuration Changes are Persisted to runtime.json': {
    topic: function() {
      // Watch the file for changes
      var t = this;
      FileSystem.unwatchFile(runtimeJsonFilename);
      FileSystem.watchFile(runtimeJsonFilename, {persistent:true}, function(){
        // This was failing on node v0.6 due to the watch happening before full write,
        // so adding a small interval so it doesn't fail on older node.js versions
        setTimeout(function(){
	        t.callback(null, CONFIG._parseFile(runtimeJsonFilename));
	      },10);

        FileSystem.createReadStream(runtimeJsonFilename).pipe(FileSystem.createWriteStream(runtimeJsonFilenameBak));
      });
    },
    'The runtime.json file was changed': function(err, runtimeObj) {
      assert.isTrue(!err);
    },
    'Prior configuration values were kept intact': function(err, runtimeObj) {
      assert.equal(runtimeObj.Customers.dbName, "override_from_runtime_json");
    },
    'Changed configuration values were persisted': function(err, runtimeObj) {
      assert.equal(runtimeObj.watchThisValue, CONFIG.watchThisValue);
      assert.deepEqual(runtimeObj.dynamicArray, CONFIG.dynamicArray);
    },
    'Unchanged configuration values were not persisted': function(err, runtimeObj) {
      assert.isUndefined(runtimeObj.staticArray);
    },
    'Module default values are persisted': function(err, runtimeObj) {
      assert.equal(runtimeObj.TestModule.parm3, 1234);
    },
    'The resetRuntime() method is available': function() {
      assert.isFunction(CONFIG.resetRuntime);
    },
    'Runtime Configuration is empty': function() {
      CONFIG.resetRuntime(function(err, written, buffer) {
        FileSystem.readFile(runtimeJsonFilename, function(err, data) {
            assert.isEqual(data,'{}');
        });
      });
    },
    teardown: function() {
      FileSystem.rename(runtimeJsonFilenameBak, runtimeJsonFilename, function(err) {
        if(err) {
          console.log('Cant rename file');
        }
      });
    }
  },

  'Assuring you can get originalConfig': {
    topic: function() {
      return CONFIG.getOriginalConfig();
    },
    'The getOriginalConfig() method is available': function() {
      assert.isFunction(CONFIG.getOriginalConfig);
    }
  }

});
