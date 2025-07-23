var requireUncached = require('./_utils/requireUncached');

// Dependencies
var vows = require('vows'),
    assert = require('assert'),
    path = require('path'),
    { Load } = require(__dirname + '/../lib/util');

process.env.NODE_CONFIG_STRICT_MODE = false;

const LOAD = new Load({});

vows.describe('Tests for Unicode situations')
.addBatch({
    'Parsing of BOM related files': {
        'A standard config file having no BOM should continue to parse without error': function () {

            var result = null,
                standardNoBomConfigFile = process.env.NODE_CONFIG_DIR + path.sep + 'defaultNoBOM.json';

            assert.doesNotThrow(function () {
                result = LOAD.loadFile(standardNoBomConfigFile);
            }, 'standard config file with no BOM has a parse error');

        },
        'A config file with a BOM should parse without error': function () {

            var result = null,
                configFileWithBom = process.env.NODE_CONFIG_DIR + path.sep + 'defaultWithUnicodeBOM.json';

            assert.doesNotThrow(function () {
                result = LOAD.loadFile(configFileWithBom);
            }, 'config file with BOM has a parse error');

        }
    }
})
.export(module);
