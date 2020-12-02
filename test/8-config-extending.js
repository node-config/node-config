var requireUncached = require('./_utils/requireUncached');

// Dependencies
var vows = require('vows'),
    assert = require('assert'),
        path = require('path');

// Change the configuration directory for testing
process.env.NODE_CONFIG_DIR = __dirname + '/8-config';

// Hard-code $NODE_ENV=test for testing
delete process.env.NODE_ENV;

// Test for multi-instance applications
delete process.env.NODE_APP_INSTANCE;

process.env.NODE_CONFIG_STRICT_MODE = false;

var CONFIG = requireUncached(__dirname + '/../lib/config');


vows.describe('Tests for config extending')
.addBatch({
    'Extending a base configuration with another configuration': {
        'Extending a configuration with another configuration should work without error': function () {

            process.env.NODE_CONFIG_DIR = __dirname + '/8-config';
            var base_config = require(process.env.NODE_CONFIG_DIR + path.sep + 'base-config.json');
            CONFIG.util.attachProtoDeep(base_config);

            assert.doesNotThrow(function () {
                result = CONFIG.util.extendDeep(base_config, CONFIG);
            }, 'Extending a configuration with another configuration has an error');

        }
    }
})
.export(module);