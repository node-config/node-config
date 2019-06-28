var requireUncached = require('./_utils/requireUncached');
var Parser = require('../parser');

'use strict';

var vows = require('vows'),
  assert = require('assert');

vows.describe('Tests for a custom parser provided by NODE_CONFIG_PARSER')
  .addBatch({
    'Using the default parser - Sanity check': {
      topic: function() {
        process.env.NODE_CONFIG_DIR = __dirname + '/16-config';
        return requireUncached(__dirname + '/../lib/config');
      },
      'validate default parser order': function(CONFIG) {
        assert.equal(CONFIG.get('file.type'), 'yaml');
        assert.equal(CONFIG.get('file.name'), 'local.yml');
        assert.equal(CONFIG.get('parser'), 'js-yaml');
        assert.equal(CONFIG.has('custom.key'), false);
      },
    }
  })
  .addBatch({
    'Using setParserOrder to change parsing order': {
      topic: function() {
        process.env.NODE_CONFIG_DIR = __dirname + '/16-config';
        process.env.NODE_CONFIG_PARSER = __dirname + '/16-config/parser/custom-1';
        return requireUncached(__dirname + '/../lib/config');
      },
      'validate changes to parser order': function(CONFIG) {
        assert.equal(CONFIG.get('file.type'), 'custom');
        assert.equal(CONFIG.get('file.name'), 'local.yml');
        // assert.equal(CONFIG.get('file.name'), 'my-custom-awesome-dsl');
        assert.equal(CONFIG.get('parser'), 'custom-awesomeness');
        assert.equal(CONFIG.get('custom.key'), 'wow!');
      },
    }
  })
  .addBatch({
    'Using setParserOrder to replace parsing order': {
      topic: function() {
        process.env.NODE_CONFIG_DIR = __dirname + '/16-config';
        process.env.NODE_CONFIG_PARSER = __dirname + '/16-config/parser/custom-2';
        return requireUncached(__dirname + '/../lib/config');
      },
      'validate changes to parser order': function(CONFIG) {
        assert.equal(CONFIG.get('file.type'), 'json');
        assert.equal(CONFIG.get('file.name'), 'local.yml');
        assert.equal(CONFIG.get('parser'), 'json');
        assert.equal(CONFIG.get('custom.key'), 'wow!');
      },
    }
  })
  .addBatch({
    'Using setParser to replace a parser': {
      topic: function() {
        process.env.NODE_CONFIG_DIR = __dirname + '/16-config';
        process.env.NODE_CONFIG_PARSER = __dirname + '/16-config/parser/custom-3';
        return requireUncached(__dirname + '/../lib/config');
      },
      'validate changes to parser logic': function(CONFIG) {
        assert.equal(CONFIG.get('file.type'), 'yaml');
        assert.equal(CONFIG.get('file.name'), 'local.yml');
        assert.equal(CONFIG.get('parser'), 'json5');
        assert.equal(CONFIG.get('custom.key'), 'json5 rules!');
      },
    },
    teardown : function (topic) {
      delete process.env.NODE_CONFIG_PARSER;
      requireUncached(__dirname + '/../parser');
    }
  })
  .export(module);
