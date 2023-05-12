var requireUncached = require('./_utils/requireUncached');

// Dependencies
var vows   = require('vows'),
    assert = require('assert'),
    Path   = require('path');

function handleConfig() {
    try {
        // Change the configuration directory for testing
        process.env.NODE_CONFIG_DIR = [`${__dirname}/22-config`].join(Path.delimiter);
        const config = requireUncached(`${__dirname}/../lib/config`);
        return {
            isError: false,
            config,
            defaultConfig: config.util.parseFile(Path.join(`${__dirname}/22-config/default.js`)),
        };
    } catch (_err) {
        return {
            isError: true,
            error: _err,
        };
    }
}

vows.describe('Testing check environment variables from custom environment variables')
.addBatch({
    'check environment variables,': {
        'with environment variables set': {
            topic: function () {
                process.env.NODE_CONFIG_CHECK_ENV_VARS = "true";

                // Scenario: With environment variables set, configuration will use environment variables values.
                process.env.SERVICE_NAME = "service-config";
                process.env.SERVICE_PORT = "8888";
                process.env.SERVICE_CORS = "true";
                process.env.REQUESTS_HEADERS = `{"Content-Type":"text/plain"}`;

                return handleConfig();
            },
            'should use environment variables and not use fallbacks values from default config': function (topic) {
                assert.strictEqual(topic.isError, false);
                assert.strictEqual(topic.config.service.name, "service-config");
                assert.strictEqual(topic.config.service.port, 8888);
                assert.strictEqual(topic.config.service.cors, true);
                assert.deepStrictEqual(topic.config.requests.headers, {"Content-Type":"text/plain"});
            },
        },
        'with environment variables unset': {
            topic: function () {
                process.env.NODE_CONFIG_CHECK_ENV_VARS = "true";

                // Scenario: With environment variables unset, configuration will try to use environment variables values or use fallbacks values from default configuration.
                // Note: There is no fall-back for SERVICE_NAME (part of the next scenario)
                process.env.SERVICE_NAME = "service-config";
                Reflect.deleteProperty(process.env, "SERVICE_PORT");
                Reflect.deleteProperty(process.env, "SERVICE_CORS");
                Reflect.deleteProperty(process.env, "REQUESTS_HEADERS");

                return handleConfig();
            },
            'should use fallbacks values from default config': function (topic) {
                assert.strictEqual(topic.isError, false);
                assert.strictEqual(topic.config.service.name, "service-config");
                assert.strictEqual(topic.config.service.port, topic.defaultConfig.service.port);
                assert.strictEqual(topic.config.service.cors, topic.defaultConfig.service.cors);
                assert.deepStrictEqual(topic.config.requests.headers, topic.defaultConfig.requests.headers);
            },
        },
        'with environment variable SERVICE_NAME unset and no fallback': {
            topic: function () {
                process.env.NODE_CONFIG_CHECK_ENV_VARS = "true";

                // Scenario: If an environment variable is unset and there is no fallback
                // Use fallbacks for other environment variables
                Reflect.deleteProperty(process.env, "SERVICE_NAME");

                return handleConfig();
            },
            'should throw an error that environment variable is missing': function (topic) {
                assert.strictEqual(topic.isError, true);
                assert.strictEqual(topic.error.stack.startsWith("Error: Missing environment variable(s): SERVICE_NAME"), true);
            },
        },
        teardown: function () {
            // Cleanup environment variables
            Reflect.deleteProperty(process.env, "NODE_CONFIG_CHECK_ENV_VARS");
            Reflect.deleteProperty(process.env, "SERVICE_NAME");
            Reflect.deleteProperty(process.env, "SERVICE_PORT");
            Reflect.deleteProperty(process.env, "SERVICE_CORS");
            Reflect.deleteProperty(process.env, "REQUESTS_HEADERS");
        }
    },
})
.export(module);
