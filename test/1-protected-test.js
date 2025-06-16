'use strict';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');

/**
 * <p>Unit tests</p>
 *
 * @module test
 */

// Make a copy of the command line args
const argvOrg = process.argv.slice();

/**
 * <p>Tests for underlying node-config utilities.  To run type:</p>
 * <pre>npm test</pre>
 * <p>Or, in a project that uses node-config:</p>
 * <pre>npm test config</pre>
 *
 * @class ProtectedTest
 */

describe('Protected (hackable) utilities test', function() {
  // We initialize the object in a batch so that the globals get changed at /run-time/ not /require-time/,
  // avoiding conflicts with other tests.
  // We initialize in our own /batch/ because batches are run in serial, while individual contexts run in parallel.

  let config;

  beforeEach(function () {
    // Change the configuration directory for testing
    process.env.NODE_CONFIG_DIR = __dirname + '/config';

    // Hard-code $NODE_ENV=test for testing
    process.env.NODE_ENV = 'test';

    // Test for multi-instance applications
    process.env.NODE_APP_INSTANCE = '3';

    // Test $NODE_CONFIG environment and --NODE_CONFIG command line parameter
    process.env.NODE_CONFIG = '{"EnvOverride":{"parm3":"overridden from $NODE_CONFIG","parm4":100}}';
    process.argv.push('--NODE_CONFIG={"EnvOverride":{"parm5":"overridden from --NODE_CONFIG","parm6":101}}');

    // Test Environment Variable Substitution
    process.env['CUSTOM_JSON_ENVIRONMENT_VAR'] = 'CUSTOM VALUE FROM JSON ENV MAPPING';

    config = requireUncached(__dirname + '/../lib/config');
  });

  describe('Library initialization', function () {
    it('Library is available', function () {
      assert.strictEqual(typeof config, 'object');
    });
  });

  describe('diffDeep() tests', function() {
    it('The function exists', function() {
      assert.strictEqual(typeof config.util.diffDeep, 'function');
    });

    it('Returns an empty object if no differences', function() {
      let a = {value_3: 14, hello:'world', value_1: 29};
      let b = {value_1: 29, hello:'world', value_3: 14};

      assert.strictEqual(typeof config.util.diffDeep(a,b), 'object');
      assert.strictEqual(Object.keys(config.util.diffDeep(a, b)).length, 0);
    });

    it('Returns an empty object if no differences (deep)', function() {
      let a = { value_3: 14, hello:'world', value_1: 29, value_4: [1,'hello',2], deepObj: { a: 22, b: { c: 45, a: 44 } } };
      let b = { value_1: 29, hello:'world', value_3: 14, value_4: [1,'hello',2], deepObj: { a: 22, b: { a: 44, c: 45 } } };

      assert.strictEqual(typeof(config.util.diffDeep(a,b)), 'object');
      assert.strictEqual(Object.keys(config.util.diffDeep(a, b)).length, 0);
    });

    it('Returns just the diff values', function() {
      let a = { value_3: 14, hello:'wurld', value_1: 29, deepObj: { a: 22, b: { c: 45, a: 44 } } };
      let b = { value_1: 29, hello:'world', value_3: 14, deepObj: { a: 22, b: { a: 44, c: 45 } } };
      let diff = config.util.diffDeep(a,b);

      assert.strictEqual(Object.keys(diff).length, 1);
      assert.strictEqual(diff.hello, 'world');
    });

    it('Returns just the diff values (deep)', function() {
      let a = { value_3: 14, hello: 'wurld', value_1: 29, value_4: [1,'hello',2], deepObj: { a:22, b: { c: 45, a: 44} } };
      let b = { value_1: 29, hello: 'wurld', value_3: 14, value_4: [1,'goodbye',2], deepObj: { a:22, b: { a: 45, c: 44} } };
      let diff = config.util.diffDeep(a,b);

      assert.strictEqual(Object.keys(diff).length, 2);
      assert.strictEqual(Object.keys(diff.deepObj).length, 1);
      assert.strictEqual(Object.keys(diff.deepObj.b).length, 2);
      assert.strictEqual(diff.deepObj.b.a, 45);
      assert.strictEqual(diff.deepObj.b.c, 44);
      assert.deepEqual(diff.value_4, [1, 'goodbye', 2]);
    })
  });

  describe('loadFileConfigs() tests', function() {
    let configs;

    beforeEach(function () {
      configs = config.util.loadFileConfigs();
    });

    it('The function exists', function() {
      assert.strictEqual(typeof config.util.loadFileConfigs, 'function');
    });

    it('An object is returned', function() {
      assert.strictEqual(typeof configs, 'object');
    });

    it('The correct object is returned', function() {
      assert.strictEqual(typeof config.Customers, 'object');
      assert.strictEqual(config.Customers.dbHost, 'base');
      assert.strictEqual(config.Customers.dbName, 'from_default_xml');
    });
  });

  describe('attachProtoDeep() tests', function() {
    let content;

    beforeEach(function () {
      // Create an object that contains other objects to see
      // that the prototype is added to all objects.
      let watchThis = {
        subObject: {
          item1: 23,
          subSubObject: {
        	item2: "hello"
          }
        }
      };

      content = config.util.attachProtoDeep(watchThis);
    });

    it('The function exists', function() {
      assert.strictEqual(typeof config.util.attachProtoDeep, 'function');
    });

    it('The original object is returned', function() {
      assert.strictEqual(typeof content, 'object');

      assert.strictEqual(content.subObject.item1, 23);
      assert.strictEqual(content.subObject.subSubObject.item2, "hello");
    });

    it('Prototype methods are not exposed in the object', function() {
      // This test is here because altering object.__proto__ places the method
      // directly onto the object. That caused problems when iterating over the
      // object.  This implementation does the same thing, but hides them.
      assert.strictEqual(JSON.stringify(content), '{"subObject":{"item1":23,"subSubObject":{"item2":"hello"}}}');
    });
  });

  describe('toObject() tests', function() {
    it('The function exists', function() {
      assert.strictEqual(typeof config.util.toObject, 'function');
    });

    it('Returns a serialized version of the current instance if no argument is provided', function() {
      assert.notDeepStrictEqual(config.util.toObject(), config);
    });

    it('Returns a POJO', function() {
      assert.ok(!(config.util.toObject() instanceof config.constructor));
    });

    it('Returns a serialized version of whatever argument is provided', function() {
      assert.notDeepStrictEqual(config.get('Customers'), {
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
    });
  });
});
