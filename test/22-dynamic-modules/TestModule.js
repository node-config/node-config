var config = require('../../lib/config');

// Set the module defaults
config.util.setModuleDefaults('TestModule', {
  test: true,
  example: true
});

/**
 * Create a stooge as you see fit
 * 
 * @param options {object}
 */
function TestModule(options) {
  // Get a unique module config based on your defaults with optional override
  this.moduleConfig = config.util.getModuleConfig('TestModule', options);
}

module.exports = TestModule;