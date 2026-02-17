// config.js (c) 2010-2026 Loren West and other contributors
// May be freely distributed under the MIT license.
// For further details and documentation:
// http://lorenwest.github.com/node-config

// Dependencies
/** @typedef {import('./util').Util} Util */
/** @typedef {import('./util').Load} Load */
/** @typedef {import('./util').LoadOptions} LoadOptions */
/** @typedef {typeof import('./../parser')} Parser */
const { Util, Load, RawConfig } = require('./util.js');
const Path = require('path');
const LOAD_SYMBOL = Symbol('load');

const DEFAULT_CLONE_DEPTH = 20;

/**
 * <p>Application Configurations</p>
 * @class
 */
class ConfigClass {
  /**
   * Non-enumerable field for util functions
   *
   * @type {ConfigUtils}
   */
  util;

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
   */
  constructor(load) {
    this[LOAD_SYMBOL] = load;
    Util.extendDeep(this, load.config);

    Util.makeHidden(this, 'util', new ConfigUtils(this));
    this.util.attachProtoDeep(this);
    // Perform strictness checks and possibly throw an exception.
    this.util.runStrictnessChecks(this);
  }

  /**
   * <p>Get a configuration value</p>
   *
   * <p>
   * This will return the specified property value, throwing an exception if the
   * configuration isn't defined.  It is used to assure configurations are defined
   * before being used, and to prevent typos.
   * </p>
   *
   * @template T
   * @param {string} property - The configuration property to get. Can include '.' sub-properties.
   * @returns {T} The property value
   */
  get(property) {
    if(property === null || typeof property === "undefined"){
      throw new Error("Calling config.get with null or undefined argument");
    }

    // Make configurations immutable after first get (unless disabled)
    if (Object.isExtensible(this)) {
      const load = this[LOAD_SYMBOL];

      if (!load.initParam('ALLOW_CONFIG_MUTATIONS', false)) {
        this.util.makeImmutable();
      }
    }

    const value = Util.getPath(this, property);

    // Produce an exception if the property doesn't exist
    if (typeof value === "undefined") {
      throw new Error('Configuration property "' + property + '" is not defined');
    }

    // Return the value
    return value;
  }

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
   * @param {string} property - The configuration property to test. Can include '.' sub-properties.
   * @return {boolean} - True if the property is defined, false if not defined.
   */
  has(property) {
    // While get() throws an exception for undefined input, has() is designed to test validity, so false is appropriate
    if (property === null || typeof property === "undefined"){
      return false;
    }

    return typeof Util.getPath(this, property) !== "undefined";
  }
}

/**
 * The exported configuration instance type.
 * This is here because the Config class is not a named export and this is how we get
 * the exported configuration instance type.
 * @typedef {ConfigClass} Config
 */

/**
 * Source of config.util utility functions.
 *
 * In general, lib/util.js is what you are looking for.
 *
 * @class ConfigUtils
 */
class ConfigUtils {
  /** @type {Config} */
  #config = undefined;

  /**
   * @param {Config} config
   */
  constructor(config) {
    this.#config = config;
  }

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
   * @param {string} moduleName - Name of your module.
   * @param {any} defaultProperties - The default module configuration.
   * @return {any} moduleConfig - The module level configuration object.
   * @see Load.scan() for loading more robust defaults
   */
  setModuleDefaults(moduleName, defaultProperties) {
    // Copy the properties into a new object
    const path = moduleName.split('.');
    const load = this.#config[LOAD_SYMBOL];
    const moduleConfig = load.setModuleDefaults(moduleName, defaultProperties);
    let existing = Util.getPath(this.#config, path);

    if (existing === undefined) {
      Util.setPath(this.#config, path, Util.cloneDeep(moduleConfig));
    } else {
      Util.extendDeep(existing, moduleConfig);
    }

    //  Attach handlers & watchers onto the module config object
    return this.attachProtoDeep(Util.getPath(this.#config, path));
  }

  /**
   * Set default configurations for a node.js module.
   *
   * This variant is provided to support handling loading of multiple versions
   * of a library. This is meant for module developers to create a config snapshot
   * for an old version of the code, particularly during a staged upgrade.
   * Instead of adding the values to the configuration, it creates a new Config
   * instance that contains the provided defaults.
   *
   * Note: This feature is primarily useful for adding, removing, or renaming
   * properties. It will struggle to deal with changing the semantics of
   * existing fields if you need to override those fields in your top level
   * config/ directory. It is always best when versioning an API to change the
   * names of fields when you change the meaning of the field.
   *
   * <p>Using the function within your module:</p>
   * <pre>
   *   const configModule = require("config");
   *   const config = configModule.withModuleDefaults("MyModule", {
   *   &nbsp;&nbsp;templateName: "t-50",
   *   &nbsp;&nbsp;colorScheme: "green"
   *   });
   * <br>
   *   // Template name may be overridden by application config files
   *   console.log("Template: " + config.MyModule.templateName);
   * </pre>
   *
   * <p>
   * The above example results in a "MyModule" element of the configuration
   * object, containing an object with the specified default values.
   * </p>
   *
   * @method withModuleDefaults
   * @param moduleName {string} - Name of your module.
   * @param defaultProperties {Object} - The default module configuration.
   * @returns {Config}
   * @see Load.scan() for loading more robust defaults
   */
  withModuleDefaults(moduleName, defaultProperties) {
    const load = this.#config[LOAD_SYMBOL];
    const copy = new ConfigClass(load.clone());

    copy.util.setModuleDefaults(moduleName, defaultProperties);

    return copy;
  }

  /**
   * <p>Make a javascript object property immutable (assuring it cannot be changed
   * from the current value).</p>
   * <p>
   * If the specified property is an object, all attributes of that object are
   * made immutable, including properties of contained objects, recursively.
   * If a property name isn't supplied, the object and all of its properties
   * are made immutable.
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
   * @deprecated see Util.makeImmutable()
   * @param {any} object - The object to specify immutable properties for
   * @param {string | string[]=} property - The name of the property (or array of names) to make immutable.
   *        If not provided, the entire object is marked immutable.
   * @param {any=} value - Property value (or array of values) to set
   *        the property to before making immutable. Only used when setting a single
   *        property. Retained for backward compatibility.
   * @return {any} - The original object is returned - for chaining.
   */
  makeImmutable(object, property, value) {
    if (object === undefined) {
      return Util.makeImmutable(this.#config);
    }

    Util.errorOnce("MAKE_IMMUTABLE", "`config.util.makeImmutable(obj)` is deprecated, and will not be supported in 5.0");

    if (property !== undefined) {
      return this.makeImmutablePartial(object, property, value);
    } else {
      return Util.makeImmutable(object);
    }
  }

  /**
   * <p>Make a javascript object property immutable (assuring it cannot be changed
   * from the current value).</p>
   * <p>
   * If the specified property is an object, all attributes of that object are
   * made immutable, including properties of contained objects, recursively.
   * If a property name isn't supplied, the object and all of its properties
   * are made immutable.
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
   * @protected
   * @deprecated - partial immutability will no longer be supported by this project
   * @param object {Object} - The object to specify immutable properties for
   * @param property {string | [string]} - The name of the property (or array of names) to make immutable.
   *        If not provided, the entire object is marked immutable.
   * @param [value] {* | [*]} - Property value (or array of values) to set
   *        the property to before making immutable. Only used when setting a single
   *        property. Retained for backward compatibility.
   * @return object {Object} - The original object is returned - for chaining.
   */
  makeImmutablePartial(object, property, value) {
    Util.errorOnce("PARTIAL_IMMUTABLE", "`makeImmutable(object, propName, value)` is deprecated and will not be supported in 5.0");
    // Backwards compatibility mode where property/value can be specified
    if (typeof property === 'string') {
      return Object.defineProperty(object, property, {
        value: (typeof value === 'undefined') ? object[property] : value,
        writable: false,
        configurable: false
      });
    }

    let properties = property;

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
        value.forEach((item, index) => {
          if (Util.isObject(item) || Array.isArray(item)) {
            Util.makeImmutable(item);
          }
        });

        Object.defineProperty(object, propertyName, {
          value: Object.freeze(value)
        });
      } else {
        // Call recursively if an object.
        if (Util.isObject(value)) {
          // Create a proxy, to capture user updates of configuration options, and throw an exception for awareness, as per:
          // https://github.com/lorenwest/node-config/issues/514
          value = new Proxy(Util.makeImmutable(value), {
            get(target, property, receiver) {
              // Config's own defined prototype properties and methods (e.g., `get`, `has`, etc.)
              const ownProps = [
              ...Object.getOwnPropertyNames(ConfigClass.prototype), //TODO: This keeps us from moving this function to util.js where it belongs
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
            set(target, name) {
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
            writable: false,
            configurable: false
          });
        }
      }
    }

    // https://github.com/lorenwest/node-config/issues/505
    // https://github.com/lorenwest/node-config/issues/865
    Object.preventExtensions(object)

    return object;
  }

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
   * @return {import('./util').ConfigSource[]} configSources - An array of objects containing
   *    name, original, and parsed elements
   */
  getConfigSources() {
    return this.#config[LOAD_SYMBOL].getSources();
  }

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
   * @see Util.loadFileConfigs for discrete execution of most of this functionality
   * @method loadFileConfigs
   * @param {string=} configDir the path to the directory containing the configurations to load
   * @param {LoadOptions=} options parsing options
   * @return {Record<string, any>} The configuration object
   */
  loadFileConfigs(configDir, options) {
    let load = this.#config[LOAD_SYMBOL];
    let newLoad;

    if (configDir) {
      let opts = {...load.options, configDir, ...options};
      newLoad = new Load(opts);
      newLoad.scan();
    } else {
      newLoad = new Load({...load.options, ...options});
      _init(newLoad);
    }

    return newLoad.config;
  }

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
   * @method attachProtoDeep
   * @param {object} toObject
   * @param {number=20} depth
   * @return {object}
   */
  attachProtoDeep(toObject, depth = DEFAULT_CLONE_DEPTH) {
    if (toObject instanceof RawConfig) {
      return toObject;
    }

    // Recursion detection
    if (depth < 0) {
      return toObject;
    }

    // Adding Config.prototype methods directly to toObject as hidden properties
    // because adding to toObject.__proto__ exposes the function in toObject
    for (const fnName of ['get', 'has', 'util', LOAD_SYMBOL]) {
      if (!toObject[fnName]) {
        Util.makeHidden(toObject, fnName, this.#config[fnName]);
      }
    }

    // Add prototypes to sub-objects
    for (const prop in toObject) {
      if (Util.isObject(toObject[prop])) {
        this.attachProtoDeep(toObject[prop], depth - 1);
      }
    }

    // Return the original object
    return toObject;
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
   * @param varName {String} The environment variable name
   * @return {String} The value of the environment variable
   */
  getEnv(varName) {
    let load = this.#config[LOAD_SYMBOL];

    return load.getEnv(varName);
  }

  /**
   * Returns a new deep copy of the current config object, or any part of the config if provided.
   *
   * @param {Config} config The part of the config to copy and serialize. Omit this argument to return the entire config.
   * @returns {object} The cloned config or part of the config
   */
  toObject(config) {
    return Util.toObject(config || this.#config);
  }

  /**
   * Run strictness checks on NODE_ENV and NODE_APP_INSTANCE and throw an error if there's a problem.
   * @param {Config} config
   */
  runStrictnessChecks(config = this.#config) {
    const load = config[LOAD_SYMBOL];

    if (load.initParam('SUPPRESS_STRICTNESS_CHECK')) {
      return;
    }

    const sources = config.util.getConfigSources();
    const sourceFilenames = sources.map(function (src) {
      return Path.basename(src.name);
    });

    load.options.nodeEnv.forEach(function (env) {
      // Throw an exception if there's no explicit config file for NODE_ENV
      const anyFilesMatchEnv = sourceFilenames.some(function (filename) {
        return filename.match(env);
      });
      // development is special-cased because it's the default value
      if (env && (env !== 'development') && !anyFilesMatchEnv) {
        _warnOrThrow(`${load.getEnv("nodeEnv")} value of '${env}' did not match any deployment config file names.`);
      }
      // Throw if NODE_ENV matches' default' or 'local'
      if ((env === 'default') || (env === 'local')) {
        _warnOrThrow(`${load.getEnv("nodeEnv")} value of '${env}' is ambiguous.`);
      }
    });

    let appInstance = load.options.appInstance;

    if (appInstance) {
      // Throw an exception if there's no explicit config file for NODE_APP_INSTANCE
      const anyFilesMatchInstance = sourceFilenames.some(function (filename) {
        return filename.match(appInstance);
      });

      if (!anyFilesMatchInstance) {
        _warnOrThrow(`NODE_APP_INSTANCE value of '${appInstance}' did not match any instance config file names.`);
      }
    }

    function _warnOrThrow(msg) {
      const beStrict = process.env.NODE_CONFIG_STRICT_MODE;
      const prefix = beStrict ? 'FATAL: ' : 'WARNING: ';
      const seeURL = 'See https://github.com/node-config/node-config/wiki/Strict-Mode';

      console.error(prefix + msg);
      console.error(prefix + seeURL);

      // Accept 1 and true as truthy values. When set via process.env, Node.js casts them to strings.
      if (["true", "1"].indexOf(beStrict) >= 0) {
        throw new Error(prefix + msg + ' ' + seeURL);
      }
    }
  }

  /**
   * @deprecated please use Parser.stripYamlComments
   * @param {string} fileStr The string to strip comments from
   */
  stripYamlComments(fileStr) {
    return this.#config[LOAD_SYMBOL].parser.stripYamlComments(fileStr);
  }
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

/** @type {Config} */
module.exports = (() => {
  const load = Load.fromEnvironment();

  _init(load);

  // Instantiate and export the configuration
  const config = new ConfigClass(load);

  // Produce warnings if the configuration is empty
  const showWarnings = !(load.initParam('SUPPRESS_NO_CONFIG_WARNING'));

  if (showWarnings && Object.keys(config).length === 0) {
    console.error('WARNING: No configurations found in configuration directory:' + load.options.configDir);
    console.error('WARNING: To disable this warning set SUPPRESS_NO_CONFIG_WARNING in the environment.');
  }

  return config;
})();
