/*jsl:declare global */
// config.js (c) 2010-2014 Loren West and other contributors
// May be freely distributed under the MIT license.
// For further details and documentation:
// http://lorenwest.github.com/node-config

// Dependencies
var Yaml = null,    // External libraries are lazy-loaded
    VisionmediaYaml = null,  // only if these file types exist.
    Coffee = null,
    FileSystem = require('fs');

// Static members
var DEFAULT_CLONE_DEPTH = 20,
    CONFIG_DIR, RUNTIME_JSON_FILENAME, NODE_ENV, APP_INSTANCE,
    HOST, HOSTNAME,
    configSources = [],          // Configuration sources - array of {name, original, parsed}
    isQueuedForPersistence = false;

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

  // Merge configurations into this
  t._extendDeep(t, t._loadFileConfigs());
  t._attachProtoDeep(t);
  t.makeImmutable(t);
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
 * @return value {mixed} - The property value
 */
Config.prototype.get = function(property) {
  var t = this,
      value = t._get(t, property);

  // Produce an exception if the property doesn't exist
  if (value === undefined) {
    throw new Error('Configuration property "' + property + '" is not defined');
  }
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
  var t = this;
  return (t._get(t, property) !== undefined);
};

/**
 * Underlying get mechanism
 *
 * @protected
 * @method _get
 * @param object {object} - Object to get the property for
 * @param property {string | array[string]} - The property name to get (as an array or '.' delimited string)
 * @return value {mixed} - Property value, including undefined if not defined.
 */
Config.prototype._get = function(object, property) {
  var t = this,
      elems = Array.isArray(property) ? property : property.split('.'),
      name = elems[0],
      value = object[name];
  if (elems.length <= 1) {
    return value;
  }
  if (typeof value !== 'object') {
    return undefined;
  }
  return t._get(value, elems.slice(1));
};

/**
 * <p>Monitor a javascript property for runtime changes.</p>
 *
 * <p>
 * This method was built for an earlier version of node-config that allowed
 * configuration value mutations.  Since version 1.0.0, node-config no longer
 * allows configuration mutations, and is no longer used in node-config.
 * </p>
 *
 * <p>
 * It is deprecated, and will be removed in the next semver incompatible release 2.0.0.
 * </p>
 *
 * @method watch
 * @deprecated
 * @param object {object} - The object to watch.
 * @param property {string} - The property name to watch.  Watch all object properties if null.
 * @param handler {function(object, propertyName, priorValue, newValue)} - Handler called when a property change is detected.
 *   The handler is run along with other handlers registered for notification.
 *   If your handler changes the value of the property, that change is applied after all handlers have finished processing the current change.
 *   Then all handlers (including this one) will be called again with the newly changed value.
 * @param depth {integer} (optional) - If watching all object properties or if the specified property is an object, this specifies the depth of the object graph to watch for changes.  Default 6.
 * @return object {object} - The original object is returned - for chaining.
 */
Config.prototype.watch = function(object, property, handler, depth) {

  // Initialize
  var t = this, o = object;
  var allProperties = property ? [property] : Object.keys(o);

  // Depth detection
  depth = (depth === null ? DEFAULT_CLONE_DEPTH : depth);
  if (depth < 0) {
    return;
  }

  // Create hidden properties on the object
  if (!o.__watchers)
    t.makeHidden(o, '__watchers', {});
  if (!o.__propertyValues)
    t.makeHidden(o, '__propertyValues', {});

  // Attach watchers to all requested properties
  allProperties.forEach(function(prop){

    // Setup the property for watching (first time only)
    if (typeof(o.__propertyValues[prop]) == 'undefined') {

      // Don't error re-defining the property if immutable
      var descriptor = Object.getOwnPropertyDescriptor(o, prop);
      if (descriptor && descriptor.writable === false)
        return;

      // Copy the value to the hidden field, and add the property to watchers
      o.__propertyValues[prop] = [o[prop]];
      o.__watchers[prop] = [];

      // Attach the property watcher
      Object.defineProperty(o, prop, {
        enumerable : true,

        get : function(){
          // If more than 1 item is in the values array,
          // then we're currently processing watchers.
          if (o.__propertyValues[prop].length == 1)
            // Current value
            return o.__propertyValues[prop][0];
          else
            // [0] is prior value, [1] is new value being processed
            return o.__propertyValues[prop][1];
        },

        set : function(newValue) {

          // Return early if no change
          var origValue = o[prop];
          if (t._equalsDeep(origValue, newValue))
            return;

          // Remember the new value, and return if we're in another setter
          o.__propertyValues[prop].push(newValue);
          if (o.__propertyValues[prop].length > 2)
            return;

          // Call all watchers for each change requested
          var numIterations = 0;
          while (o.__propertyValues[prop].length > 1) {

            // Detect recursion
            if (++numIterations > 20) {
              o.__propertyValues[prop] = [origValue];
              throw new Error('Recursion detected while setting [' + prop + ']');
            }

            // Call each watcher for the current values
            var oldValue = o.__propertyValues[prop][0];
            newValue = o.__propertyValues[prop][1];
            o.__watchers[prop].forEach(function(watcher) {
              try {
                watcher(o, prop, oldValue, newValue);
              } catch (e) {
                // Log an error and continue with subsequent watchers
                console.error("Exception in object watcher for " + prop, e);
              }
            });

            // Done processing this value
            o.__propertyValues[prop].splice(0,1);
          }
        }
      });

    } // Done setting up the property for watching (first time)

    // Add the watcher to the property
    o.__watchers[prop].push(handler);

    // Recurs if this is an object...
    if (o[prop] && typeof(o[prop]) == 'object') {
      Config.prototype.watch(o[prop], null, handler, depth - 1);
    }

  }); // Done processing each property

  // Return the original object - for chaining
  return o;
};

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
 *   CONFIG.setModuleDefaults("MyModule", {
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

  // Copy the properties into a new object
  var t = this,
      moduleConfig = t._cloneDeep(defaultProperties);

  // Set module defaults into the first sources element
  if (configSources.length === 0 || configSources[0].name !== 'Module Defaults') {
    configSources.splice(0, 0, {
      name: 'Module Defaults',
      parsed: {}
    });
  }
  configSources[0].parsed[moduleName] = {};
  t._extendDeep(configSources[0].parsed[moduleName], defaultProperties);

  // Attach handlers & watchers onto the module config object
  t._attachProtoDeep(moduleConfig);

  // Make the module configs immutable
  t.makeImmutable(moduleConfig);

  // Fold module configs into the config object.  This won't override
  // current values, as they've been made immutable.
  t[moduleName] = t[moduleName] || {};
  t._extendDeep(t[moduleName], moduleConfig);

  // Return the module config
  return t[moduleName];
};

/**
 * <p>Make a configuration property hidden so it doesn't appear when enumerating
 * elements of the object.</p>
 *
 * <p>
 * The property still exists and can be read from and written to, but it won't
 * show up in for ... in loops, Object.keys(), or JSON.stringify() type methods.
 * </p>
 *
 * <p>
 * If the property already exists, it will be made hidden.  Otherwise it will
 * be created as a hidden property with the specified value.
 * </p>
 *
 * <p><i>
 * This method was built for hiding configuration values, but it can be applied
 * to <u>any</u> javascript object.
 * </i></p>
 *
 * <p>Example:</p>
 * <pre>
 *   var CONFIG = require('config');
 *   ...
 *
 *   // Hide the Amazon S3 credentials
 *   CONFIG.makeHidden(CONFIG.amazonS3, 'access_id');
 *   CONFIG.makeHidden(CONFIG.amazonS3, 'secret_key');
 * </pre>
 *
 * @method makeHidden
 * @param object {object} - The object to make a hidden property into.
 * @param property {string} - The name of the property to make hidden.
 * @param value {mixed} - (optional) Set the property value to this (otherwise leave alone)
 * @return object {object} - The original object is returned - for chaining.
 */
Config.prototype.makeHidden = function(object, property, value) {

  // Use the existing value if the new value isn't specified
  value = (typeof value == 'undefined') ? object[property] : value;

  // Create the hidden property
  Object.defineProperty(object, property, {
    value: value,
    enumerable : false
  });

  return object;
}

/**
 * <p>Make a javascript object property immutable (assuring it cannot be changed
 * from the current value).</p>
 * <p>
 * If the specified property is an object, all attributes of that object are
 * made immutable, including properties of contained objects, recursively.
 * If a property name isn't supplied, all properties of the object are made
 * immutable.
 * </p>
 * <p>
 *
 * </p>
 * <p>
 * New properties can be added to the object and those properties will not be
 * immutable unless this method is called on those new properties.
 * </p>
 * <p>
 * This operation cannot be undone.
 * </p>
 *
 * <p>Example:</p>
 * <pre>
 *   var config = require('config');
 *   var myObject = {hello:'world'};
 *   config.makeImmutable(myObject);
 * </pre>
 *
 * @method makeImmutable
 * @param object {object} - The object to specify immutable properties for
 * @param [property] {string | [string]} - The name of the property (or array of names) to make immutable.
 *        If not provided, all owned properties of the object are made immutable.
 * @param [value] {mixed | [mixed]} - Property value (or array of values) to set
 *        the property to before making immutable. Only used when setting a single
 *        property. Retained for backward compatibility.
 * @return object {object} - The original object is returned - for chaining.
 */
Config.prototype.makeImmutable = function(object, property, value) {
  var t = this,
      properties = null;

  // Backwards compatibility mode where property/value can be specified
  if (typeof property === 'string') {
    return Object.defineProperty(object, property, {
      value : (typeof value == 'undefined') ? object[property] : value,
      writable : false,
      configurable: false
    });
  }

  // Get the list of properties to work with
  if (Array.isArray(property)) {
    properties = property;
  }
  else {
    properties = Object.keys(object);
  }

  // Process each property
  for (var i = 0; i < properties.length; i++) {
    var propertyName = properties[i],
        value = object[propertyName];

    Object.defineProperty(object, propertyName, {
      value: value,
      writable : false,
      configurable: false
    });

    // Call recursively if an object.
    if (t._isObject(value)) {
      t.makeImmutable(value);
    }
  }

  return object;
};

/**
 * Return the sources for the configurations
 *
 * <p>
 * All sources for configurations are stored in an array of objects containing
 * the source name (usually the filename), the original source (as a string),
 * and the parsed source as an object.
 * </p>
 *
 * @method getConfigSources
 * @return configSources {Array[Object]} - An array of objects containing
 *    name, original, and parsed elements
 */
Config.prototype.getConfigSources = function() {
  var t = this;
  return configSources.slice(0);
};

/**
 * Load the individual file configurations.
 *
 * <p>
 * This method builds a map of filename to the configuration object defined
 * by the file.  The search order is:
 * </p>
 *
 * <pre>
 *   default.EXT
 *   (deployment).EXT
 *   (hostname).EXT
 *   (hostname)-(deployment).EXT
 *   local.EXT
 *   local-(deployment).EXT
 *   runtime.json
 * </pre>
 *
 * <p>
 * EXT can be yml, yaml, coffee, json, or js signifying the file type.
 * yaml (and yml) is in YAML format, coffee is a coffee-script,
 * json is in JSON format, and js is a javascript executable file that is
 * require()'d with module.exports being the config object.
 * </p>
 *
 * <p>
 * hostname is the $HOST environment variable (or --HOST command line parameter)
 * if set, otherwise the $HOSTNAME environment variable (or --HOSTNAME command
 * line parameter) if set, otherwise the hostname found from
 * require('os').hostname().
 * </p>
 *
 * <p>
 * Once a hostname is found, everything from the first period ('.') onwards
 * is removed. For example, abc.example.com becomes abc
 * </p>
 *
 * <p>
 * (deployment) is the deployment type, found in the $NODE_ENV environment
 * variable or --NODE_ENV command line parameter.  Defaults to 'development'.
 * </p>
 *
 * <p>
 * The runtime.json file contains configuration changes made at runtime either
 * manually, or by the application setting a configuration value.
 * </p>
 *
 * <p>
 * If the $NODE_APP_INSTANCE environment variable (or --NODE_APP_INSTANCE
 * command line parameter) is set, then files with this appendage will be loaded.
 * See the Multiple Application Instances section of the main documentaion page
 * for more information.
 * </p>
 *
 * @protected
 * @method _loadFileConfigs
 * @return config {Object} The configuration object
 */
Config.prototype._loadFileConfigs = function() {

  // Initialize
  var t = this,
      config = {};

  // Initialize parameters from command line, environment, or default
  NODE_ENV = t._initParam('NODE_ENV', 'development');
  CONFIG_DIR = t._initParam('NODE_CONFIG_DIR', process.cwd() + '/config');
  if (CONFIG_DIR.indexOf('.') === 0) {
    CONFIG_DIR = process.cwd() + '/' + CONFIG_DIR;
  }
  APP_INSTANCE = t._initParam('NODE_APP_INSTANCE');
  HOST = t._initParam('HOST');
  HOSTNAME = t._initParam('HOSTNAME');

  // This is for backward compatibility
  RUNTIME_JSON_FILENAME = t._initParam('NODE_CONFIG_RUNTIME_JSON', CONFIG_DIR + '/runtime.json');

  // Determine the host name from the OS module, $HOST, or $HOSTNAME
  // Remove any . appendages, and default to null if not set
  try {
    var hostName = HOST || HOSTNAME;

    if (!hostName) {
        var OS = require('os');
        hostName = OS.hostname();
    }
  } catch (e) {
    hostName = '';
  }
  hostName = hostName ? hostName.split('.')[0] : null;

  // Read each file in turn
  var baseNames = ['default', NODE_ENV, hostName, hostName + '-' + NODE_ENV, 'local', 'local-' + NODE_ENV];
  var extNames = ['js', 'json', 'coffee', 'yaml', 'yml'];
  baseNames.forEach(function(baseName) {
    extNames.forEach(function(extName) {

      // Try merging the config object into this object
      var fullFilename = CONFIG_DIR + '/' + baseName + '.' + extName;
      var configObj = t._parseFile(fullFilename);
      if (configObj) {
        t._extendDeep(config, configObj);
      }

      // See if the application instance file is available
      if (APP_INSTANCE) {
        fullFilename = CONFIG_DIR + '/' + baseName + '-' + APP_INSTANCE + '.' + extName;
        configObj = t._parseFile(fullFilename);
        if (configObj) {
          t._extendDeep(config, configObj);
        }
      }
    });
  });

  // Override configurations from the $NODE_CONFIG environment variable
  if (process.env.NODE_CONFIG) {
    var envConfig = {};
    try {
      envConfig = JSON.parse(process.env.NODE_CONFIG);
    } catch(e) {
      console.error('The $NODE_CONFIG environment variable is malformed JSON');
    }
    t._extendDeep(config, envConfig);
    configSources.push({
      name: "$NODE_CONFIG",
      parsed: envConfig,
    });
  }

  // Override configurations from the --NODE_CONFIG command line
  var cmdLineConfig = t._getCmdLineArg('NODE_CONFIG');
  if (cmdLineConfig) {
    try {
      cmdLineConfig = JSON.parse(cmdLineConfig);
    } catch(e) {
      console.error('The --NODE_CONFIG={json} command line argument is malformed JSON');
    }
    t._extendDeep(config, cmdLineConfig);
    configSources.push({
      name: "--NODE_CONFIG argument",
      parsed: cmdLineConfig,
    });
  }

  // Extend the original config with the contents of runtime.json (backwards compatibility)
  runtimeJson = t._parseFile(RUNTIME_JSON_FILENAME) || {};
  t._extendDeep(config, runtimeJson);

  // Return the configuration object
  return config;
};

/**
 * Parse and return the specified configuration file.
 *
 * If the file exists in the application config directory, it will
 * parse and return it as a JavaScript object.
 *
 * The file extension determines the parser to use.
 *
 * .js = File to run that has a module.exports containing the config object
 * .json = File is parsed using JSON.parse()
 * .coffee = File to run that has a module.exports with coffee-script containing the config object
 * .yaml (or .yml) = Parsed with a YAML parser
 *
 * If the file doesn't exist, a null will be returned.  If the file can't be
 * parsed, an exception will be thrown.
 *
 * This method performs synchronous file operations, and should not be called
 * after synchronous module loading.
 *
 * @protected
 * @method _parseFile
 * @param fullFilename {string} The full file path and name
 * @return {configObject} The configuration object parsed from the file
 */
Config.prototype._parseFile = function(fullFilename) {

  // Initialize
  var t = this,
      extension = fullFilename.substr(fullFilename.lastIndexOf('.') + 1),
      configObject = null,
      fileContent = null;

  // Return null if the file doesn't exist.
  // Note that all methods here are the Sync versions.  This is appropriate during
  // module loading (which is a synchronous operation), but not thereafter.
  try {
    var stat = FileSystem.statSync(fullFilename);
    if (!stat || stat.size < 1) {
      return null;
    }
  } catch (e1) {
    return null
  }

  // Try loading the file.
  try {
    fileContent = FileSystem.readFileSync(fullFilename, 'UTF-8');
  }
  catch (e2) {
    throw new Error('Config file ' + fullFilename + ' cannot be read');
  }

  // Parse the file based on extension
  try {
    if (extension === 'yaml' || extension === 'yml') {
      if (!Yaml && !VisionmediaYaml) {
        // Lazy loading
        try {
          // Try to load the better js-yaml module
          Yaml = require('js-yaml');
        }
        catch (e) {
          // If it doesn't exist, load the fallback visionmedia yaml module.
          VisionmediaYaml = require('yaml');
        }
      }

      if (Yaml) {
        configObject = Yaml.load(t._stripYamlComments(fileContent));
      }
      else if (VisionmediaYaml) {
        // The yaml library doesn't like strings that have newlines but don't
        // end in a newline: https://github.com/visionmedia/js-yaml/issues/issue/13
        fileContent += '\n';
        configObject = VisionmediaYaml.eval(t._stripYamlComments(fileContent));
      }
      else {
        console.error("No YAML parser loaded.  Suggest adding js-yaml dependency to your package.json file.")
      }
    }
    else if (extension == 'json') {
      // Allow comments in JSON files
      configObject = JSON.parse(t._stripComments(fileContent));
    }
    else if (extension == 'js') {
      // Use the built-in parser for .js files
      configObject = require(fullFilename);
    }
    else if (extension == 'coffee') {
      // Lazy load the coffee-script extension
      Coffee = Coffee || require('coffee-script');
      // Use the built-in parser for .coffee files with coffee-script
      configObject = require(fullFilename);
    }
  }
  catch (e3) {
    throw new Error("Cannot parse config file: '" + fullFilename + "': " + e3);
  }

  // Keep track of this configuration source if it has anything in it
  if (JSON.stringify(configObject).length > 2) {
    configSources.push({
      name: fullFilename,
      original: fileContent,
      parsed: configObject,
    });
  }

  return configObject;
};

/**
 * Attach the Config class prototype to all config objects recursively.
 *
 * <p>
 * This allows you to do anything with CONFIG sub-objects as you can do with
 * the top-level CONFIG object.  It's so you can do this:
 * </p>
 *
 * <pre>
 *   var CUST_CONFIG = require('config').Customer;
 *   CUST_CONFIG.get(...)
 * </pre>
 *
 * @protected
 * @method _attachProtoDeep
 * @param toObject
 * @param depth
 * @return toObject
 */
Config.prototype._attachProtoDeep = function(toObject, depth) {

  // Recursion detection
  var t = this;
  depth = (depth === null ? DEFAULT_CLONE_DEPTH : depth);
  if (depth < 0) {
    return toObject;
  }

  // Adding Config.prototype methods directly to toObject as hidden properties
  // because adding to toObject.__proto__ exposes the function in toObject
  for (var fnName in Config.prototype) {
    t.makeHidden(toObject, fnName, Config.prototype[fnName]);
  }

  // Cycle through each element
  for (var prop in toObject) {

    // Call recursively if an object
    if (t._isObject(toObject[prop])) {
      t._attachProtoDeep(toObject[prop], depth - 1);
    }
  }

  // Return the original object
  return toObject;

};

/**
 * Return a deep copy of the specified object.
 *
 * This returns a new object with all elements copied from the specified
 * object.  Deep copies are made of objects and arrays so you can do anything
 * with the returned object without affecting the input object.
 *
 * @protected
 * @method _cloneDeep
 * @param copyFrom {object} The original object to copy from
 * @param depth {integer} An optional depth to prevent recursion.  Default: 20.
 * @return {object} A new object with the elements copied from the copyFrom object
 */
Config.prototype._cloneDeep = function(obj, depth) {

  // Recursion detection
  var t = this;
  depth = (depth === null ? DEFAULT_CLONE_DEPTH : depth);
  if (depth < 0) {
    return {};
  }

  // Create the copy of the correct type
  var copy = Array.isArray(obj) ? [] : {};

  // Cycle through each element
  for (var prop in obj) {

    // Call recursively if an object or array
    if (obj[prop] && typeof obj[prop] == 'object') {
      copy[prop] = t._cloneDeep(obj[prop], depth - 1);
    }
    else {
      copy[prop] = obj[prop];
    }
  }

  // Return the copied object
  return copy;

};

/**
 * Return true if two objects have equal contents.
 *
 * @protected
 * @method _equalsDeep
 * @param object1 {object} The object to compare from
 * @param object2 {object} The object to compare with
 * @param depth {integer} An optional depth to prevent recursion.  Default: 20.
 * @return {boolean} True if both objects have equivalent contents
 */
Config.prototype._equalsDeep = function(object1, object2, depth) {

  // Recursion detection
  var t = this;
  depth = (depth === null ? DEFAULT_CLONE_DEPTH : depth);
  if (depth < 0) {
    return {};
  }

  // Fast comparisons
  if (!object1 || !object2) {
    return false;
  }
  if (object1 === object2) {
    return true;
  }
  if (typeof(object1) != 'object' || typeof(object2) != 'object') {
    return false;
  }

  // They must have the same keys.  If their length isn't the same
  // then they're not equal.  If the keys aren't the same, the value
  // comparisons will fail.
  if (Object.keys(object1).length != Object.keys(object2).length) {
    return false;
  }

  // Compare the values
  for (var prop in object1) {

    // Call recursively if an object or array
    if (object1[prop] && typeof(object1[prop]) === 'object') {
      if (!t._equalsDeep(object1[prop], object2[prop], depth - 1)) {
        return false;
      }
    }
    else {
      if (object1[prop] !== object2[prop]) {
        return false;
      }
    }
  }

  // Test passed.
  return true;
};

/**
 * Returns an object containing all elements that differ between two objects.
 * <p>
 * This method was designed to be used to create the runtime.json file
 * contents, but can be used to get the diffs between any two Javascript objects.
 * </p>
 * <p>
 * It works best when object2 originated by deep copying object1, then
 * changes were made to object2, and you want an object that would give you
 * the changes made to object1 which resulted in object2.
 * </p>
 *
 * @protected
 * @method _diffDeep
 * @param object1 {object} The base object to compare to
 * @param object2 {object} The object to compare with
 * @param depth {integer} An optional depth to prevent recursion.  Default: 20.
 * @return {object} A differential object, which if extended onto object1 would
 *                  result in object2.
 */
Config.prototype._diffDeep = function(object1, object2, depth) {

  // Recursion detection
  var t = this, diff = {};
  depth = (depth === null ? DEFAULT_CLONE_DEPTH : depth);
  if (depth < 0) {
    return {};
  }

  // Process each element from object2, adding any element that's different
  // from object 1.
  for (var parm in object2) {
    var value1 = object1[parm];
    var value2 = object2[parm];
    if (value1 && value2 && t._isObject(value2)) {
      if (!(t._equalsDeep(value1, value2))) {
        diff[parm] = t._diffDeep(value1, value2, depth - 1);
      }
    }
    else if (Array.isArray(value1) && Array.isArray(value2)) {
      if(!t._equalsDeep(value1, value2)) {
        diff[parm] = value2;
      }
    }
    else if (value1 !== value2){
      diff[parm] = value2;
    }
  }

  // Return the diff object
  return diff;

};

/**
 * Extend an object, and any object it contains.
 *
 * This does not replace deep objects, but dives into them
 * replacing individual elements instead.
 *
 * @protected
 * @method _extendDeep
 * @param mergeInto {object} The object to merge into
 * @param mergeFrom... {object...} - Any number of objects to merge from
 * @param depth {integer} An optional depth to prevent recursion.  Default: 20.
 * @return {object} The altered mergeInto object is returned
 */
Config.prototype._extendDeep = function(mergeInto) {

  // Initialize
  var t = this;
  var vargs = Array.prototype.slice.call(arguments, 1);
  var depth = vargs.pop();
  if (typeof(depth) != 'number') {
    vargs.push(depth);
    depth = DEFAULT_CLONE_DEPTH;
  }

  // Recursion detection
  if (depth < 0) {
    return mergeInto;
  }

  // Cycle through each object to extend
  vargs.forEach(function(mergeFrom) {

    // Cycle through each element of the object to merge from
    for (var prop in mergeFrom) {

      // Extend recursively if both elements are objects
      if (t._isObject(mergeInto[prop]) && t._isObject(mergeFrom[prop])) {
        t._extendDeep(mergeInto[prop], mergeFrom[prop], depth - 1);
      }

      // Copy recursively if the mergeFrom element is an object (or array or fn)
      else if (mergeFrom[prop] && typeof mergeFrom[prop] == 'object') {
        mergeInto[prop] = t._cloneDeep(mergeFrom[prop], depth - 1);
      }

      // Simple assignment otherwise
      else {
        mergeInto[prop] = mergeFrom[prop];
      }
    }
  });

  // Chain
  return mergeInto;

};

/**
 * Strip YAML comments from the string
 *
 * The 2.0 yaml parser doesn't allow comment-only or blank lines.  Strip them.
 *
 * @protected
 * @method _stripYamlComments
 * @param fileString {string} The string to strip comments from
 * @return {string} The string with comments stripped.
 */
Config.prototype._stripYamlComments = function(fileStr) {
  // First replace removes comment-only lines
  // Second replace removes blank lines
  return fileStr.replace(/^\s*#.*/mg,'').replace(/^\s*[\n|\r]+/mg,'');
}

/**
 * Strip all Javascript type comments from the string.
 *
 * The string is usually a file loaded from the O/S, containing
 * newlines and javascript type comments.
 *
 * Thanks to James Padolsey, and all who conributed to this implementation.
 * http://james.padolsey.com/javascript/javascript-comment-removal-revisted/
 *
 * @protected
 * @method _stripComments
 * @param fileString {string} The string to strip comments from
 * @return {string} The string with comments stripped.
 */
Config.prototype._stripComments = function(fileStr) {

  var uid = '_' + +new Date(),
      primitives = [],
      primIndex = 0;

  return (
    fileStr

    /* Remove strings */
    .replace(/(['"])(\\\1|.)+?\1/g, function(match){
      primitives[primIndex] = match;
      return (uid + '') + primIndex++;
    })

    /* Remove Regexes */
    .replace(/([^\/])(\/(?!\*|\/)(\\\/|.)+?\/[gim]{0,3})/g, function(match, $1, $2){
      primitives[primIndex] = $2;
      return $1 + (uid + '') + primIndex++;
    })

    /*
    - Remove single-line comments that contain would-be multi-line delimiters
        E.g. // Comment /* <--
    - Remove multi-line comments that contain would be single-line delimiters
        E.g. /* // <--
   */
    .replace(/\/\/.*?\/?\*.+?(?=\n|\r|$)|\/\*[\s\S]*?\/\/[\s\S]*?\*\//g, '')

    /*
    Remove single and multi-line comments,
    no consideration of inner-contents
   */
    .replace(/\/\/.+?(?=\n|\r|$)|\/\*[\s\S]+?\*\//g, '')

    /*
    Remove multi-line comments that have a replaced ending (string/regex)
    Greedy, so no inner strings/regexes will stop it.
   */
    .replace(RegExp('\\/\\*[\\s\\S]+' + uid + '\\d+', 'g'), '')

    /* Bring back strings & regexes */
    .replace(RegExp(uid + '(\\d+)', 'g'), function(match, n){
      return primitives[n];
    })
  );

};

/**
 * Is the specified argument a regular javascript object?
 *
 * The argument is an object if it's a JS object, but not an array.
 *
 * @protected
 * @method _isObject
 * @param arg {MIXED} An argument of any type.
 * @return {boolean} TRUE if the arg is an object, FALSE if not
 */
Config.prototype._isObject = function(obj) {
  return (obj !== null) && (typeof obj == 'object') && !(Array.isArray(obj));
};

/**
 * <p>Initialize a parameter from the command line or process environment</p>
 *
 * <p>
 * This method looks for the parameter from the command line in the format
 * --PARAMETER=VALUE, then from the process environment, then from the
 * default specified as an argument.
 * </p>
 *
 * @method _initParam
 * @param paramName {String} Name of the parameter
 * @param [defaultValue] {Any} Default value of the parameter
 * @return {Any} The found value, or default value
 */
Config.prototype._initParam = function (paramName, defaultValue) {
  var t = this;
  return t._getCmdLineArg(paramName) || process.env[paramName] || defaultValue;
}

/**
 * <p>Get Command Line Arguments</p>
 *
 * <p>
 * This method allows you to retrieve the value of the specified command line argument.
 * </p>
 *
 * <p>
 * The argument is case sensitive, and must be of the form '--ARG_NAME=value'
 * </p>
 *
 * @method _getCmdLineArg
 * @param searchFor {STRING} The argument name to search for
 * @return {MIXED} FALSE if the argument was not found, the argument value if found
 */
Config.prototype._getCmdLineArg = function (searchFor) {
    var cmdLineArgs = process.argv.slice(2, process.argv.length),
        argName = '--' + searchFor + '=';

    for (var argvIt = 0; argvIt < cmdLineArgs.length; argvIt++) {
      if (cmdLineArgs[argvIt].indexOf(argName) === 0) {
        return cmdLineArgs[argvIt].substr(argName.length);
      }
    }

    return false;
}

// Assure the configuration object is a singleton.
global.NODE_CONFIG = global.NODE_CONFIG ? global.NODE_CONFIG : new Config();

// The module exports a singleton instance of the Config class so the
// instance is immediately available on require(), and the prototype methods
// aren't a part of the object namespace when inspected.
module.exports = global.NODE_CONFIG;

// Produce warnings if the global config is empty
if (Object.keys(global.NODE_CONFIG).length === 0) {
  console.error('WARNING: No configurations found in configuration directory:');
  console.error('WARNING: ' + CONFIG_DIR);
  console.error('WARNING: See https://www.npmjs.org/package/config for more information.');
}