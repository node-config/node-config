'use strict';

const Path   = require('path');
const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');

describe('Testing the skipConfigSources functionality', function() {
  describe('The config.util.parseFile function,', function () {
    describe('given a file path and no options parameter', function () {
      let config, configObject;

      beforeEach(function () {
        // Change the configuration directory for testing
        process.env.NODE_CONFIG_DIR = [__dirname + '/18-config'].join(Path.delimiter);
        delete process.env.NODE_ENV;
        process.env.NODE_CONFIG = '{}';
        delete process.env.NODE_APP_INSTANCE;
        process.env.NODE_CONFIG_STRICT_MODE=0;

        config = requireUncached(__dirname + '/../lib/config');
        configObject = config.util.parseFile(Path.join(__dirname,'/18-extra-config/customFile.json'))
      });

      it('should return the configuration object', function() {
          assert.deepStrictEqual(configObject, { arbitraryKey: 'arbitraryValue'});
      });

      it('should not add the configuration object to the global configuration', function (){
          assert.strictEqual(config.has('arbitraryKey'), false);
      });
    });

    describe('given a file path and an options parameter', function () {
      describe('when the skipConfigSources flag is set to false', function () {
        let config, configObject;

        beforeEach(function () {
          // Change the configuration directory for testing
          process.env.NODE_CONFIG_DIR = [__dirname + '/18-config'].join(Path.delimiter);
          delete process.env.NODE_ENV;
          process.env.NODE_CONFIG = '{}';
          delete process.env.NODE_APP_INSTANCE;
          process.env.NODE_CONFIG_STRICT_MODE=0;

          config = requireUncached(__dirname + '/../lib/config');
          configObject = config.util.parseFile(Path.join(__dirname,'/18-extra-config/customFile.json'), { skipConfigSources: false })
        });

        it('should return the configuration object', function() {
            assert.deepStrictEqual(configObject, { arbitraryKey: 'arbitraryValue'});
        });

        it('should not add the configuration object to the global configuration', function (){
            assert.strictEqual(config.has('arbitraryKey'), false);
        });
      });

      describe('when the skipConfigSources flag is set to true', function () {
        let config, configObject;

        beforeEach(function () {
          // Change the configuration directory for testing
          process.env.NODE_CONFIG_DIR = [__dirname + '/18-config'].join(Path.delimiter);
          delete process.env.NODE_ENV;
          process.env.NODE_CONFIG = '{}';
          delete process.env.NODE_APP_INSTANCE;
          process.env.NODE_CONFIG_STRICT_MODE=0;

          config = requireUncached(__dirname + '/../lib/config');
          configObject = config.util.parseFile(Path.join(__dirname,'/18-extra-config/customFile.json'), { skipConfigSources: true })
        });

        it('should return the configuration object', function() {
          assert.deepStrictEqual(configObject, { arbitraryKey: 'arbitraryValue' });
        });

        it('should not add the configuration object to the global configuration', function (){
          assert.strictEqual(config.has('arbitraryKey'), false);
        });

        it('should not add the file information to the config.util.getConfigSources array', function() {
          let configSources = config.util.getConfigSources();
          let fullFileName = Path.join(__dirname,'/18-extra-config/customFile.json');

          assert.strictEqual(configSources.findIndex( (value, index) => { return value.name === fullFileName}), -1)
        });
      });
    });
  });

  describe('The config.util.loadFileConfigs function,', function () {
    describe('given a directory and no options parameter', function () {
      let config, configObject;

      beforeEach(function () {
        // Change the configuration directory for testing
        process.env.NODE_CONFIG_DIR = [__dirname + '/18-config'].join(Path.delimiter);
        delete process.env.NODE_ENV;
        process.env.NODE_CONFIG = '{}';
        delete process.env.NODE_APP_INSTANCE;
        process.env.NODE_CONFIG_STRICT_MODE=0;

        config = requireUncached(__dirname + '/../lib/config');
        configObject = config.util.loadFileConfigs(Path.join(__dirname,'/18-extra-config'))
      });

      it('should return the configuration object', function() {
        assert.deepStrictEqual(configObject, { someKey: 'anotherTestValue' });
      });

      it('should not add the configuration object to the global configuration', function (){
        assert.deepStrictEqual(config.get('someKey'), 'testValue');
      });
    });

    describe('given a directory and an options parameter,', function() {
      describe('when the skipConfigSources flag is set to false', function () {
        let config, configObject;

        beforeEach(function () {
          // Change the configuration directory for testing
          process.env.NODE_CONFIG_DIR = [__dirname + '/18-config'].join(Path.delimiter);
          delete process.env.NODE_ENV;
          process.env.NODE_CONFIG = '{}';
          delete process.env.NODE_APP_INSTANCE;
          process.env.NODE_CONFIG_STRICT_MODE = 0;

          config = requireUncached(__dirname + '/../lib/config');
          configObject = config.util.loadFileConfigs(Path.join(__dirname, '/18-extra-config'), {skipConfigSources: false})
        });

        it('should return the configuration object', function () {
          assert.deepStrictEqual(configObject, {someKey: 'anotherTestValue'});
        });

        it('should not add the configuration object to the global configuration', function () {
          assert.deepStrictEqual(config.get('someKey'), 'testValue');
        });
      });
    });

    describe('when the skipConfigSources flag is set to true', function() {
      let config, configObject;

      beforeEach(function () {
        // Change the configuration directory for testing
        process.env.NODE_CONFIG_DIR = [__dirname + '/18-config'].join(Path.delimiter);
        delete process.env.NODE_ENV;
        process.env.NODE_CONFIG = '{}';
        delete process.env.NODE_APP_INSTANCE;
        process.env.NODE_CONFIG_STRICT_MODE = 0;

        config = requireUncached(__dirname + '/../lib/config');
        configObject = config.util.loadFileConfigs(Path.join(__dirname,'/18-extra-config'), { skipConfigSources: true })
      });

      it('should return the configuration object', function() {
        assert.deepStrictEqual(configObject, { someKey: 'anotherTestValue' });
      });

      it('should not add the configuration object to the global configuration', function (){
        assert.deepStrictEqual(config.get('someKey'), 'testValue');
      });

      it('should not add the file information to the config.util.getConfigSources array', function() {
        let configSources = config.util.getConfigSources();
        let fullFileName = Path.join(__dirname,'/18-extra-config/default.json');

        assert.strictEqual(configSources.findIndex( (value, index) => { return value.name === fullFileName}), -1)
      });
    });
  });
});
