
// Dependencies
var vows = require('vows'),
    assert = require('assert'),
        path = require('path');

// Change the configuration directory for testing
process.env.NODE_CONFIG_DIR = __dirname + '/7-config';

// Hardcode $NODE_ENV=test for testing
delete process.env.NODE_ENV;

// Test for multi-instance applications
delete process.env.NODE_APP_INSTANCE;

process.env.NODE_CONFIG_STRICT_MODE = false;

var CONFIG = requireUncached('../lib/config');


vows.describe('Tests for Unicode situations')
.addBatch({
    'Parsing of BOM related files': {
        'A standard config file having no BOM should continue to parse without error': function () {

            var result = null,
                standardNoBomConfigFile = process.env.NODE_CONFIG_DIR + path.sep + 'defaultNoBOM.json';

            assert.doesNotThrow(function () {
                result = CONFIG.util.parseFile(standardNoBomConfigFile);
            }, 'standard config file with no BOM has a parse error');

        },
        'A config file with a BOM should parse without error': function () {

            var result = null,
                configFileWithBom = process.env.NODE_CONFIG_DIR + path.sep + 'defaultWithUnicodeBOM.json';

            assert.doesNotThrow(function () {
                result = CONFIG.util.parseFile(configFileWithBom);
            }, 'config file with BOM has a parse error');

        }
    }
})
.export(module);

//
// Because require'ing config creates and caches a global singleton,
// We have to invalidate the cache to build new object based on the environment variables above
function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

