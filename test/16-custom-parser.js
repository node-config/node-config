import { describe, it, beforeEach, after } from 'node:test';
import assert from 'assert';
import { requireUncached } from './_utils/requireUncached.mjs';

describe('Tests for a custom parser provided by NODE_CONFIG_PARSER', function() {
  describe('Using the default parser - Sanity check', function() {
    let config;

    beforeEach(async function() {
      process.env.NODE_CONFIG_DIR = import.meta.dirname + '/16-config';

      config = await requireUncached('./lib/config.mjs');
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

    beforeEach(async function() {
      process.env.NODE_CONFIG_DIR = import.meta.dirname + '/16-config';
      process.env.NODE_CONFIG_PARSER = import.meta.dirname + '/16-config/parser/custom-1.js';

      config = await requireUncached('./lib/config.mjs');
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

    beforeEach(async function() {
      process.env.NODE_CONFIG_DIR = import.meta.dirname + '/16-config';
      process.env.NODE_CONFIG_PARSER = import.meta.dirname + '/16-config/parser/custom-2';

      config = await requireUncached('./lib/config.mjs');
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

    beforeEach(async function() {
      process.env.NODE_CONFIG_DIR = import.meta.dirname + '/16-config';
      process.env.NODE_CONFIG_PARSER = import.meta.dirname + '/16-config/parser/custom-3';

      config = await requireUncached('./lib/config.mjs');
    });

    it('validate changes to parser logic', function() {
      assert.strictEqual(config.get('file.type'), 'yaml');
      assert.strictEqual(config.get('file.name'), 'local.yml');
      assert.strictEqual(config.get('parser'), 'json5');
      assert.strictEqual(config.get('custom.key'), 'json5 rules!');
    });
  });

  after(async function () {
    delete process.env.NODE_CONFIG_PARSER;
  });
});
