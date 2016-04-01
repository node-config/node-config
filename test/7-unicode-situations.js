
// Dependencies
var vows = require('vows'),
    assert = require('assert'),
        path = require('path');

var CONFIG,
    override;

vows.describe('Tests for Unicode situations')
.addBatch({
    'Byte Order Marker (BOM)': {
        topic: function () {
            // Change the configuration directory for testing
            process.env.NODE_CONFIG_DIR = __dirname + '/7-config';

            // Hardcode $NODE_ENV=test for testing
            process.env.NODE_ENV = 'test';

            // Test for multi-instance applications
            process.env.NODE_APP_INSTANCE = '7';

            // Test $NODE_CONFIG environment and --NODE_CONFIG command line parameter
            process.env.NODE_CONFIG = '{"EnvOverride":{"parm3":"overridden from $NODE_CONFIG","parm4":100}}';
            process.argv.push('--NODE_CONFIG={"EnvOverride":{"parm5":"overridden from --NODE_CONFIG","parm6":101}}');

            // Test Environment Variable Substitution
            override = 'CUSTOM VALUE FROM JSON ENV MAPPING';
            process.env.CUSTOM_JSON_ENVIRONMENT_VAR = override;

            CONFIG = requireUncached('../lib/config');

            return CONFIG;

        },
        'Config library is available': function () {
            assert.isObject(CONFIG);
        }
    },
})
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
