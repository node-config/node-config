var requireUncached = require('./_utils/requireUncached');

// Dependencies
var vows   = require('vows'),
    assert = require('assert'),
    Path   = require('path');

vows.describe('Testing the skipConfigSources functionality')
.addBatch({
    'The config.util.parseFile function,': {
        'given a file path and no options parameter': {
            topic: function () {
                // Change the configuration directory for testing
                process.env.NODE_CONFIG_DIR = [__dirname + '/18-config'].join(Path.delimiter);
                delete process.env.NODE_ENV;
                process.env.NODE_CONFIG = '{}';
                delete process.env.NODE_APP_INSTANCE;
                process.env.NODE_CONFIG_STRICT_MODE=0;
                var config = requireUncached(__dirname + '/../lib/config');
                return {
                     config,
                     configObject: config.util.parseFile(Path.join(__dirname,'/18-extra-config/customFile.json'))
                 };
            },
            'should return the configuration object': function(topic) {
                assert.deepStrictEqual(topic.configObject,{ arbitraryKey: 'arbitraryValue'});
            },
            'should not add the configuration object to the global configuration': function (topic){
                assert(!topic.config.has('arbitraryKey'));
            },
            'should add the file information to the config.util.getConfigSources array': function(topic) {
                var configSources = topic.config.util.getConfigSources();
                var lastEntry = configSources[configSources.length - 1 ];
                var fullFileName = Path.join(__dirname,'/18-extra-config/customFile.json');
                assert.deepStrictEqual(lastEntry.name, fullFileName);
                assert.deepStrictEqual(lastEntry.parsed, { arbitraryKey: 'arbitraryValue'});
            }
        },
        'given a file path and an options parameter,': {
            'when the skipConfigSources flag is set to false': {
                topic: function () {
                    // Change the configuration directory for testing
                    process.env.NODE_CONFIG_DIR = [__dirname + '/18-config'].join(Path.delimiter);
                    delete process.env.NODE_ENV;
                    process.env.NODE_CONFIG = '{}';
                    delete process.env.NODE_APP_INSTANCE;
                    process.env.NODE_CONFIG_STRICT_MODE=0;
                    var config = requireUncached(__dirname + '/../lib/config');
                    return {
                         config,
                         configObject: config.util.parseFile(Path.join(__dirname,'/18-extra-config/customFile.json'), { skipConfigSources: false })
                     };
                },
                'should return the configuration object': function(topic) {
                    assert.deepStrictEqual(topic.configObject,{ arbitraryKey: 'arbitraryValue'});
                },
                'should not add the configuration object to the global configuration': function (topic){
                    assert(!topic.config.has('arbitraryKey'));
                },
                'should add the file information to the config.util.getConfigSources array': function(topic) {
                    var configSources = topic.config.util.getConfigSources();
                    var lastEntry = configSources[configSources.length - 1 ];
                    var fullFileName = Path.join(__dirname,'/18-extra-config/customFile.json');
                    assert.deepStrictEqual(lastEntry.name, fullFileName);
                    assert.deepStrictEqual(lastEntry.parsed, { arbitraryKey: 'arbitraryValue'});
                }
            },
            'when the skipConfigSources flag is set to true': {
                topic: function () {
                    // Change the configuration directory for testing
                    process.env.NODE_CONFIG_DIR = [__dirname + '/18-config'].join(Path.delimiter);
                    delete process.env.NODE_ENV;
                    process.env.NODE_CONFIG = '{}';
                    delete process.env.NODE_APP_INSTANCE;
                    process.env.NODE_CONFIG_STRICT_MODE=0;
                    var config = requireUncached(__dirname + '/../lib/config');
                    return {
                         config,
                         configObject: config.util.parseFile(Path.join(__dirname,'/18-extra-config/customFile.json'), { skipConfigSources: true })
                     };
                },
                'should return the configuration object': function(topic) {
                    assert.deepStrictEqual(topic.configObject,{ arbitraryKey: 'arbitraryValue'});
                },
                'should not add the configuration object to the global configuration': function (topic){
                    assert(!topic.config.has('arbitraryKey'));
                }, 
                'should not add the file information to the config.util.getConfigSources array': function(topic) {
                    var configSources = topic.config.util.getConfigSources();
                    var fullFileName = Path.join(__dirname,'/18-extra-config/customFile.json');
                    assert.strictEqual(configSources.findIndex( (value, index) => { return value.name === fullFileName}), -1)
                }
            }
        }
    },
    'The config.util.loadFileConfigs function,': {
        'given a directory and no options parameter': {
            topic: function () {
                // Change the configuration directory for testing
                process.env.NODE_CONFIG_DIR = [__dirname + '/18-config'].join(Path.delimiter);
                delete process.env.NODE_ENV;
                process.env.NODE_CONFIG = '{}';
                delete process.env.NODE_APP_INSTANCE;
                process.env.NODE_CONFIG_STRICT_MODE=0;
                var config = requireUncached(__dirname + '/../lib/config');
                return {
                    config,
                    configObject: config.util.loadFileConfigs(Path.join(__dirname,'/18-extra-config'))
                };
            },
            'should return the configuration object': function(topic) {
                assert.deepStrictEqual(topic.configObject,{ someKey: 'anotherTestValue'});
            },
            'should not add the configuration object to the global configuration': function (topic){
                assert.deepStrictEqual(topic.config.get('someKey'),'testValue');
            },
            'should add the file information to the config.util.getConfigSources array': function(topic) {
                var configSources = topic.config.util.getConfigSources();
                var lastEntry = configSources[configSources.length - 1 ];
                var fullFileName = Path.join(__dirname,'/18-extra-config/default.json');
                assert.deepStrictEqual(lastEntry.name, fullFileName);
                assert.deepStrictEqual(lastEntry.parsed, { someKey: 'anotherTestValue'});
            }
        },
        'given a directory and an options parameter,': {
            'when the skipConfigSources flag is set to false': {
                topic: function () {
                    // Change the configuration directory for testing
                    process.env.NODE_CONFIG_DIR = [__dirname + '/18-config'].join(Path.delimiter);
                    delete process.env.NODE_ENV;
                    process.env.NODE_CONFIG = '{}';
                    delete process.env.NODE_APP_INSTANCE;
                    process.env.NODE_CONFIG_STRICT_MODE=0;
                    var config = requireUncached(__dirname + '/../lib/config');
                    return {
                        config,
                        configObject: config.util.loadFileConfigs(Path.join(__dirname,'/18-extra-config'), { skipConfigSources: false })
                    };
                },
                'should return the configuration object': function(topic) {
                    assert.deepStrictEqual(topic.configObject,{ someKey: 'anotherTestValue'});
                },
                'should not add the configuration object to the global configuration': function (topic){
                    assert.deepStrictEqual(topic.config.get('someKey'),'testValue');
                },
                'should add the file information to the config.util.getConfigSources array': function(topic) {
                    var configSources = topic.config.util.getConfigSources();
                    var lastEntry = configSources[configSources.length - 1 ];
                    var fullFileName = Path.join(__dirname,'/18-extra-config/default.json');
                    assert.deepStrictEqual(lastEntry.name, fullFileName);
                    assert.deepStrictEqual(lastEntry.parsed, { someKey: 'anotherTestValue'});
                }
            },
            'when the skipConfigSources flag is set to true': {
                topic: function () {
                    // Change the configuration directory for testing
                    process.env.NODE_CONFIG_DIR = [__dirname + '/18-config'].join(Path.delimiter);
                    delete process.env.NODE_ENV;
                    process.env.NODE_CONFIG = '{}';
                    delete process.env.NODE_APP_INSTANCE;
                    process.env.NODE_CONFIG_STRICT_MODE=0;
                    var config = requireUncached(__dirname + '/../lib/config');
                    return {
                        config,
                        configObject: config.util.loadFileConfigs(Path.join(__dirname,'/18-extra-config'), { skipConfigSources: true })
                    };
                },
                'should return the configuration object': function(topic) {
                    assert.deepStrictEqual(topic.configObject,{ someKey: 'anotherTestValue'});
                },
                'should not add the configuration object to the global configuration': function (topic){
                    assert.deepStrictEqual(topic.config.get('someKey'),'testValue');
                },
                'should not add the file information to the config.util.getConfigSources array': function(topic) {
                    var configSources = topic.config.util.getConfigSources();
                    var fullFileName = Path.join(__dirname,'/18-extra-config/default.json');
                    assert.strictEqual(configSources.findIndex( (value, index) => { return value.name === fullFileName}), -1)
                }
            }
        }
    }
})
.export(module);
