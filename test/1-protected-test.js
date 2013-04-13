/**
 * <p>Unit tests</p>
 *
 * @module test
 */

// Change the configuration directory for testing
process.env.NODE_CONFIG_DIR = __dirname + '/config';

// Hardcode $NODE_ENV=test for testing
process.env.NODE_ENV='test';

// Test for multi-instance applications
process.env.NODE_APP_INSTANCE='3';

// Test for environment variable overrides
process.env.CONFIG_EnvOverride_parm__1 = 'overridden from test';
process.env.CONFIG_EnvOverride_parm2 = 13;

// Dependencies
var CONFIG = require('../lib/config');
var vows = require('vows');
var assert = require('assert');

/**
 * <p>Tests for underlying node-config utilities.  To run type:</p>
 * <pre>npm test config</pre>
 *
 * @class ProtectedTest
 */
exports.PrivateTest = vows.describe('Protected (hackable) utilities test').addBatch({
  'Library initialization': {
    'Library is available': function() {
      assert.isObject(CONFIG);
    }
  },

  '_isObject() tests': {
    'The function exists': function() {
      assert.isFunction(CONFIG._isObject);
    },
    'Correctly identifies objects': function() {
   	  assert.isTrue(CONFIG._isObject({A:"b"}));
    },
    'Correctly excludes non-objects': function() {
   	  assert.isFalse(CONFIG._isObject("some string"));
   	  assert.isFalse(CONFIG._isObject(45));
   	  assert.isFalse(CONFIG._isObject([2, 3]));
   	  assert.isFalse(CONFIG._isObject(["a", "b"]));
   	  assert.isFalse(CONFIG._isObject(null));
   	  assert.isFalse(CONFIG._isObject(undefined));
    }
  },

  '_cloneDeep() tests': {
    topic: function() {
      // Return an object for copy tests
      return {
        elem0:true,
        elem1:"Element 1",
        elem2:2,
        elem3:[1,2,3],
        elem4:function(){return "hello";},
        elem5:{sub1:"sub 1",sub2:2,sub3:[1,2,3]}
      };
    },
    'The function exists': function() {
      assert.isFunction(CONFIG._cloneDeep);
    },
    'Original and copy should test equivalent (deep)': function(orig) {
      var copy = CONFIG._cloneDeep(orig);
      assert.deepEqual(copy, orig);
    },
    'The objects should be different': function(orig) {
      var copy = CONFIG._cloneDeep(orig);
      copy.elem1 = false;
      assert.notDeepEqual(copy, orig);
    },
    'Object clones should be objects': function(orig) {
      assert.isObject(CONFIG._cloneDeep({a:1, b:2}));
    },
    'Array clones should be arrays': function(orig) {
      assert.isArray(CONFIG._cloneDeep(["a", "b", 3]));
    },
    'Arrays should be copied by value, not by reference': function(orig) {
      var copy = CONFIG._cloneDeep(orig);
      assert.deepEqual(copy, orig);
      copy.elem3[0] = 2;
      // If the copy wasn't deep, elem3 would be the same object
      assert.notDeepEqual(copy, orig);
    },
    'Objects should be copied by value, not by reference': function(orig) {
      var copy = CONFIG._cloneDeep(orig);
      copy.elem5.sub2 = 3;
      assert.notDeepEqual(copy, orig);
      copy = CONFIG._cloneDeep(orig);
      copy.elem5.sub3[1] = 3;
      assert.notDeepEqual(copy, orig);
    }
  },

  '_extendDeep() tests': {
    'The function exists': function() {
      assert.isFunction(CONFIG._extendDeep);
    },
    'Performs normal extend': function() {
      var orig = {elem1:"val1", elem2:"val2"};
      var extWith = {elem3:"val3"};
      var shouldBe = {elem1:"val1", elem2:"val2", elem3:"val3"};
      assert.deepEqual(CONFIG._extendDeep(orig, extWith), shouldBe);
    },
    'Replaces non-objects': function() {
      var orig = {elem1:"val1", elem2:["val2","val3"],elem3:{sub1:"val4"}};
      var extWith = {elem1:1,elem2:["val4"],elem3:"val3"};
      var shouldBe = {elem1:1, elem2:["val4"],elem3:"val3"};
      assert.deepEqual(CONFIG._extendDeep(orig, extWith), shouldBe);
    },
    'Merges objects': function() {
      var orig = {e1:"val1", elem2:{sub1:"val4",sub2:"val5"}};
      var extWith = {elem2:{sub2:"val6",sub3:"val7"}};
      var shouldBe = {e1:"val1", elem2:{sub1:"val4",sub2:"val6",sub3:"val7"}};
      assert.deepEqual(CONFIG._extendDeep(orig, extWith), shouldBe);
    },
    'Correctly types new objects and arrays': function() {
      var orig = {e1:"val1", e3:["val5"]};
      var extWith = {e2:{elem1:"val1"}, e3:["val6","val7"]};
      var shouldBe = {e1:"val1", e2:{elem1:"val1"}, e3:["val6","val7"]};
      var ext = CONFIG._extendDeep({}, orig, extWith);
      assert.isObject(ext.e2);
      assert.isArray(ext.e3);
    },
    'Keeps non-merged objects intact': function() {
      var orig     = {e1:"val1", elem2:{sub1:"val4",sub2:"val5"}};
      var shouldBe = {e1:"val1", elem2:{sub1:"val4",sub2:"val5"}};
      var extWith = {elem3:{sub2:"val6",sub3:"val7"}};
      CONFIG._extendDeep({}, orig, extWith);
      assert.deepEqual(orig, shouldBe);
    }
  },

  '_equalsDeep() tests': {
    'The function exists': function() {
      assert.isFunction(CONFIG._equalsDeep);
    },
    'Succeeds on two empty objects': function() {
      assert.isTrue(CONFIG._equalsDeep({}, {}));
    },
    'Succeeds on array comparisons': function() {
      assert.isTrue(CONFIG._equalsDeep([1,'hello',2], [1,'hello',2]));
    },
    'Succeeds on the same object': function() {
      var a = {hello:'world'};
      assert.isTrue(CONFIG._equalsDeep(a, a));
    },
    'Succeeds on a regular object': function() {
      var a = {value_3: 14, hello:'world', value_1: 29};
      var b = {value_1: 29, hello:'world', value_3: 14};
      assert.isTrue(CONFIG._equalsDeep(a, b));
    },
    'Succeeds on a deep object': function() {
      var a = {value_3: 14, hello:'world', value_1: 29, value_4:['now','is','the','time']};
      var b = {value_1: 29, hello:'world', value_3: 14, value_4:['now','is','the','time']};
      var c = {creditLimit: 10000, deepValue: a};
      var d = {deepValue: b, creditLimit:10000};
      assert.isTrue(CONFIG._equalsDeep(c, d));
    },
    'Fails if either object is null': function() {
      assert.isFalse(CONFIG._equalsDeep({}, null));
      assert.isFalse(CONFIG._equalsDeep(null, {}));
      assert.isFalse(CONFIG._equalsDeep(null, null));
    },
    'Fails if either object is undefined': function() {
      var a = {};
      assert.isFalse(CONFIG._equalsDeep({}));
      assert.isFalse(CONFIG._equalsDeep(a['noElement'], {}));
    },
    'Fails if either object is undefined': function() {
      var a = {};
      assert.isFalse(CONFIG._equalsDeep({}));
      assert.isFalse(CONFIG._equalsDeep(a['noElement'], {}));
    },
    'Fails if object1 has more elements': function() {
      var a = {value_3: 14, hello:'world', value_1: 29, otherElem: 40};
      var b = {value_1: 29, hello:'world', value_3: 14};
      assert.isFalse(CONFIG._equalsDeep(a, b));
    },
    'Fails if object2 has more elements': function() {
      var a = {value_1: 29, hello:'world', value_3: 14};
      var b = {value_3: 14, hello:'world', value_1: 29, otherElem: 40};
      assert.isFalse(CONFIG._equalsDeep(a, b));
    },
    'Fails if any value is different': function() {
      var a = {value_1: 30, hello:'world', value_3: 14, value_4:['now','is','the','time']};
      var b = {value_1: 29, hello:'world', value_3: 14, value_4:['now','is','the','time']};
      assert.isFalse(CONFIG._equalsDeep(a, b));
      var a = {value_1: 29, hello:'world', value_3: 14, value_4:['now','is','the','time']};
      var b = {value_1: 29, hello:'world', value_3: 14, value_4:['now','isnt','the','time']};
      assert.isFalse(CONFIG._equalsDeep(a, b));
    }
  },

  '_diffDeep() tests': {
    'The function exists': function() {
      assert.isFunction(CONFIG._diffDeep);
    },
    'Returns an empty object if no differences': function() {
      var a = {value_3: 14, hello:'world', value_1: 29};
      var b = {value_1: 29, hello:'world', value_3: 14};
      assert.equal(typeof(CONFIG._diffDeep(a,b)), 'object');
      assert.isTrue(Object.keys(CONFIG._diffDeep(a, b)).length == 0);
    },
    'Returns an empty object if no differences (deep)': function() {
      var a = {value_3: 14, hello:'world', value_1: 29, deepObj:{a:22,b:{c:45,a:44}}};
      var b = {value_1: 29, hello:'world', value_3: 14, deepObj:{a:22,b:{a:44,c:45}}};
      assert.equal(typeof(CONFIG._diffDeep(a,b)), 'object');
      assert.isTrue(Object.keys(CONFIG._diffDeep(a, b)).length == 0);
    },
    'Returns just the diff values': function() {
      var a = {value_3: 14, hello:'wurld', value_1: 29, deepObj:{a:22,b:{c:45,a:44}}};
      var b = {value_1: 29, hello:'world', value_3: 14, deepObj:{a:22,b:{a:44,c:45}}};
      var diff = CONFIG._diffDeep(a,b);
      assert.equal(Object.keys(diff).length, 1);
      assert.equal(diff.hello, 'world');
    },
    'Returns just the diff values (deep)': function() {
      var a = {value_3: 14, hello:'wurld', value_1: 29, deepObj:{a:22,b:{c:45,a:44}}};
      var b = {value_1: 29, hello:'wurld', value_3: 14, deepObj:{a:22,b:{a:45,c:44}}};
      var diff = CONFIG._diffDeep(a,b);
      assert.equal(Object.keys(diff).length, 1);
      assert.equal(Object.keys(diff.deepObj).length, 1);
      assert.equal(Object.keys(diff.deepObj.b).length, 2);
      assert.equal(diff.deepObj.b.a, 45);
      assert.equal(diff.deepObj.b.c, 44);
    }
  },

  '_stripComments() tests': {
    // Only testing baseline stripComments functionality.
	// This implementation handles lots of edge cases that aren't in these tests
    'The function exists': function() {
      assert.isFunction(CONFIG._stripComments);
    },
    'Leaves a simple string without comments alone': function() {
   	  var str = "Hello\nWorld";
   	  assert.equal(CONFIG._stripComments(str), str);
    },
    'Strips out line-type comments': function() {
   	  var str1 = "var a='Hello'; // Comment about the a variable";
   	  var str2 = "var a='Hello'; ";
   	  assert.equal(CONFIG._stripComments(str1), str2);
    },
    'Strips out block-type comments': function() {
   	  var str1 = "var a='Hello';/* Block Comment */ var b=24";
   	  var str2 = "var a='Hello'; var b=24";
   	  assert.equal(CONFIG._stripComments(str1), str2);
    },
    'Strips out multi-line block comments': function() {
   	  var str1 = "var a='Hello';\n/* Block Comment\n  Line 2 comment\n*/\nvar b=24";
   	  var str2 = "var a='Hello';\n\nvar b=24";
   	  assert.equal(CONFIG._stripComments(str1), str2);
    }
  },

  '_parseFile() tests': {
    topic: function() {
      return CONFIG._parseFile(__dirname + '/config/default.yaml');
    },
    'The function exists': function() {
      assert.isFunction(CONFIG._parseFile);
    },
    'An object is returned': function(config) {
      assert.isObject(config);
    },
    'The correct object is returned': function(config) {
      assert.isObject(config.Customers);
      assert.isTrue(config.Customers.dbName == 'from_default_yaml');
      assert.isTrue(config.Customers.dbPort == 5984);
      assert.isObject(config.AnotherModule);
      assert.isTrue(config.AnotherModule.parm2 == "value2");
    }
  },

  '_loadFileConfigs() tests': {
    topic: function() {
      return CONFIG._loadFileConfigs();
    },
    'The function exists': function() {
      assert.isFunction(CONFIG._loadFileConfigs);
    },
    'An object is returned': function(configs) {
      assert.isObject(configs);
    },
    'The correct object is returned': function(config) {
      assert.isObject(config.Customers);
      assert.isTrue(config.Customers.dbHost == 'base');
      assert.isTrue(config.Customers.dbName == 'override_from_runtime_json');
    }
  },

  '_attachProtoDeep() tests': {
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
      return CONFIG._attachProtoDeep(watchThis);
    },
    'The function exists': function() {
      assert.isFunction(CONFIG._attachProtoDeep);
    },
    'The original object is returned': function(config) {
      assert.isObject(config);
      assert.isTrue(config.subObject.item1 === 23);
      assert.isTrue(config.subObject.subSubObject.item2 === "hello");
    },
    'The _cloneDeep method is attached to the object': function(config) {
      assert.isTrue({a:27}.a == config._cloneDeep({a:27}).a);
    },
    'The _cloneDeep method is also attached to sub-objects': function(config) {
      assert.isTrue({a:27}.a == config.subObject._cloneDeep({a:27}).a);
      assert.isTrue({a:27}.a == config.subObject.subSubObject._cloneDeep({a:27}).a);
    },
    'Prototype methods are not exposed in the object': function(config) {
      // This test is here because altering object.__proto__ places the method
      // directly onto the object. That caused problems when iterating over the
      // object.  This implementation does the same thing, but hides them.
      assert.isTrue(JSON.stringify(config) == '{"subObject":{"item1":23,"subSubObject":{"item2":"hello"}}}');
    }
  }

});
