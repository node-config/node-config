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
vows.describe('Dynamically module import test')
.addBatch({
  'Library initialization': {
    topic : function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + '/22-dynamic-modules';

      // Hard-code $NODE_ENV=test for testing
      process.env.NODE_ENV='development';

      config = requireUncached(__dirname + '/../lib/config');

      return config;

    },
    'Config library is available': function() {
      assert.isObject(config);
    },
    'Config settings for Stooge is available': function() {
      assert.deepEqual(config.Stooge, {
        smart: true
      });
    },
    'Make configs immutable': function() {
      assert.deepEqual(config.util.cloneDeep(config.get('Stooge')), {
        smart: true
      });
    }
  },
})
.addBatch({
  'Load Stooge Library Dynamically': {
    topic : function () {
      // Dynamically load the Stooge module
      return require(__dirname + '/22-dynamic-modules/Stooge.js')
    },
    'Config override settings for Stooge match': function(Stooge) {
      assert.deepEqual(config.Stooge, {
        smart: true
      });
    },
    'Config module defaults for Stooge are overridden': function(Stooge) {
      assert.deepEqual(config.util.cloneDeep(config.get('Stooge')), {
        bald: false,
        happy: true,
        smart: true,
        canPlayViolin: false
      });
    },
    'Create Moe with overrides and verify his settings': function(Stooge) {
      var moe = new Stooge({
        happy: false
      });
      assert.deepEqual(config.util.cloneDeep(moe.moduleConfig), {
        bald: false,
        happy: false,
        smart: true,
        canPlayViolin: false
      });
      assert.equal(moe.isBald(), false);
      assert.equal(moe.isHappy(), false);
      assert.equal(moe.isSmart(), true);
      assert.throws(function () {
        moe.playViolin();
      }, {
        name: "Error",
        message: "I'm a victim of soikemstance!"
      });
    },
    'Create Larry with overrides and verify his settings': function(Stooge) {
      var larry = new Stooge({
        happy: true,
        smart: false,
        canPlayViolin: true
      });
      assert.deepEqual(config.util.cloneDeep(larry.moduleConfig), {
        bald: false,
        happy: true,
        smart: false,
        canPlayViolin: true
      });
      assert.equal(larry.isBald(), false);
      assert.equal(larry.isHappy(), true);
      assert.equal(larry.isSmart(), false);
      assert.equal(larry.playViolin(), true);
    },
    'Create Curly with overrides and verify his settings': function(Stooge) {
      var curly = new Stooge({
        bald: true,
        happy: true,
        smart: false
      });
      assert.deepEqual(config.util.cloneDeep(curly.moduleConfig), {
        bald: true,
        happy: true,
        smart: false,
        canPlayViolin: false
      });
      assert.equal(curly.isBald(), true);
      assert.equal(curly.isHappy(), true);
      assert.equal(curly.isSmart(), false);
      assert.throws(function () {
        curly.playViolin();
      }, {
        name: "Error",
        message: "I'm a victim of soikemstance!"
      });
    },
    'Config module defaults for Stooge haven\'t changed with each module instantiation': function(Stooge) {
      assert.deepEqual(config.util.cloneDeep(config.get('Stooge')), {
        bald: false,
        happy: true,
        smart: true,
        canPlayViolin: false
      });
    },
  }
})
.addBatch({
  'Load TestModule Library Dynamically': {
    topic : function () {
      // Dynamically load the TestModule module
      return require(__dirname + '/22-dynamic-modules/TestModule.js')
    },
    'Config override settings for TestModule match': function(TestModule) {
      assert.isUndefined(config.TestModule);
    },
    'Config module defaults for TestModule are overridden': function(TestModule) {
      assert.deepEqual(config.util.cloneDeep(config.get('TestModule')), {
        test: true,
        example: true
      });
    },
    'Create Moe with overrides and verify his settings': function(TestModule) {
      var testModule = new TestModule({
        happy: false
      });
      assert.deepEqual(config.util.cloneDeep(testModule.moduleConfig), {
        happy: false,
        test: true,
        example: true
      });
    }
  }
})
.export(module);
