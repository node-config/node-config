/*******************************************************************************
* config-test.js - Test for the node-config library
********************************************************************************
*/

// Dependencies
var configFn = require('../lib/config');
var vows = require('../deps').vows;
var assert = require('assert');

/*******************************************************************************
* ConfigTest
********************************************************************************
*/
exports.ConfigTest = vows.describe('Test suite for node-config').addBatch({
  'Library initialization': {
    'Config library is available': function() {
      assert.isFunction(configFn);
    },
    'Config utils are included with the library': function() {
      // Normal underscore + config extensions
      assert.isFunction(_);
      assert.isFunction(_.cloneDeep);
    },
    'Config methods exposed for testing': function() {
      assert.isFunction(configFn.getRuntimeName);
      assert.isFunction(configFn.pathFrom);
    }
  },

  'pathFrom() tests': {
    'Same directory yields .': function() {
      assert.equal(configFn.pathFrom('/usr/lib', '/usr/lib'), '.');
    },
    'Up one level yields ./..': function() {
   	  assert.equal(configFn.pathFrom('/usr/lib/test', '/usr/lib'), './..');
    },
    'Down one level yields ./dir': function() {
   	  assert.equal(configFn.pathFrom('/usr/lib', '/usr/lib/dir'), './dir');
    },
    'Over one level yields ./../dir': function() {
   	  assert.equal(configFn.pathFrom('/usr/lib', '/usr/dir'), './../dir');
    },
    'Up a couple and down a few yields ./../../one/deep/dir': function() {
   	  assert.equal(configFn.pathFrom('/usr/test/deep', '/one/deep/dir'), './../../../one/deep/dir');
    }
  },

  'getRuntimeName() tests': {
    topic: function() {
      return process.argv || [];
    },
    'Default runtime name is local': function(origArgs) {
      process.argv = ['hello', '--there'];
      assert.equal(configFn.getRuntimeName(), 'local');
    },
    'Correctly discovers alpha': function(origArgs) {
      configFn.runtimeName = null;
      process.argv = ['hello', '-config', 'alpha', '--there'];
      assert.equal(configFn.getRuntimeName(), 'alpha');
    },
    'Correctly discovers beta': function(origArgs) {
      configFn.runtimeName = null;
      process.argv = ['-config', 'beta', '--help'];
      assert.equal(configFn.getRuntimeName(), 'beta');
    },
    'Correctly discovers prod': function(origArgs) {
      configFn.runtimeName = null;
      process.argv = ['-config', 'prod'];
      assert.equal(configFn.getRuntimeName(), 'prod');
    },
    'Resetting command line args': function(origArgs) {
      process.argv = origArgs;
     assert.deepEqual(process.argv, origArgs);
    }
  },

  'configuration tests': {
    topic: function() {
      // Run the test as if it were the main module
      var prcParts = {argv:process.argv, 
        runtimeName:configFn.runtimeName,
        filename:process.mainModule.filename};
      process.mainModule.filename = module.filename;
      return prcParts;
    },
    'Local deployment configuration is correct': function(prcParts) {
      configFn.runtimeName = "local";
      var conf = configFn('test',{parm_1:1});
      var shouldBe = {
        parm_1:"Test app parameter 1",
	    parm_2:"Local deployment parm 2 override"}
      assert.deepEqual(conf, shouldBe);
    },
    'Production deployment configuration is correct': function(prcParts) {
      configFn.runtimeName = "prod";
      var conf = configFn('test',{parm_1:1,parm_3:43});
      var shouldBe = {
        parm_1:"Production parm 1 override",
        parm_2:"Production parm 2 override",
        parm_3:43};
      assert.deepEqual(conf, shouldBe);
    },
    'Alpha deployment with command line overrides is correct': function(prcParts) {
      configFn.runtimeName = "alpha";
      process.argv = ["deploy=alpha","test.parm_4=cmd_line_override"];
      var conf = configFn('test',{parm_1:1,parm_2:{sub1:"sub1_val", sub2:""}});
      module.shouldBe = {
	    parm_1:"Alpha parm 1 override",
	    parm_2:{sub1:"sub1_val", sub2:92},
	    parm_3:"Alpha parm 3 override",
	    parm_4:"cmd_line_override"};
      assert.deepEqual(conf, module.shouldBe);
    },
    'Configuration can be retrieved later': function(prcParts) {
      assert.deepEqual(configFn('test'), module.shouldBe);
    },
    'All configurations can be retrieved': function(prcParts) {
      assert.isObject(configFn());
    },
    'Resetting command line args': function(prcParts) {
      process.argv = prcParts.argv;
      configFn.runtimeName = prcParts.runtimeName;
      process.mainModule.filename = prcParts.filename;
      assert.isTrue(true);
    }
  }
  
}); 