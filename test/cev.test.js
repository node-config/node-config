'use strict';

var assert = require('assert');
var cev = require('../lib/cev');

describe('cev', function () {
  it('should work with nothing', function (done) {
    assert.deepEqual(cev(), {});
    done();
  });
  it('should work with a flat object with defaults', function (done) {
    var obj = {
      foo: 1
    };
    var expected = {
      foo: 'NODE_APP_FOO'
    };
    var actual = cev(obj);
    assert.deepEqual(actual, expected);
    done();
  });
  it('should work with a flat object with a function and defaults', function (done) {
    var obj = {
      foo: function () {
      }
    };
    var expected = {};
    var actual = cev(obj);
    assert.deepEqual(actual, expected);
    done();
  });
  it('should work with a deep object with a function and defaults', function (done) {
    var obj = {
      foo: {
        bar: function () {
        }
      }
    };
    var expected = {};
    var actual = cev(obj);
    assert.deepEqual(actual, expected);
    done();
  });
  it('should work with a flat object with non-defaults', function (done) {
    var prefix = 'PRE';
    var separator = '_';
    var casing = cev.CASING_UPPER;
    var empties = true;
    var obj = {
      foo: 1
    };
    var expected = {
      foo: prefix + separator + 'FOO'
    };
    var actual = cev(obj, {
      prefix: prefix,
      separator: separator,
      casing: casing,
      empties: empties
    });
    assert.deepEqual(actual, expected);
    done();
  });
  it('should work with a deep object with defaults', function (done) {
    var obj = {
      foo: 1,
      bar: {
        goo: 1
      }
    };
    var expected = {
      foo: 'NODE_APP_FOO',
      bar: {
        goo: 'NODE_APP_BAR_GOO'
      }
    };
    var actual = cev(obj);
    assert.deepEqual(actual, expected);
    done();
  });
  it('should work with a deep object with non-defaults', function (done) {
    var prefix = 'PRE';
    var separator = '_';
    var casing = cev.CASING_UPPER;
    var empties = true;
    var obj = {
      foo: 1,
      bar: {
        goo: 1,
        hoo: {}
      },
      loo: function () {
      }
    };
    var expected = {
      foo: prefix + separator + 'FOO',
      bar: {
        goo: prefix + separator + 'BAR' + separator + 'GOO',
        hoo: {}
      }
    };
    var actual = cev(obj, {
      prefix: prefix,
      separator: separator,
      casing: casing,
      empties: empties
    });
    assert.deepEqual(actual, expected);
    done();
  });
});
