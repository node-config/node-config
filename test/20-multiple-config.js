const vows = require('vows');
const assert = require('assert');
const path = require('path');
const requireUncached = require('./_utils/requireUncached');

vows.describe('Tests for multiple config')
.addBatch({
  'Adding multiple relative configuration paths should work without error': function () {
    process.env.NODE_CONFIG_DIR =  [
      './test/20-config',
      './test/20-extra-config',
    ].join(path.delimiter)

    assert.doesNotThrow(function () {
      const CONFIG = requireUncached(__dirname + '/../lib/config');
    }, 'Adding multiple relative configuration paths has an error');

  }
})
.addBatch({
  'Adding multiple absolute configuration paths should work without error': function () {
    process.env.NODE_CONFIG_DIR =  [
      __dirname + '/20-config',
      __dirname + '/20-extra-config',
    ].join(path.delimiter)

    assert.doesNotThrow(function () {
      const CONFIG = requireUncached(__dirname + '/../lib/config');
    }, 'Adding multiple absolute configuration paths has an error');

  }
})
.addBatch({
  'Adding one absolute and one relative configuration paths should work without error': function () {
    process.env.NODE_CONFIG_DIR =  [
      __dirname + '/20-config',
      './test/20-extra-config',
    ].join(path.delimiter)

    assert.doesNotThrow(function () {
      const CONFIG = requireUncached(__dirname + '/../lib/config');
    }, 'Adding one absolute and one relative configuration paths has an error');

  }
})
.addBatch({
  'Adding one relative and one absolute configuration paths should work without error': function () {
    process.env.NODE_CONFIG_DIR =  [
      './test/20-config',
      __dirname + '/20-extra-config',
    ].join(path.delimiter)

    assert.doesNotThrow(function () {
      const CONFIG = requireUncached(__dirname + '/../lib/config');
    }, 'Adding one relative and one absolute configuration paths has an error');

  }
})
.export(module);
