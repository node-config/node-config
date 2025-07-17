/**
 * <p>Unit tests</p>
 *
 * @module test
 */

var requireUncached = require('./_utils/requireUncached');

var vows = require('vows');
var assert = require('assert');

// Make a copy of the command line args
var argvOrg = process.argv;

/**
 * <p>Tests for underlying node-config utilities.  To run type:</p>
 * <pre>npm test</pre>
 * <p>Or, in a project that uses node-config:</p>
 * <pre>npm test config</pre>
 *
 * @class ProtectedTest
 */

var CONFIG;
vows.describe('Protected (hackable) utilities test')
.addBatch({
  // We initialize the object in a batch so that the globals get changed at /run-time/ not /require-time/,
  // avoiding conflicts with other tests.
  // We initialize in our own /batch/ because batches are run in serial, while individual contexts run in parallel.
  'Library initialization': {
    topic : function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + '/config';

      // Hard-code $NODE_ENV=test for testing
      process.env.NODE_ENV='test';

      // Test for multi-instance applications
      process.env.NODE_APP_INSTANCE='3';

      // Test $NODE_CONFIG environment and --NODE_CONFIG command line parameter
      process.env.NODE_CONFIG='{"EnvOverride":{"parm3":"overridden from $NODE_CONFIG","parm4":100}}';
      process.argv.push('--NODE_CONFIG={"EnvOverride":{"parm5":"overridden from --NODE_CONFIG","parm6":101}}');

      // Test Environment Variable Substitution
      var override = 'CUSTOM VALUE FROM JSON ENV MAPPING';
      process.env['CUSTOM_JSON_ENVIRONMENT_VAR'] = override;

      // Dependencies
      CONFIG = requireUncached(__dirname + '/../lib/config');

      return CONFIG;

    },
    'Library is available': function(config) {
      assert.isObject(config);
    }
  }
})
.addBatch({

  'loadFileConfigs() tests': {
    topic: function() {
      return CONFIG.util.loadFileConfigs();
    },
    'The function exists': function() {
      assert.isFunction(CONFIG.util.loadFileConfigs);
    },
    'An object is returned': function(configs) {
      assert.isObject(configs);
    },
    'The correct object is returned': function(config) {
      assert.isObject(config.Customers);
      assert.isTrue(config.Customers.dbHost == 'base');
      assert.isTrue(config.Customers.dbName == 'from_default_xml');
    }
  },

  'attachProtoDeep() tests': {
    topic: function() {
      // Create an object that contains other objects to see
      // that the prototype is added to all objects.
      var watchThis = {
        subObject: {
          item1: 23,
          subSubObject: {
        	item2: "hello"
          }
        }
      };
      return CONFIG.util.attachProtoDeep(watchThis);
    },
    'The function exists': function() {
      assert.isFunction(CONFIG.util.attachProtoDeep);
    },
    'The original object is returned': function(config) {
      assert.isObject(config);
      assert.isTrue(config.subObject.item1 === 23);
      assert.isTrue(config.subObject.subSubObject.item2 === "hello");
    },
    'Prototype methods are not exposed in the object': function(config) {
      // This test is here because altering object.__proto__ places the method
      // directly onto the object. That caused problems when iterating over the
      // object.  This implementation does the same thing, but hides them.
      assert.isTrue(JSON.stringify(config) == '{"subObject":{"item1":23,"subSubObject":{"item2":"hello"}}}');
    }
  },

  'toObject() tests': {
    topic: function() {
      return CONFIG.util.loadFileConfigs();
    },
    'The function exists': function() {
      assert.isFunction(CONFIG.util.toObject);
    },
    'Returns a serialized version of the current instance if no argument is provided': function() {
      assert.notDeepStrictEqual(CONFIG.util.toObject(), CONFIG);
    },
    'Returns a POJO': function() {
      assert.ok(!(CONFIG.util.toObject() instanceof CONFIG.constructor));
    },
    'Returns a serialized version of whatever argument is provided': function() {
      assert.notDeepStrictEqual(CONFIG.get('Customers'), {
        dbHost: 'base',
        dbName: 'from_default_json',
        dbPort: 5999,
        dbString: 'from_default_json:5999',
        random: 0.08624527123827352,
        dbPassword: 'real password',
        dbPassword2: 'another password',
        lang: ['en','de','es'],
        altDbPort: 4400,
        altDbPort1: 2209,
        emptySub: null
      });
    }
  }
})
.export(module);
