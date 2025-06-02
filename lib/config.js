// config.js (c) 2010-2022 Loren West and other contributors
// May be freely distributed under the MIT license.
// For further details and documentation:
// http://lorenwest.github.com/node-config

// Dependencies
const RawConfig = require('../raw').RawConfig;
const { Util, Load } = require('./util.js');
const Path = require('path');

const DEFAULT_CLONE_DEPTH = 20;
let checkMutability = true;      // Check for mutability/immutability on first get

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
 *   const CONFIG = require('config').customer;
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
 * const CONFIG = require('config');
 * </pre>
 *
 * <p>
 * Sometimes you only care about a specific sub-object within the CONFIG
 * object.  In that case you could do this at the top of your file:
 * </p>
 * <pre>
 * const CONFIG = require('config').customer;
 * or
 * const CUSTOMER_CONFIG = require('config').customer;
 * </pre>
 *
 * <script type="text/javascript">
 *   document.getElementById("showProtected").style.display = "block";
 * </script>
 *
 * @method constructor
 * @return CONFIG {Object} - The top level configuration object
 */
const Config = function() {
  const t = this;

  // Bind all utility functions to this
  for (const fnName in util) {
    if (typeof util[fnName] === 'function') {
      util[fnName] = util[fnName].bind(t);
    }
  }

  // Merge configurations into this
  _init(FIRST_LOAD);
  Util.extendDeep(t, FIRST_LOAD.config);
  util.attachProtoDeep(t);

  // Perform strictness checks and possibly throw an exception.
  util.runStrictnessChecks(t);
};

/**
 * Utilities are under the util namespace vs. at the top level
 */
const util = Config.prototype.util = {};

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
  if(property === null || typeof property === "undefined"){
    throw new Error("Calling config.get with null or undefined argument");
  }

  // Make configurations immutable after first get (unless disabled)
  if (checkMutability) {
    if (!FIRST_LOAD.initParam('ALLOW_CONFIG_MUTATIONS', false)) {
      util.makeImmutable(config);
    }
    checkMutability = false;
  }
  const t = this;
  const value = Util.getPath(t, property);

  // Produce an exception if the property doesn't exist
  if (typeof value === "undefined") {
    throw new Error('Configuration property "' + property + '" is not defined');
  }

  // Return the value
  return value;
};

/**
 * Test that a configuration parameter exists
 *
 * <pre>
 *    const config = require('config');
 *    if (config.has('customer.dbName')) {
 *      console.log('Customer database name: ' + config.customer.dbName);
 *    }
 * </pre>
 *
 * @method has
 * @param property {string} - The configuration property to test. Can include '.' sub-properties.
 * @return {boolean} - True if the property is defined, false if not defined.
 */
Config.prototype.has = function(property) {
  // While get() throws an exception for undefined input, has() is designed to test validity, so false is appropriate
  if(property === null || typeof property === "undefined"){
    return false;
  }
  const t = this;
  return typeof Util.getPath(t, property) !== "undefined";
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
 *   const CONFIG = require("config");
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
 * @param defaultProperties {Object} - The default module configuration.
 * @return moduleConfig {Object} - The module level configuration object.
 */
util.setModuleDefaults = function (moduleName, defaultProperties) {

  // Copy the properties into a new object
  const t = this;
  const path = moduleName.split('.');
  const moduleConfig = FIRST_LOAD.setModuleDefaults(moduleName, defaultProperties);
  let existing = Util.getPath(t, path);

  if (existing === undefined) {
    Util.setPath(t, path, Util.cloneDeep(moduleConfig));
  } else {
    Util.extendDeep(existing, moduleConfig);
  }

  // reset the mutability check for "config.get" method.
  // we are not making t[moduleName] immutable immediately,
  // since there might be more modifications before the first config.get
  if (!FIRST_LOAD.initParam('ALLOW_CONFIG_MUTATIONS', false)) {
    checkMutability = true;
  }

  // Attach handlers & watchers onto the module config object
  return util.attachProtoDeep(Util.getPath(t, path));
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
 *   const CONFIG = require('config');
 *   ...
 *
 *   // Hide the Amazon S3 credentials
 *   CONFIG.util.makeHidden(CONFIG.amazonS3, 'access_id');
 *   CONFIG.util.makeHidden(CONFIG.amazonS3, 'secret_key');
 * </pre>
 *
 * @deprecated use Util.makeHidden
 * @method makeHidden
 * @param object {Object} - The object to make a hidden property into.
 * @param property {string} - The name of the property to make hidden.
 * @param value {*} - (optional) Set the property value to this (otherwise leave alone)
 * @return object {Object} - The original object is returned - for chaining.
 */
util.makeHidden = function(object, property, value) {
  return Util.makeHidden(object, property, value);
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
 *   const config = require('config');
 *   const myObject = {hello:'world'};
 *   config.util.makeImmutable(myObject);
 * </pre>
 *
 * @method makeImmutable
 * @param object {Object} - The object to specify immutable properties for
 * @param [property] {string | [string]} - The name of the property (or array of names) to make immutable.
 *        If not provided, all owned properties of the object are made immutable.
 * @param [value] {* | [*]} - Property value (or array of values) to set
 *        the property to before making immutable. Only used when setting a single
 *        property. Retained for backward compatibility.
 * @return object {Object} - The original object is returned - for chaining.
 */
util.makeImmutable = function(object, property, value) {
  if (Buffer.isBuffer(object)) {
    return object;
  }
  let properties = null;

  // Backwards compatibility mode where property/value can be specified
  if (typeof property === 'string') {
    return Object.defineProperty(object, property, {
      value : (typeof value === 'undefined') ? object[property] : value,
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
  for (let i = 0; i < properties.length; i++) {
    const propertyName = properties[i];
    let value = object[propertyName];

    if (value instanceof RawConfig) {
      Object.defineProperty(object, propertyName, {
        value: value.resolve(),
        writable: false,
        configurable: false
      });
    } else if (Array.isArray(value)) {
      // Ensure object items of this array are also immutable.
      value.forEach((item, index) => { if (Util.isObject(item) || Array.isArray(item)) util.makeImmutable(item) })

      Object.defineProperty(object, propertyName, {
        value: Object.freeze(value)
      });
    } else {
      // Call recursively if an object.
      if (Util.isObject(value)) {
        // Create a proxy, to capture user updates of configuration options, and throw an exception for awareness, as per:
        // https://github.com/lorenwest/node-config/issues/514
        value = new Proxy(util.makeImmutable(value), {
          get(target, property, receiver) {
            // Config's own defined prototype properties and methods (e.g., `get`, `has`, etc.)
            const ownProps = [
              ...Object.getOwnPropertyNames(Config.prototype), //TODO: This keeps us from moving this function to util.js where it belongs
              ...Object.getOwnPropertyNames(target),
            ]

            // Bypass proxy receiver for properties directly on the target (e.g., RegExp.prototype.source)
            // or properties that are not functions to prevent errors related to internal object methods.
            if (ownProps.includes(property) || (property in target && typeof target[property] !== 'function')) {
              return Reflect.get(target, property);
            }

            // Otherwise, use the proxy receiver to handle the property access
            const ref = Reflect.get(target, property, receiver);

            // Binds the method's `this` context to the target object (e.g., Date.prototype.toISOString)
            // to ensure it behaves correctly when called on the proxy.
            if (typeof ref === 'function') {
              return ref.bind(target);
            }
            return ref;
          },
          set (target, name) {
            const message = (Reflect.has(target, name) ? 'update' : 'add');
            // Notify the user.
            throw Error(`Can not ${message} runtime configuration property: "${name}". Configuration objects are immutable unless ALLOW_CONFIG_MUTATIONS is set.`)
          }
        })
      }

      // Check if property already has writable: false and configurable: false
      const currentDescriptor = Object.getOwnPropertyDescriptor(object, propertyName);
      if (!currentDescriptor || currentDescriptor.writable !== false || currentDescriptor.configurable !== false) {
        Object.defineProperty(object, propertyName, {
          value: value,
          writable : false,
          configurable: false
        });
      }

      // Ensure new properties can not be added, as per:
      // https://github.com/lorenwest/node-config/issues/505
      Object.preventExtensions(object[propertyName])
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
util.getConfigSources = function() {
  return FIRST_LOAD.getSources();
};

/**
 * Looks into an options object for a specific attribute
 *
 * <p>
 * This method looks into the options object, and if an attribute is defined, returns it,
 * and if not, returns the default value
 * </p>
 *
 * @method getOption
 * @deprecated use Util.getOption
 * @param options {Object | undefined} the options object
 * @param optionName {string} the attribute name to look for
 * @param defaultValue { any } the default in case the options object is empty, or the attribute does not exist.
 * @return options[optionName] if defined, defaultValue if not.
 */
util.getOption = function(options, optionName, defaultValue) {
  return Util.getOption(options, optionName, defaultValue);
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
 * </pre>
 *
 * <p>
 * EXT can be yml, yaml, coffee, iced, json, jsonc, cson or js signifying the file type.
 * yaml (and yml) is in YAML format, coffee is a coffee-script, iced is iced-coffee-script,
 * json is in JSON format, jsonc is in JSONC format, cson is in CSON format, properties is
 * in .properties format (http://en.wikipedia.org/wiki/.properties), and js is a javascript
 * executable file that is require()'d with module.exports being the config object.
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
 * variable (which can be overridden by using $NODE_CONFIG_ENV
 * environment variable). Defaults to 'development'.
 * </p>
 *
 * <p>
 * If the $NODE_APP_INSTANCE environment variable (or --NODE_APP_INSTANCE
 * command line parameter) is set, then files with this appendage will be loaded.
 * See the Multiple Application Instances section of the main documentation page
 * for more information.
 * </p>
 *
 * @protected
 * @see Util.loadFileConfigs for discrete execution of (most of this functionality
 * @method loadFileConfigs
 * @param configDir { string | null } the path to the directory containing the configurations to load
 * @param options { LoadOptions | undefined } parsing options
 * @return {Object} The configuration object
 */
util.loadFileConfigs = function(configDir, options) {
  let newLoad;

  if (configDir) {
    let opts = {...FIRST_LOAD.options, configDir, ...options};
    newLoad = new Load(opts);
    newLoad.scan();
  } else {
    newLoad = new Load({...FIRST_LOAD.options, ...options});
    _init(newLoad);
  }

  return newLoad.config;
}

/**
 * Scan with the default config dir (usually only at startup.
 * This adds a bit more data from NODE_CONFIG that _load() skips
 *
 * @param load {Load}
 * @private
 */
function _init(load) {
  let options = load.options;
  let additional = [];

  // Override configurations from the $NODE_CONFIG environment variable
  let envConfig = {};

  load.setEnv("CONFIG_DIR", options.configDir);

  if (process.env.NODE_CONFIG) {
    try {
      envConfig = JSON.parse(process.env.NODE_CONFIG);
    } catch(e) {
      console.error('The $NODE_CONFIG environment variable is malformed JSON');
    }

    additional.push({ name: "$NODE_CONFIG", config: envConfig });
  }

  // Override configurations from the --NODE_CONFIG command line
  let cmdLineConfig = load.getCmdLineArg('NODE_CONFIG');
  if (cmdLineConfig) {
    try {
      cmdLineConfig = JSON.parse(cmdLineConfig);
    } catch(e) {
      console.error('The --NODE_CONFIG={json} command line argument is malformed JSON');
    }

    additional.push({ name: "--NODE_CONFIG argument", config: cmdLineConfig });
  }

  // Place the mixed NODE_CONFIG into the environment
  load.setEnv('NODE_CONFIG', JSON.stringify(Util.extendDeep(envConfig, cmdLineConfig, {})));

  load.scan(additional);
}

/**
 * Return a list of fullFilenames who exists in allowedFiles
 * Ordered according to allowedFiles argument specifications
 *
 * @protected
 * @deprecated use Util.locateMatchingFiles
 * @method locateMatchingFiles
 * @param configDirs {string}   the config dir, or multiple dirs separated by a column (:)
 * @param allowedFiles {Object} an object. keys and supported filenames
 *                              and values are the position in the resolution order
 * @returns {string[]}          fullFilenames - path + filename
 */
util.locateMatchingFiles = function(configDirs, allowedFiles) {
  return Util.locateMatchingFiles(configDirs, allowedFiles);
};

/**
 * @deprecated use Util.resolveDeferredConfigs
 * @param config
 */
// Using basic recursion pattern, find all the deferred values and resolve them.
util.resolveDeferredConfigs = function (config) {
  return Util.resolveDeferredConfigs(config);
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
 * .coffee = File to run that has a module.exports with coffee-script containing the config object
 * .iced = File to run that has a module.exports with iced-coffee-script containing the config object
 * All other supported file types (yaml, toml, json, cson, hjson, json5, properties, xml)
 * are parsed with util.parseString.
 *
 * If the file doesn't exist, a null will be returned.  If the file can't be
 * parsed, an exception will be thrown.
 *
 * This method performs synchronous file operations, and should not be called
 * after synchronous module loading.
 *
 * @protected
 * @deprecated
 * @method parseFile
 * @param fullFilename {string} The full file path and name
 * @param options { object | undefined } parsing options. Current supported option: skipConfigSources: true|false
 * @return configObject {object|null} The configuration object parsed from the file
 */
util.parseFile = function(fullFilename, options = {}) {
  let loadOpts = {...FIRST_LOAD.options}; //TODO: Support full LoadOptions?
  let loadInfo = new Load(loadOpts);

  loadInfo.loadFile(fullFilename);

  return loadInfo.config;
}

/**
 * Parse and return the specified string with the specified format.
 *
 * The format determines the parser to use.
 *
 * json = File is parsed using JSON.parse()
 * yaml (or yml) = Parsed with a YAML parser
 * toml = Parsed with a TOML parser
 * cson = Parsed with a CSON parser
 * hjson = Parsed with a HJSON parser
 * json5 = Parsed with a JSON5 parser
 * properties = Parsed with the 'properties' node package
 * xml = Parsed with a XML parser
 *
 * If the file doesn't exist, a null will be returned.  If the file can't be
 * parsed, an exception will be thrown.
 *
 * This method performs synchronous file operations, and should not be called
 * after synchronous module loading.
 *
 * @protected
 * @deprecated
 * @method parseString
 * @param content {string} The full content
 * @param format {string} The format to be parsed
 * @return {configObject} The configuration object parsed from the string
 */
util.parseString = function (content, format) {
  return FIRST_LOAD.parseString(content, format);
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
 *   const CUST_CONFIG = require('config').Customer;
 *   CUST_CONFIG.get(...)
 * </pre>
 *
 * @protected
 * @method attachProtoDeep
 * @param toObject {Object}
 * @param depth {number=20}
 * @return {Object}
 */
util.attachProtoDeep = function(toObject, depth) {
  if (toObject instanceof RawConfig) {
    return toObject;
  }

  // Recursion detection
  depth = (depth === null ? DEFAULT_CLONE_DEPTH : depth);
  if (depth < 0) {
    return toObject;
  }

  // Adding Config.prototype methods directly to toObject as hidden properties
  // because adding to toObject.__proto__ exposes the function in toObject
  for (const fnName in Config.prototype) {
    if (!toObject[fnName]) {
      Util.makeHidden(toObject, fnName, Config.prototype[fnName]);
    }
  }

  // Add prototypes to sub-objects
  for (const prop in toObject) {
    if (Util.isObject(toObject[prop])) {
      util.attachProtoDeep(toObject[prop], depth - 1);
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
 * @deprecated please see Util.cloneDeep
 * @method cloneDeep
 * @param parent {Object} The original object to copy from
 * @param [depth=20] {number} Maximum depth (default 20)
 * @return {Object} A new object with the elements copied from the copyFrom object
 */
util.cloneDeep = function cloneDeep(parent, depth, circular, prototype) {
  return Util.cloneDeep(parent, depth, circular, prototype);
};

/**
 * Set objects given a path as a string list
 *
 * @protected
 * @deprecated see Util.setPath()
 *
 * @method setPath
 * @param object {Object} - Object to set the property on
 * @param path {array[string]} - Array path to the property
 * @param value {*} - value to set, ignoring null
 */
util.setPath = function (object, path, value) {
  Util.setPath(object, path, value);
};

/**
 * Create a new object patterned after substitutionMap, where:
 * 1. Terminal string values in substitutionMap are used as keys
 * 2. To look up values in a key-value store, variables
 * 3. And parent keys are created as necessary to retain the structure of substitutionMap.
 *
 * @protected
 * @deprecated
 *
 * @method substituteDeep
 * @param substitutionMap {Object} - an object whose terminal (non-subobject) values are strings
 * @param variables {object[string:value]} - usually process.env, a flat object used to transform
 *      terminal values in a copy of substitutionMap.
 * @returns {Object} - deep copy of substitutionMap with only those paths whose terminal values
 *      corresponded to a key in `variables`
 */
util.substituteDeep = function (substitutionMap, variables) {
  return FIRST_LOAD.substituteDeep(substitutionMap, variables);
};

/**
 *  Map environment variables into the configuration if a mapping file,
 * `custom-environment-variables.EXT` exists.
 *
 * @protected
 * @deprecated
 * @method getCustomEnvVars
 * @param configDir {string} - the passed configuration directory
 * @param extNames {Array[string]} - acceptable configuration file extension names.
 * @returns {Object} - mapped environment variables or {} if there are none
 */
util.getCustomEnvVars = function (configDir, extNames) {
  let options = {...FIRST_LOAD.options, configDir};
  let load = new Load(options);

  load.loadCustomEnvVars(extNames);

  return load.config;
};

/**
 * Return true if two objects have equal contents.
 *
 * @protected
 * @deprecated see Util.equalsDeep()
 *
 * @method equalsDeep
 * @param object1 {Object} The object to compare from
 * @param object2 {Object} The object to compare with
 * @param depth {integer} An optional depth to prevent recursion.  Default: 20.
 * @return {boolean} True if both objects have equivalent contents
 */
util.equalsDeep = function(object1, object2, depth) {
  return Util.equalsDeep(object1, object2, depth);
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
 * <b>This function has a number of issues and you may be better off with lodash</b>
 *
 * @protected
 * @deprecated please investigate lodash or similar tools for object traversal
 * @method diffDeep
 * @param object1 {Object} The base object to compare to
 * @param object2 {Object} The object to compare with
 * @param depth {integer} An optional depth to prevent recursion.  Default: 20.
 * @return {Object} A differential object, which if extended onto object1 would
 *                  result in object2.
 */
util.diffDeep = function(object1, object2, depth) {
  // Recursion detection
  const diff = {};
  depth = (depth === null ? DEFAULT_CLONE_DEPTH : depth);
  if (depth < 0) {
    return {};
  }

  // Process each element from object2, adding any element that's different
  // from object 1.
  for (const parm in object2) {
    const value1 = object1[parm];
    const value2 = object2[parm];
    if (value1 && value2 && Util.isObject(value2)) {
      if (!(Util.equalsDeep(value1, value2))) {
        diff[parm] = util.diffDeep(value1, value2, depth - 1);
      }
    }
    else if (Array.isArray(value1) && Array.isArray(value2)) {
      if(!Util.equalsDeep(value1, value2)) {
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
 * @deprecated please use Util.extendDeep()
 * @method extendDeep
 * @param mergeInto {Object} The object to merge into
 * @param mergeFrom... {object[]} - Any number of objects to merge from
 * @param depth {integer} An optional depth to prevent recursion.  Default: 20.
 * @return {Object} The altered mergeInto object is returned
 */
util.extendDeep = function(mergeInto, ...vargs) {
  return Util.extendDeep(mergeInto, ...vargs);
};

/**
 * Is the specified argument a regular javascript object?
 *
 * The argument is an object if it's a JS object, but not an array.
 *
 * @protected
 * @deprecated please use Util.isObject()
 * @method isObject
 * @param obj {*} An argument of any type.
 * @return {boolean} TRUE if the arg is an object, FALSE if not
 */
util.isObject = function(obj) {
  return Util.isObject(obj);
};

/**
 * Is the specified argument a javascript promise?
 *
 * @protected
 * @deprecated please use Util.isPromise()
 * @method isPromise
 * @param obj {*} An argument of any type.
 * @returns {boolean}
 */
util.isPromise = function(obj) {
  return Util.isPromise(obj);
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
 * @method initParam
 * @deprecated
 * @param paramName {String} Name of the parameter
 * @param [defaultValue] {*} Default value of the parameter
 * @return {*} The found value, or default value
 */
util.initParam = function (paramName, defaultValue) {
  return FIRST_LOAD.initParam(paramName, defaultValue);
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
 * @method getCmdLineArg
 * @deprecated
 * @param searchFor {String} The argument name to search for
 * @return {*} false if the argument was not found, the argument value if found
 */
util.getCmdLineArg = function (searchFor) {
  return FIRST_LOAD.getCmdLineArg(searchFor);
}


/**
 * <p>Get a Config Environment Variable Value</p>
 *
 * <p>
 * This method returns the value of the specified config environment variable,
 * including any defaults or overrides.
 * </p>
 *
 * @method getEnv
 * @deprecated
 * @param varName {String} The environment variable name
 * @return {String} The value of the environment variable
 */
util.getEnv = function (varName) {
  return FIRST_LOAD.getEnv(varName);
}



/**
 * Returns a string of flags for regular expression `re`.
 *
 * @protected
 * @deprecated This is an internal implementation detail
 * @param {RegExp} re Regular expression
 * @returns {string} Flags
 */
util.getRegExpFlags = function (re) {
  return Util.getRegExpFlags(re);
};

/**
 * Returns a new deep copy of the current config object, or any part of the config if provided.
 *
 * @param {Object} config The part of the config to copy and serialize. Omit this argument to return the entire config.
 * @returns {Object} The cloned config or part of the config
 */
util.toObject = function(config) {
  return Util.toObject(config || this);
};

// Run strictness checks on NODE_ENV and NODE_APP_INSTANCE and throw an error if there's a problem.
util.runStrictnessChecks = function (config) {
  if (FIRST_LOAD.initParam('SUPPRESS_STRICTNESS_CHECK')) {
    return;
  }

  const sources = config.util.getConfigSources();
  const sourceFilenames = sources.map(function (src) {
    return Path.basename(src.name);
  });

  FIRST_LOAD.options.nodeEnv.forEach(function(env) {
    // Throw an exception if there's no explicit config file for NODE_ENV
    const anyFilesMatchEnv = sourceFilenames.some(function (filename) {
        return filename.match(env);
    });
    // development is special-cased because it's the default value
    if (env && (env !== 'development') && !anyFilesMatchEnv) {
      _warnOrThrow(`${FIRST_LOAD.getEnv("nodeEnv")} value of '${env}' did not match any deployment config file names.`);
    }
    // Throw if NODE_ENV matches' default' or 'local'
    if ((env === 'default') || (env === 'local')) {
      _warnOrThrow(`${FIRST_LOAD.getEnv("nodeEnv")} value of '${env}' is ambiguous.`);
    }
  });

  let appInstance = FIRST_LOAD.options.appInstance;

  if (appInstance) {
    // Throw an exception if there's no explicit config file for NODE_APP_INSTANCE
    const anyFilesMatchInstance = sourceFilenames.some(function (filename) {
      return filename.match(appInstance);
    });

    if (!anyFilesMatchInstance) {
      _warnOrThrow(`NODE_APP_INSTANCE value of '${appInstance}' did not match any instance config file names.`);
    }
  }

  function _warnOrThrow (msg) {
    const beStrict = process.env.NODE_CONFIG_STRICT_MODE;
    const prefix = beStrict ? 'FATAL: ' : 'WARNING: ';
    const seeURL = 'See https://github.com/node-config/node-config/wiki/Strict-Mode';

    console.error(prefix+msg);
    console.error(prefix+seeURL);

    // Accept 1 and true as truthy values. When set via process.env, Node.js casts them to strings.
    if (["true", "1"].indexOf(beStrict) >= 0) {
      throw new Error(prefix+msg+' '+seeURL);
    }
  }
};

/** @type {Load} */
const FIRST_LOAD = Load.fromEnvironment();

// Instantiate and export the configuration
const config = module.exports = new Config();

// copy method to util for backwards compatibility
util.stripYamlComments = FIRST_LOAD.parser.stripYamlComments;

// Produce warnings if the configuration is empty
const showWarnings = !(FIRST_LOAD.initParam('SUPPRESS_NO_CONFIG_WARNING'));
if (showWarnings && Object.keys(config).length === 0) {
  console.error('WARNING: No configurations found in configuration directory:' + FIRST_LOAD.options.configDir);
  console.error('WARNING: To disable this warning set SUPPRESS_NO_CONFIG_WARNING in the environment.');
}
