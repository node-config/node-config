/*jsl:declare global */
// config.js (c) 2010-2013 Loren West and other contributors
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
    FILE_WATCHER_INTERVAL = 2500, // For old style (pre-6.0) file watching
    CONFIG_DIR, RUNTIME_JSON_FILENAME, NODE_ENV, APP_INSTANCE,
    DISABLE_FILE_WATCH, PERSIST_ON_CHANGE, HOST, HOSTNAME,
    originalConfig = null,       // Not including the runtime.json values
    runtimeJson = {},            // Current runtimeJson extensions
    runtimeJsonWatcher = null,   // Filesystem watcher for runtime.json
    configSources = [],          // Configuration sources - array of {name, original, parsed}
    isQueuedForPersistence = false;

/**
 * <p>Runtime Application Configurations</p>
 *
 * <p>
 * The config module exports a singleton object representing all runtime
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
 * The configuration object is a shared singleton object within the applicaiton,
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

  // Initialize parameters from command line, environment, or default
  NODE_ENV = t._initParam('NODE_ENV', 'development');
  CONFIG_DIR = t._initParam('NODE_CONFIG_DIR', process.cwd() + '/config');
  RUNTIME_JSON_FILENAME = t._initParam('NODE_CONFIG_RUNTIME_JSON', CONFIG_DIR + '/runtime.json');
  DISABLE_FILE_WATCH = t._initParam('NODE_CONFIG_DISABLE_FILE_WATCH');
  PERSIST_ON_CHANGE = t._initParam('NODE_CONFIG_PERSIST_ON_CHANGE');
  APP_INSTANCE = t._initParam('NODE_APP_INSTANCE');
  HOST = t._initParam('HOST');
  HOSTNAME = t._initParam('HOSTNAME');

  t._loadFileConfigs();
  t._persistConfigsOnChange();
};

/**
 * <p>Monitor a configuration value for runtime changes.</p>
 *
 * <p>
 * Configuration values can be changed at runtime by the application or by a
 * manual change to the config/runtime.json  file.
 * This method lets you specify a function to run when a configuration
 * value changes.
 * </p>
 *
 * <p><i>
 * This was built for monitoring changes to configuration values,
 * but it can be used for watching changes to <u>any</u> javascript object.
 * </i></p>
 *
 * <p>Example:</p>
 * <pre>
 *   var CONFIG = require('config').customer;
 *   ...
 *
 *   // Watch for any changes to the customer configuration
 *   CONFIG.watch(CONFIG, null, function(object, propertyName, priorValue, newValue) {
 *   &nbsp;console.log("Customer configuration " + propertyName + " changed from " + priorValue + " to " + newValue);
 *   });
 * </pre>
 *
 * @method watch
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
      moduleConfig = t._extendDeep({}, defaultProperties);

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
  t._persistConfigsOnChange(moduleConfig);

  // Extend the module config object with values from originalConfig
  if (originalConfig[moduleName]) {
    t._extendDeep(moduleConfig, originalConfig[moduleName]);
  }

  // Save the mixed module config as the original
  originalConfig[moduleName] = t._cloneDeep(moduleConfig);

  // Extend the module config object with values from runtimeJson
  if (runtimeJson[moduleName]) {
    t._extendDeep(moduleConfig, runtimeJson[moduleName]);
  }

  // Attach the object onto the CONFIG object
  t[moduleName] = moduleConfig;

  // Return the module config
  return moduleConfig;
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
 * <p>Make a configuration property immutable (assuring it cannot be changed
 * from the current value).</p>
 *
 * <p>
 * This operation cannot be un-done.
 * </p>
 * <p><i>
 *
 * This method was built for disabling runtime changes to configuration values,
 * but it can be applied to <u>any</u> javascript object.
 * </i></p>
 *
 * <p>Example:</p>
 * <pre>
 *   var CONFIG = require('config').customer;
 *   ...
 *
 *   // Obtain a DB connection using CONFIG parameters
 *   database.open(CONFIG.db.name, CONFIG.db.port);
 *   ...
 *
 *   // Don't allow database changes after connect
 *   CONFIG.makeImmutable(CONFIG.db, 'name');
 *   CONFIG.makeImmutable(CONFIG.db, 'port');
 * </pre>
 *
 * @method makeImmutable
 * @param object {object} - The object to attach an immutable property into.
 * @param property {string} - The name of the property to make immutable.
 * @param value {mixed} - (optional) Set the property value to this (otherwise leave alone)
 * @return object {object} - The original object is returned - for chaining.
 */
Config.prototype.makeImmutable = function(object, property, value) {

  // Use the existing value if a new value isn't specified
  value = (typeof value == 'undefined') ? object[property] : value;

  // Disable writing, and make sure the property cannot be re-configured.
  Object.defineProperty(object, property, {
    value : value,
    writable : false,
    configurable: false
  });

  return object;
};

/**
 * Start or stop runtime.json configuration file watching
 *
 * <p>
 * Node-config automatically monitors and apply changes made to the
 * config/runtime.json file.  This paradigm allows for manual changes to running
 * application servers, and for multi-node application servers to keep in sync.
 * </p>
 *
 * <p>
 * This method allows you to change the polling interval from the default
 * interval (2.5 seconds), or to turn file watching off.  On Linux systems with
 * inotify, and in node.js versions 0.6 and above, this interval is ignored.
 * </p>
 *
 * <p>
 * runtime.json file watching can be disabled by setting the NODE_CONFIG_DISABLE_FILE_WATCH
 * environment variable or --NODE_CONFIG_DISABLE_FILE_WATCH command line parameter
 * to "Y" prior to running your application.
 * </p>
 *
 * @method watchForConfigFileChanges
 * @param interval {Integer} - Polling interval in milliseconds.  Defaults to 2500.
 */
Config.prototype.watchForConfigFileChanges = function(interval) {

  // Turn off any prior watching
  var t = this, watchInterval = (typeof interval === 'undefined' ? FILE_WATCHER_INTERVAL : interval);
  if (FileSystem.watch) {
    if (runtimeJsonWatcher) {
      runtimeJsonWatcher.close();
      runtimeJsonWatcher = null;
    }
  } else {
    FileSystem.unwatchFile(RUNTIME_JSON_FILENAME);
  }

  // If interval is zero or file watching is disabled, don't attach a new watcher
  if (interval === 0 || DISABLE_FILE_WATCH === "Y") {
    return;
  }

  // Re-merge the runtime JSON file if we notice a change
  var onFileChange = function(retry) {
    FileSystem.readFile(RUNTIME_JSON_FILENAME, 'UTF-8', function(err, fileContent) {

      // Not much to do on error
      if (err) {
        console.error("Error loading " + RUNTIME_JSON_FILENAME, err);
        return;
      }

      // Parse the file and mix it in to this config object.
      // This notifies listeners
      try {
        var configObject = JSON.parse(t._stripComments(fileContent));
        t._extendDeep(t, configObject);
      } catch (e) {
        console.error("Error parsing " + RUNTIME_JSON_FILENAME, e);
        // Retry once - could be someone else writing
        if (!retry) {
          setTimeout(function(){
            onFileChange(true);
          }, 1000);
        }
        return;
      }
    });
  };

  // Use the latest version of file watching
  try {
    if (FileSystem.watch) {
      // This is the latest
      runtimeJsonWatcher = FileSystem.watch(RUNTIME_JSON_FILENAME, {persistent:false}, function(event, filename) {

        // Re-attach watcher on inode change (happens when some editors save a file)
        // Wait for the O/S rename to complete, then re-watch the file
        if (event == 'rename') {
          setTimeout(function(){
            t.watchForConfigFileChanges();
            onFileChange();
          }, 10);
          return;
        }

        onFileChange();
      });
    }
    else {
      // Old style polling - only choice if running pre-6.0
      FileSystem.watchFile(RUNTIME_JSON_FILENAME, {persistent:false, interval:watchInterval}, function(curr, prev) {
        if (curr.mtime.getTime() === prev.mtime.getTime()) {return;}
        onFileChange();
      });
    }
  } catch (e) {
    // Complain if it exists and we can't watch it
    if (e.code !== 'ENOENT') {
      console.error("Error watching for file: " + RUNTIME_JSON_FILENAME, e);
    }
  }

};

/**
 * Return the sources for the configurations
 *
 * <p>
 * All sources for configurations are stored in an array of objects containing
 * the source name (usually the filaname), the original source (as a string),
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
 * <p>
 * Watch the specified object for a change in properties, and persist changes
 * to runtime.json when a change is detected.
 * </p>
 *
 * @protected
 * @param object {object} - The config object to watch
 * @method _persistConfigsOnChange
 */
Config.prototype._persistConfigsOnChange = function(objectToWatch) {

  if (PERSIST_ON_CHANGE === 'N') {
    return;
  }
  // Watch for configuration value changes
  var t = this;
  objectToWatch = objectToWatch || t;
  t.watch(objectToWatch, null, function(){

    // Return early if we're already queued up for persisting
    if (isQueuedForPersistence)
      return;

    // Defer persisting until the next tick.  This results in a single
    // persist across any number of config changes in a single event cycle.
    isQueuedForPersistence = true;
    process.nextTick(function(){

      // Persist if necessary
      var newDiffs = t._diffDeep(originalConfig, t);
      if (!t._equalsDeep(newDiffs, runtimeJson)) {
        FileSystem.writeFile(RUNTIME_JSON_FILENAME, JSON.stringify(newDiffs, null, 2), 'utf-8', function(error){
          if (error)
            console.error("Error writing " + RUNTIME_JSON_FILENAME, error);
        });
      }

      // Set up for next time
      isQueuedForPersistence = false;
    });
  });
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
 *   (hostname).EXT
 *   (deployment).EXT
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
 * See the Multiple Applicstion Instances section of the main documentaion page
 * for more information.
 * </p>
 *
 * @protected
 * @method _loadFileConfigs
 * @return {this} The configuration object
 */
Config.prototype._loadFileConfigs = function() {

  // Initialize
  var t = this;

  // Run only once
  if (originalConfig) {
    return t;
  }

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
  var baseNames = ['default', hostName, NODE_ENV, hostName + '-' + NODE_ENV, 'local', 'local-' + NODE_ENV];
  var extNames = ['js', 'json', 'coffee', 'yaml', 'yml'];
  baseNames.forEach(function(baseName) {
    extNames.forEach(function(extName) {

      // Try merging the config object into this object
      var fullFilename = CONFIG_DIR + '/' + baseName + '.' + extName;
      var configObj = t._parseFile(fullFilename);
      if (configObj) {
        t._extendDeep(t, configObj);
      }

      // See if the application instance file is available
      if (APP_INSTANCE) {
        fullFilename = CONFIG_DIR + '/' + baseName + '-' + APP_INSTANCE + '.' + extName;
        configObj = t._parseFile(fullFilename);
        if (configObj) {
          t._extendDeep(t, configObj);
        }
      }
    });
  });

  // Override configurations with the old-style environment variables
  // Warning: This will be deprecated in a future major revision release
  var oldStyleEnv = t._loadOldStyleEnv();
  if (JSON.stringify(oldStyleEnv).length > 2) {
    t._extendDeep(t, oldStyleEnv);
    configSources.push({
      name: "Old-Style Environment Variables",
      parsed: oldStyleEnv,
    });
    console.log('\nWarning - old style $CONFIG_* environment configurations found. Convert to $NODE_CONFIG={JSON}')
  }

  // Override configurations from the $NODE_CONFIG environment variable
  if (process.env.NODE_CONFIG) {
    var newStyleEnv = {};
    try {
      newStyleEnv = JSON.parse(process.env.NODE_CONFIG);
    } catch(e) {
      console.error('The $NODE_CONFIG environment variable is malformed JSON');
    }
    t._extendDeep(t, newStyleEnv);
    configSources.push({
      name: "$NODE_CONFIG",
      parsed: newStyleEnv,
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
    t._extendDeep(t, cmdLineConfig);
    configSources.push({
      name: "--NODE_CONFIG argument",
      parsed: cmdLineConfig,
    });
  }

  // Remember the original configuration (before adding runtimeJson)
  originalConfig = t._cloneDeep(t);

  // Extend the original config with any prior runtime.json diffs
  runtimeJson = t._parseFile(RUNTIME_JSON_FILENAME) || {};
  t._extendDeep(t, runtimeJson);

  // Attach the config.prototype to all sub-objects.
  t._attachProtoDeep(t);

  // Return the configuration object
  return t;
};

/**
 * Check for the old-style environment variable configurations
 *
 * @protected
 * @deprecated
 * @method _loadOldStyleEnv
 * @return {Object} old-style configurations from process.env
 */
Config.prototype._loadOldStyleEnv = function() {
  var t = this,
      envOverride = {};

  for (var varName in process.env) {
    if (varName.indexOf('CONFIG_') === 0) {

      // Get the string or numeric value
      var value = process.env[varName],
          floatVal = parseFloat(value),
          value = floatVal.toString() === value ? floatVal : value;

      // Convert __ to ` (which you can't have in environment variables)
      // After splitting, ` are converted to single underscores
      varName = varName.replace(/__/g,'`');
      var parts = varName.split('_');
      parts.splice(0,1); // remove CONFIG

      var curCtxt = envOverride;
      for (var i = 0, l = parts.length; i < l; i++) {
        var partName = parts[i].replace(/`/g,'_');
        if (i == l - 1) {
          // Final (element) part
          curCtxt[partName] = value;
        }
        else {
          // Mid (object) part
          curCtxt[partName] = curCtxt[partName] || {};
          curCtxt = curCtxt[partName];
        }
      }
    }
  }
  return envOverride;
}


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

  // Make sure the runtime.json file exists.  This is required for fs.watch().
  var checkRuntimeJson = function() {
    if (fullFilename == RUNTIME_JSON_FILENAME) {
      try {
        FileSystem.writeFileSync(RUNTIME_JSON_FILENAME, '{}');
      } catch (e) {
        // If we cannot write file, clear watch function.
        t.watchForConfigFileChanges = function () {
          return;
        };
      }
      return {};
    }
    return null;
  };

  // Return null if the file doesn't exist.
  // Note that all methods here are the Sync versions.  This is appropriate during
  // module loading (which is a synchronous operation), but not thereafter.
  try {
    var stat = FileSystem.statSync(fullFilename);
    if (!stat || stat.size < 1) {
      return checkRuntimeJson();
    }
  } catch (e1) {
    return checkRuntimeJson();
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
 *   CUST_CONFIG.watch(...)
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
 * <p>Exposing original Config</p>
 *
 * <p>
 * This method allows get the original config properties.
 * </p>
 *
 * @method getOriginalConfig
 * @return {object} The original config object is returned
 */
Config.prototype.getOriginalConfig = function() {
    return originalConfig;
}

/**
 * <p>Reset Runtime Config</p>
 *
 * <p>
 * This method allows you to reset the runtime.json generated file.
 * </p>
 *
 * @method resetRuntime
 * @param callback {function} An optional callback function
 */
Config.prototype.resetRuntime = function(callback) {
    FileSystem.writeFile(RUNTIME_JSON_FILENAME, '{}', function(err, written, buffer) {
        if(err) {
            console.log("Cannot write runtime.json file " + err);
            if (callback && typeof(callback) === 'function') {
                callback(err);
            }
        }
        console.log("Write to runtime.json completed");
        if (callback && typeof(callback) === 'function') {
            callback(null, written, buffer);
        }
    });
}

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

// Watch for configuration file changes
global.NODE_CONFIG.watchForConfigFileChanges();
