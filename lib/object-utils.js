// Dependencies
var File = require('fs');
var Yaml = require('yaml');
var FileSystem = require('fs');

// Static members
var DEFAULT_CLONE_DEPTH = 6,
    FILE_WATCHER_INTERVAL = 3000,
    CONFIG_PATH = process.cwd() + '/config/'

/**
 * <p>Runtime Application Configurations</p>
 *
 * <p>
 * The config module is a singleton class representing all runtime
 * configurations for this application instance.
 * </p>
 *
 * <p>
 * The require('config') constructor returns the global configuration object.
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
 * This code loads the customer section into the CONFIG variable:
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
 * @module node-config
 * @class Config
 */
var Config = function() {
      this._buildConfig();
    };

/**
 * <p>Monitor a configuration value for runtime changes.</p>
 *
 * <p>
 * 
 * Configuration values can be changed in a running application by the 
 * application applying changes, or by a manual change to the runtime.json
 * file within the configuration directory. This method lets you specify a 
 * function to run if a configuration value changes.  
 * </p>
 * 
 * <p>
 * If you want to prevent changes to configuration values, it's better to use 
 * the makePropertyImmutable method.
 * </p>
 * 
 * <p>
 * This method was built for monitoring changes to configuration values,
 * but it can be used for watching changes to any javascript object.
 * </p>
 *
 * @method watch
 * @param object {object} - The object to watch.  Can be any javascript object.
 * @param property {string} - The property name to watch.  Watch all object properties if null.
 * @param handler {function(object, propertyName, priorValue, newValue)} - Handler called when a property change is detected.
 *   The handler is run along with other handlers registered for notification.
 *   If the handler changes the value of the property, that change is applied after all handlers have finished processing the current change.
 *   Then all handlers (including this one) will be called again with the newly changed value.
 * @param depth {integer} (optional) - If watching all object properties or if the specified property is an object, this specifies the depth of the object graph to watch for changes.  Default 6.
 * @return object {object} - The original object is returned.
 */
Config.prototype.watch = function(object, property, handler, depth) {

  // Initialize
  var t = object;
  var allProperties = property ? [property] : Object.keys(t);

  // Depth detection
  depth = (depth === null ? DEFAULT_CLONE_DEPTH : depth);
  if (depth < 0) {
    return;
  }

  // Create hidden properties on the object
  function makeHiddenProperty(hiddenProp, initialValue) {
    Object.defineProperty(t, hiddenProp, {
      value: initialValue,
      writable : true,
      enumerable : false,
      configurable : false
    });
  }
  if (!t.__watchers)
    makeHiddenProperty('__watchers', {});
  if (!t.__propertyValues)
    makeHiddenProperty('__propertyValues', {});
  
  // Attach watchers to all requested properties
  allProperties.forEach(function(prop){

    // Setup the property for watching (first time only)
    if (typeof(t.__propertyValues[prop]) == 'undefined') {

      // Don't error re-defining the property if immutable
      var descriptor = Object.getOwnPropertyDescriptor(t,prop);
      if (descriptor && descriptor.writable === false)
        return;

      // Copy the value to the hidden field, and add the property to watchers
      t.__propertyValues[prop] = [t[prop]];
      t.__watchers[prop] = [];

      // Attach the property watcher
      Object.defineProperty(t, prop, {
        enumerable : true,
        configurable : false,

        get : function(){ 
          // If more than 1 item is in the values array,
          // then we're currently processing watchers.
          if (t.__propertyValues[prop].length == 1)
            // Current value
            return t.__propertyValues[prop][0];
          else
            // [0] is prior value, [1] is new value being processed
            return t.__propertyValues[prop][1];
        },

        set : function(newValue) {

          // Return early if no change
          var origValue = t[prop];
          if (origValue === newValue)
            return;

          // Remember the new value, and return if we're in another setter
          t.__propertyValues[prop].push(newValue);
          if (t.__propertyValues[prop].length > 2)
            return;

          // Call all watchers for each change requested
          var numIterations = 0;
          while (t.__propertyValues[prop].length > 1) {

            // Detect recursion
            if (++numIterations > 20) {
              t.__propertyValues[prop] = [origValue];
              throw new Error('Recursion detected while setting [' + prop + ']');
            }

            // Call each watcher for the current values
            var oldValue = t.__propertyValues[prop][0];
            newValue = t.__propertyValues[prop][1];
            t.__watchers[prop].forEach(function(watcher) {
              try {
                watcher(t, prop, oldValue, newValue);
              } catch (e) {
                // Log an error and continue with subsequent watchers
                console.error("Exception in watcher for " + prop);
              }
            });

            // Done processing this value
       	    t.__propertyValues[prop].splice(0,1);
          }
        }
      });
    	  
    } // Done setting up the property for watching (first time)

    // Add the watcher to the property
    t.__watchers[prop].push(handler);
    
    // Recurs if this is an object...
    if (typeof(t[prop]) == 'object') {
      Config.prototype.watch(t[prop], null, handler, depth - 1);
    }

  }); // Done processing each property

  // Return the original object - for chaining
  return t;
};

/**
 * <p>Make a configuration property immutable (assuring it cannot be changed).</p>
 * 
 * <p>
 * This method was built for configuration properties that shouldn't change,
 * but it can be applied to any javascript object property.
 * </p>
 * 
 * <p>
 * This operation cannot be un-done.
 * </p>
 *
 * @method makeImmutable
 * @param object {object} - The object to attach an immutable property into.  
 * @param property {string} - The name of the property to make immutable.
 */
Config.prototype.makeImmutable = function(object, property) {

  // Disable writing, and make sure the property cannot be re-configured.
  Object.defineProperty(object, property, {
    writable : false,
    configurable: false
  });
};

/**
 * <p>Assemble the configuration object members into this object</p>
 *
 * @protected
 * @method _buildConfig
 */
Config.prototype._buildConfig = function() {

  // Load the individual file configurations in order
  var t = this;
  t._loadFileConfigs();
  t._watchForConfigFileChanges();

};

/**
 * Monitor the filesystem for configuration file changes.
 *
 * <p>
 * Runtime configuration changes are made by modifying the runtime.json file.
 * This paradigm allows multiple application servers to internally notify
 * listeners whenever the configuration changes.
 * </p>
 *
 * <p>
 * This method attaches the file watcher onto the runtime.json file.
 * </p>
 *
 * @protected
 * @method _watchForConfigFileChanges
 */
Config.prototype._watchForConfigFileChanges = function() {

  // Attach the file watcher
  var t = this;
  var runtimeYamlFilename = CONFIG_PATH + 'runtime.json';
  FileSystem.watchFile(runtimeYamlFilename, function(curr, prev) {

    // no-op if the file hasn't changed
    if (curr.mtime == prev.mtime) {
      return;
    }

    // Load the runtime.json file asynchronously.
    FileSystem.readFile(runtimeYamlFilename, 'UTF-8', function(err, fileContent) {

      // Not much to do on error
      if (err) {
        console.error("Error loading " + runtimeYamlFilename);
        return;
      }

      // Parse the file and mix it in to this config object.
      // This notifies listeners
      try {
        var configObject = JSON.parse(fileContent);
        t._extendDeep(t, configObject);
      } catch (e) {
        console.error("Error parsing " + runtimeJsonFilename, e);
        return;
      }

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
 *   runtime.json
 * </pre>
 *
 * <p>
 * EXT can be yaml, json, or js signifying the file type.  yaml is in YAML format,
 * json is in strict JSON format, and js is a javascript executable file that is
 * require()'d with module.exports being the config object.
 * </p>
 *
 * <p>
 * (hostname) is the $HOST environment variable if set, otherwise the
 * $HOSTNAME environment variable if set, otherwise the hostname found from
 * require('os').hostname()
 * </p>
 *
 * <p>
 * (deployment) is the deployment type, found in the $NODE_ENV environment
 * variable.  Defaults to 'development'.
 * </p>
 *
 * <p>
 * The runtime.json file contains configuration changes made at runtime via
 * the CONFIG.set('element',value) method.
 * </p>
 *
 * @protected
 * @method _loadFileConfigs
 * @return {this} The configuration object
 */
Config.prototype._loadFileConfigs = function() {

  // Initialize
  var t = this;

  // Determine the host name from the OS module, $HOST, or $HOSTNAME
  // Remove any . appendages, and default to null if not set
  try {
    var OS = require('os');
    var hostName = OS.hostname();
  } catch (e) {
    hostName = process.env.HOST || process.env.HOSTNAME;
  }
  hostName = hostName ? hostName.split('.')[0] : null;

  // Get the deployment type from NODE_ENV
  var deployment = process.env.NODE_ENV || 'development';

  // Read each file in turn
  var baseNames = ['default', hostName, deployment, hostName + '-' + deployment, 'runtime'];
  var extNames = ['js', 'json', 'yaml'];
  baseNames.forEach(function(baseName) {
    extNames.forEach(function(extName) {
      // Try merging the config object into this object
      var fullFilename = CONFIG_PATH + baseName + '.' + extName;
      var configObj = t._parseFile(fullFilename);
      if (configObj) {
        t._extendDeep(t, configObj);
      }
    });
  });

  // Attach the config.prototype to all sub-objects.
  t._attachProtoDeep(t);

  // Return the configuration object
  return t;
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
 * .yaml = Parsed with a YAML parser
 *
 * If the file doesn't exist, a null will be returned.
 *
 * If the file can't be parsed, an exception will be thrown.
 *
 * @protected
 * @method _loadFileConfigs
 * @param fullFilename {string} The full file path and name
 * @return {configObject} The configuration object parsed from the file
 */
Config.prototype._parseFile = function(fullFilename) {

  // Initialize
  var extension = fullFilename.substr(fullFilename.lastIndexOf('.') + 1),
      configObject = null,
      fileContent = null;

  // Return null if the file doesn't exist.
  // Note that all methods here are the Sync versions.  This allows the 
  // config package to follow the same calling semantics as require('filename') 
  // which is also synchronous.
  try {
    var stat = FileSystem.statSync(fullFilename);
    if (!stat || stat.size < 1) {
      return null;
    }
  } catch (e1) {
    return null;
  }

  // Try loading the file.
  try {
    fileContent = FileSystem.readFileSync(fullFilename, 'UTF-8');
  }
  catch (e2) {
    throw new Error('Config file ' + fullFilename + ' cannot be read');
  }

  try {
    if (extension == 'yaml') {
      // The yaml library doesn't like strings that have newlines but don't 
      // end in a newline: https://github.com/visionmedia/js-yaml/issues/issue/13
      fileContent += '\n';
      configObject = Yaml.eval(fileContent);
    }
    else if (extension == 'json') {
      configObject = JSON.parse(fileContent);
    }
    else if (extension == 'js') {
      configObject = require(fullFilename);
    }
  }
  catch (e3) {
    throw new Error("Cannot parse config file: '" + fullFilename + "': " + e3);
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
 *   var CONFIG = require('config').Customer;
 *   CONFIG.watch(...)
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
    return;
  }
  
  // Attach the prototype to this object
  toObject.__proto__ = Config.prototype;

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
    if (Array.isArray(obj[prop]) || t._isObject(obj[prop])) {
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
 * Is the specified argument an object?
 *
 * The argument is an object if it's a JS object, but not an array.
 *
 * @protected
 * @method _isObject
 * @param arg {MIXED} An argument of any type.
 * @return {boolean} TRUE if the arg is an object, FALSE if not
 */
Config.prototype._isObject = function(obj) {
  if (Array.isArray(obj)) {
    return false;
  }
  return typeof obj == 'object';
};

// The module exports a singleton instance of the Config class so the
// instance is immediately available on require(), and the prototype methods 
// aren't a part of the object namespace when inspected.
module.exports = new Config();




/*

Would like to have a :

didChange() - 

1) Gathers a new runtime.json object as diff this vs. originalConfig
2) If different from current runtime.json: (can javascript object.set() do this?)
   * Save into current runtime.json
   * Notify listeners
   * Write it out to disk

Change notification:
1) Load the new runtime.json file
2) If different from current runtime.json:
   * Save into current runtime.json
   * Merge into this
   * Notify listeners


*/