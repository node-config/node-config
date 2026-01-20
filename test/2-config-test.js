'use strict';

const Path = require('path');
const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');

/**
 * <p>Unit tests for the node-config library.  To run type:</p>
 * <pre>npm test</pre>
 * <p>Or, in a project that uses node-config:</p>
 * <pre>npm test config</pre>
 *
 * @class ConfigTest
 */

describe('Test suite for node-config', function() {
  describe('Library initialization', function() {
    let config;

    beforeEach(function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + '/config';

      // Hard-code $NODE_ENV=test for testing
      process.env.NODE_ENV='test';

      // Test for multi-instance applications
      process.env.NODE_APP_INSTANCE='3';

      // Test $NODE_CONFIG environment and --NODE_CONFIG command line parameter
      process.env.NODE_CONFIG='{"EnvOverride":{"parm3":"overridden from $NODE_CONFIG","parm4":100}}';
      process.argv = [undefined, undefined, '--NODE_CONFIG={"EnvOverride":{"parm5":"overridden from --NODE_CONFIG","parm6":101}}'];

      // Test Environment Variable Substitution
      process.env.CUSTOM_JSON_ENVIRONMENT_VAR = 'CUSTOM VALUE FROM JSON ENV MAPPING';

      // Test Environment variable substitution of boolean values
      process.env.CUSTOM_BOOLEAN_TRUE_ENVIRONMENT_VAR = 'true';
      process.env.CUSTOM_BOOLEAN_FALSE_ENVIRONMENT_VAR = 'false';
      process.env.CUSTOM_BOOLEAN_ERROR_ENVIRONMENT_VAR = 'notProperBoolean';

      // Test Environment variable substitution of numeric values
      process.env.CUSTOM_NUMBER_INTEGER_ENVIRONMENT_VAR = 1001;
      process.env.CUSTOM_NUMBER_FLOAT_ENVIRONMENT_VAR = 3.14;
      process.env.CUSTOM_NUMBER_EMPTY_ENVIRONMENT_VAR = '';
      process.env.CUSTOM_NUMBER_STRING_ENVIRONMENT_VAR = 'String';

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('Config library is available', function() {
      assert.strictEqual(typeof config, 'object');
    });

    it('Config extensions are included with the library', function() {
      assert.strictEqual(typeof config.util.makeImmutable, 'function');
    });
  });

  describe('Immutability', function() {
    let config;

    beforeEach(function() {
      config = requireUncached(__dirname + '/../lib/config');
    });

    it('Correct mute setup var', function () {
      assert.strictEqual(config.MuteThis, 'hello');
    });

    it('Mutation sticks', function () {
      config.MuteThis = 'world';
      assert.strictEqual(config.MuteThis, 'world');
    });

    it('No mutation after the first get()', function () {
      config.MuteThis = 'world';
      assert.strictEqual(config.get('MuteThis'), 'world');

      assert.throws(
        function() {
          config.MuteThis = 'backToHello';
        },
        /Cannot assign to read only property 'MuteThis'/
      );

      assert.strictEqual(config.MuteThis, 'world');
    });

    it('No recursive mutation after first get()', function() {
      config.MuteThis = 'world';
      assert.strictEqual(config.get('MuteThis'), 'world');

      assert.throws(
        function() {
          config.TestModule.arr1 = [ 'bad value' ];
        },
        /Can not update runtime configuration property: "arr1"\. Configuration objects are immutable unless ALLOW_CONFIG_MUTATIONS is set\./
      )
    });

    it('reverse tree walk also prevents mutation after second get()', function() {
      config.TestModule.get('parm1');
      config.get('Customers')

      assert.throws(
        function() {
          config.Customers.dbHost = [ 'bad value' ];
        },
        /Can not update runtime configuration property: "dbHost"\. Configuration objects are immutable unless ALLOW_CONFIG_MUTATIONS is set\./
      )
    });
  });

  describe('Configurations from the $NODE_CONFIG environment variable', function() {
    let config;

    beforeEach(function() {
      config = requireUncached(__dirname + '/../lib/config');
    });

    it('Configuration can come from the $NODE_CONFIG environment', function() {
      assert.strictEqual(config.EnvOverride.parm3, 'overridden from $NODE_CONFIG');
    });

    it('Type correct configurations from $NODE_CONFIG', function() {
      assert.strictEqual(config.EnvOverride.parm4, 100);
    });
  });

  describe('Configurations from the --NODE_CONFIG command line', function() {
    let config;

    beforeEach(function() {
      config = requireUncached(__dirname + '/../lib/config');
    });

    it('Configuration can come from the --NODE_CONFIG command line argument', function() {
      assert.strictEqual(config.EnvOverride.parm5, 'overridden from --NODE_CONFIG');
    });

    it('Type correct configurations from --NODE_CONFIG', function() {
      assert.strictEqual(config.EnvOverride.parm6, 101);
    });
  });

  describe('Assuring a configuration property can be made immutable', function() {
    let config;

    // Support old two and three argument pattern;

    beforeEach(function() {
      config = requireUncached(__dirname + '/../lib/config');

      config.util.makeImmutable(config.TestModule, 'parm1');
    });

    it('The makeImmutable() method is available', function() {
      assert.strictEqual(typeof config.util.makeImmutable, 'function');
    });

    it('Correctly unable to change an immutable configuration', function() {
      assert.throws(() => config.TestModule.parm1 = "setToThis",
        /Cannot assign to read only property/);
      assert.strictEqual(config.TestModule.parm1, "value1");
    });

    it('Correctly unable to add new fields to an immutable configuration', function() {
      config.util.makeImmutable(config.TestModule);

      assert.throws(() => config.TestModule.newField = "setToThis",
        /Cannot add property newField, object is not extensible/);
    });
  });

  describe('Assuring a configuration array property can be made immutable', function() {
    let config;

    beforeEach(function() {
      config = requireUncached(__dirname + '/../lib/config');
    });

    it('Correctly unable to change an immutable property', function() {
      config.util.makeImmutable(config);

      assert.throws(
        function() {
          config.TestModule.arr1 = [ 'bad value' ];
        },
        /Can not update runtime configuration property: "arr1"\. Configuration objects are immutable unless ALLOW_CONFIG_MUTATIONS is set\./
      )
    });

    it('Correctly unable to add values to immutable array', function() {
      config.util.makeImmutable(config.TestModule);

      assert.throws(() => config.TestModule.arr1.push('bad value'),
        /TypeError: Cannot add property/);

      assert.strictEqual(config.TestModule.arr1.includes('bad value'), false);
    });
  });

  describe('get() tests', function() {
    let config;

    beforeEach(function() {
      config = requireUncached(__dirname + '/../lib/config');
    });

    it('The function exists', function() {
      assert.strictEqual(typeof config.get, 'function');
    });

    it('A top level item is returned', function() {
      assert.strictEqual(typeof config.get('TestModule'), 'object');
    });

    it('A sub level item is returned', function() {
      assert.strictEqual(config.get('Customers.dbHost'), 'base');
    });

    it('get is attached deeply', function() {
      assert.strictEqual(config.Customers.get('dbHost'), 'base');
    });

    it('An extended property accessor remains a getter', function() {
      assert.strictEqual(config.get('customerDbPort'), '5999');
    });

    it('A cloned property accessor remains a getter', function() {
      assert.strictEqual(config.Customers.get('dbString'), 'from_default_xml:5999');
    });

    it('A cloned property accessor is made immutable', function() {
      var random1 = config.Customers.get('random'),
          random2 = config.Customers.get('random');

      assert.strictEqual(random1, random2);
    });

    it('A proper exception is thrown on mis-spellings', function() {
      assert.throws(
        function () { config.get('mis.spelled'); },
        /Configuration property "mis.spelled" is not defined/
      );
    });

    it('An exception is thrown on non-objects', function() {
      assert.throws(
          function () { config.get('Testmodule.misspelled'); },
          /Configuration property "Testmodule.misspelled" is not defined/
      );
    });

    it('get(undefined) throws an exception', function() {
      assert.throws(
          function () { config.get(undefined); },
          /Calling config.get with null or undefined argument/
      );
    });

    it('get(null) throws an exception', function() {
      assert.throws(
          function () { config.get(null); },
          /Calling config.get with null or undefined argument/
      );
    });

    it("get('') throws an exception", function() {
      assert.throws(
          function () { config.get(''); },
          /Configuration property "" is not defined/
      );
    });
  });

  describe('has() tests', function() {
    let config;

    beforeEach(function() {
      config = requireUncached(__dirname + '/../lib/config');
    });

    it('The function exists', function() {
      assert.strictEqual(typeof config.has, 'function');
    });

    it('A top level item can be tested', function() {
      assert.strictEqual(config.has('TestModule'), true);
    });

    it('A sub level item can be tested', function() {
      assert.strictEqual(config.has('Customers.dbHost'), true);
    });

    it('A missing sub level item can be tested', function() {
      assert.strictEqual(config.has('Customers.emptySub'), true);
      assert.strictEqual(config.has('Customers.emptySub.foo'), false);
    });

    it('has is attached deeply', function() {
      assert.strictEqual(config.Customers.has('dbHost'), true);
    });

    it('Correctly identifies not having element', function() {
      assert.strictEqual(config.Customers.has('dbHosx'), false);
    });

    it('Correctly identifies not having element (deep)', function() {
      assert.strictEqual(config.has('Customers.dbHosx'), false);
    });

    it('has(undefined) returns false', function() {
      assert.strictEqual(config.has(undefined), false);
    });

    it("has(null) returns false", function() {
      assert.strictEqual(config.has(null), false);
    });

    it("has('') returns false", function() {
      assert.strictEqual(config.has(''), false);
    });
  });

  describe('Configuration for module developers', function() {
    let config;

    beforeEach(function() {
      config = requireUncached(__dirname + '/../lib/config');
    });

    it('The setModuleDefaults() method is available', function() {
      assert.strictEqual(typeof config.util.setModuleDefaults, 'function');
    });

    it('The module config is in the CONFIG object', function() {
      // Set some parameters for the test module
      let moduleConfig = config.util.setModuleDefaults("TestModule", {
        parm1: 1000, parm2: 2000, parm3: 3000,
        nested: {
          param4: 4000,
          param5: 5000
        }
      });

      assert.strictEqual(typeof config.TestModule, 'object');
      assert.deepEqual(config.TestModule, moduleConfig);
    });

    // Regression test for https://github.com/node-config/node-config/issues/518
    it('The module config did not extend itself with its own name', function() {
      let moduleConfig = config.util.setModuleDefaults("TestModule", {
          parm1: 1000, parm2: 2000, parm3: 3000,
          nested: {
            param4: 4000,
            param5: 5000
          }
        });

      assert.strictEqual('TestModule' in moduleConfig, false);
      assert.strictEqual('TestModule' in config.TestModule, false);
    });

    it('Local configurations are mixed in', function() {
      config.util.setModuleDefaults("TestModule", { parm1: 1000 });

      assert.strictEqual(config.TestModule.parm1, "value1");
    });

    it('Defaults remain intact unless overridden', function() {
      config.util.setModuleDefaults("TestModule", { parm1: 1000, parm2: 2000, parm3: 3000 });

      assert.strictEqual(config.TestModule.parm2, 2000);
    });

    it('Config.get() before setModuleDefaults() can see updates', function() {
      process.env.ALLOW_CONFIG_MUTATIONS = true;

      const mutableConfig = requireUncached(__dirname + '/../lib/config');

      let defaults = {
        someValue: "default"
      };

      try {
        let customers = mutableConfig.get('Customers');

        mutableConfig.util.setModuleDefaults('Customers', defaults);

        assert.strictEqual(customers.get("someValue"), "default");
      } finally {
        delete process.env.ALLOW_CONFIG_MUTATIONS;
      }
    });

    it('Prototypes are applied by setModuleDefaults even if no previous config exists for the module', function() {
      let BKTestModuleDefaults = {
        parm1: 1000, parm2: 2000, parm3: 3000,
        nested: {
          param4: 4000,
          param5: 5000
        }
      };
      let OtherTestModuleDefaults = {
        parm6: 6000, parm7: 7000,
        other: {
          param8: 8000,
          param9: 9000
        }
      };

      config.util.setModuleDefaults('BKTestModule', BKTestModuleDefaults);
      config.util.setModuleDefaults('services.OtherTestModule', OtherTestModuleDefaults);

      let testModuleConfig = config.get('BKTestModule');
      var testSubModuleConfig = config.get('services');

      assert.deepEqual(BKTestModuleDefaults.nested, testModuleConfig.get('nested'));
      assert.deepEqual(OtherTestModuleDefaults.other, testSubModuleConfig.OtherTestModule.other);
    });
  });
});
