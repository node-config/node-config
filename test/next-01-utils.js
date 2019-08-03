const { processScope } = require('./_utils');
const utils = require('../lib/utils');
const assert = require('assert');
const vows = require('vows');

vows.describe(`Configuration utilities`)
  .addBatch({
    'utils.getArgv()': {
      'values can be separated by spaces': processScope({
        argv: [
          '--NODE_CONFIG_ENV', 'production',
        ],
      }, function() {
        assert.strictEqual(utils.getArgv('NODE_CONFIG_ENV'), 'production');
      }),
      'values can be separated by an equality sign (=)': processScope({
        argv: [
          '--NODE_APP_INSTANCE=test',
        ],
      }, function() {
        assert.strictEqual(utils.getArgv('NODE_APP_INSTANCE'), 'test');
      }),
      'supports boolean arguments - returns true in case of a valueless argument': processScope({
        argv: [
          '--NODE_SKIP_GITCRYPT',
        ],
      }, function() {
        assert.isTrue(utils.getArgv('NODE_SKIP_GITCRYPT'));
      }),
      'returns last occurrence in case of multiple matching arguments': processScope({
        argv: [
          '--NODE_ENV=development',
          '--NODE_ENV=staging',
        ],
      }, function() {
        assert.strictEqual(utils.getArgv('NODE_ENV'), 'staging');
      }),
      'returns false in case no matching arguments were found': processScope({
        argv: [],
      }, function() {
        assert.isFalse(utils.getArgv('NODE_CONFIG_DIR'));
      }),
    }
  })
  .addBatch({
    'utils.getOption()': {
      'returns cli-arg when matched': processScope({
        env: {},
        argv: [
          '--NODE_ENV=staging',
        ],
      }, function() {
        assert.strictEqual(utils.getOption('NODE_ENV'), 'staging');
      }),
      'returns cli-arg when matched, even if an env-var also matches': processScope({
        env: {
          NODE_APP_INSTANCE: 'env-var',
        },
        argv: [
          '--NODE_APP_INSTANCE=argv',
        ],
      }, function() {
        assert.strictEqual(utils.getOption('NODE_APP_INSTANCE'), 'argv');
      }),
      'returns env-var when matched and no cli-arg was matched': processScope({
        env: {
          NODE_CONFIG_DIR: '/path/to/config',
        },
        argv: [],
      }, function() {
        assert.strictEqual(utils.getOption('NODE_CONFIG_DIR'), '/path/to/config');
      }),
      'returns default value when no cli-arg or env-var were matched': processScope({
        env: {},
        argv: [],
      }, function() {
        assert.strictEqual(utils.getOption('NON_EXISTING','myDefaultValue'), 'myDefaultValue');
      }),
      'does not returns default value when a cli-arg or env-var were matched but returned a falsly value': processScope({
        env: {
          NUMBER_VALUE: '0',
          BOOL_VALUE: false,
          INT_VALUE: 0,
        },
        argv: [
          '--CLI_VALUE', '0',
        ],
      }, function() {
        // in reality env-vars are always cast to strings, but we wanna
        // make sure programmatically defined env-vars won't cause problems
        assert.strictEqual(utils.getOption('INT_VALUE','myDefaultValue'),0);
        assert.strictEqual(utils.getOption('BOOL_VALUE','myDefaultValue'),false);
        assert.strictEqual(utils.getOption('NUMBER_VALUE','myDefaultValue'),'0');
        assert.strictEqual(utils.getOption('CLI_VALUE','myDefaultValue'),'0');
      }),
    }
  })
  .addBatch({
    'utils.isObject()': {
      'identifies objects correctly': function() {
        function F() { this.key = 'val'; }
        const values = [{key: 'val'}, new F, new Map];
        for (let val of values) {
          assert.isTrue(utils.isObject(val));
        }
      },
      'identifies non-objects correctly': function() {
        const values = [
          () => {}, NaN, Infinity, null, undefined,
          'string', 42, [4, 2], ['some', 'strings'],
        ];
        for (let val of values) {
          assert.isFalse(utils.isObject(val));
        }
      },
    },
    'utils.isPromise()': {
      'identifies promises correctly': function() {
        const values = [
          new Promise(() => {}),
          Promise.reject().catch(() => {}),
          Promise.resolve(42),
        ];
        for (let val of values) {
          assert.isTrue(utils.isPromise(val));
        }
      },
      'identifies non-promises correctly': function() {
        const values = [
          () => {}, class {}, true, 'string',
          {k: 'v'}, [4, 2], new Map, Object.create(null),
        ];
        for (let val of values) {
          assert.isFalse(utils.isPromise(val));
        }
      },
    },
    'utils.makePath()': {
      topic: () => ({
        TestModule: {
          parm1: 'value1',
          list1: ['item']
        },
        Customers: {
          dbHost: 'base',
          dbName: 'from_default_js',
          oauth: {
            key: 'a_api_key',
            secret: null
          }
        },
        EnvOverride: {
          parm_number_1: 'from_default_js',
          parm2: 22
        }
      }),
      'null values are replaced by the default value': function (object) {
        assert.strictEqual(object.Customers.oauth.secret, null);
        utils.makePath(object, 'Customers.oauth.secret', 'an_api_secret');
        assert.strictEqual(object.Customers.oauth.secret, 'an_api_secret');
      },
      'top-level keys are created': function (object) {
        utils.makePath(object, 'NewKey', 'NEW_VALUE');
        assert.strictEqual(object.NewKey, 'NEW_VALUE');
      },
      'sub-level keys are created': function (object) {
        utils.makePath(object, 'TestModule.oauth', 'NEW_VALUE');
        assert.strictEqual(object.TestModule.oauth, 'NEW_VALUE');
      },
      'multiple levels are created': function (object) {
        utils.makePath(object, 'EnvOverride.oauth.secret', 'NEW_VALUE');
        assert.strictEqual(object.EnvOverride.oauth.secret, 'NEW_VALUE');
      },
      'existing values remain untouched': function (object) {
        utils.makePath(object, 'Customers.dbHost', 'NEW_VALUE');
        assert.strictEqual(object.Customers.dbHost, 'base');
      },
      'arrays remain intact and properties are defined on them': function (object) {
        const list = ['item'];
        list.param2 = 'NEW_VALUE';
        utils.makePath(object, 'TestModule.list1.param2', 'NEW_VALUE');
        assert.deepEqual(object.TestModule.list1.slice(), ['item']);
        assert.strictEqual(object.TestModule.list1.param2, 'NEW_VALUE');
        assert.deepEqual(object.TestModule.list1, list);
      },
    },
    'utils.collect()': {
      topic: () => ({
        a1: {
          b1: {
            c1: ['string'],
            c2: {
              d1: 'string',
            },
          },
          b2: {
            c1: 42,
            c2: true,
          },
        },
        a2: {
          b1: [/regexp/, false, 7],
          b2: 'string',
        }
      }),
      'results are collected recursively': function(object) {
        const strings = [];
        utils.collect(object, val => typeof val ==='string', strings);
        for (const [ val, key, obj ] of strings) {
          assert.strictEqual(obj[key], val);
          assert.strictEqual(typeof val, 'string');
        }
        assert.strictEqual(strings.length, 3);
      },
      'results contain the correct arguments': function(object) {
        for (const [ val, key, obj ] of utils.collect(object, val => val instanceof RegExp)) {
          assert.strictEqual(key, 0);
          assert.deepEqual(obj, [val, false, 7]);
          assert.isTrue(val.test('regexp'));
        }
      },
    },
    'utils.cloneDeep()': {
      topic() {
        const object = {
          string: 'string',
          number: Math.PI,
          list: [{nested: true, data: {success: true}}, null, 42],
          complex: process.stdout,
          object: {
            prop1: false,
            prop2: /regexp/,
            prop3: function() {
              return 'prop3';
            }
          }
        };
        const clone = utils.cloneDeep(object);
        return {object, clone};
      },
      'arrays are cloned but not copied': function({ object, clone }) {
        assert.deepEqual(clone.list, object.list);
        assert.notStrictEqual(clone.list, object.list);
      },
      'objects are cloned but not copied': function({ object, clone }) {
        assert.deepEqual(clone.object, object.object);
        assert.deepEqual(clone.list[0], object.list[0]);
        assert.notStrictEqual(clone.object, object.object);
        assert.notStrictEqual(clone.list[0], object.list[0]);
      },
      'complex objects are copied': function({ object, clone }) {
        assert.strictEqual(clone.object.prop2, object.object.prop2);
        assert.strictEqual(clone.object.prop3, object.object.prop3);
        assert.strictEqual(clone.complex, object.complex);
      },
      'primitive values are preserved': function({ object, clone }) {
        assert.strictEqual(clone.string, object.string);
        assert.strictEqual(clone.number, object.number);
      },
    },
    'utils.extendDeep()': {
      'plain objects are merged': function() {
        const origin = {elem3: 'val3'};
        utils.extendDeep(origin, {elem1: 'val1', elem2: 'val2'});
        assert.deepEqual(origin, {elem1: 'val1', elem2: 'val2', elem3: 'val3'});
      },
      'nested plain objects are merged': function() {
        const origin = {e1: 'val1', elem2: {sub1: 'val4', sub2: 'val5'}};
        utils.extendDeep(origin, {elem2: {sub2: 'val6', sub3: 'val7'}});
        assert.deepEqual(origin, {e1: 'val1', elem2: {sub1: 'val4', sub2: 'val6', sub3: 'val7'}});
      },
      'anything other than plain objects is replaced, not merged': function() {
        const origin = {elem1: 'val1', elem2: ['val2', 'val3'], elem3: {sub1: 'val4'}};
        utils.extendDeep(origin, {elem1: 1, elem2: ['val4'], elem3: 'val3'});
        assert.deepEqual(origin, {elem1: 1, elem2: ['val4'], elem3: 'val3'});
      },
      'dates are replaced, not merged': function() {
        const origin = {e1: 'val1', elem2: {sub1: 'val4', sub2: new Date(2015, 0, 1)}};
        utils.extendDeep(origin, {elem2: {sub2: new Date(2015, 0, 2), sub3: 'val7'}});
        assert.deepEqual(origin, {e1: 'val1', elem2: {sub1: 'val4', sub2: new Date(2015, 0, 2), sub3: 'val7'}});
      },
      'replacement clears all previously defined object data': function () {
        const origin = {elem1: {sub1: 5}};
        utils.extendDeep(origin, {elem1: {sub2: 7}}, {elem1: 7}, {elem1: {sub3: 13}});
        // When we get to ext2, the 7 clears all memories of sub1 and sub3. Then, when
        // we merge with ext3, the 7 is replaced by the new object.
        assert.deepEqual(origin, {elem1: {sub3: 13}});
      },
      'extended objects and arrays values preserve their types respectively': function() {
        const origin = {e1: 'val1', e3: ['val5']};
        const clone = utils.extendDeep({}, origin, {e2: {elem1: 'val1'}, e3: ['val6', 'val7']});
        assert.deepEqual(clone, {e1: 'val1', e2: {elem1: 'val1'}, e3: ['val6', 'val7']});
        assert.isObject(clone.e2);
        assert.isArray(clone.e3);
      },
      'replaced objects remain unaffected': function() {
        const origin = {e1: 'val1', elem2: {sub1: 'val4', sub2: 'val5'}};
        utils.extendDeep({}, origin, {elem3: {sub2: 'val6', sub3: 'val7'}});
        assert.deepEqual(origin, {e1: 'val1', elem2: {sub1: 'val4', sub2: 'val5'}});
      },
      'prototype methods remain intact': function() {
        const origin = {};
        const object = Object.create({status: 100, get() { return -this.status; }});
        utils.extendDeep(origin, object);
        assert.isFunction(origin.get);
        assert.strictEqual(origin.status, 100);
        assert.strictEqual(origin.status, -origin.get());
      },
    },
    'utils.deepFreeze()': {
      topic: () => utils.deepFreeze({
        string: 'string',
        number: Math.PI,
        list: [{nested: true, data: {success: true}}, null, 42],
        complex: process.stdout,
        object: {
          prop1: false,
          prop2: /regexp/,
          prop3: function() {
            return 'prop3';
          }
        }
      }),
      'object is frozen': function(frozen) {
        assert.strictEqual(frozen.string, 'string');
        assert.strictEqual(frozen.number, Math.PI);
        assert.isObject(frozen.object);
        frozen.string = false;
        frozen.number = 's27';
        frozen.object = /regexp/;
        assert.strictEqual(frozen.string, 'string');
        assert.strictEqual(frozen.number, Math.PI);
        assert.isObject(frozen.object);
      },
      'object properties are frozen': function(frozen) {
        assert.isFalse(frozen.object.prop1);
        assert.deepEqual(frozen.object.prop2, /regexp/);
        assert.isFunction(frozen.object.prop3);
        frozen.object.prop1 = true;
        frozen.object.prop2 = 's27';
        frozen.object.prop3 = {};
        assert.isFalse(frozen.object.prop1);
        assert.deepEqual(frozen.object.prop2, /regexp/);
        assert.isFunction(frozen.object.prop3);
      },
      'complex values are not frozen': function(frozen) {
        assert.isTrue(Object.isFrozen(frozen));
        assert.isFalse(Object.isExtensible(frozen));
        assert.isFalse(Object.isFrozen(frozen.complex));
      },
    },
    'utils.reduceObject()': {
      'objects are reduced correctly': function() {
        const object = {a1: 2, a2: 7, b1: -4, c1: 0};
        assert.strictEqual(utils.reduceObject(object, (result, value) => result + value, 0), 5);
      },
      'all expected arguments are received by the reducer function': function() {
        const object = {a1: 2, a2: 7, b1: -4, c1: 0};

        let result = utils.reduceObject(object, (result, value) => result.concat(value), []);
        assert.deepEqual(result, [2, 7, -4, 0]);

        result = utils.reduceObject(object, (result, value, key) => result.concat(key), []);
        assert.deepEqual(result, ['a1', 'a2', 'b1', 'c1']);

        result = utils.reduceObject(object, (result, value, key, object) => result.concat(object), []);
        assert.deepEqual(result, [object, object, object, object]);
      },
    },
    'utils.attachLazyProperty()': {
      'property is set and initialized on first access': function() {
        const object = {};
        const config = {ready: false};
        utils.attachLazyProperty(object, 'config', () => {
          config.ready = true;
          return config;
        });
        assert.strictEqual(config.ready, false);
        assert.strictEqual(object.config.ready, true);
        assert.strictEqual(config.ready, true);
        assert.strictEqual(object.config, config);
      },
      'property is enumerable': function() {
        const object = {};
        const config = {ready: false};
        utils.attachLazyProperty(object, 'config', () => {
          config.ready = true;
          return config;
        });
        assert.isTrue(Object.keys(object).includes('config'));
        assert.strictEqual(object.config, config);
        assert.strictEqual(object.config.ready, true);
        assert.isTrue(Object.keys(object).includes('config'));
      },
      'property is not writable': function() {
        const object = {};
        const config = {ready: false};
        utils.attachLazyProperty(object, 'config', () => {
          config.ready = true;
          return config;
        });
        object.config = {};
        object.config.myKey = 'myValue';
        assert.strictEqual(object.config, config);
        assert.strictEqual(object.config.ready, true);
        assert.strictEqual(object.config.myKey, 'myValue');
      },
      'property is not reconfigurable after first access': function() {
        const object = {};
        const config = {ready: false};
        utils.attachLazyProperty(object, 'config', () => ({test: true}));
        utils.attachLazyProperty(object, 'config', () => {
          config.ready = true;
          return config;
        });
        assert.strictEqual(object.config, config);
        assert.strictEqual(object.config.ready, true);
        assert.strictEqual(object.config.test, undefined);
        assert.throws(() => utils.attachLazyProperty(object, 'config', () => ({test: true})));
        assert.strictEqual(object.config, config);
      },
    },
    'utils.attachPropertyValue()': {
      'property is set': function() {
        const object = {key: null};
        utils.attachPropertyValue(object, 'key', 'myValue');
        assert.strictEqual(object.key, 'myValue');
      },
      'property is enumerable': function() {
        const object = {};
        utils.attachPropertyValue(object, 'myKey', 'myValue');
        assert.isTrue(Object.keys(object).includes('myKey'));
      },
      'property is not writable': function() {
        const object = {};
        utils.attachPropertyValue(object, 'key', 'myValue');
        assert.strictEqual(object.key, 'myValue');
        object.key = 'testValue';
        assert.strictEqual(object.key, 'myValue');
      },
      'property is not reconfigurable': function() {
        const object = {};
        utils.attachPropertyValue(object, 'key', 'myValue');
        assert.throws(() => utils.attachPropertyValue(object, 'key', 'newValue'));
        assert.strictEqual(object.key, 'myValue');
      },
    },
    'utils.attachPropertyGetter()': {
      'property is set': function() {
        let value = 'myValue';
        const object = {key: null};
        utils.attachPropertyGetter(object, 'key', () => value);
        assert.strictEqual(object.key, 'myValue');
        value = 'newValue';
        assert.strictEqual(object.key, 'newValue');
      },
      'property is enumerable': function() {
        const object = {};
        let value = 'myValue';
        utils.attachPropertyGetter(object, 'myKey', () => value);
        assert.isTrue(Object.keys(object).includes('myKey'));
        assert.strictEqual(object['myKey'], 'myValue');
      },
      'property is not writable': function() {
        const object = {};
        let value = 'myValue';
        utils.attachPropertyGetter(object, 'key', () => value);
        assert.strictEqual(object.key, 'myValue');
        object.key = 'testValue';
        assert.strictEqual(value, 'myValue');
        assert.strictEqual(object.key, 'myValue');
        value = 'newValue';
        assert.strictEqual(object.key, 'newValue');
      },
      'property is not reconfigurable': function() {
        const object = {};
        let value = 'myValue';
        utils.attachPropertyGetter(object, 'key', () => value);
        assert.throws(() => utils.attachPropertyValue(object, 'key', 'newValue'));
        assert.strictEqual(object.key, 'myValue');
      },
    },
    'utils.enforceArrayProperty()': {
      'property is set': function() {
        const object = {};
        const list = [1, false, 'value', null];
        utils.enforceArrayProperty(object, 'list', list);
        list.push('newItem');
        assert.strictEqual(object.list, list);
        assert.strictEqual(object.list[object.list.length -1], 'newItem');
        assert.deepEqual(object.list, [1, false, 'value', null, 'newItem']);
      },
      'property is writable': function() {
        const object = {};
        const listA = [1, false, 'value', null];
        const listB = [1, 2, 3, 4, 5];
        utils.enforceArrayProperty(object, 'list', listA);
        assert.strictEqual(object.list, listA);
        object.list = listB;
        assert.notEqual(object.list, listA);
        assert.strictEqual(object.list, listB);
      },
      'property is enumerable': function() {
        const list = [];
        const object = {};
        utils.enforceArrayProperty(object, 'myList', list);
        assert.isTrue(Object.keys(object).includes('myList'));
        assert.strictEqual(object['myList'], list);
      },
      'property is not reconfigurable': function() {
        const list = [];
        const object = {};
        utils.enforceArrayProperty(object, 'list', list);
        assert.throws(() => utils.enforceArrayProperty(object, 'list', [true]));
        assert.strictEqual(object.list, list);
      },
      'throws when initializing with a non-array value': function() {
        const object = {};
        assert.throws(() => utils.enforceArrayProperty(object, 'list', true));
        assert.throws(() => utils.enforceArrayProperty(object, 'list', '42'));
        assert.throws(() => utils.enforceArrayProperty(object, 'list', 42));
        assert.throws(() => utils.enforceArrayProperty(object, 'list', {}));
        assert.strictEqual(object.list, undefined);
      },
      'throws when initialization value fails validation': function() {
        const object = {};
        const list = [1, false, 'value', null];
        assert.throws(() => utils.enforceArrayProperty(object, 'list', list, i => typeof i === 'string'));
      },
      'throws Throws when setting property with a non-array value': function() {
        const list = [];
        const object = {};
        utils.enforceArrayProperty(object, 'list', list);
        assert.throws(() => object.list = true);
        assert.throws(() => object.list = '42');
        assert.throws(() => object.list = 42);
        assert.throws(() => object.list = {});
        assert.strictEqual(object.list, list);
      },
      'throws when setting property value fails validation': function() {
        const list = [];
        const object = {};
        utils.enforceArrayProperty(object, 'list', list, i => typeof i === 'string');
        assert.throws(() => object.list = ['str', null]);
        assert.throws(() => object.list = [false]);
        assert.throws(() => object.list = [1]);
        assert.strictEqual(object.list, list);
        object.list = ['a', 'b', 'c'];
        assert.deepEqual(object.list, ['a', 'b', 'c']);
      },
    },
  })
  .export(module);