/**
 * <p>Unit tests</p>
 *
 * @module test
 */

const vows = require('vows');
const assert = require('assert');
const Path = require('path');
const util = require('../lib/util.js').Util;
const Load = require('../lib/util.js').Load;
const deferConfig = require('../defer').deferConfig;

vows.describe('Tests for util functions')
  .addBatch({
    'Util.isObject()': {
      'The function exists': function () {
        assert.isFunction(util.isObject);
      },
      'Correctly identifies objects': function () {
        assert.isTrue(util.isObject({A: "b"}));
      },
      'Correctly excludes non-objects': function () {
        assert.isFalse(util.isObject("some string"));
        assert.isFalse(util.isObject(45));
        assert.isFalse(util.isObject([2, 3]));
        assert.isFalse(util.isObject(["a", "b"]));
        assert.isFalse(util.isObject(null));
        assert.isFalse(util.isObject(undefined));
      }
    },
    'Util.isPromise()': {
      'It can identify a new Promise': function () {
        assert.isTrue(util.isPromise(new Promise(() => {
        })));
      },
      'It can identify a resolved Promise': function () {
        assert.isTrue(util.isPromise(Promise.resolve()));
      },
      'It can identify a rejected Promise': function () {
        // Use .catch to avoid `UnhandledPromiseRejectionWarning`, DO NOT REMOVE
        assert.isTrue(util.isPromise(Promise.reject().catch(function () {
        })));
      },
      'It can identify other things different as no promises': function () {
        var testCases = [
          new Function(),
          function () {
          },
          true,
          false,
          new Boolean(),
          class {
          },
          '',
          new String(),
          [],
          {},
          Object.create(null),
          new Map(),
          null,
          undefined,
          NaN,
          Infinity,
          0,
          1.1
          - 1,
        ];
        testCases.forEach(function (testCase) {
          assert.isFalse(util.isPromise(testCase));
        });
      }
    },
    'Util.makeHidden()': {
      topic: function () {
        return {
          item1: 23,
          subObject: {
            item2: "hello"
          }
        };
      },
      'The makeHidden() method is available': function () {
        assert.isFunction(util.makeHidden);
      },
      'The test object (before hiding) is correct': function (object) {
        assert.isTrue(JSON.stringify(object) == '{"item1":23,"subObject":{"item2":"hello"}}');
      },
      'The test object (after hiding) is correct': function (object) {
        util.makeHidden(object, 'item1');
        assert.isTrue(JSON.stringify(object) == '{"subObject":{"item2":"hello"}}');
      },
      'The hidden property is readable, and has not changed': function (object) {
        assert.isTrue(JSON.stringify(object) == '{"subObject":{"item2":"hello"}}');
        assert.isTrue(object.item1 == 23);
      },
      'The hidden property is readable, and updated': function (object) {
        util.makeHidden(object, 'newValue', 3);
        assert.isTrue(JSON.stringify(object) == '{"subObject":{"item2":"hello"}}');
        assert.isTrue(object.newValue == 3);
      }
    },
    'Util.getOption()': {
      topic: function () {
        return {
          item1: 23,
          item2: 0,
          item3: "hello"
        };
      },
      'The getOption() method is available': function () {
        assert.isFunction(util.getOption);
      },
      'returns a field': function (options) {
        assert.equal(util.getOption(options, "item1"), 23);
      },
      'falls back to a default': function (options) {
        assert.equal(util.getOption(options, "missing", "orange"), "orange");
      },
      'handles falsey values': function (options) {
        assert.equal(util.getOption(options, "item2", "orange"), 0);
      }
    },
    'Util.locateMatchingFiles()': {
      'The locateMatchingFiles() method is available': function () {
        assert.isFunction(util.locateMatchingFiles);
      },
      'returns files in the correct order': function () {
        let allowed = {"default.mjs": 2, "default.json": 1};
        let results = util.locateMatchingFiles("./test/config", allowed);
        assert.equal(Path.basename(results[0]), "default.json");
        assert.equal(Path.basename(results[1]), "default.mjs");
      }
    },
    'Util.equalsDeep()': {
      topic: function () {
        // Return an object for copy tests
        return {
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
      },
      'The function exists': function () {
        assert.isFunction(util.equalsDeep);
      },
      'handles undefined': function () {
        assert.isFalse(util.equalsDeep()); //TODO: is this right?
        assert.isFalse(util.equalsDeep([1, 2, 3]));
        assert.isFalse(util.equalsDeep(undefined, [1, 2, 3]));
      },
      'handles primitives': function () {
        assert.isTrue(util.equalsDeep(1, 1));
        assert.isFalse(util.equalsDeep(1, 2));
        assert.isTrue(util.equalsDeep("foo", "foo"));
      },
      'handles mismatched types': function () {
        assert.isFalse(util.equalsDeep({value: 3}, "three"));
      },
      'can compare arrays': function () {
        assert.isTrue(util.equalsDeep([1, 2, 3], [1, 2, 3]));
        assert.isFalse(util.equalsDeep([1, 2, 3], [1, 2, 4]));
        assert.isFalse(util.equalsDeep([1, 2, 3], [1, 2]));
        assert.isFalse(util.equalsDeep([1, 2], [1, 2, 3]));
      },
      'can compare objects': function () {
        assert.isTrue(util.equalsDeep({a: 1, b: 2}, {a: 1, b: 2}));
        assert.isFalse(util.equalsDeep({a: 1, b: 2}, {a: 1, b: 3}));
        assert.isTrue(util.equalsDeep({a: 1, b: {c: 3}}, {a: 1, b: {c: 3}}));
        assert.isFalse(util.equalsDeep({a: 1, b: {c: 3}}, {a: 1, b: {c: 3, d: 2}}));
      },
      'Catches subsets': function (orig) {
        let copy = {...orig};
        delete copy.elem6;

        assert.isFalse(util.equalsDeep(orig, copy));
      },
      'Catches supersets': function (orig) {
        let copy = {...orig};
        copy.elem7 = "new";

        assert.isFalse(util.equalsDeep(orig, copy));
      },
    },
    'Util.cloneDeep()': {
      topic: function () {
        // Return an object for copy tests
        return {
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
      },
      'The function exists': function () {
        assert.isFunction(util.cloneDeep);
      },
      'Original and copy should test equivalent (deep)': function (orig) {
        var copy = util.cloneDeep(orig);
        assert.deepEqual(copy, orig);
      },
      'The objects should be different': function (orig) {
        var copy = util.cloneDeep(orig);
        copy.elem1 = false;
        assert.notDeepEqual(copy, orig);
      },
      'Object clones should be objects': function (orig) {
        assert.isObject(util.cloneDeep({a: 1, b: 2}));
      },
      'Array clones should be arrays': function (orig) {
        assert.isArray(util.cloneDeep(["a", "b", 3]));
      },
      'Arrays should be copied by value, not by reference': function (orig) {
        var copy = util.cloneDeep(orig);
        assert.deepEqual(copy, orig);
        copy.elem3[0] = 2;
        // If the copy wasn't deep, elem3 would be the same object
        assert.notDeepEqual(copy, orig);
      },
      'Objects should be copied by value, not by reference': function (orig) {
        var copy = util.cloneDeep(orig);
        copy.elem5.sub2 = 3;
        assert.notDeepEqual(copy, orig);
        copy = util.cloneDeep(orig);
        copy.elem5.sub3[1] = 3;
        assert.notDeepEqual(copy, orig);
      },
      'Regexps and dates are preserved': function (orig) {
        var copy = util.cloneDeep(orig);
        assert.equal(copy.elem6.date.constructor.name, 'Date');
        assert.equal(copy.elem6.regexp.toString(), '/test/i');
      }
    },
    'Util.extendDeep()': {
      'The function exists': function () {
        assert.isFunction(util.extendDeep);
      },
      'Performs normal extend': function () {
        var orig = {elem1: "val1", elem2: "val2"};
        var extWith = {elem3: "val3"};
        var shouldBe = {elem1: "val1", elem2: "val2", elem3: "val3"};

        assert.deepEqual(util.extendDeep(orig, extWith), shouldBe);
      },
      'Replaces non-objects': function () {
        var orig = {elem1: "val1", elem2: ["val2", "val3"], elem3: {sub1: "val4"}};
        var extWith = {elem1: 1, elem2: ["val4"], elem3: "val3"};
        var shouldBe = {elem1: 1, elem2: ["val4"], elem3: "val3"};
        assert.deepEqual(util.extendDeep(orig, extWith), shouldBe);
      },
      'Merges objects': function () {
        var orig = {e1: "val1", elem2: {sub1: "val4", sub2: "val5"}};
        var extWith = {elem2: {sub2: "val6", sub3: "val7"}};
        var shouldBe = {e1: "val1", elem2: {sub1: "val4", sub2: "val6", sub3: "val7"}};

        assert.deepEqual(util.extendDeep(orig, extWith), shouldBe);
      },
      'Merges dates': function () {
        var orig = {e1: "val1", elem2: {sub1: "val4", sub2: new Date(2015, 0, 1)}};
        var extWith = {elem2: {sub2: new Date(2015, 0, 2), sub3: "val7"}};
        var shouldBe = {e1: "val1", elem2: {sub1: "val4", sub2: new Date(2015, 0, 2), sub3: "val7"}};

        assert.deepEqual(util.extendDeep(orig, extWith), shouldBe);
      },
      'Creates partial objects when mixing objects and non-objects': function () {
        var orig = {elem1: {sub1: 5}};
        var ext1 = {elem1: {sub2: 7}};
        var ext2 = {elem1: 7};
        var ext3 = {elem1: {sub3: 13}};
        // When we get to ext2, the 7 clears all memories of sub1 and sub3. Then, when
        // we merge with ext3, the 7 is replaced by the new object.
        var expected = {elem1: {sub3: 13}};

        assert.deepEqual(util.extendDeep(orig, ext1, ext2, ext3), expected);
      },
      'Correctly types new objects and arrays': function () {
        var orig = {e1: "val1", e3: ["val5"]};
        var extWith = {e2: {elem1: "val1"}, e3: ["val6", "val7"]};
        var shouldBe = {e1: "val1", e2: {elem1: "val1"}, e3: ["val6", "val7"]};
        var ext = util.extendDeep({}, orig, extWith);

        assert.isObject(ext.e2);
        assert.isArray(ext.e3);
        assert.deepEqual(ext, shouldBe);
      },
      'Keeps non-merged objects intact': function () {
        var orig = {e1: "val1", elem2: {sub1: "val4", sub2: "val5"}};
        var shouldBe = {e1: "val1", elem2: {sub1: "val4", sub2: "val5"}};
        var extWith = {elem3: {sub2: "val6", sub3: "val7"}};

        util.extendDeep({}, orig, extWith);
        assert.deepEqual(orig, shouldBe);
      },
      'Keeps prototype methods intact': function () {
        var orig = Object.create({
          has: function () {
          }
        });
        var result = util.extendDeep({}, orig, {});
        assert.isFunction(result.has);
      },
      'Keeps keys with no value': function() {
        var orig = Object.create({foo: 3, bar: 4});

        var result = util.extendDeep({}, orig, {baz: undefined});
        assert.equal(Object.keys(result).length, 3);
      }
    },
    'Util.toObject() tests': {
      'The function exists': function () {
        assert.isFunction(util.toObject);
      },
      'Returns a serialized version of the given object': function () {
        let input = {some: {field: 4}};
        assert.notStrictEqual(util.toObject(input), input);
      },
    },
    'getPath() tests:': {
      topic: function () {
        return {
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
      },
      'The function exists': function () {
        assert.isFunction(util.getPath);
      },
      'can pull from paths': function (topic) {
        let result = util.getPath(topic, ['Customers', 'oauth', 'secret']);
        assert.equal(result, 'an_api_secret');
      },
      'can pull from a string path': function (topic) {
        let result = util.getPath(topic, "EnvOverride.parm2");
        assert.equal(result, 22);
      },
    },
    'setPath() tests:': {
      topic: function () {
        return {
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
      },
      'The function exists': function () {
        assert.isFunction(util.setPath);
      },
      'Ignores null values': function (topic) {
        util.setPath(topic, ['Customers', 'oauth', 'secret'], null);
        assert.equal(topic.Customers.oauth.secret, 'an_api_secret');
      },
      'Creates top-level keys to set new values': function (topic) {
        util.setPath(topic, ['NewKey'], 'NEW_VALUE');
        assert.equal(topic.NewKey, 'NEW_VALUE');
      },
      'Creates sub-keys to set new values': function (topic) {
        util.setPath(topic, ['TestModule', 'oauth'], 'NEW_VALUE');
        assert.equal(topic.TestModule.oauth, 'NEW_VALUE');
      },
      'Creates parents to set new values': function (topic) {
        util.setPath(topic, ['EnvOverride', 'oauth', 'secret'], 'NEW_VALUE');
        assert.equal(topic.EnvOverride.oauth.secret, 'NEW_VALUE');
      },
      'Overwrites existing values': function (topic) {
        util.setPath(topic, ['Customers'], 'NEW_VALUE');
        assert.equal(topic.Customers, 'NEW_VALUE');
      },
      'can handled dotted string paths': function (topic) {
        util.setPath(topic, 'EnvOverride.oauth.secret', 'ANOTHER');
        assert.equal(topic.EnvOverride.oauth.secret, 'ANOTHER');
      },
    },
  })
  .addBatch({
    'Load.initParam()': {
      topic: function () {
        return new Load({});
      },
      'The function exists': function (load) {
        assert.isFunction(load.initParam);
      },
      'looks up values': function (load) {
        process.env.NODE_CONFIG = '{"EnvOverride":{"parm4":100}}';

        let result = load.initParam('NODE_CONFIG');

        assert.equal(result, '{"EnvOverride":{"parm4":100}}');

        delete process.env.NODE_CONFIG;
      },
      'defaults on missing value up values': function (load) {
        delete process.env.NODE_CONFIG;

        let result = load.initParam('NODE_CONFIG', '{}');

        assert.equal(result, '{}');
      },
      'tracks lookups': function (load) {
        delete process.env.NODE_CONFIG;
        delete process.env.NODE_CONFIG_FOO;

        load.initParam('NODE_CONFIG', true);
        load.initParam('NODE_CONFIG_FOO', "small");

        assert.equal(load.getEnv('NODE_CONFIG'), true);
        assert.equal(load.getEnv('NODE_CONFIG_FOO'), "small");
      },
    },
    'Load.addConfig()': {
      topic: function () {
        return new Load({});
      },
      'The function exists': function (load) {
        assert.isFunction(load.addConfig);
      },
      'adds new fields': function (load) {
        load.addConfig("first", { foo: { field1: 'new'}});
        assert.deepEqual(load.config, { foo: { field1: 'new' } });
      },
      'composes values': function (load) {
        load.addConfig("second", { foo: { field2: 'another' } });
        assert.deepEqual(load.config, { foo: { field1: 'new', field2: 'another' } });
      },
      'chains on itself': function () {
        let load = new Load({});
        load
          .addConfig("first", {foo: {field1: 'blue'}})
          .addConfig("second", {foo: {field2: 'green'}});

        assert.deepEqual(load.config, { foo: { field1: 'blue', field2: 'green' } });
      },
      'tracks the sources': function () {
        let load = new Load({});
        load.addConfig("first", { foo: { field1: 'new' }});
        load.addConfig("second", { foo: { field2: 'another' }});

        assert.deepEqual(load.getSources(), [
          {
            name: 'first',
            parsed: { foo: { field1: 'new' } }
          },
          {
            name: 'second',
            parsed: { foo: { field2: 'another' } }
          }
        ]);
      }
    },
    'Load.setModuleDefaults()': {
      topic: function () {
        let load = new Load({});
        load.addConfig("first", { foo: { field1: 'set'}});
        return load;
      },
      'The function exists': function (load) {
        assert.isFunction(load.setModuleDefaults);
      },
      'adds new defaults': function (load) {
        load.setModuleDefaults("foo", { field2: 'another'});

        assert.deepEqual(load.config, { foo: { field1: 'set', field2: 'another' } });
      },
      'can be called multiple times for the same key': function (load) {
        load.setModuleDefaults("foo", { field2: 'another'});
        load.setModuleDefaults("foo", { field3: 'additional'});

        assert.deepEqual(load.config, { foo: { field1: 'set', field2: 'another', field3: 'additional' } });
      },
      'tracks the sources': function () {
        let load = new Load({});
        load.setModuleDefaults("foo", { field2: 'another'});

        assert.deepEqual(load.getSources(), [
          {
            name: 'Module Defaults',
            parsed: { foo: { field2: 'another' } }
          }
        ]);
      },
      'can disable tracking sources': function () {
        let load = new Load({skipConfigSources: true});
        load.setModuleDefaults("foo", { field2: 'another'});

        assert.isEmpty(load.getSources());
      }
    },
    'Load.loadFile()': {
      topic: function () {
        return new Load({configDir: './config'});
      },
      'The function exists': function(load) {
        assert.isFunction(load.loadFile);
      },
      'throws no error on missing file': function (load) {
        assert.doesNotThrow(() => load.loadFile(Path.join(__dirname, './config/missing.json')));
      },
      'throws error on other file issues': function (load) {
        assert.throws(() => load.loadFile(Path.join(__dirname, './config/')));
      },
      'adds new values': function(load) {
        load.loadFile(Path.join(__dirname, './config/default.json'));

        assert.deepEqual(load.config.staticArray, [2,1,3]);
      },
      'uses an optional transform on the data': function(load) {
        load.loadFile(Path.join(__dirname, './config/default-3.json'), () => { return { foo: "bar" } });

        assert.equal(load.config.foo, "bar");
      },
      'tracks the sources': function () {
        let load = new Load({configDir: './config'});
        load.loadFile(Path.join(__dirname, './config/default.json'));

        let sources = load.getSources();

        assert.equal(sources.length, 1);
        assert.isTrue(sources[0].name.endsWith("/config/default.json"));
      }
    },
    'Load.fromEnvironment()': {
      'nodeEnv values': {
        'defaults env to development when NODE_CONFIG_ENV and NODE_ENV are undefined': function () {
          try {
            delete process.env.NODE_ENV;
            delete process.env.NODE_CONFIG_ENV;

            let loadInfo = Load.fromEnvironment();

            assert.equal(loadInfo.options.nodeEnv, 'development');
            assert.equal(loadInfo.getEnv('NODE_ENV'), 'development');
            assert.equal(loadInfo.getEnv('NODE_CONFIG_ENV'), 'development');
          } finally {
          }
        },
        'defaults to NODE_ENV if NODE_CONFIG_ENV is not set': function () {
          try {
            process.env.NODE_ENV = 'apollo';

            let loadInfo = Load.fromEnvironment();

            assert.equal(loadInfo.options.nodeEnv, 'apollo');
            assert.equal(loadInfo.getEnv('NODE_ENV'), 'apollo');
            assert.equal(loadInfo.getEnv('NODE_CONFIG_ENV'), 'apollo');
          } finally {
            delete process.env.NODE_ENV;
          }
        },
        'uses NODE_CONFIG_ENV when NODE_ENV is unset': function () {
          try {
            process.env.NODE_CONFIG_ENV = 'mercury';

            let loadInfo = Load.fromEnvironment();

            assert.equal(loadInfo.options.nodeEnv, 'mercury');
            assert.equal(loadInfo.getEnv('NODE_ENV'), undefined);
            assert.equal(loadInfo.getEnv('NODE_CONFIG_ENV'), 'mercury');
          } finally {
            delete process.env.NODE_CONFIG_ENV;
          }
        },
        'prefers NODE_CONFIG_ENV': function () {
          try {
            process.env.NODE_ENV = 'mercury';
            process.env.NODE_CONFIG_ENV = 'apollo';

            let loadInfo = Load.fromEnvironment();

            assert.equal(loadInfo.options.nodeEnv, 'apollo');
            assert.equal(loadInfo.getEnv('NODE_ENV'), 'mercury');
            assert.equal(loadInfo.getEnv('NODE_CONFIG_ENV'), 'apollo');
          } finally {
            delete process.env.NODE_ENV;
            delete process.env.NODE_CONFIG_ENV;
          }
        },
      },
      'host calculations': {
        'uses OS when neither HOST nor HOSTNAME are set': function() {
          try {
            delete process.env.HOST;
            delete process.env.HOSTNAME;

            let loadInfo = Load.fromEnvironment();

            assert.isString(loadInfo.getEnv('HOSTNAME'));
            assert.isString(loadInfo.options.hostName);
          } finally {
          }
        },
        'uses HOSTNAME if it is set': function() {
          try {
            delete process.env.HOST;
            process.env.HOSTNAME = 'foo.example.com';

            let loadInfo = Load.fromEnvironment();

            assert.equal(loadInfo.getEnv('HOSTNAME'), 'foo.example.com');
          } finally {
            delete process.env.HOST;
            delete process.env.HOSTNAME;
          }
        },
        'prefers HOST if is set': function() {
          try {
            process.env.HOST = 'correct.example.com';
            process.env.HOSTNAME = 'foo.example.com';

            let loadInfo = Load.fromEnvironment();

            assert.equal(loadInfo.getEnv('HOSTNAME'), 'correct.example.com');
          } finally {
            delete process.env.HOST;
            delete process.env.HOSTNAME;
          }
        }
      },
    },
  })
  .addBatch({
    'Load.substituteDeep()': {
      topic: function () {
        var topic = {
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
        return topic;
      },
      'returns an empty object if the variables mapping is empty': function (topic) {
        let load = new Load();
        let substituted = load.substituteDeep(topic, {});

        assert.deepEqual(substituted, {});
      },
      'returns an empty object if none of the variables map to leaf strings': function (topic) {
        let load = new Load();
        let substituted = load.substituteDeep(topic, {NON_EXISTENT_VAR: 'ignore_this'});

        assert.deepEqual(substituted, {});
      },
      'returns an object with keys matching down to mapped existing variables': function (topic) {
        let load = new Load();
        let substituted = load.substituteDeep(topic, {
          'SOME_TOP_LEVEL': 5,
          'DB_NAME': 'production_db',
          'OAUTH_SECRET': '123456',
          'PATH': 'ignore other environment variables'
        });

        assert.deepEqual(substituted, {
          TopLevel: 5,
          Customers: {
            dbName: 'production_db',
            oauth: {
              secret: '123456'
            }
          }
        });
      },
      'returns an object with keys matching down to mapped existing and defined variables': function (topic) {
        let load = new Load();
        let substituted = load.substituteDeep(topic, {
          'SOME_TOP_LEVEL': 0,
          'DB_HOST': undefined,
          'DB_NAME': '',
          'OAUTH_SECRET': 'false',
          'OAUTH_KEY': 'null',
          'PATH': ''
        });

        assert.deepEqual(substituted, {
          TopLevel: 0,
          Customers: {
            oauth: {
              key: 'null',
              secret: 'false'
            }
          }
        });
      },
      'returns an object with keys matching down to mapped existing variables with JSON content': function (topic) {
        let load = new Load();
        let substituted = load.substituteDeep(topic, {
          'DB_HOST': '{"port":"3306","host":"example.com"}'
        });

        assert.deepEqual(substituted, {
          Customers: {
            dbHost: '{"port":"3306","host":"example.com"}'
          }
        });
      },
      'returns an object with keys matching down to mapped existing and defined variables with JSON content': function (topic) {
        let dbHostObject = {
          param1WithZero: 0,
          param2WithFalse: false,
          param3WithNull: null,
          param4WithEmptyObject: {},
          param5WithEmptyArray: [],
          param6WithEmptyString: ''
        };
        let dbHostObjectWithUndefinedProperty = Object.assign({}, dbHostObject, {param7WithUndefined: undefined});

        let load = new Load();
        let substituted = load.substituteDeep(topic, {
          'DB_HOST': JSON.stringify(dbHostObjectWithUndefinedProperty)
        });

        assert.deepEqual(substituted, {
          Customers: {
            dbHost: JSON.stringify(dbHostObject)
          }
        });
      },
      'returns an object with keys matching down to mapped and JSON-parsed existing variables': function (topic) {
        topic.Customers.dbHost = {__name: 'DB_HOST', __format: 'json'};

        let load = new Load();
        let substituted = load.substituteDeep(topic, {
          'DB_HOST': '{"port":"3306","host":"example.com"}'
        });

        assert.deepEqual(substituted, {
          Customers: {
            dbHost: {
              port: '3306',
              host: 'example.com'
            }
          }
        });
      },
      'returns an object with keys matching down to mapped and JSON-parsed existing and defined variables': function (topic) {
        let dbHostObject = {
          param1WithZero: 0,
          param2WithFalse: false,
          param3WithNull: null,
          param4WithEmptyObject: {},
          param5WithEmptyArray: [],
          param6WithEmptyString: ''
        };
        let dbHostObjectWithUndefinedProperty = Object.assign({}, dbHostObject, {param7WithUndefined: undefined});
        let load = new Load();

        topic.Customers.dbHost = {__name: 'DB_HOST', __format: 'json'};

        let substituted = load.substituteDeep(topic, {
          'DB_HOST': JSON.stringify(dbHostObjectWithUndefinedProperty)
        });

        assert.deepEqual(substituted, {
          Customers: {
            dbHost: dbHostObject
          }
        });
      },
      'throws an error for leaf Array values': function (topic) {
        // Testing all the things in variable maps that don't make sense because ENV vars are always
        // strings.
        topic.Customers.dbHost = ['a', 'b', 'c'];

        let load = new Load();

        assert.throws(function () {
          load.substituteDeep(topic, {
            NON_EXISTENT_VAR: 'ignore_this'
          });
        });
      },
      'throws an error for leaf Boolean values': function (topic) {
        topic.Customers.dbHost = false;

        let load = new Load();

        assert.throws(function () {
          load.substituteDeep(topic, {
            NON_EXISTENT_VAR: 'ignore_this'
          });
        });
      },
      'throws an error for leaf Numeric values': function (topic) {
        topic.Customers.dbHost = 443;

        let load = new Load();

        assert.throws(function () {
          load.substituteDeep(topic, {
            NON_EXISTENT_VAR: 'ignore_this'
          });
        });
      },
      'throws an error for leaf null values': function (topic) {
        topic.Customers.dbHost = null;

        let load = new Load();

        assert.throws(function () {
          load.substituteDeep(topic, {
            NON_EXISTENT_VAR: 'ignore_this'
          });
        });
      },
      'throws an error for leaf Undefined values': function (topic) {
        topic.Customers.dbHost = undefined;

        let load = new Load();

        assert.throws(function () {
          load.substituteDeep(topic, {
            NON_EXISTENT_VAR: 'ignore_this'
          });
        });
      },
      'throws an error for leaf NaN values': function (topic) {
        topic.Customers.dbHost = NaN;

        let load = new Load();

        assert.throws(function () {
          load.substituteDeep(topic, {
            NON_EXISTENT_VAR: 'ignore_this'
          });
        });
      },
      'throws an error with message describing variables name that throw a parser error': function(topic) {
        var JSON_WITH_SYNTAX_ERROR = '{"port":"3306","host" "example.com"}'

        topic.Customers.dbHost = {__name: 'DB_HOST', __format: 'json'};

        let load = new Load();

        assert.throws(function () {
          load.substituteDeep(topic, {
            'DB_HOST': JSON_WITH_SYNTAX_ERROR
          });
        },  /__format parser error in DB_HOST: /);
      },
    },
    'Load.loadCustomEnvVars()': {
      'should override from the environment variables': function () {
        // Test Environment Variable Substitution
        let expected = 'CUSTOM VALUE FROM JSON ENV MAPPING';
        process.env.CUSTOM_JSON_ENVIRONMENT_VAR = expected;

        let load = new Load({nodeEnv: 'production', configDir: __dirname + '/config'})
        load.loadCustomEnvVars();
        assert.deepStrictEqual(load.config.customEnvironmentVariables, { "mappedBy": { "json": expected } });
      },
      'should override from the environment variables': function () {
        // Test Environment Variable Substitution
        let expected = 'CUSTOM VALUE FROM JSON ENV MAPPING';
        process.env.CUSTOM_JSON_ENVIRONMENT_VAR = expected;

        try {
          let load = new Load({nodeEnv: 'production', configDir: __dirname + '/config'})
          load.loadCustomEnvVars();
          assert.isObject(load.config.customEnvironmentVariables);
          assert.isObject(load.config.customEnvironmentVariables.mappedBy);
          assert.deepStrictEqual(load.config.customEnvironmentVariables.mappedBy, {"json": expected});
        } finally {
          delete process.env.CUSTOM_JSON_ENVIRONMENT_VAR;
        }
      },
      'can handle boolean values': function () {
        process.env.CUSTOM_BOOLEAN_TRUE_ENVIRONMENT_VAR = 'true';
        process.env.CUSTOM_BOOLEAN_FALSE_ENVIRONMENT_VAR = 'false';
        process.env.CUSTOM_BOOLEAN_ERROR_ENVIRONMENT_VAR = 'notProperBoolean';

        try {
          let load = new Load({nodeEnv: 'production', configDir: __dirname + '/config'})
          load.loadCustomEnvVars();
          assert.isObject(load.config.customEnvironmentVariables.mappedBy);
          assert.deepStrictEqual(load.config.customEnvironmentVariables.mappedBy.formats,
            { "booleanTrue": true, "booleanFalse": false, "notProperBoolean": false });
        } finally {
          delete process.env.CUSTOM_BOOLEAN_TRUE_ENVIRONMENT_VAR;
          delete process.env.CUSTOM_BOOLEAN_FALSE_ENVIRONMENT_VAR;
          delete process.env.CUSTOM_BOOLEAN_ERROR_ENVIRONMENT_VAR;
        }
      },
      'can handle numeric values': function () {
        // Test Environment variable substitution of numeric values
        let numberInteger = 1001;
        let numberFloat = 3.14
        process.env.CUSTOM_NUMBER_INTEGER_ENVIRONMENT_VAR = numberInteger;
        process.env.CUSTOM_NUMBER_FLOAT_ENVIRONMENT_VAR = numberFloat;
        process.env.CUSTOM_NUMBER_EMPTY_ENVIRONMENT_VAR = '';
        process.env.CUSTOM_NUMBER_STRING_ENVIRONMENT_VAR = 'String';

        let load = new Load({nodeEnv: 'production', configDir: __dirname + '/config'})
        load.loadCustomEnvVars();
        assert.isObject(load.config.customEnvironmentVariables.mappedBy);
        assert.deepStrictEqual(load.config.customEnvironmentVariables.mappedBy.formats,
          { "numberInteger": 1001, "numberFloat": 3.14, "numberString": undefined });
      }
    },
  })
  .addBatch({
    'Util.resolveDeferredConfigs()': {
      'The function exists': function () {
        assert.isFunction(util.resolveDeferredConfigs);
      },
      'expands values': function() {
        let data = {
          deferreds: {
            foo: '3',
            bar: deferConfig(() => {
              return 4;
            })
          }
        };

        util.resolveDeferredConfigs(data);

        assert.deepStrictEqual(data.deferreds, { foo: '3', bar: 4});
      },
      'works for arrays': function() {
        let data = {
          deferreds: {
            foo: 2,
            bar: [deferConfig(() => {
              return 4;
            })]
          }
        };

        util.resolveDeferredConfigs(data);

        assert.deepStrictEqual(data.deferreds, { foo: 2, bar: [4]});
      },
      'handles recursive expansion': function() {
        let data = {
          deferreds: {
            foo: deferConfig(() => {
              return 4;
            }),
            bar: deferConfig((config) => {
              return `${config.deferreds.foo} interpolated`
            })
          }
        };

        util.resolveDeferredConfigs(data);

        assert.deepStrictEqual(data.deferreds, { foo: 4, bar: '4 interpolated'});
      }
    },
    'Util.loadFileConfigs()': {
      'The function exists': function () {
        assert.isFunction(util.loadFileConfigs);
      },
      'It can load data from a given directory': function () {
        var result = util.loadFileConfigs({configDir: Path.join(__dirname, '5-config')});

        assert.strictEqual(result.config.number, 5);
      },
      'It ignores NODE_CONFIG': function () {
        var prev = process.env.NODE_CONFIG;
        process.env.NODE_CONFIG = '{"extra": 4}';

        var result = util.loadFileConfigs({configDir: Path.join(__dirname, 'config')});

        assert.strictEqual(result.config.extra, undefined);
        process.env.NODE_CONFIG = prev;
      },
      'it handles appInstance': function () {
        var result = util.loadFileConfigs({
          configDir: Path.join(__dirname, 'config'),
          appInstance: 3
        });

        assert.strictEqual(result.config.Customers.altDbPort, 4400);
      },
      'it loads CSON files': function () {
        var result = util.loadFileConfigs({
          configDir: Path.join(__dirname, 'config')
        });

        assert.isObject(result.config.Customers);
        assert.isArray(result.config.Customers.lang);
        assert.equal(result.config.Customers.other, 'from_default_cson');
        assert.isObject(result.config.AnotherModule);
        assert.equal(result.config.AnotherModule.parm4, "value4");
      },
      ' .properties files': {
        topic: function() {
          return util.loadFileConfigs({
            configDir: Path.join(__dirname, 'config')
          }).config;
        },
        'values are loaded': function(config) {
          assert.isObject(config.AnotherModule);
          assert.equal(config.AnotherModule.parm5, "value5");
          assert.isObject(config['key with spaces']);
          assert.isTrue(config['key with spaces'].another_key == 'hello');
          assert.isUndefined(config.ignore_this_please);
          assert.isUndefined(config.i_am_a_comment);
        },
        'handles variable expansion': function(config) {
          assert.isTrue(config.replacement.param == "foobar")
        },
        'Sections are supported': function(config) {
          assert.isDefined(config.section.param);
          assert.isUndefined(config.param);
        },
      }
    },
  })
  .addBatch({
    'Load.scan()': {
      'The function exists': function () {
        const load = new Load();
        assert.isFunction(load.scan);
      },
      'It can load data from a given directory': function () {
        let load = new Load({configDir: __dirname + '/config'})
        load.scan();

        assert.isObject(load.config.Customers);
      },
      'It merges in the provided data': function () {
        let load = new Load({configDir: __dirname + '/config'})
        load.scan([{ name: 'a', config: {foo: 'bar'} }]);

        assert.equal(load.config.foo, 'bar');
      },
      'can disable source accumulation': function() {
        let load = new Load({configDir: __dirname + '/config', skipConfigSources: true});
        load.scan();

        assert.isEmpty(load.getSources());
      }
    },
  })
.export(module);

