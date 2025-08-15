'use strict';

const path = require('path');
const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');

describe('Tests for multiple config', function() {
  describe('Adding multiple relative configuration paths should work without error', function () {
    process.env.NODE_CONFIG_DIR =  [
      './test/20-config',
      './test/20-extra-config',
    ].join(path.delimiter)

    assert.doesNotThrow(function () {
      const CONFIG = requireUncached(__dirname + '/../lib/config');
    }, 'Adding multiple relative configuration paths has an error');

  });

  describe('Adding multiple absolute configuration paths should work without error', function () {
    process.env.NODE_CONFIG_DIR =  [
      __dirname + '/20-config',
      __dirname + '/20-extra-config',
    ].join(path.delimiter)

    assert.doesNotThrow(function () {
      const CONFIG = requireUncached(__dirname + '/../lib/config');
    }, 'Adding multiple absolute configuration paths has an error');

  });

  describe('Adding one absolute and one relative configuration paths should work without error', function () {
    process.env.NODE_CONFIG_DIR =  [
      __dirname + '/20-config',
      './test/20-extra-config',
    ].join(path.delimiter)

    assert.doesNotThrow(function () {
      const CONFIG = requireUncached(__dirname + '/../lib/config');
    }, 'Adding one absolute and one relative configuration paths has an error');
  });

  describe('Adding one relative and one absolute configuration paths should work without error', function () {
    process.env.NODE_CONFIG_DIR =  [
      './test/20-config',
      __dirname + '/20-extra-config',
    ].join(path.delimiter)

    assert.doesNotThrow(function () {
      const CONFIG = requireUncached(__dirname + '/../lib/config');
    }, 'Adding one relative and one absolute configuration paths has an error');
  });

  describe('Empty string should not blow up', function () {
    process.env.NODE_CONFIG_DIR =  [
      './test/20-config',
      ''
    ].join(path.delimiter)

    assert.doesNotThrow(function () {
      const CONFIG = requireUncached(__dirname + '/../lib/config');
    }, 'Adding an empty string does not result in an error');
  });
});
