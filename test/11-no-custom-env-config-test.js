
// Dependencies
var vows = require('vows'),
    assert = require('assert'),
    FileSystem = require('fs');

/**
 * <p>Unit tests for the node-config library.  To run type:</p>
 * <pre>npm test</pre>
 * <p>Or, in a project that uses node-config:</p>
 * <pre>npm test config</pre>
 *
 * @class ConfigTest
 */

var CONFIG, override;
vows.describe('Test NO_CUSTOM_ENV')
.addBatch({
  'Library initialization': {
    topic : function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR = __dirname + '/11-config';

      // Hardcode $NODE_ENV=test for testing
      // process.env.NODE_ENV='test';

      // Test for multi-instance applications
      // process.env.NODE_APP_INSTANCE='3';

      // Test $NODE_CONFIG environment and --NODE_CONFIG command line parameter
      process.env.NODE_CONFIG='{"EnvOverride":{"parm3":"overridden from $NODE_CONFIG","parm4":100}}';
      process.argv.push('--NODE_CONFIG={"EnvOverride":{"parm5":"overridden from --NODE_CONFIG","parm6":101}}');

      // Test Environment Variable Substitution
      override = 'CUSTOM VALUE FROM JSON ENV MAPPING';
      process.env.CUSTOM_JSON_ENVIRONMENT_VAR = override;

      process.env.NO_CUSTOM_ENV='true'

      CONFIG = requireUncached('../lib/config');

      return CONFIG;

    },
    'Config library is available': function() {
      assert.isObject(CONFIG);
    },
    'Config extensions are included with the library': function() {
      assert.isFunction(CONFIG.util.cloneDeep);
    }
  },
})
.addBatch({
  'Configurations from the $NODE_CONFIG environment variable': {
    'Configuration can come from the $NODE_CONFIG environment': function() {
      assert.equal(CONFIG.EnvOverride.parm3, 'overridden from $NODE_CONFIG');
    },

    'Type correct configurations from $NODE_CONFIG': function() {
      assert.equal(CONFIG.EnvOverride.parm4, 100);
    }

  },

  'Configurations from the --NODE_CONFIG command line': {
    'Configuration can come from the --NODE_CONFIG command line argument': function() {
      assert.equal(CONFIG.EnvOverride.parm5, 'overridden from --NODE_CONFIG');
    },

    'Type correct configurations from --NODE_CONFIG': function() {
      assert.equal(CONFIG.EnvOverride.parm6, 101);
    }

  },

  'Configurations from custom environment variables': {
    'Configuration can NOT come from an environment variable mapped in custom_environment_variables.json': function () {
      assert.equal(CONFIG.get('customEnvironmentVariables.mappedBy.json'), 'DEFAULT_JSON_VAR');
    }
  },
})
.export(module);

//
// Because require'ing config creates and caches a global singleton,
// We have to invalidate the cache to build new object based on the environment variables above
function requireUncached(module){
   delete require.cache[require.resolve(module)];
   return require(module);
}

