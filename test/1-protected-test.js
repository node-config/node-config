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

  describe('isObject() tests', function () {
    it('The function exists', function () {
      assert.strictEqual(typeof config.util.isObject, 'function');
    });

    it('Correctly identifies objects', function () {
      assert.strictEqual(config.util.isObject({A: "b"}), true);
    });

    it('Correctly excludes non-objects', function () {
      assert.strictEqual(config.util.isObject("some string"), false);
      assert.strictEqual(config.util.isObject(45), false);
      assert.strictEqual(config.util.isObject([2, 3]), false);
      assert.strictEqual(config.util.isObject(["a", "b"]), false);
      assert.strictEqual(config.util.isObject(null), false);
      assert.strictEqual(config.util.isObject(undefined), false);
    });
  });

  describe('_cloneDeep() tests', function () {
    let orig;

    beforeEach(function () {
      // Return an object for copy tests
      orig = {
        elem0: true,
        elem1: "Element 1",
        elem2: 2,
        elem3: [1, 2, 3],
        elem4: function () {
          return "hello";
        },
        elem5: {sub1: "sub 1", sub2: 2, sub3: [1, 2, 3]},
        elem6: {date: new Date, regexp: /test/i}
      };
    });

    it('The function exists', function () {
      assert.strictEqual(typeof config.util.cloneDeep, 'function');
    });

    it('Original and copy should test equivalent (deep)', function () {
      let copy = config.util.cloneDeep(orig);
      assert.deepEqual(copy, orig);
    });

    it('The objects should be different', function () {
      let copy = config.util.cloneDeep(orig);
      copy.elem1 = false;
      assert.notDeepEqual(copy, orig);
    });

    it('Object clones should be objects', function () {
      assert.strictEqual(typeof config.util.cloneDeep({a: 1, b: 2}), 'object');
    });

    it('Array clones should be arrays', function () {
      assert.ok(Array.isArray(config.util.cloneDeep(["a", "b", 3])));
    });

    it('Arrays should be copied by value, not by reference', function () {
      let copy = config.util.cloneDeep(orig);

      assert.deepEqual(copy, orig);

      copy.elem3[0] = 2;
      // If the copy wasn't deep, elem3 would be the same object
      assert.notDeepEqual(copy, orig);
    });

    it('Objects should be copied by value, not by reference', function () {
      let copy = config.util.cloneDeep(orig);
      copy.elem5.sub2 = 3;
      assert.notDeepEqual(copy, orig);

      copy = config.util.cloneDeep(orig);
      copy.elem5.sub3[1] = 3;
      assert.notDeepEqual(copy, orig);
    });

    it('Regexps and dates are preserved', function () {
      let copy = config.util.cloneDeep(orig);

      assert.strictEqual(copy.elem6.date.constructor.name, 'Date');
      assert.strictEqual(copy.elem6.regexp.toString(), '/test/i');
    });
  });

  describe('extendDeep() tests', function () {
    it('The function exists', function () {
      assert.strictEqual(typeof config.util.extendDeep, 'function');
    });

    it('Performs normal extend', function () {
      let orig = {elem1: "val1", elem2: "val2"};
      let extWith = {elem3: "val3"};
      let shouldBe = {elem1: "val1", elem2: "val2", elem3: "val3"};

      assert.deepEqual(config.util.extendDeep(orig, extWith), shouldBe);
    });

    it('Replaces non-objects', function () {
      let orig = {elem1: "val1", elem2: ["val2", "val3"], elem3: {sub1: "val4"}};
      let extWith = {elem1: 1, elem2: ["val4"], elem3: "val3"};
      let shouldBe = {elem1: 1, elem2: ["val4"], elem3: "val3"};

      assert.deepEqual(config.util.extendDeep(orig, extWith), shouldBe);
    });

    it('Merges objects', function () {
      let orig = {e1: "val1", elem2: {sub1: "val4", sub2: "val5"}};
      let extWith = {elem2: {sub2: "val6", sub3: "val7"}};
      let shouldBe = {e1: "val1", elem2: {sub1: "val4", sub2: "val6", sub3: "val7"}};

      assert.deepEqual(config.util.extendDeep(orig, extWith), shouldBe);
    });

    it('Merges dates', function () {
      let orig = {e1: "val1", elem2: {sub1: "val4", sub2: new Date(2015, 0, 1)}};
      let extWith = {elem2: {sub2: new Date(2015, 0, 2), sub3: "val7"}};
      let shouldBe = {e1: "val1", elem2: {sub1: "val4", sub2: new Date(2015, 0, 2), sub3: "val7"}};

      assert.deepEqual(config.util.extendDeep(orig, extWith), shouldBe);
    });

    it('Creates partial objects when mixing objects and non-objects', function () {
      let orig = {elem1: {sub1: 5}};
      let ext1 = {elem1: {sub2: 7}};
      let ext2 = {elem1: 7};
      let ext3 = {elem1: {sub3: 13}};
      // When we get to ext2, the 7 clears all memories of sub1 and sub3. Then, when
      // we merge with ext3, the 7 is replaced by the new object.
      let expected = {elem1: {sub3: 13}};

      assert.deepEqual(config.util.extendDeep(orig, ext1, ext2, ext3), expected);
    });

    it('Correctly types new objects and arrays', function () {
      let orig = {e1: "val1", e3: ["val5"]};
      let extWith = {e2: {elem1: "val1"}, e3: ["val6", "val7"]};
      let shouldBe = {e1: "val1", e2: {elem1: "val1"}, e3: ["val6", "val7"]};
      let ext = config.util.extendDeep({}, orig, extWith);

      assert.strictEqual(typeof ext.e2, 'object');
      assert.ok(Array.isArray(ext.e3));
      assert.deepEqual(ext, shouldBe);
    });

    it('Keeps non-merged objects intact', function () {
      let orig = {e1: "val1", elem2: {sub1: "val4", sub2: "val5"}};
      let shouldBe = {e1: "val1", elem2: {sub1: "val4", sub2: "val5"}};
      let extWith = {elem3: {sub2: "val6", sub3: "val7"}};

      config.util.extendDeep({}, orig, extWith);
      assert.deepEqual(orig, shouldBe);
    });

    it('Keeps prototype methods intact', function () {
      let orig = Object.create({
        has: function () {
        }
      });
      let result = config.util.extendDeep({}, orig, {});

      assert.strictEqual(typeof result.has, 'function');
    });
  });

  describe('equalsDeep() tests', function() {
    it('The function exists', function() {
      assert.strictEqual(typeof config.util.equalsDeep, 'function');
    });

    it('Succeeds on two empty objects', function() {
      assert.strictEqual(config.util.equalsDeep({}, {}), true);
    });

    it('Succeeds on array comparisons', function() {
      assert.strictEqual(config.util.equalsDeep([1,'hello',2], [1,'hello',2]), true);
    });

    it('Succeeds on the same object', function() {
      let a = { hello:'world' };
      assert.strictEqual(config.util.equalsDeep(a, a), true);
    });

    it('Succeeds on differently ordered objects', function() {
      let a = { value_3: 14, hello:'world', value_1: 29 };
      let b = { value_1: 29, hello:'world', value_3: 14 };

      assert.strictEqual(config.util.equalsDeep(a, b), true);
    });

    it('Succeeds on a deep object', function() {
      let a = { value_3: 14, hello:'world', value_1: 29, value_4: ['now','is','the','time'] };
      let b = { value_1: 29, hello:'world', value_3: 14, value_4: ['now','is','the','time'] };
      let c = { creditLimit: 10000, deepValue: a };
      let d = { deepValue: b, creditLimit:10000 };

      assert.strictEqual(config.util.equalsDeep(c, d), true);
    });

    it('Fails if either object is null', function() {
      assert.strictEqual(config.util.equalsDeep({}, null), false);
      assert.strictEqual(config.util.equalsDeep(null, {}), false);
      assert.strictEqual(config.util.equalsDeep(null, null), false);
    });

    it('Fails if either object is undefined', function() {
      assert.strictEqual(config.util.equalsDeep({}), false);
      assert.strictEqual(config.util.equalsDeep(undefined, {}), false);
    });

    it('Fails if object1 has more elements', function() {
      let a = { value_3: 14, hello:'world', value_1: 29, otherElem: 40 };
      let b = { value_1: 29, hello:'world', value_3: 14 };

      assert.strictEqual(config.util.equalsDeep(a, b), false);
    });

    it('Fails if object2 has more elements', function() {
      let a = { value_1: 29, hello:'world', value_3: 14 };
      let b = { value_3: 14, hello:'world', value_1: 29, otherElem: 40 };

      assert.strictEqual(config.util.equalsDeep(a, b), false);
    });

    it('Fails if any value is different', function() {
      let a = { value_1: 30, hello:'world', value_3: 14, value_4: ['now','is','the','time'] };
      let b = { value_1: 29, hello:'world', value_3: 14, value_4: ['now','is','the','time'] };

      assert.strictEqual(config.util.equalsDeep(a, b), false);

      a = { value_1: 29, hello:'world', value_3: 14, value_4: ['now','is','the','time'] };
      b = { value_1: 29, hello:'world', value_3: 14, value_4: ['now','isnt','the','time'] };

      assert.strictEqual(config.util.equalsDeep(a, b), false);
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

  describe('substituteDeep() tests', function() {
    let orig;

    beforeEach(function() {
      orig = {
        TopLevel: 'SOME_TOP_LEVEL',
        TestModule: {
          parm1: "SINGLE_SECOND_LEVEL"
        },
        Customers: {
          dbHost: 'DB_HOST',
          dbName: 'DB_NAME',
          oauth: {
            key: 'OAUTH_KEY',
            secret: 'OAUTH_SECRET'
          }
        }
      };
    });

    it('returns an empty object if the variables mapping is empty', function () {
      let vars = {};
      let substituted = config.util.substituteDeep(orig, vars);

      assert.deepEqual(substituted, {});
    });

    it('returns an empty object if none of the variables map to leaf strings', function () {
      let vars = {
        NON_EXISTENT_VAR: 'ignore_this'
      };
      let substituted = config.util.substituteDeep(orig, vars);

      assert.deepEqual(substituted, {});
    });

    it('returns an object with keys matching down to mapped existing variables', function () {
      let vars = {
        'SOME_TOP_LEVEL': 5,
        'DB_NAME': 'production_db',
        'OAUTH_SECRET': '123456',
        'PATH': 'ignore other environment variables'
      };

      let substituted = config.util.substituteDeep(orig, vars);

      assert.deepEqual(substituted, {
        TopLevel: 5,
        Customers: {
          dbName: 'production_db',
          oauth: {
            secret: '123456'
          }
        }
      });
    });

    it('Returns an object with keys matching down to mapped existing and defined variables', function () {
      let vars = {
        'SOME_TOP_LEVEL': 0,
        'DB_HOST': undefined,
        'DB_NAME': '',
        'OAUTH_SECRET': 'false',
        'OAUTH_KEY': 'null',
        'PATH': ''
      };

      let substituted = config.util.substituteDeep(orig, vars);

      assert.deepEqual(substituted, {
        TopLevel: 0,
        Customers: {
          oauth: {
            key: 'null',
            secret: 'false'
          }
        }
      });
    });

    it('returns an object with keys matching down to mapped existing variables with JSON content', function () {
      let vars = {
        'DB_HOST': '{"port":"3306","host":"example.com"}'
      };

      let substituted = config.util.substituteDeep(orig, vars);

      assert.deepEqual(substituted, {
        Customers: {
          dbHost: '{"port":"3306","host":"example.com"}'
        }
      });
    });

    it('Returns an object with keys matching down to mapped existing and defined variables with JSON content', function () {
      let dbHostObject = {
        param1WithZero: 0,
        param2WithFalse: false,
        param3WithNull: null,
        param4WithEmptyObject: {},
        param5WithEmptyArray: [],
        param6WithEmptyString: ''
      };
      let dbHostObjectWithUndefinedProperty = Object.assign({}, dbHostObject, { param7WithUndefined: undefined });
      let vars = {
        'DB_HOST': JSON.stringify(dbHostObjectWithUndefinedProperty)
      };

      let substituted = config.util.substituteDeep(orig, vars);

      assert.deepEqual(substituted, {
        Customers: {
          dbHost: JSON.stringify(dbHostObject)
        }
      });
    });

    it('returns an object with keys matching down to mapped and JSON-parsed existing variables', function () {
      let vars = {
        'DB_HOST': '{"port":"3306","host":"example.com"}'
      };

      orig.Customers.dbHost = {__name: 'DB_HOST', __format: 'json'};

      let substituted = config.util.substituteDeep(orig, vars);

      assert.deepEqual(substituted, {
        Customers: {
          dbHost: {
            port: '3306',
            host: 'example.com'
          }
        }
      });
    });

    it('Returns an object with keys matching down to mapped and JSON-parsed existing and defined variables', function () {
      let dbHostObject = {
        param1WithZero: 0,
        param2WithFalse: false,
        param3WithNull: null,
        param4WithEmptyObject: {},
        param5WithEmptyArray: [],
        param6WithEmptyString: ''
      };
      let dbHostObjectWithUndefinedProperty = Object.assign({}, dbHostObject, { param7WithUndefined: undefined });
      let vars = {
        'DB_HOST': JSON.stringify(dbHostObjectWithUndefinedProperty)
      };

      orig.Customers.dbHost = {__name: 'DB_HOST', __format: 'json'};

      let substituted = config.util.substituteDeep(orig, vars);

      assert.deepEqual(substituted, {
        Customers: {
          dbHost: dbHostObject
        }
      });
    });

    // Testing all the things in variable maps that don't make sense because ENV vars are always
    // strings.
    it('Throws an error for leaf Array values', function () {
      let vars = {
        NON_EXISTENT_VAR: 'ignore_this'
      };

      orig.Customers.dbHost = ['a', 'b', 'c'];

      assert.throws(function () {
        config.util.substituteDeep(orig, vars);
      });
    });

    it('Throws an error for leaf Boolean values', function () {
      let vars = {
        NON_EXISTENT_VAR: 'ignore_this'
      };

      orig.Customers.dbHost = false;

      assert.throws(function () {
        config.util.substituteDeep(orig, vars);
      });
    });

    it('Throws an error for leaf Numeric values', function () {
      let vars = {
        NON_EXISTENT_VAR: 'ignore_this'
      };

      orig.Customers.dbHost = 443;

      assert.throws(function () {
        config.util.substituteDeep(orig, vars);
      });
    });

    it('Throws an error for leaf null values', function () {
      let vars = {
        NON_EXISTENT_VAR: 'ignore_this'
      };

      orig.Customers.dbHost = null;

      assert.throws(function () {
        config.util.substituteDeep(orig, vars);
      });
    });

    it('Throws an error for leaf Undefined values', function () {
      let vars = {
        NON_EXISTENT_VAR: 'ignore_this'
      };

      orig.Customers.dbHost = undefined;

      assert.throws(function () {
        config.util.substituteDeep(orig, vars);
      });
    });

    it('Throws an error for leaf NaN values', function () {
      let vars = {
        NON_EXISTENT_VAR: 'ignore_this'
      };

      orig.Customers.dbHost = NaN;

      assert.throws(function () {
        config.util.substituteDeep(orig, vars);
      });
    });

    it('Throws an error with message describing variables name that throw a parser error', function() {
      let JSON_WITH_SYNTAX_ERROR = '{"port":"3306","host" "example.com"}'
      let vars = {
        'DB_HOST': JSON_WITH_SYNTAX_ERROR
      };

      orig.Customers.dbHost = {__name: 'DB_HOST', __format: 'json'};

      try {
        config.util.substituteDeep(orig, vars);
        assert.fail('no error thrown');
      } catch (err) {
        assert.match(err.message, /__format parser error in DB_HOST: /);
      }
    });
  });

  describe('setPath() tests:', function () {
    let orig;

    beforeEach(function () {
      orig = {
        TestModule: {
          parm1: "value1"
        },
        Customers: {
          dbHost: 'base',
          dbName: 'from_default_js',
          oauth: {
            key: 'a_api_key',
            secret: 'an_api_secret'
          }
        },
        EnvOverride: {
          parm_number_1: "from_default_js",
          parm2: 22
        }
      };
    });

    it('Ignores null values', function () {
      config.util.setPath(orig, ['Customers', 'oauth', 'secret'], null);
      assert.strictEqual(orig.Customers.oauth.secret, 'an_api_secret');
    });

    it('Creates top-level keys to set new values', function () {
      config.util.setPath(orig, ['NewKey'], 'NEW_VALUE');
      assert.strictEqual(orig.NewKey, 'NEW_VALUE');
    });

    it('Creates sub-keys to set new values', function () {
      config.util.setPath(orig, ['TestModule', 'oauth'], 'NEW_VALUE');
      assert.strictEqual(orig.TestModule.oauth, 'NEW_VALUE');
    });

    it('Creates parents to set new values', function () {
      config.util.setPath(orig, ['EnvOverride', 'oauth', 'secret'], 'NEW_VALUE');
      assert.strictEqual(orig.EnvOverride.oauth.secret, 'NEW_VALUE');
    });

    it('Overwrites existing values', function () {
      config.util.setPath(orig, ['Customers'], 'NEW_VALUE');
      assert.strictEqual(orig.Customers, 'NEW_VALUE');
    });
  });

  describe('parseFile() tests', function () {
    let content;

    beforeEach(function () {
      content = config.util.parseFile(__dirname + '/config/default.yaml');
    });

    it('The function exists', function () {
      assert.strictEqual(typeof config.util.parseFile, 'function');
    });

    it('An object is returned', function () {
      assert.strictEqual(typeof content, 'object');
    });

    it('The correct object is returned', function () {
      assert.strictEqual(typeof content.Customers, 'object');
      assert.strictEqual(content.Customers.dbName, 'from_default_yaml');
      assert.strictEqual(content.Customers.dbPort, 5984);
      assert.strictEqual(typeof content.AnotherModule, 'object');
      assert.strictEqual(content.AnotherModule.parm2, "value2");
    });

    describe('CSON parse tests', function () {
      let content;

      beforeEach(function () {
        content = config.util.parseFile(__dirname + '/config/default.cson');
      });

      it('An object is returned', function () {
        assert.strictEqual(typeof content, 'object');
      });

      it('The correct object is returned', function () {
        assert.strictEqual(typeof content.Customers, 'object');
        assert.strictEqual(content.Customers.dbName, 'from_default_cson');
        assert.strictEqual(content.Customers.dbPassword, 'password will be overwritten.');
        assert.strictEqual(typeof content.AnotherModule, 'object');
        assert.strictEqual(content.AnotherModule.parm4, "value4");
        assert.ok(Array.isArray(content.Customers.lang));
      });
    });

    describe('.properties parse tests', function () {
      let content;

      beforeEach(function () {
        content = config.util.parseFile(__dirname + '/config/default.properties');
      });

      it('An object is returned', function () {
        assert.strictEqual(typeof content, 'object');
      });

      it('The correct object is returned', function () {
        assert.strictEqual(typeof content.AnotherModule, 'object');
        assert.strictEqual(content.AnotherModule.parm5, "value5");
        assert.strictEqual(typeof content['key with spaces'], 'object');
        assert.strictEqual(content['key with spaces'].another_key, 'hello');
        assert.strictEqual(content.ignore_this_please, undefined);
        assert.strictEqual(content.i_am_a_comment, undefined);
      });

      it('Variable replacements are working', function () {
        assert.strictEqual(content.replacement.param, "foobar")
      });

      it('Sections are supported', function () {
        assert.notEqual(content.section.param, undefined);
        assert.strictEqual(content.param, undefined);
      });
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

    it('The cloneDeep method is attached to the object', function() {
      assert.strictEqual( { a: 27 }.a, content.util.cloneDeep( { a: 27 }).a);
    });

    it('The cloneDeep method is also attached to sub-objects', function() {
      assert.strictEqual( { a: 27 }.a, content.subObject.util.cloneDeep({ a: 27 }).a);
      assert.strictEqual ( { a: 27 }.a, content.subObject.subSubObject.util.cloneDeep({ a: 27 }).a);
    });

    it('Prototype methods are not exposed in the object', function() {
      // This test is here because altering object.__proto__ places the method
      // directly onto the object. That caused problems when iterating over the
      // object.  This implementation does the same thing, but hides them.
      assert.strictEqual(JSON.stringify(content), '{"subObject":{"item1":23,"subSubObject":{"item2":"hello"}}}');
    });
  });

  describe('getCmdLineArg() tests', function() {
    beforeEach(function () {
        // Set process.argv example object
        let testArgv = [
            process.argv[0],
            process.argv[1],
            '--NODE_ENV=staging'
        ];
        process.argv = testArgv;
    });

    it('The function exists', function() {
        assert.strictEqual(typeof config.util.getCmdLineArg, 'function');
    });

    it('NODE_ENV should be staging', function() {
      assert.strictEqual(config.util.getCmdLineArg('NODE_ENV'), 'staging');
    });

    it('Returns false if the argument did not match', function() {
        assert.strictEqual(config.util.getCmdLineArg('NODE_CONFIG_DIR'), false);
    });

    it('Returns the argument (alternative syntax)', function() {
        process.argv.push('--NODE_CONFIG_DIR=/etc/nodeConfig');
        assert.strictEqual(config.util.getCmdLineArg('NODE_CONFIG_DIR'), '/etc/nodeConfig');
    });

    it('Returns always the first matching', function() {
        process.argv.push('--NODE_ENV=test');
        assert.strictEqual(config.util.getCmdLineArg('NODE_ENV'), 'staging');
    });

    it('Revert original process arguments', function() {
        assert.notEqual(process.argv, argvOrg);
        process.argv = argvOrg;
        assert.strictEqual(process.argv, argvOrg);
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
