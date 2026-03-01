import Path from 'path';
import { describe, it, beforeEach } from 'node:test';
import assert from 'assert';
import { requireUncached } from './_utils/requireUncached.mjs';

describe('Tests config.util.getConfigSources', function() {
  describe('tests with NODE_CONFIG env set, and --NODE_CONFIG command line flag', function() {
    let sources;

    beforeEach(async function () {

      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = [
        import.meta.dirname + '/5-config',
        import.meta.dirname + '/5-extra-config'
      ].join(Path.delimiter);

      delete process.env.NODE_ENV;
      process.env.NODE_CONFIG = '{}';
      delete process.env.NODE_APP_INSTANCE;
      process.env.NODE_CONFIG_STRICT_MODE=0;
      process.argv = ["node","path/to/some.js","--NODE_CONFIG={}"];

      let config = await requireUncached('./lib/config.mjs');
      sources =  config.util.getConfigSources();
    });

    it('Two files plus NODE_CONFIG in env and as command line args should result in four entries', function() {
      assert.strictEqual(sources.length, 6);
    });

    it("The environment variable and command line args are the last two overrides", function () {
      assert.strictEqual(sources[2].name, '$NODE_CONFIG');
      assert.strictEqual(sources[3].name, "--NODE_CONFIG argument");
    });
  });

  describe('tests without NODE_ENV set', function() {
    let sources;

    beforeEach(async function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = import.meta.dirname + '/5-config';

      delete process.env.NODE_ENV;
      delete process.env.NODE_CONFIG;
      delete process.env.NODE_APP_INSTANCE;
      process.env.NODE_CONFIG_STRICT_MODE=0;
      process.argv = [];

      let config = await requireUncached('./lib/config.mjs');

      sources = config.util.getConfigSources();
    });

    it('Three files should result in three entries', function() {
      assert.strictEqual(sources.length, 3);
    });

    it("The keys for each object are 'name', 'original', and 'parsed'", function() {
      assert.deepEqual(Object.keys(sources[0]).sort(), ['name','original','parsed']);
    });
  });

  describe('tests with NODE_ENV set', function() {
    let sources;

    beforeEach(async function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = import.meta.dirname + '/5-config';

      process.env.NODE_ENV='test';
      delete process.env.NODE_CONFIG;
      delete process.env.NODE_APP_INSTANCE;
      process.argv = [];

      let config = await requireUncached('./lib/config.mjs');
      sources = config.util.getConfigSources();
    });

    it('Three files should result in three entries', function() {
      assert.strictEqual(sources.length, 3);
    });

    it("The keys for each object are 'name', 'original', and 'parsed'", function() {
      assert.deepEqual(Object.keys(sources[0]).sort(), ['name','original','parsed']);
    });
  });

  describe('Files which return empty objects still end up in getConfigSources()', function() {
   let sources;

   beforeEach(async function () {
    // Change the configuration directory for testing
    process.env.NODE_CONFIG_DIR = import.meta.dirname + '/5-config';

    process.env.NODE_ENV='empty';
    delete process.env.NODE_CONFIG;
    delete process.env.NODE_APP_INSTANCE;
    process.argv = [];

    let config = await requireUncached('./lib/config.mjs');
    sources = config.util.getConfigSources();
  });

  it('Three files should result in 3 entries', function() {
    assert.strictEqual(sources.length, 4);
  });

  it('Second file is named empty', function () {
    assert.strictEqual(Path.basename(sources[1].name), 'empty.json');
  });
 });
});
