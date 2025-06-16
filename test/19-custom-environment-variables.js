var requireUncached = require('./_utils/requireUncached');

// Dependencies
var vows   = require('vows'),
    assert = require('assert'),
    Path   = require('path'),
    { LoadInfo } = require(__dirname + '/../lib/util');

vows.describe('Testing custom environment variable overrides')
.addBatch({
    'custom environment variable overrides,': {
        'with unset environment variables': {
            'should not override from the environment variables': function() {
                delete process.env.TEST_VALUE;
                delete process.env.TEST_JSON_VALUE;

                // Change the configuration directory for testing
                var loadInfo = new LoadInfo({configDir: Path.join(__dirname, '19-config')});

                loadInfo.load()

                assert.strictEqual(loadInfo.config.testValue, 'from js');
                assert.deepStrictEqual(loadInfo.config.testJSONValue, { fromJS: true, type: 'JSON'});
            },
        },
        'with empty string environment variables': {
            'should not override from the environment variables': function(topic) {
                process.env.TEST_VALUE = '';
                process.env.TEST_JSON_VALUE = '';

                // Change the configuration directory for testing
                var loadInfo = new LoadInfo({configDir: Path.join(__dirname, '19-config')});

                loadInfo.load()
                assert.strictEqual(loadInfo.config.testValue, 'from js');
                assert.deepStrictEqual(loadInfo.config.testJSONValue, { fromJS: true, type: 'JSON'});
            },
        },
        'with string environment variables': {
            'should override from the environment variables': function(topic) {
                process.env.TEST_VALUE = 'from env';
                process.env.TEST_JSON_VALUE = '{ "fromJS": false, "type": "stringified JSON"}';

                // Change the configuration directory for testing
                var loadInfo = new LoadInfo({configDir: Path.join(__dirname, '19-config')});

                loadInfo.load()
                assert.strictEqual(loadInfo.config.testValue, 'from env');
                assert.deepStrictEqual(loadInfo.config.testJSONValue, { fromJS: false, type: 'stringified JSON' });
            },
        },
    },
})
.export(module);
