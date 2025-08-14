'use strict';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach, after } = require('node:test');
const assert = require('assert');

const Parser = require('../parser');

describe('Tests for a custom parser provided by NODE_CONFIG_PARSER', function() {
  describe('Using the default parser - Sanity check', function() {
    let config;

    beforeEach(function() {
      process.env.NODE_CONFIG_DIR = __dirname + '/16-config';

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('validate default parser order', function() {
      assert.strictEqual(config.get('file.type'), 'yaml');
      assert.strictEqual(config.get('file.name'), 'local.yml');
      assert.strictEqual(config.get('parser'), 'js-yaml');
      assert.strictEqual(config.has('custom.key'), false);
    });
  });

  describe('Using setParserOrder to change parsing order', function() {
    let config;

    beforeEach(function() {
      process.env.NODE_CONFIG_DIR = __dirname + '/16-config';
      process.env.NODE_CONFIG_PARSER = __dirname + '/16-config/parser/custom-1';

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('validate changes to parser order', function() {
      assert.strictEqual(config.get('file.type'), 'custom');
      assert.strictEqual(config.get('file.name'), 'local.yml');
      // assert.strictEqual(config.get('file.name'), 'my-custom-awesome-dsl');
      assert.strictEqual(config.get('parser'), 'custom-awesomeness');
      assert.strictEqual(config.get('custom.key'), 'wow!');
    })
  });

  describe('Using setParserOrder to replace parsing order', function() {
    let config;

    beforeEach(function() {
      process.env.NODE_CONFIG_DIR = __dirname + '/16-config';
      process.env.NODE_CONFIG_PARSER = __dirname + '/16-config/parser/custom-2';

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('validate changes to parser order', function() {
      assert.strictEqual(config.get('file.type'), 'json');
      assert.strictEqual(config.get('file.name'), 'local.yml');
      assert.strictEqual(config.get('parser'), 'json');
      assert.strictEqual(config.get('custom.key'), 'wow!');
    });
  });

  describe('Using setParser to replace a parser', function() {
    let config;

    beforeEach(function() {
      process.env.NODE_CONFIG_DIR = __dirname + '/16-config';
      process.env.NODE_CONFIG_PARSER = __dirname + '/16-config/parser/custom-3';

      config = requireUncached(__dirname + '/../lib/config');
    });

    it('validate changes to parser logic', function() {
      assert.strictEqual(config.get('file.type'), 'yaml');
      assert.strictEqual(config.get('file.name'), 'local.yml');
      assert.strictEqual(config.get('parser'), 'json5');
      assert.strictEqual(config.get('custom.key'), 'json5 rules!');
    });
  });

  after(function () {
    delete process.env.NODE_CONFIG_PARSER;
    requireUncached(__dirname + '/../parser');
  });
});
