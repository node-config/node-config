/**
 * <p>Unit tests</p>
 *
 * @module test
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const Path = require('path');
const util = require('../lib/util.js').Util;
const Load = require('../lib/util.js').Load;
const deferConfig = require('../defer').deferConfig;

describe('Tests for util functions', function () {
  describe('Util.isObject()', function() {
    it('The function exists', function () {
      assert.strictEqual(typeof util.isObject, 'function');
    });

    it('Correctly identifies objects', function () {
      assert.strictEqual(util.isObject({A: "b"}), true);
    });

    it('Correctly excludes non-objects', function () {
      assert.strictEqual(util.isObject("some string"), false);
      assert.strictEqual(util.isObject(45), false);
      assert.strictEqual(util.isObject([2, 3]), false);
      assert.strictEqual(util.isObject(["a", "b"]), false);
      assert.strictEqual(util.isObject(null), false);
      assert.strictEqual(util.isObject(undefined), false);
    });
  })

  describe('Util.isPromise()', function() {
    it('can identify a new Promise', function () {
      assert.strictEqual(util.isPromise(new Promise(() => {
      })), true);
    });

    it('can identify a resolved Promise', function () {
      assert.strictEqual(util.isPromise(Promise.resolve()), true);
    });

    it('can identify a rejected Promise', function () {
      // Use .catch to avoid `UnhandledPromiseRejectionWarning`, DO NOT REMOVE
      assert.strictEqual(util.isPromise(Promise.reject().catch(function () {
      })), true);
    });

    it('can identify other things different as no promises', function () {
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
        assert.strictEqual(util.isPromise(testCase), false);
      });
    });
  });

  describe('Util.makeHidden()', function() {
    let object;

    beforeEach(function () {
      object = {
        item1: 23,
        subObject: {
          item2: "hello"
        }
      };
    });

    it('The makeHidden() method is available', function () {
      assert.strictEqual(typeof util.makeHidden, 'function');
    });

    it('The test object (before hiding) is correct', function () {
      assert.strictEqual(JSON.stringify(object), '{"item1":23,"subObject":{"item2":"hello"}}');
    });

    it('The test object (after hiding) is correct', function () {
      util.makeHidden(object, 'item1');
      assert.strictEqual(JSON.stringify(object), '{"subObject":{"item2":"hello"}}');
    });

    it('The hidden property is readable, and has not changed', function () {
      util.makeHidden(object, 'item1');
      assert.strictEqual(JSON.stringify(object), '{"subObject":{"item2":"hello"}}');
      assert.strictEqual(object.item1, 23);
    });

    it('The hidden property is readable, and updated', function () {
      util.makeHidden(object, 'newValue', 3);
      assert.strictEqual(JSON.stringify(object), '{"item1":23,"subObject":{"item2":"hello"}}');
      assert.strictEqual(object.newValue, 3);
    });
  });

  describe('Util.getOption()', function() {
    let options;

    beforeEach(function() {
      options = {
        item1: 23,
        item2: 0,
        item3: "hello"
      };
    });

    it('The getOption() method is available', function () {
      assert.strictEqual(typeof util.getOption, 'function');
    });

    it('returns a field', function () {
      assert.strictEqual(util.getOption(options, "item1"), 23);
    });

    it('falls back to a default', function () {
      assert.strictEqual(util.getOption(options, "missing", "orange"), "orange");
    });

    it('handles falsey values', function () {
      assert.strictEqual(util.getOption(options, "item2", "orange"), 0);
    });
  });

  describe('Util.locateMatchingFiles()', function() {
    it('The locateMatchingFiles() method is available', function () {
      assert.strictEqual(typeof util.locateMatchingFiles, 'function');
    });

    it('returns files in the correct order', function () {
      let allowed = {"default.mjs": 2, "default.json": 1};
      let results = util.locateMatchingFiles("./test/config", allowed);
      assert.strictEqual(Path.basename(results[0]), "default.json");
      assert.strictEqual(Path.basename(results[1]), "default.mjs");
    });
  });

  describe('Util.equalsDeep()', function() {
    let orig;
    beforeEach(function () {
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
      assert.strictEqual(typeof util.equalsDeep, 'function');
    });

    it('handles undefined', function () {
      assert.strictEqual(util.equalsDeep(), false); //TODO: is this right?
      assert.strictEqual(util.equalsDeep([1, 2, 3]), false);
      assert.strictEqual(util.equalsDeep(undefined, [1, 2, 3]), false);
    });

    it('handles primitives', function () {
      assert.strictEqual(util.equalsDeep(1, 1), true);
      assert.strictEqual(util.equalsDeep(1, 2), false);
      assert.strictEqual(util.equalsDeep("foo", "foo"), true);
    });

    it('handles mismatched types', function () {
      assert.strictEqual(util.equalsDeep({value: 3}, "three"), false);
    });

    it('can compare arrays', function () {
      assert.strictEqual(util.equalsDeep([1, 2, 3], [1, 2, 3]), true);
      assert.strictEqual(util.equalsDeep([1, 2, 3], [1, 2, 4]), false);
      assert.strictEqual(util.equalsDeep([1, 2, 3], [1, 2]), false);
      assert.strictEqual(util.equalsDeep([1, 2], [1, 2, 3]), false);
    });

    it('can compare objects', function () {
      assert.strictEqual(util.equalsDeep({a: 1, b: 2}, {a: 1, b: 2}), true);
      assert.strictEqual(util.equalsDeep({a: 1, b: 2}, {a: 1, b: 3}), false);
      assert.strictEqual(util.equalsDeep({a: 1, b: {c: 3}}, {a: 1, b: {c: 3}}), true);
      assert.strictEqual(util.equalsDeep({a: 1, b: {c: 3}}, {a: 1, b: {c: 3, d: 2}}), false);
    });

    it('Catches subsets', function () {
      let copy = {...orig};
      delete copy.elem6;

      assert.strictEqual(util.equalsDeep(orig, copy), false);
    });

    it('Catches supersets', function () {
      let copy = {...orig};
      copy.elem7 = "new";

      assert.strictEqual(util.equalsDeep(orig, copy), false);
    });
  });

  describe('Util.cloneDeep()', function() {
    let orig;

    beforeEach(function () {
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
      assert.strictEqual(typeof util.cloneDeep, 'function');
    });

    it('Original and copy should test equivalent (deep)', function () {
      var copy = util.cloneDeep(orig);
      assert.deepEqual(copy, orig);
    });

    it('The objects should be different', function () {
      var copy = util.cloneDeep(orig);
      copy.elem1 = false;
      assert.notDeepEqual(copy, orig);
    });

    it('Object clones should be objects', function () {
      assert.strictEqual(typeof util.cloneDeep({a: 1, b: 2}), 'object');
    });

    it('Array clones should be arrays', function () {
      assert.ok(Array.isArray(util.cloneDeep(["a", "b", 3])));
    });

    it('Arrays should be copied by value, not by reference', function () {
      var copy = util.cloneDeep(orig);
      assert.deepEqual(copy, orig);
      copy.elem3[0] = 2;
      // If the copy wasn't deep, elem3 would be the same object
      assert.notDeepEqual(copy, orig);
    });

    it('Objects should be copied by value, not by reference', function () {
      var copy = util.cloneDeep(orig);
      copy.elem5.sub2 = 3;
      assert.notDeepEqual(copy, orig);
      copy = util.cloneDeep(orig);
      copy.elem5.sub3[1] = 3;
      assert.notDeepEqual(copy, orig);
    });

    it('Regexps and dates are preserved', function () {
      var copy = util.cloneDeep(orig);
      assert.strictEqual(copy.elem6.date.constructor.name, 'Date');
      assert.strictEqual(copy.elem6.regexp.toString(), '/test/i');
    });
  });

  describe('Util.extendDeep()', function() {
    it('The function exists', function () {
      assert.strictEqual(typeof util.extendDeep, 'function');
    });

    it('Performs normal extend', function () {
      var orig = {elem1: "val1", elem2: "val2"};
      var extWith = {elem3: "val3"};
      var shouldBe = {elem1: "val1", elem2: "val2", elem3: "val3"};

      assert.deepEqual(util.extendDeep(orig, extWith), shouldBe);
    });

    it('Replaces non-objects', function () {
      var orig = {elem1: "val1", elem2: ["val2", "val3"], elem3: {sub1: "val4"}};
      var extWith = {elem1: 1, elem2: ["val4"], elem3: "val3"};
      var shouldBe = {elem1: 1, elem2: ["val4"], elem3: "val3"};
      assert.deepEqual(util.extendDeep(orig, extWith), shouldBe);
    });

    it('Merges objects', function () {
      var orig = {e1: "val1", elem2: {sub1: "val4", sub2: "val5"}};
      var extWith = {elem2: {sub2: "val6", sub3: "val7"}};
      var shouldBe = {e1: "val1", elem2: {sub1: "val4", sub2: "val6", sub3: "val7"}};

      assert.deepEqual(util.extendDeep(orig, extWith), shouldBe);
    });

    it('Merges dates', function () {
      var orig = {e1: "val1", elem2: {sub1: "val4", sub2: new Date(2015, 0, 1)}};
      var extWith = {elem2: {sub2: new Date(2015, 0, 2), sub3: "val7"}};
      var shouldBe = {e1: "val1", elem2: {sub1: "val4", sub2: new Date(2015, 0, 2), sub3: "val7"}};

      assert.deepEqual(util.extendDeep(orig, extWith), shouldBe);
    });

    it('Creates partial objects when mixing objects and non-objects', function () {
      var orig = {elem1: {sub1: 5}};
      var ext1 = {elem1: {sub2: 7}};
      var ext2 = {elem1: 7};
      var ext3 = {elem1: {sub3: 13}};
      // When we get to ext2, the 7 clears all memories of sub1 and sub3. Then, when
      // we merge with ext3, the 7 is replaced by the new object.
      var expected = {elem1: {sub3: 13}};

      assert.deepEqual(util.extendDeep(orig, ext1, ext2, ext3), expected);
    });

    it('Correctly types new objects and arrays', function () {
      var orig = {e1: "val1", e3: ["val5"]};
      var extWith = {e2: {elem1: "val1"}, e3: ["val6", "val7"]};
      var shouldBe = {e1: "val1", e2: {elem1: "val1"}, e3: ["val6", "val7"]};
      var ext = util.extendDeep({}, orig, extWith);

      assert.strictEqual(typeof ext.e2, 'object');
      assert.strictEqual(typeof ext.e3, 'object');
      assert.deepEqual(ext, shouldBe);
    });

    it('Keeps non-merged objects intact', function () {
      var orig = {e1: "val1", elem2: {sub1: "val4", sub2: "val5"}};
      var shouldBe = {e1: "val1", elem2: {sub1: "val4", sub2: "val5"}};
      var extWith = {elem3: {sub2: "val6", sub3: "val7"}};

      util.extendDeep({}, orig, extWith);
      assert.deepEqual(orig, shouldBe);
    });

    it('Keeps prototype methods intact', function () {
      var orig = Object.create({
        has: function () {
        }
      });
      var result = util.extendDeep({}, orig, {});

      assert.strictEqual(typeof result.has, 'function');
    });

    it('Keeps keys with no value', function() {
      var orig = Object.create({foo: 3, bar: 4});

      var result = util.extendDeep({}, orig, {baz: undefined});
      assert.strictEqual(Object.keys(result).length, 3);
    });
  });

  describe('Util.toObject() tests', function() {
    it('The function exists', function () {
      assert.strictEqual(typeof util.toObject, 'function');
    });

    it('Returns a serialized version of the given object', function () {
      let input = {some: {field: 4}};
      assert.notStrictEqual(util.toObject(input), input);
    });
  });

  describe('getPath() tests:', function () {
    let topic;

    beforeEach(function () {
      topic = {
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

    it('The function exists', function () {
      assert.strictEqual(typeof util.getPath, 'function');
    });

    it('can pull from paths', function () {
      let result = util.getPath(topic, ['Customers', 'oauth', 'secret']);
      assert.strictEqual(result, 'an_api_secret');
    });

    it('can pull from a string path', function () {
      let result = util.getPath(topic, "EnvOverride.parm2");
      assert.strictEqual(result, 22);
    });
  });

  describe('setPath() tests:', function () {
    let topic;

    beforeEach(function () {
      topic = {
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

    it('The function exists', function () {
      assert.strictEqual(typeof util.setPath, 'function');
    });

    it('Ignores null values', function () {
      util.setPath(topic, ['Customers', 'oauth', 'secret'], null);
      assert.strictEqual(topic.Customers.oauth.secret, 'an_api_secret');
    });

    it('Creates top-level keys to set new values', function () {
      util.setPath(topic, ['NewKey'], 'NEW_VALUE');
      assert.strictEqual(topic.NewKey, 'NEW_VALUE');
    });

    it('Creates sub-keys to set new values', function () {
      util.setPath(topic, ['TestModule', 'oauth'], 'NEW_VALUE');
      assert.strictEqual(topic.TestModule.oauth, 'NEW_VALUE');
    });

    it('Creates parents to set new values', function () {
      util.setPath(topic, ['EnvOverride', 'oauth', 'secret'], 'NEW_VALUE');
      assert.strictEqual(topic.EnvOverride.oauth.secret, 'NEW_VALUE');
    });

    it('Overwrites existing values', function () {
      util.setPath(topic, ['Customers'], 'NEW_VALUE');
      assert.strictEqual(topic.Customers, 'NEW_VALUE');
    });

    it('can handled dotted string paths', function () {
      util.setPath(topic, 'EnvOverride.oauth.secret', 'ANOTHER');
      assert.strictEqual(topic.EnvOverride.oauth.secret, 'ANOTHER');
    });

    it('returns the given value', function () {
      let input = { foo: "3"};
      assert.strictEqual(util.setPath(topic, 'some.path', input), input);
    });
  });

  describe('Load.initParam()', function () {
    let load;

    beforeEach(function () {
      load = new Load({});
    });

    it('The function exists', function () {
      assert.strictEqual(typeof load.initParam, 'function');
    });

    it('looks up values', function () {
      process.env.NODE_CONFIG = '{"EnvOverride":{"parm4":100}}';

      let result = load.initParam('NODE_CONFIG');

      assert.strictEqual(result, '{"EnvOverride":{"parm4":100}}');

      delete process.env.NODE_CONFIG;
    });

    it('defaults on missing value up values', function () {
      delete process.env.NODE_CONFIG;

      let result = load.initParam('NODE_CONFIG', '{}');

      assert.strictEqual(result, '{}');
    });

    it('tracks lookups', function () {
      delete process.env.NODE_CONFIG;
      delete process.env.NODE_CONFIG_FOO;

      load.initParam('NODE_CONFIG', true);
      load.initParam('NODE_CONFIG_FOO', "small");

      assert.strictEqual(load.getEnv('NODE_CONFIG'), true);
      assert.strictEqual(load.getEnv('NODE_CONFIG_FOO'), "small");
    });
  });

  describe('Load.addConfig()', function () {
    let load;
    beforeEach(function () {
      load = new Load({});
    });

    it('The function exists', function () {
      assert.strictEqual(typeof load.addConfig, 'function');
    });

    it('adds new fields', function () {
      load.addConfig("first", { foo: { field1: 'new'}});
      assert.deepEqual(load.config, { foo: { field1: 'new' } });
    });

    it('composes values', function () {
      load.addConfig("first", { foo: { field1: 'new'}});
      load.addConfig("second", { foo: { field2: 'another' } });
      assert.deepEqual(load.config, { foo: { field1: 'new', field2: 'another' } });
    });

    it('chains on itself', function () {
      let load = new Load({});
      load
        .addConfig("first", {foo: {field1: 'blue'}})
        .addConfig("second", {foo: {field2: 'green'}});

      assert.deepEqual(load.config, { foo: { field1: 'blue', field2: 'green' } });
    });

    it('tracks the sources', function () {
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
    });
  });

  describe('Load.setModuleDefaults()', function () {
    it('The function exists', function () {
      let load = new Load();
      assert.strictEqual(typeof load.setModuleDefaults, 'function');
    });

    it('adds new defaults', function () {
      let load = new Load({});
      load.addConfig("first", { foo: { field1: 'set'}});

      load.setModuleDefaults("foo", { field2: 'another'});

      assert.deepEqual(load.config, { foo: { field1: 'set', field2: 'another' } });
    });

    it('getSources() and Config.get() are consistent with each other', function () {
      let loadInfo = new Load({});

      loadInfo.setModuleDefaults("foo", { field2: 'another', field4: "1"});
      loadInfo.setModuleDefaults("foo", { field3: 'additional', field4: "2"});

      // this is probably a bug (#822) but at least the sources and the config now agree with each other.
      assert.deepEqual(loadInfo.config, { foo: { field2: 'another', field3: 'additional', field4: '2'}});

      assert.deepEqual(loadInfo.getSources(), [
        {
          name: 'Module Defaults',
          parsed: { foo: { field2: 'another', field3: 'additional', field4: '2' } }
        }
      ]);
    });

    it('can be called multiple times for the same key', function () {
      let load = new Load({});
      load.addConfig("first", { foo: { field1: 'set'}});

      load.setModuleDefaults("foo", { field2: 'another'});
      load.setModuleDefaults("foo", { field3: 'additional'});

      assert.deepEqual(load.config, { foo: { field1: 'set', field2: 'another', field3: 'additional' } });
    });

    it('applies sequential calls in the correct order', function () {
      let load = new Load({});
      load.addConfig("first", { foo: { field1: 'set'}});

      load.setModuleDefaults("foo", { field2: 'another'});
      load.setModuleDefaults("foo", { field2: 'nevermind'});

      assert.deepEqual(load.config, { foo: { field1: 'set', field2: 'nevermind'} });
    });

    it('handles deferred values', function() {
      let load = new Load({skipConfigSources: true});

      load.addConfig("first", { foo: { field1: 'set' }});
      load.setModuleDefaults("foo", { field2: 'another', deferredField: deferConfig((cfg) => `${cfg.foo.field1}3`) });

      assert.deepEqual(load.config, { foo: { field1: 'set', field2: 'another', deferredField: 'set3' } });
    });

    it('tracks the sources', function () {
      let load = new Load({});
      load.setModuleDefaults("foo", { field2: 'another'});

      assert.deepEqual(load.getSources(), [
        {
          name: 'Module Defaults',
          parsed: { foo: { field2: 'another' } }
        }
      ]);
    });

    it('can disable tracking sources', function () {
      let load = new Load({skipConfigSources: true});
      load.setModuleDefaults("foo", { field2: 'another'});

      assert.deepEqual(load.getSources(), []);
    });
  });

  describe('Load.loadFile()', function () {
    let load;

    beforeEach(function () {
      load = new Load({configDir: './config'});
    });

    it('The function exists', function() {
      assert.strictEqual(typeof load.loadFile, 'function');
    });

    it('throws no error on missing file', function () {
      assert.doesNotThrow(() => load.loadFile(Path.join(__dirname, './config/missing.json')));
    });

    it('throws error on other file issues', function () {
      assert.throws(() => load.loadFile(Path.join(__dirname, './config/')));
    });

    it('adds new values', function() {
      load.loadFile(Path.join(__dirname, './config/default.json'));

      assert.deepEqual(load.config.staticArray, [2,1,3]);
    });

    it('uses an optional transform on the data', function() {
      load.loadFile(Path.join(__dirname, './config/default-3.json'), () => { return { foo: "bar" } });

      assert.strictEqual(load.config.foo, "bar");
    });

    it('tracks the sources', function () {
      let load = new Load({configDir: './config'});
      load.loadFile(Path.join(__dirname, './config/default.json'));

      let sources = load.getSources();

      assert.strictEqual(sources.length, 1);
      assert.ok(sources[0].name.endsWith("/config/default.json"));
    });
  });

  describe('Load.fromEnvironment()', function () {
    describe('nodeEnv values', function() {
      it('defaults env to development when NODE_CONFIG_ENV and NODE_ENV are undefined', function () {
        try {
          delete process.env.NODE_ENV;
          delete process.env.NODE_CONFIG_ENV;

          let loadInfo = Load.fromEnvironment();

          assert.deepEqual(loadInfo.options.nodeEnv, ['development']);
          assert.strictEqual(loadInfo.getEnv('NODE_ENV'), 'development');
          assert.strictEqual(loadInfo.getEnv('NODE_CONFIG_ENV'), 'development');
        } finally {
        }
      });

      it('defaults to NODE_ENV if NODE_CONFIG_ENV is not set', function () {
        try {
          process.env.NODE_ENV = 'apollo';

          let loadInfo = Load.fromEnvironment();

          assert.deepEqual(loadInfo.options.nodeEnv, ['apollo']);
          assert.strictEqual(loadInfo.getEnv('NODE_ENV'), 'apollo');
          assert.strictEqual(loadInfo.getEnv('NODE_CONFIG_ENV'), 'apollo');
        } finally {
          delete process.env.NODE_ENV;
        }
      });

      it('uses NODE_CONFIG_ENV when NODE_ENV is unset', function () {
        try {
          process.env.NODE_CONFIG_ENV = 'mercury';

          let loadInfo = Load.fromEnvironment();

          assert.deepEqual(loadInfo.options.nodeEnv, ['mercury']);
          assert.strictEqual(loadInfo.getEnv('NODE_ENV'), undefined);
          assert.strictEqual(loadInfo.getEnv('NODE_CONFIG_ENV'), 'mercury');
        } finally {
          delete process.env.NODE_CONFIG_ENV;
        }
      });

      describe('with multiple values', function () {
        it('enumerates the values', function () {
          try {
            process.env.NODE_ENV = 'mercury,apollo';

            let loadInfo = Load.fromEnvironment();

            assert.deepEqual(loadInfo.options.nodeEnv, ['mercury', 'apollo']);
          } finally {
            delete process.env.NODE_ENV;
          }
        });
      });
    });

    describe('host calculations', function () {
      it('uses OS when neither HOST nor HOSTNAME are set', function() {
        try {
          delete process.env.HOST;
          delete process.env.HOSTNAME;

          let loadInfo = Load.fromEnvironment();

          assert.strictEqual(typeof loadInfo.getEnv('HOSTNAME'), 'string');
          assert.strictEqual(typeof loadInfo.options.hostName, 'string');
        } finally {
        }
      });

      it('uses HOSTNAME if it is set', function() {
        try {
          delete process.env.HOST;
          process.env.HOSTNAME = 'foo.example.com';

          let loadInfo = Load.fromEnvironment();

          assert.strictEqual(loadInfo.getEnv('HOSTNAME'), 'foo.example.com');
        } finally {
          delete process.env.HOST;
          delete process.env.HOSTNAME;
        }
      });

      it('prefers HOST if is set', function() {
        try {
          process.env.HOST = 'correct.example.com';
          process.env.HOSTNAME = 'foo.example.com';

          let loadInfo = Load.fromEnvironment();

          assert.strictEqual(loadInfo.getEnv('HOSTNAME'), 'correct.example.com');
        } finally {
          delete process.env.HOST;
          delete process.env.HOSTNAME;
        }
      });
    });
  });

  describe('Load.substituteDeep()', function () {
    let topic;

    beforeEach(function () {
      topic = {
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
      let load = new Load();
      let substituted = load.substituteDeep(topic, {});

      assert.deepEqual(substituted, {});
    });

    it('returns an empty object if none of the variables map to leaf strings', function () {
      let load = new Load();
      let substituted = load.substituteDeep(topic, {NON_EXISTENT_VAR: 'ignore_this'});

      assert.deepEqual(substituted, {});
    });

    it('returns an object with keys matching down to mapped existing variables', function () {
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
    });

    it('returns an object with keys matching down to mapped existing and defined variables', function () {
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
    });

    it('returns an object with keys matching down to mapped existing variables with JSON content', function () {
      let load = new Load();
      let substituted = load.substituteDeep(topic, {
        'DB_HOST': '{"port":"3306","host":"example.com"}'
      });

      assert.deepEqual(substituted, {
        Customers: {
          dbHost: '{"port":"3306","host":"example.com"}'
        }
      });
    });

    it('returns an object with keys matching down to mapped existing and defined variables with JSON content', function () {
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
    });

    it('returns an object with keys matching down to mapped and JSON-parsed existing variables', function () {
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
    });

    it('returns an object with keys matching down to mapped and JSON-parsed existing and defined variables', function () {
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
    });

    it('throws an error for leaf Array values', function () {
      // Testing all the things in variable maps that don't make sense because ENV vars are always
      // strings.
      topic.Customers.dbHost = ['a', 'b', 'c'];

      let load = new Load();

      assert.throws(function () {
        load.substituteDeep(topic, {
          NON_EXISTENT_VAR: 'ignore_this'
        });
      });
    });

    it('throws an error for leaf Boolean values', function () {
      topic.Customers.dbHost = false;

      let load = new Load();

      assert.throws(function () {
        load.substituteDeep(topic, {
          NON_EXISTENT_VAR: 'ignore_this'
        });
      });
    });

    it('throws an error for leaf Numeric values', function () {
      topic.Customers.dbHost = 443;

      let load = new Load();

      assert.throws(function () {
        load.substituteDeep(topic, {
          NON_EXISTENT_VAR: 'ignore_this'
        });
      });
    });

    it('throws an error for leaf null values', function () {
      topic.Customers.dbHost = null;

      let load = new Load();

      assert.throws(function () {
        load.substituteDeep(topic, {
          NON_EXISTENT_VAR: 'ignore_this'
        });
      });
    });

    it('throws an error for leaf Undefined values', function () {
      topic.Customers.dbHost = undefined;

      let load = new Load();

      assert.throws(function () {
        load.substituteDeep(topic, {
          NON_EXISTENT_VAR: 'ignore_this'
        });
      });
    });

    it('throws an error for leaf NaN values', function () {
      topic.Customers.dbHost = NaN;

      let load = new Load();

      assert.throws(function () {
        load.substituteDeep(topic, {
          NON_EXISTENT_VAR: 'ignore_this'
        });
      });
    });

    it('throws an error with message describing variables name that throw a parser error', function() {
      var JSON_WITH_SYNTAX_ERROR = '{"port":"3306","host" "example.com"}'

      topic.Customers.dbHost = {__name: 'DB_HOST', __format: 'json'};

      let load = new Load();

      assert.throws(function () {
        load.substituteDeep(topic, {
          'DB_HOST': JSON_WITH_SYNTAX_ERROR
        });
      },  /__format parser error in DB_HOST: /);
    });
  });

  describe('Load.loadCustomEnvVars()', function() {
    it('should override from the environment variables', function () {
      // Test Environment Variable Substitution
      let expected = 'CUSTOM VALUE FROM JSON ENV MAPPING';
      process.env.CUSTOM_JSON_ENVIRONMENT_VAR = expected;

      let load = new Load({nodeEnv: 'production', configDir: __dirname + '/config'})
      load.loadCustomEnvVars();
      assert.deepStrictEqual(load.config.customEnvironmentVariables, { "mappedBy": { "json": expected } });
    });

    it('should override from the environment variables', function () {
      // Test Environment Variable Substitution
      let expected = 'CUSTOM VALUE FROM JSON ENV MAPPING';
      process.env.CUSTOM_JSON_ENVIRONMENT_VAR = expected;

      try {
        let load = new Load({nodeEnv: 'production', configDir: __dirname + '/config'})
        load.loadCustomEnvVars();
        assert.strictEqual(typeof load.config.customEnvironmentVariables, 'object');
        assert.strictEqual(typeof load.config.customEnvironmentVariables.mappedBy, 'object');
        assert.deepStrictEqual(load.config.customEnvironmentVariables.mappedBy, {"json": expected});
      } finally {
        delete process.env.CUSTOM_JSON_ENVIRONMENT_VAR;
      }
    });

    it('can handle boolean values', function () {
      process.env.CUSTOM_BOOLEAN_TRUE_ENVIRONMENT_VAR = 'true';
      process.env.CUSTOM_BOOLEAN_FALSE_ENVIRONMENT_VAR = 'false';
      process.env.CUSTOM_BOOLEAN_ERROR_ENVIRONMENT_VAR = 'notProperBoolean';

      try {
        let load = new Load({nodeEnv: 'production', configDir: __dirname + '/config'})
        load.loadCustomEnvVars();
        assert.strictEqual(typeof load.config.customEnvironmentVariables.mappedBy, 'object');
        assert.deepStrictEqual(load.config.customEnvironmentVariables.mappedBy.formats,
          { "booleanTrue": true, "booleanFalse": false, "notProperBoolean": false });
      } finally {
        delete process.env.CUSTOM_BOOLEAN_TRUE_ENVIRONMENT_VAR;
        delete process.env.CUSTOM_BOOLEAN_FALSE_ENVIRONMENT_VAR;
        delete process.env.CUSTOM_BOOLEAN_ERROR_ENVIRONMENT_VAR;
      }
    });

    it('can handle numeric values', function () {
      // Test Environment variable substitution of numeric values
      let numberInteger = 1001;
      let numberFloat = 3.14
      process.env.CUSTOM_NUMBER_INTEGER_ENVIRONMENT_VAR = numberInteger;
      process.env.CUSTOM_NUMBER_FLOAT_ENVIRONMENT_VAR = numberFloat;
      process.env.CUSTOM_NUMBER_EMPTY_ENVIRONMENT_VAR = '';
      process.env.CUSTOM_NUMBER_STRING_ENVIRONMENT_VAR = 'String';

      let load = new Load({nodeEnv: 'production', configDir: __dirname + '/config'})
      load.loadCustomEnvVars();
      assert.strictEqual(typeof load.config.customEnvironmentVariables.mappedBy, 'object');
      assert.deepStrictEqual(load.config.customEnvironmentVariables.mappedBy.formats,
        { "numberInteger": 1001, "numberFloat": 3.14, "numberString": undefined });
    });
  });

  describe('Util.resolveDeferredConfigs()', function() {
    it('The function exists', function () {
      assert.strictEqual(typeof util.resolveDeferredConfigs, 'function');
    });

    it('expands values', function () {
      let data = {
        deferreds: {
          foo: '3',
          bar: deferConfig(() => {
            return 4;
          })
        }
      };

      util.resolveDeferredConfigs(data);

      assert.deepStrictEqual(data.deferreds, {foo: '3', bar: 4});
    });

    it('works for arrays', function () {
      let data = {
        deferreds: {
          foo: 2,
          bar: [deferConfig(() => {
            return 4;
          })]
        }
      };

      util.resolveDeferredConfigs(data);

      assert.deepStrictEqual(data.deferreds, {foo: 2, bar: [4]});
    });

    it('handles recursive expansion', function () {
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

      assert.deepStrictEqual(data.deferreds, {foo: 4, bar: '4 interpolated'});
    });
  });

  describe('Util.loadFileConfigs()', function() {
    it('The function exists', function () {
      assert.strictEqual(typeof util.loadFileConfigs, 'function');
    });

    it('can load data from a given directory', function () {
      var result = util.loadFileConfigs({configDir: Path.join(__dirname, '5-config')});

      assert.strictEqual(result.config.number, 5);
    });

    it('ignores NODE_CONFIG', function () {
      var prev = process.env.NODE_CONFIG;
      process.env.NODE_CONFIG = '{"extra": 4}';

      var result = util.loadFileConfigs({configDir: Path.join(__dirname, 'config')});

      assert.strictEqual(result.config.extra, undefined);
      process.env.NODE_CONFIG = prev;
    });

    it('handles appInstance', function () {
      var result = util.loadFileConfigs({
        configDir: Path.join(__dirname, 'config'),
        appInstance: 3
      });

      assert.strictEqual(result.config.Customers.altDbPort, 4400);
    });

    it('loads CSON files', function () {
      var result = util.loadFileConfigs({
        configDir: Path.join(__dirname, 'config')
      });

      assert.strictEqual(typeof result.config.Customers, 'object');
      assert.ok(Array.isArray(result.config.Customers.lang));
      assert.strictEqual(result.config.Customers.other, 'from_default_cson');
      assert.strictEqual(typeof result.config.AnotherModule, 'object');
      assert.strictEqual(result.config.AnotherModule.parm4, "value4");
    });

    describe('for .properties files', function() {
      let config;

      beforeEach(function () {
        config = util.loadFileConfigs({
          configDir: Path.join(__dirname, 'config')
        }).config;
      });

      it('values are loaded', function() {
        assert.strictEqual(typeof config.AnotherModule, 'object');
        assert.strictEqual(config.AnotherModule.parm5, "value5");
        assert.strictEqual(typeof config['key with spaces'], 'object');
        assert.strictEqual(config['key with spaces'].another_key, 'hello');
        assert.strictEqual(config.ignore_this_please, undefined);
        assert.strictEqual(config.i_am_a_comment, undefined);
      });

      it('handles variable expansion', function() {
        assert.strictEqual(config.replacement.param, "foobar")
      });

      it('Sections are supported', function() {
        assert.notStrictEqual(config.section.param, undefined);
        assert.strictEqual(config.param, undefined);
      });
    });

    describe('with multiple nodeEnv values', function() {
      it('Values of the corresponding files are loaded', function() {
        const config = util.loadFileConfigs({
          configDir: Path.join(__dirname, 'config'),
          nodeEnv: ['development', 'cloud']
        }).config;

        assert.strictEqual(config.db.name, 'development-config-env-provided');
        assert.strictEqual(config.db.port, 3000);
      });

      it('Values of the corresponding local files are loaded', function() {
        const config = util.loadFileConfigs({
          configDir: Path.join(__dirname, 'config'),
          nodeEnv: ['development', 'cloud']
        }).config;

        assert.strictEqual(config.app.context, 'local cloud');
        assert.strictEqual(config.app.message, 'local development');
      });

      it('loads all corresponding env-hostname files', function() {
        const config = util.loadFileConfigs({
          configDir: Path.join(__dirname, 'config'),
          nodeEnv: ['development', 'bare-metal'],
          hostName: 'test'
        }).config;

        assert.strictEqual(config.host.os, 'linux');
        assert.strictEqual(config.host.arch, 'x86_64');
      });

      it('loads the values in left-right order', function(done) {
        const config = util.loadFileConfigs({
          configDir: Path.join(__dirname, 'config'),
          nodeEnv: ['cloud', 'bare-metal'],
          hostName: 'test'
        }).config;

        assert.strictEqual(config.db.name, 'bare-metal-config-env-provided');
      });
    });
  });

  describe('Load.scan()', function() {
    it('The function exists', function () {
      const load = new Load();
      assert.strictEqual(typeof load.scan, 'function');
    });

    it('can load data from a given directory', function () {
      let load = new Load({configDir: __dirname + '/config'})
      load.scan();

      assert.strictEqual(typeof load.config.Customers, 'object');
    });

    it('merges in the provided data', function () {
      let load = new Load({configDir: __dirname + '/config'})
      load.scan([{ name: 'a', config: {foo: 'bar'} }]);

      assert.strictEqual(load.config.foo, 'bar');
    });

    it('can disable source accumulation', function() {
      let load = new Load({configDir: __dirname + '/config', skipConfigSources: true});
      load.scan();

      assert.deepEqual(load.getSources(), []);
    });
  })
});
