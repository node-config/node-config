var vows = require('vows');
var assert = require('assert');

vows.describe('vows/assert').addBatch({
    "The Assertion module": {
        topic: require('assert'),

        "`equal`": function (assert) {
            assert.equal("hello world", "hello world");
            assert.equal(1, true);
        },
        "`match`": function (assert) {
            assert.match("hello world", /^[a-z]+ [a-z]+$/);
        },
        "`length`": function (assert) {
            assert.length("hello world", 11);
            assert.length([1, 2, 3], 3);
        },
        "`include`": function (assert) {
            assert.include("hello world", "world");
            assert.include([0, 42, 0],    42);
            assert.include({goo:true},    'goo');
        },
        "`typeOf`": function (assert) {
            assert.typeOf('goo', 'string');
            assert.typeOf(42,    'number');
            assert.typeOf([],    'array');
            assert.typeOf({},    'object');
            assert.typeOf(false, 'boolean');
        },
        "`instanceOf`": function (assert) {
            assert.instanceOf([], Array);
            assert.instanceOf(function () {}, Function);
        },
        "`isArray`": function (assert) {
            assert.isArray([]);
            assertError(assert.isArray, {});
        },
        "`isString`": function (assert) {
            assert.isString("");
        },
        "`isObject`": function (assert) {
            assert.isObject({});
            assertError(assert.isObject, []);
        },
        "`isNumber`": function (assert) {
            assert.isNumber(0);
        },
        "`isNan`": function (assert) {
            assert.isNaN(0/0);
        },
        "`isTrue`": function (assert) {
            assert.isTrue(true);
            assertError(assert.isTrue, 1);
        },
        "`isFalse`": function (assert) {
            assert.isFalse(false);
            assertError(assert.isFalse, 0);
        },
        "`isZero`": function (assert) {
            assert.isZero(0);
            assertError(assert.isZero, null);
        },
        "`isNotZero`": function (assert) {
            assert.isNotZero(1);
        },
        "`isUndefined`": function (assert) {
            assert.isUndefined(undefined);
            assertError(assert.isUndefined, null);
        },
        "`isNull`": function (assert) {
            assert.isNull(null);
            assertError(assert.isNull, 0);
            assertError(assert.isNull, undefined);
        },
        "`isNotNull`": function (assert) {
            assert.isNotNull(0);
        },
        "`greater` and `lesser`": function (assert) {
            assert.greater(5, 4);
            assert.lesser(4, 5);
        },
        "`isEmpty`": function (assert) {
            assert.isEmpty({});
            assert.isEmpty([]);
            assert.isEmpty("");
        }
    }
}).export(module);

function assertError(assertion, value, fail) {
    try {
        assertion(value);
        fail = true;
    } catch (e) {/* Success */}

    fail && assert.fail(value, assert.AssertionError, 
                               "expected an AssertionError for {actual}",
                               "assertError", assertError);
}

