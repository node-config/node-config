// config.js (c) 2010-2015 Loren West and other contributors
// May be freely distributed under the MIT license.
// For further details and documentation:
// http://lorenwest.github.com/node-config

// Dependencies
var RawConfig = require('../raw').RawConfig;

// Static members
var CONFIG_DIR,
    ALLOW_CONFIG_MUTATIONS,
    checkMutability = true;      // Check for mutability/immutability on first get

var util = require('./util');

/**
 * <p>Application Configurations</p>
 *
 * <p>
 * The config module exports a singleton object representing all
 * configurations for this application deployment.
 * </p>
 *
 * <p>
 * Application configurations are stored in files within the config directory
 * of your application.  The default configuration file is loaded, followed
 * by files specific to the deployment type (development, testing, staging,
 * production, etc.).
 * </p>
 *
 * <p>
 * For example, with the following config/default.yaml file:
 * </p>
 *
 * <pre>
 *   ...
 *   customer:
 *     &nbsp;&nbsp;initialCredit: 500
 *     &nbsp;&nbsp;db:
 *       &nbsp;&nbsp;&nbsp;&nbsp;name: customer
 *       &nbsp;&nbsp;&nbsp;&nbsp;port: 5984
 *   ...
 * </pre>
 *
 * <p>
 * The following code loads the customer section into the CONFIG variable:
 * <p>
 *
 * <pre>
 *   var CONFIG = require('config').customer;
 *   ...
 *   newCustomer.creditLimit = CONFIG.initialCredit;
 *   database.open(CONFIG.db.name, CONFIG.db.port);
 *   ...
 * </pre>
 *
 * @module config
 * @class Config
 */

/**
 * <p>Get the configuration object.</p>
 *
 * <p>
 * The configuration object is a shared singleton object within the application,
 * attained by calling require('config').
 * </p>
 *
 * <p>
 * Usually you'll specify a CONFIG variable at the top of your .js file
 * for file/module scope. If you want the root of the object, you can do this:
 * </p>
 * <pre>
 * var CONFIG = require('config');
 * </pre>
 *
 * <p>
 * Sometimes you only care about a specific sub-object within the CONFIG
 * object.  In that case you could do this at the top of your file:
 * </p>
 * <pre>
 * var CONFIG = require('config').customer;
 * or
 * var CUSTOMER_CONFIG = require('config').customer;
 * </pre>
 *
 * <script type="text/javascript">
 *   document.getElementById("showProtected").style.display = "block";
 * </script>
 *
 * @method constructor
 * @return CONFIG {object} - The top level configuration object
 */
var Config = function() {
  var t = this;
  // todo @ANKU @LOW - не нравится что утилиты имеют состояние (configSources), может быть потом вынесем это в config.js файл
  util.clearConfigSources();

  // // Bind all utility functions to this
  // for (var fnName in util) {
  //   util[fnName] = util[fnName].bind(t);
  // }
  t.util.setModuleDefaults = t.util.setModuleDefaults.bind(null, t);

  // Merge configurations into this
  util.extendDeep(t, util.loadFileConfigs());
  util.attachProtoDeep(Config, t);

  // Perform strictness checks and possibly throw an exception.
  util.runStrictnessChecks(t);
};

/**
 * Utilities are under the util namespace vs. at the top level
 */

Config.prototype.util = Object.assign({}, util, {
  // todo @ANKU @LOW - @deprecated config.util.setModuleDefaults. Use config.setModuleDefaults instead
  setModuleDefaults: function (configObject, moduleName, defaultProperties) {
    return util.setModuleDefaults(configObject, moduleName, defaultProperties);
  },
  // todo @ANKU @LOW - @deprecated config.util.attachProtoDeep. Use config.attachProtoDeep instead
  attachProtoDeep: function(toObject, depth) {
    return util.attachProtoDeep(Config, toObject, depth);
  }
});

/**
 * <p>
 * Set default configurations for a node.js module.
 * </p>
 *
 * <p>
 * This allows module developers to attach their configurations onto the
 * default configuration object so they can be configured by the consumers
 * of the module.
 * </p>
 *
 * <p>Using the function within your module:</p>
 * <pre>
 *   var CONFIG = require("config");
 *   CONFIG.util.setModuleDefaults("MyModule", {
 *   &nbsp;&nbsp;templateName: "t-50",
 *   &nbsp;&nbsp;colorScheme: "green"
 *   });
 * <br>
 *   // Template name may be overridden by application config files
 *   console.log("Template: " + CONFIG.MyModule.templateName);
 * </pre>
 *
 * <p>
 * The above example results in a "MyModule" element of the configuration
 * object, containing an object with the specified default values.
 * </p>
 *
 * @method setModuleDefaults
 * @param moduleName {string} - Name of your module.
 * @param defaultProperties {object} - The default module configuration.
 * @return moduleConfig {object} - The module level configuration object.
 */
Config.prototype.setModuleDefaults = function(moduleName, defaultProperties) {
  var t = this;
  // reset the mutability check for "config.get" method.
  // we are not making t[moduleName] immutable immediately,
  // since there might be more modifications before the first config.get
  if (!util.initParam('ALLOW_CONFIG_MUTATIONS', false)) {
    checkMutability = true;
  }

  return util.setModuleDefaults(t, moduleName, defaultProperties);
}

Config.prototype.attachProtoDeep = function(toObject, depth) {
  return util.attachProtoDeep(Config, toObject, depth);
};


/**
 * <p>Get a configuration value</p>
 *
 * <p>
 * This will return the specified property value, throwing an exception if the
 * configuration isn't defined.  It is used to assure configurations are defined
 * before being used, and to prevent typos.
 * </p>
 *
 * @method get
 * @param property {string} - The configuration property to get. Can include '.' sub-properties.
 * @return value {*} - The property value
 */
Config.prototype.get = function(property) {
  if(property === null || property === undefined){
    throw new Error("Calling config.get with null or undefined argument");
  }
  var t = this,
      value = util.getImpl(t, property);

  // Produce an exception if the property doesn't exist
  if (value === undefined) {
    throw new Error('Configuration property "' + property + '" is not defined');
  }

  // Make configurations immutable after first get (unless disabled)
  if (checkMutability) {
    if (!util.initParam('ALLOW_CONFIG_MUTATIONS', false)) {
      util.makeImmutable(config);
    }
    checkMutability = false;
  }

  if (value instanceof RawConfig) {
    value = value.resolve();
  }

  // Return the value
  return value;
};

/**
 * Test that a configuration parameter exists
 *
 * <pre>
 *    var config = require('config');
 *    if (config.has('customer.dbName')) {
 *      console.log('Customer database name: ' + config.customer.dbName);
 *    }
 * </pre>
 *
 * @method has
 * @param property {string} - The configuration property to test. Can include '.' sub-properties.
 * @return isPresent {boolean} - True if the property is defined, false if not defined.
 */
Config.prototype.has = function(property) {
  // While get() throws an exception for undefined input, has() is designed to test validity, so false is appropriate
  if(property === null || property === undefined){
    return false;
  }
  var t = this;
  return (util.getImpl(t, property) !== undefined);
};

// Process pre-1.0 utility names
var utilWarnings = {};
['watch', 'setModuleDefaults', 'makeHidden', 'makeImmutable', 'getConfigSources', '_loadFileConfigs',
 '_parseFile', '_attachProtoDeep', '_cloneDeep', '_equalsDeep', '_diffDeep', '_extendDeep', '_stripYamlComments',
 '_stripComments', '_isObject', '_initParam', '_getCmdLineArg'].forEach(function(oldName) {

  // Config.util names don't have underscores
  var newName = oldName;
  if (oldName.indexOf('_') === 0) {
    newName = oldName.substr(1);
  }

  // Build the wrapper with warning
  Config.prototype[oldName] = function(){

    // Produce the warning
    if (!utilWarnings[oldName]) {
      console.error('WARNING: config.' + oldName + '() is deprecated.  Use config.util.' + newName + '() instead.');
      console.error('WARNING: See https://github.com/lorenwest/node-config/wiki/Future-Compatibility#upcoming-incompatibilities');
      utilWarnings[oldName] = true;
    }

    // Forward the call
    return util[newName].apply(this, arguments);
  }
});



// Instantiate and export the configuration
var config = module.exports = new Config();

// Produce warnings if the configuration is empty
var showWarnings = !(util.initParam('SUPPRESS_NO_CONFIG_WARNING'));
if (showWarnings && Object.keys(config).length === 0) {
  console.error('WARNING: No configurations found in configuration directory:' +CONFIG_DIR);
  console.error('WARNING: To disable this warning set SUPPRESS_NO_CONFIG_WARNING in the environment.');
}
