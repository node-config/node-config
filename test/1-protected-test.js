import { describe, it, beforeEach } from 'node:test';
import assert from 'assert';
import { requireUncached } from './_utils/requireUncached.mjs';

/**
 * <p>Unit tests</p>
 *
 * @module test
 */

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

  beforeEach(async function () {
    // Change the configuration directory for testing
    process.env.NODE_CONFIG_DIR = import.meta.dirname + '/config';

    // Hard-code $NODE_ENV=test for testing
    process.env.NODE_ENV = 'test';

    // Test for multi-instance applications
    process.env.NODE_APP_INSTANCE = '3';

    // Test $NODE_CONFIG environment and --NODE_CONFIG command line parameter
    process.env.NODE_CONFIG = '{"EnvOverride":{"parm3":"overridden from $NODE_CONFIG","parm4":100}}';
    process.argv.push('--NODE_CONFIG={"EnvOverride":{"parm5":"overridden from --NODE_CONFIG","parm6":101}}');

    // Test Environment Variable Substitution
    process.env['CUSTOM_JSON_ENVIRONMENT_VAR'] = 'CUSTOM VALUE FROM JSON ENV MAPPING';

    config = await requireUncached('./lib/config.mjs');
  });

  describe('Library initialization', function () {
    it('Library is available', function () {
      assert.strictEqual(typeof config, 'object');
    });
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
