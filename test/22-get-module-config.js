var requireUncached = require('./_utils/requireUncached');

// Dependencies
var vows = require('vows'),
    assert = require('assert'),
    FileSystem = require('fs');

/**
 * <p>Unit tests for the node-config library.  To run type:</p>
 * <pre>npm test</pre>
 * <p>Or, in a project that uses node-config:</p>
 * <pre>npm test config</pre>
 *
 * @class ConfigTest
 */

var config;
vows.describe('Set SubModule Defaults Multiple Times')
.addBatch({
  'Library initialization': {
    topic : function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + '/config';

      // Hard-code $NODE_ENV=test for testing
      process.env.NODE_ENV='test';

      config = requireUncached(__dirname + '/../lib/config');

      return config;
    },
    'Config library is available': function() {
      assert.isObject(config);
    }
  },
})
.addBatch({
  'Load the "http-1" submodule with different payloads': {
    topic : function () {
      return config.util.setModuleDefaults('http-1', {useAgent: 'lala 42'});
    },
    'Config settings "http-1" are set': function(http1) {
      assert.deepEqual(config.get('http-1'), http1);
      assert.deepEqual(http1, {
        useAgent: 'lala 42'
      });
    },
    'Setting submodule defaults for "http-1" again throws an error': function(moduleConfig) {
      assert.throws(function() {
        config.util.setModuleDefaults('http-1', {useAgent: 'lala 42', another: 'prop'});
      }, {
        name: 'Error',
        message: 'Submodule "http-1" has already been set'
      });
    }
  }
})
.addBatch({
  'Load the "http-2" submodule with different payloads': {
    topic : function () {      
      return config.util.setModuleDefaults('http-2', {obj: {}});
    },
    'Config settings "http-2" are set': function(moduleConfig) {
      assert.deepEqual(config.get('http-2'), moduleConfig);
      assert.deepEqual(moduleConfig, {
        obj: {}
      });
    },
    'Setting submodule defaults for "http-2" again throws an error': function(moduleConfig) {
      assert.throws(function() {
        config.util.setModuleDefaults('http-2', {obj: {prop: 'this default isn\'t set'}});
      }, {
        name: 'Error',
        message: 'Submodule "http-2" has already been set'
      });
    }
  }
})
.addBatch({
  'Load the "http-3" submodule with different payloads': {
    topic : function () {
      return config.util.setModuleDefaults('http-3', {useAgent: 'lala 42'});
    },
    'Config settings "http-3" are set': function(moduleConfig) {
      assert.deepEqual(config.get('http-3'), moduleConfig);
      assert.deepEqual(moduleConfig, {
        useAgent: 'lala 42'
      });
    },
    'Setting submodule defaults for "http-3" again throws an error': function(moduleConfig) {
      assert.throws(function() {
        config.util.setModuleDefaults('http-3', {useAgent: 'lala 45', another: 'prop'});
      }, {
        name: 'Error',
        message: 'Submodule "http-3" has already been set'
      });
    }
  }
})
.addBatch({
  'Load the "AnotherModule" submodule which has existing local configs': {
    topic : function () {
      return config.util.setModuleDefaults('AnotherModule', { parm2: 'value3' });
    },
    'Config settings "AnotherModule" are set': function(moduleConfig) {
      assert.deepEqual(config.get('AnotherModule'), moduleConfig);
      assert.deepEqual(moduleConfig, {
        parm2: 'value2', 
        parm1: 'value1', 
        parm6: 'value6', 
        parm8: 'value8', 
        parm7: 'value7', 
        parm3: 'value3', 
        parm2yml: 'value2yml', 
        parm4: 'value4', 
        parm5: 'value5', 
        parm9: 'value9',
      });
    },
    'Setting submodule defaults for "AnotherModule" again throws an error': function(moduleConfig) {
      assert.throws(function() {
        config.util.setModuleDefaults('AnotherModule', { parm10: 'value10' });
      }, {
        name: 'Error',
        message: 'Submodule "AnotherModule" has already been set'
      });
    },
    'Get module config overrides defaults': function() {
      var moduleConfig = config.util.getModuleConfig('AnotherModule', {
        parm2: 'value3',
        parm10: 'value10'
      });
      assert.deepEqual(moduleConfig, {
        parm2: 'value3', 
        parm1: 'value1', 
        parm6: 'value6', 
        parm8: 'value8', 
        parm7: 'value7', 
        parm3: 'value3', 
        parm2yml: 'value2yml', 
        parm4: 'value4', 
        parm5: 'value5', 
        parm9: 'value9',
        parm10: 'value10'
      });
      // Get module default value
      assert.equal(moduleConfig.get('AnotherModule.parm2'), 'value2');

      // Get module config instance values
      assert.equal(moduleConfig.get('parm2'), 'value3');
      assert.equal(moduleConfig.get('parm10'), 'value10');
    },
    'Get module config for unregisted module': function() {
      assert.throws(function() {
        config.util.getModuleConfig('UnregisteredModule', {
          parm2: 'value3',
          parm10: 'value10'
        });
      }, {
        name: "Error",
        message: 'Submodule "UnregisteredModule" defaults has not been set'
      });
    }
  }
})
.export(module);
