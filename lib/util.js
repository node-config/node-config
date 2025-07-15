// config.js (c) 2010-2022 Loren West and other contributors
// May be freely distributed under the MIT license.
// For further details and documentation:
// http://lorenwest.github.com/node-config

// Dependencies
const DeferredConfig = require('../defer').DeferredConfig;
const Path = require('path');
const FileSystem = require('fs');
const OS = require("os");

const DEFAULT_CONFIG_DIR = Path.join( process.cwd(), 'config');

/**
 * A source in the configSources list
 *
 * @typedef {Object} ConfigSource
 * @property {string} name
 * @property {Object} parsed - parsed representation
 * @property {string=} original - unparsed representation of the data
 */

/**
 * The data used for a Load operation, mostly derived from environment variables
 *
 * @typedef {Object} LoadOptions
 * @property {string} configDir - config directory location, absolute or relative to cwd()
 * @property {string} nodeEnv - NODE_ENV value or commo-separated list
 * @property {string} hostName - hostName for host-specific loads
 * @property {string=} appInstance - per-process config ID
 * @property {boolean} skipConfigSources - don't track sources
 * @property {boolean} gitCrypt - allow gitcrypt files
 * @property {Parser} parser - alternative parser implementation
 */

/** @type {LoadOptions} */
const DEFAULT_OPTIONS = {
  configDir: DEFAULT_CONFIG_DIR,
  nodeEnv: ['development'],
  hostName: OS.hostname(),
  gitCrypt: true,
  parser: require("../parser.js")
};

/**
 * Callback for converting loaded data.
 *
 * @callback DataConvert
 * @param {Object} input - An object to modify.
 * @returns {Object} - converted object
 */


const DEFAULT_CLONE_DEPTH = 20;
const GIT_CRYPT_REGEX = /^.GITCRYPT/; // regular expression to test for gitcrypt files.

/**
 * Util functions that do not require the singleton in order to run.
 */
class Util {

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
   *   const Util = require('config/lib/util.js');
   *   ...
   *
   *   // Hide the Amazon S3 credentials
   *   Util.makeHidden(CONFIG.amazonS3, 'access_id');
   *   Util.makeHidden(CONFIG.amazonS3, 'secret_key');
   * </pre>
   *
   * @method makeHidden
   * @param object {Object} - The object to make a hidden property into.
   * @param property {string} - The name of the property to make hidden.
   * @param value {*} - (optional) Set the property value to this (otherwise leave alone)
   * @return object {Object} - The original object is returned - for chaining.
   */
  static makeHidden(object, property, value) {
    // If the new value isn't specified, just mark the property as hidden
    if (typeof value === 'undefined') {
      Object.defineProperty(object, property, {
        enumerable: false,
        configurable: true
      });
    } else {
      // Otherwise set the value and mark it as hidden
      Object.defineProperty(object, property, {
        value: value,
        enumerable: false,
        configurable: true
      });
    }

    return object;
  }

  /**
   * Looks into an options object for a specific attribute
   *
   * <p>
   * This method looks into the options object, and if an attribute is defined, returns it,
   * and if not, returns the default value
   * </p>
   *
   * @method getOption
   * @param options {Object | undefined} the options object
   * @param optionName {string} the attribute name to look for
   * @param defaultValue { any } the default in case the options object is empty, or the attribute does not exist.
   * @return options[optionName] if defined, defaultValue if not.
   */
  static getOption(options, optionName, defaultValue) {
    if (options !== undefined && typeof options[optionName] !== 'undefined') {
      return options[optionName];
    } else {
      return defaultValue;
    }
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
   * @method loadFileConfigs
   * @param opts {LoadOptions | Load} parsing options or Load to update
   * @return loadConfig {LoadConfig}
   */
  static loadFileConfigs(opts) {
    let load;

    if (opts instanceof Load) {
      load = opts;
    } else {
      load = new Load(opts);
    }

    let options = load.options;
    let dir = options.configDir;
    dir = _toAbsolutePath(dir);

    // Read each file in turn
    const baseNames = ['default'].concat(options.nodeEnv);
    const hostName = options.hostName;

    // #236: Also add full hostname when they are different.
    if (hostName) {
      const firstDomain = hostName.split('.')[0];

      for (let env of options.nodeEnv) {
        // Backward compatibility
        baseNames.push(firstDomain, firstDomain + '-' + env);

        // Add full hostname when it is not the same
        if (hostName !== firstDomain) {
          baseNames.push(hostName, hostName + '-' + env);
        }
      }
    }

    for (let env of options.nodeEnv) {
      baseNames.push('local', 'local-' + env);
    }

    const allowedFiles = {};
    let resolutionIndex = 1;
    const extNames = options.parser.getFilesOrder();

    for (let baseName of baseNames) {
      const fileNames = [baseName];
      if (options.appInstance) {
        fileNames.push(baseName + '-' + options.appInstance);
      }

      for (let fileName of fileNames) {
        for (let extName of extNames) {
          allowedFiles[fileName + '.' + extName] = resolutionIndex++;
        }
      }
    }

    const locatedFiles = this.locateMatchingFiles(dir, allowedFiles);
    for (let fullFilename of locatedFiles) {
      load.loadFile(fullFilename);
    }

    return load;
  }

  /**
   * Return a list of fullFilenames who exists in allowedFiles
   * Ordered according to allowedFiles argument specifications
   *
   * @method locateMatchingFiles
   * @param configDirs {string}   the config dir, or multiple dirs separated by a column (:)
   * @param allowedFiles {Object} an object. keys and supported filenames
   *                              and values are the position in the resolution order
   * @returns {string[]}          fullFilenames - path + filename
   */
  static locateMatchingFiles(configDirs, allowedFiles) {
    return configDirs.split(Path.delimiter)
      .filter(Boolean)
      .reduce(function (files, configDir) {
        configDir = _toAbsolutePath(configDir);
        try {
          FileSystem.readdirSync(configDir)
            .filter(file => allowedFiles[file])
            .forEach(function (file) {
              files.push([allowedFiles[file], Path.join(configDir, file)]);
            });
        } catch (e) {
        }

        return files;
      }, [])
      .sort(function (a, b) {
        return a[0] - b[0];
      })
      .map(function (file) {
        return file[1];
      });
  }

  /**
   *
   * @param config
   */
  static resolveDeferredConfigs(config) {
    const deferred = [];

    function _iterate (prop) {
      if (prop == null || prop.constructor === String) {
        return;
      }

      // We put the properties we are going to look it in an array to keep the order predictable
      const propsToSort = Object.keys(prop).filter((property) => prop[property] != null);

      // Second step is to iterate of the elements in a predictable (sorted) order
      propsToSort.sort().forEach(function (property) {
        if (prop[property].constructor === Object) {
          _iterate(prop[property]);
        } else if (prop[property].constructor === Array) {
          for (let i = 0; i < prop[property].length; i++) {
            if (prop[property][i] instanceof DeferredConfig) {
              deferred.push(prop[property][i].prepare(config, prop[property], i));
            } else {
              _iterate(prop[property][i]);
            }
          }
        } else {
          if (prop[property] instanceof DeferredConfig) {
            deferred.push(prop[property].prepare(config, prop, property));
          }
          // else: Nothing to do. Keep the property how it is.
        }
      });
    }

    _iterate(config);

    deferred.forEach(function (defer) { defer.resolve(); });
  }

  /**
   * Return a deep copy of the specified object.
   *
   * This returns a new object with all elements copied from the specified
   * object.  Deep copies are made of objects and arrays so you can do anything
   * with the returned object without affecting the input object.
   *
   * @method cloneDeep
   * @param parent {Object} The original object to copy from
   * @param [depth=20] {number} Maximum depth (default 20)
   * @return {Object} A new object with the elements copied from the copyFrom object
   *
   * This method is copied from https://github.com/pvorb/node-clone/blob/17eea36140d61d97a9954c53417d0e04a00525d9/clone.js
   *
   * Copyright © 2011-2014 Paul Vorbach and contributors.
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the “Software”), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
   * of the Software, and to permit persons to whom the Software is furnished to do so,
   * subject to the following conditions: The above copyright notice and this permission
   * notice shall be included in all copies or substantial portions of the Software.
   */
  static cloneDeep(parent, depth, circular, prototype) {
    // maintain two arrays for circular references, where corresponding parents
    // and children have the same index
    const allParents = [];
    const allChildren = [];
    const util = this;

    const useBuffer = typeof Buffer !== 'undefined';

    if (typeof circular === 'undefined')
      circular = true;

    if (typeof depth === 'undefined')
      depth = 20;

    // recurse this function so we don't reset allParents and allChildren
    function _clone(parent, depth) {
      // cloning null always returns null
      if (parent === null)
        return null;

      if (depth === 0)
        return parent;

      let child;
      if (typeof parent != 'object') {
        return parent;
      }

      if (Array.isArray(parent)) {
        child = [];
      } else if (parent instanceof RegExp) {
        child = new RegExp(parent.source, util.getRegExpFlags(parent));
        if (parent.lastIndex) child.lastIndex = parent.lastIndex;
      } else if (parent instanceof Date) {
        child = new Date(parent.getTime());
      } else if (useBuffer && Buffer.isBuffer(parent)) {
        child = Buffer.alloc(parent.length);
        parent.copy(child);
        return child;
      } else {
        if (typeof prototype === 'undefined') child = Object.create(Object.getPrototypeOf(parent));
        else child = Object.create(prototype);
      }

      if (circular) {
        const index = allParents.indexOf(parent);

        if (index !== -1) {
          return allChildren[index];
        }
        allParents.push(parent);
        allChildren.push(child);
      }

      for (const i in parent) {
        const propDescriptor = Object.getOwnPropertyDescriptor(parent, i);
        const hasGetter = ((typeof propDescriptor !== 'undefined') && (typeof propDescriptor.get !== 'undefined'));

        if (hasGetter) {
          Object.defineProperty(child, i, propDescriptor);
        } else if (util.isPromise(parent[i])) {
          child[i] = parent[i];
        } else {
          child[i] = _clone(parent[i], depth - 1);
        }
      }

      return child;
    }

    return _clone(parent, depth);
  }

  /**
   * Underlying get mechanism
   *
   * @method getPath
   * @param object {Object} - Object to get the property for
   * @param property {string|string[]} - The property name to get (as an array or '.' delimited string)
   * @return value {*} - Property value, including undefined if not defined.
   */
  static getPath(object, property) {
    const path = Array.isArray(property) ? property : property.split('.');

    let next = object;
    for (let i = 0; i < path.length; i++) {
      const name = path[i];
      const value = next[name];

      if (i === path.length - 1) {
        return value;
      }

      // Note that typeof null === 'object'
      if (value === null || typeof value !== 'object') {
        return undefined;
      }

      next = value;
    }
  }

  /**
   * Set objects given a path as a string list
   *
   * @method setPath
   * @param object {Object} - Object to set the property on
   * @param property {string|string[]} - The property name to get (as an array or '.' delimited string)
   * @param value {*} - value to set, ignoring null
   * @return {*} - the given value
   */
  static setPath(object, property, value) {
    const path = Array.isArray(property) ? property : property.split('.');

    if (value === null || path.length === 0) {
      return;
    }

    let next = object;

    for (let i = 0; i < path.length; i++) {
      let name = path[i];

      if (i === path.length - 1) { // no more keys to make, so set the value
        next[name] = value;
      } else if (Object.hasOwnProperty.call(next, name)) {
        next = next[name];
    } else {
        next = next[name] = {};
      }
    }

    return value;
  }

  /**
   * Return true if two objects have equal contents.
   *
   * @method equalsDeep
   * @param object1 {Object} The object to compare from
   * @param object2 {Object} The object to compare with
   * @param depth {number} An optional depth to prevent recursion.  Default: 20.
   * @return {boolean} True if both objects have equivalent contents
   */
  static equalsDeep(object1, object2, depth) {
    // Recursion detection
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
    if (typeof (object1) != 'object' || typeof (object2) != 'object') {
      return false;
    }

    // They must have the same keys.  If their length isn't the same
    // then they're not equal.  If the keys aren't the same, the value
    // comparisons will fail.
    if (Object.keys(object1).length != Object.keys(object2).length) {
      return false;
    }

    // Compare the values
    for (const prop in object1) {

      // Call recursively if an object or array
      if (object1[prop] && typeof (object1[prop]) === 'object') {
        if (!this.equalsDeep(object1[prop], object2[prop], depth - 1)) {
          return false;
        }
      } else {
        if (object1[prop] !== object2[prop]) {
          return false;
        }
      }
    }

    // Test passed.
    return true;
  }

  /**
   * Extend an object, and any object it contains.
   *
   * This does not replace deep objects, but dives into them
   * replacing individual elements instead.
   *
   * @method extendDeep
   * @param mergeInto {Object} The object to merge into
   * @param mergeFrom... {Object} - Any number of objects to merge from
   * @param depth {integer} An optional depth to prevent recursion.  Default: 20.
   * @return {Object} The altered mergeInto object is returned
   */
  static extendDeep(mergeInto, ...vargs) {
    // Initialize
    let depth = vargs.pop();
    if (typeof (depth) != 'number') {
      vargs.push(depth);
      depth = DEFAULT_CLONE_DEPTH;
    }

    // Recursion detection
    if (depth < 0) {
      return mergeInto;
    }

    for (let mergeFrom of vargs) {
      // Cycle through each element of the object to merge from
      for (const prop in mergeFrom) {
        // save original value in deferred elements
        const fromIsDeferredFunc = mergeFrom[prop] instanceof DeferredConfig;
        const isDeferredFunc = mergeInto[prop] instanceof DeferredConfig;

        if (fromIsDeferredFunc && Object.hasOwnProperty.call(mergeInto, prop)) {
          mergeFrom[prop]._original = isDeferredFunc ? mergeInto[prop]._original : mergeInto[prop];
        }
        // Extend recursively if both elements are objects and target is not really a deferred function
        if (mergeFrom[prop] instanceof Date) {
          mergeInto[prop] = mergeFrom[prop];
        }
        if (mergeFrom[prop] instanceof RegExp) {
          mergeInto[prop] = mergeFrom[prop];
        } else if (Util.isObject(mergeInto[prop]) && Util.isObject(mergeFrom[prop]) && !isDeferredFunc) {
          Util.extendDeep(mergeInto[prop], mergeFrom[prop], depth - 1);
        } else if (Util.isPromise(mergeFrom[prop])) {
          mergeInto[prop] = mergeFrom[prop];
        }
        // Copy recursively if the mergeFrom element is an object (or array or fn)
        else if (mergeFrom[prop] && typeof mergeFrom[prop] === 'object') {
          mergeInto[prop] = Util.cloneDeep(mergeFrom[prop], depth - 1);
        }
        // Copy property descriptor otherwise, preserving accessors
        else if (Object.getOwnPropertyDescriptor(Object(mergeFrom), prop)) {
          Object.defineProperty(mergeInto, prop, Object.getOwnPropertyDescriptor(Object(mergeFrom), prop));
        } else if (mergeInto[prop] !== mergeFrom[prop]) {
          mergeInto[prop] = mergeFrom[prop];
        }
      }
    }

    // Chain
    return mergeInto;
  }

  /**
   * Is the specified argument a regular javascript object?
   *
   * The argument is an object if it's a JS object, but not an array.
   *
   * @method isObject
   * @param obj {*} An argument of any type.
   * @return {boolean} TRUE if the arg is an object, FALSE if not
   */
  static isObject(obj) {
    return (obj !== null) && (typeof obj === 'object') && !(Array.isArray(obj));
  }

  /**
   * Is the specified argument a javascript promise?
   *
   * @method isPromise
   * @param obj {*} An argument of any type.
   * @returns {boolean}
   */
  static isPromise(obj) {
    return Object.prototype.toString.call(obj) === '[object Promise]';
  }

  /**
   * Returns a string of flags for regular expression `re`.
   *
   * @param {RegExp} re Regular expression
   * @returns {string} Flags
   */
  static getRegExpFlags = function (re) {
    let flags = '';
    re.global && (flags += 'g');
    re.ignoreCase && (flags += 'i');
    re.multiline && (flags += 'm');

    return flags;
  }

  /**
   * Returns a new deep copy of the current config object, or any part of the config if provided.
   *
   * @param {Object} config The part of the config to copy and serialize.
   * @returns {Object} The cloned config or part of the config
   */
  static toObject(config) {
    return JSON.parse(JSON.stringify(config));
  }
}

/**
 * Record a set of lookups
 */
class Env {
  constructor() {
    this.lookups = {};
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
   * @method initParam
   * @param paramName {String} Name of the parameter
   * @param [defaultValue] {*} Default value of the parameter
   * @return {*} The found value, or default value
   */
  initParam(paramName, defaultValue) {
    // Record and return the value
    const value = this.getCmdLineArg(paramName) || process.env[paramName] || defaultValue;
    this.setEnv(paramName, value);

    return value;
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
   * @param searchFor {String} The argument name to search for
   * @return {*} false if the argument was not found, the argument value if found
   */
  getCmdLineArg(searchFor) {
    const cmdLineArgs = process.argv.slice(2, process.argv.length);
    const argName = '--' + searchFor + '=';

    for (let argvIt = 0; argvIt < cmdLineArgs.length; argvIt++) {
      if (cmdLineArgs[argvIt].indexOf(argName) === 0) {
        return cmdLineArgs[argvIt].substr(argName.length);
      }
    }

    return false;
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
    return this.lookups[varName];
  }

  /**
   * Set a tracing variable of what was accessed from process.env
   *
   * @see fromEnvironment
   * @param key {string}
   * @param value
   */
  setEnv(key, value) {
    this.lookups[key] = value;
  }
}


/**
 * The work horse of loading Config data - without the singleton.
 *
 * This class can be used to execute important workflows, such as build-time validations
 * and Module Defaults.
 *
 * @example
 * //load module defaults
 * const config = require("config");
 * const Load = require("config/util.js").Load;
 *
 * let load = Load.fromEnvironment();
 *
 * load.scan();
 *
 * config.setModuleDefaults("my-module", load.config);
 *
 * @example
 * // verify configs
 * const Load = require("config/util.js").Load;
 *
 * for (let environment of ["sandbox", "qa", "qa-hyderabad", "perf", "staging", "prod-east-1", "prod-west-2"] {
 *   let load = Load.fromEnvironment(environment);
 *
 *   load.scan();
 * }
 *
 *
 * @class Load
 */
class Load {
  /**
   * @constructor
   * @param options {LoadOptions=} - defaults to reading from environment variables
   */
  constructor(options, env = new Env()) {
    this.env = env;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.sources = this.options.skipConfigSources ? undefined : [];
    this.parser = this.options.parser;
    this.config = {};
    this.defaults = undefined;
    this.unmerged = undefined;
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
   * @method initParam
   * @param paramName {String} Name of the parameter
   * @param [defaultValue] {*} Default value of the parameter
   * @return {*} The found value, or default value
   */
  initParam(paramName, defaultValue) {
    return this.env.initParam(paramName, defaultValue);
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
   * @param searchFor {String} The argument name to search for
   * @return {*} false if the argument was not found, the argument value if found
   */
  getCmdLineArg(searchFor) {
    return this.env.getCmdLineArg(searchFor);
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
    return this.env.getEnv(varName);
  }

  /**
   * Set a tracing variable of what was accessed from process.env
   *
   * @see fromEnvironment
   * @param key {string}
   * @param value
   */
  setEnv(key, value) {
    return this.env.setEnv(key, value);
  }

  /**
   * Add a set of configurations and record the source
   *
   * @param name {string=} an entry will be added to sources under this name (if given)
   * @param values {Object} values to merge in
   * @param original {string=} Optional unparsed version of the data
   */
  addConfig(name, values, original) {
    Util.extendDeep(this.config, values);

    if (name && this.sources) {
      let source = {name, parsed: values};

      if (original !== undefined) {
        source.original = original;
      }

      this.sources.push(source);
    }

    return this;
  }


  /**
   * scan and load config files in the same manner that config.js does
   *
   * @param load {Load}
   * @param additional {{name, value}[]=} additional values to populate (usually from NODE_CONFIG
   */
  scan(additional) {
    Util.loadFileConfigs(this);

    if (additional) {
      for (let {name, config} of additional) {
        this.addConfig(name, config);
      }
    }

    // Override with environment variables if there is a custom-environment-variables.EXT mapping file
    this.loadCustomEnvVars();

    Util.resolveDeferredConfigs(this.config);
  }

  /**
   * Load a file and add it to the configuration
   *
   * @param fullFilename {string} an absolute file path
   * @param convert {DataConvert=}
   * @returns {null}
   */
  loadFile(fullFilename, convert) {
    let configObject = null;
    let fileContent = null;

    // Note that all methods here are the Sync versions.  This is appropriate during
    // module loading (which is a synchronous operation), but not thereafter.

    try {
      // Try loading the file.
      fileContent = FileSystem.readFileSync(fullFilename, 'utf-8');
      fileContent = fileContent.replace(/^\uFEFF/, '');
    }
    catch (e2) {
      if (e2.code !== 'ENOENT') {
        throw new Error('Config file ' + fullFilename + ' cannot be read. Error code is: '+e2.code
          +'. Error message is: '+e2.message);
      }
      return null;  // file doesn't exists
    }

    // Parse the file based on extension
    try {

      // skip if it's a gitcrypt file and CONFIG_SKIP_GITCRYPT is true
      if (!this.options.gitCrypt) {
        if (GIT_CRYPT_REGEX.test(fileContent)) {
          console.error('WARNING: ' + fullFilename + ' is a git-crypt file and CONFIG_SKIP_GITCRYPT is set. skipping.');
          return null;
        }
      }

      configObject = this.parser.parse(fullFilename, fileContent);
    } catch (e3) {
      if (GIT_CRYPT_REGEX.test(fileContent)) {
        console.error('ERROR: ' + fullFilename + ' is a git-crypt file and CONFIG_SKIP_GITCRYPT is not set.');
      }
      throw new Error("Cannot parse config file: '" + fullFilename + "': " + e3);
    }

    if (convert) {
      configObject = convert(configObject);
    }

    this.addConfig(fullFilename, configObject, fileContent);

    return configObject;
  }

  /**
   * load custom-environment-variables
   *
   * @param extNames {string[]=} extensions
   * @returns {{}}
   */
  loadCustomEnvVars(extNames) {
    let resolutionIndex = 1;
    const allowedFiles = {};

    extNames = extNames ?? this.parser.getFilesOrder();

    extNames.forEach(function (extName) {
      allowedFiles['custom-environment-variables' + '.' + extName] = resolutionIndex++;
    });

    const locatedFiles = Util.locateMatchingFiles(this.options.configDir, allowedFiles);
    locatedFiles.forEach((fullFilename) => {
      this.loadFile(fullFilename, (configObj) => this.substituteDeep(configObj, process.env));
    });
  }

  /**
   * Return the report of where the sources for this load operation came from
   * @returns {ConfigSource[]}
   */
  getSources() {
    return (this.sources ?? []).slice();
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
   *   load.setModuleDefaults("MyModule", {
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
   * @return {Object} - The module level configuration object.
   */
  setModuleDefaults(moduleName, defaultProperties) {
    if (this.defaults === undefined) {
      this.defaults = {};
      this.unmerged = {};

      if (this.sources) {
        this.sources.splice(0, 0, { name: 'Module Defaults', parsed: this.defaults });
      }
    }

    const path = moduleName.split('.');
    const defaults = Util.setPath(this.defaults, path, Util.getPath(this.defaults, path) ?? {});

    Util.extendDeep(defaults, defaultProperties);

    const original =
      Util.getPath(this.unmerged, path) ??
      Util.setPath(this.unmerged, path, Util.getPath(this.config, path) ?? {});

    const moduleConfig = Util.extendDeep({}, defaults, original);
    Util.setPath(this.config, path, moduleConfig);
    Util.resolveDeferredConfigs(this.config);

    return moduleConfig;
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
   * @method parseString
   * @param content {string} The full content
   * @param format {string} The format to be parsed
   * @return {configObject} The configuration object parsed from the string
   */
  parseString = function (content, format) {
    const parser = this.parser.getParser(format);

    if (typeof parser === 'function') {
      return parser(null, content);
    } else {
      //TODO: throw on missing #753
    }
  }

  /**
   * Create a new object patterned after substitutionMap, where:
   * 1. Terminal string values in substitutionMap are used as keys
   * 2. To look up values in a key-value store, variables
   * 3. And parent keys are created as necessary to retain the structure of substitutionMap.
   *
   * @protected
   * @method substituteDeep
   * @param substitutionMap {Object} - an object whose terminal (non-subobject) values are strings
   * @param variables {object[string:value]} - usually process.env, a flat object used to transform
   *      terminal values in a copy of substitutionMap.
   * @returns {Object} - deep copy of substitutionMap with only those paths whose terminal values
   *      corresponded to a key in `variables`
   */
  substituteDeep(substitutionMap, variables) {
    const result = {};

    const _substituteVars = (map, vars, pathTo) => {
      for (const prop in map) {
        const value = map[prop];

        if (typeof(value) === 'string') { // We found a leaf variable name
          if (typeof vars[value] !== 'undefined' && vars[value] !== '') { // if the vars provide a value set the value in the result map
            Util.setPath(result, pathTo.concat(prop), vars[value]);
          }
        } else if (Util.isObject(value)) { // work on the subtree, giving it a clone of the pathTo
          if ('__name' in value && '__format' in value && typeof vars[value.__name] !== 'undefined' && vars[value.__name] !== '') {
            let parsedValue;
            try {
              parsedValue = this.parseString(vars[value.__name], value.__format);
            } catch(err) {
              err.message = '__format parser error in ' + value.__name + ': ' + err.message;
              throw err;
            }
            Util.setPath(result, pathTo.concat(prop), parsedValue);
          } else {
            _substituteVars(value, vars, pathTo.concat(prop));
          }
        } else {
          let msg = "Illegal key type for substitution map at " + pathTo.join('.') + ': ' + typeof(value);
          throw Error(msg);
        }
      }
    };

    _substituteVars(substitutionMap, variables, []);
    return result;
  }

  /**
   * Populate a LoadConfig entirely from environment variables.
   *
   * This is the way a base config is normally accomplished, but not for independent loads.
   *
   * This function exists in part to reduce the circular dependency of variable initializations
   * in the config.js file
   * @param environments {string} the NODE_CONFIG_ENVs you want to load
   * @private
   * @returns {Load}
   */
  static fromEnvironment(environments) {
    let env = new Env();

    if (environments !== undefined) {
      environments = environments.split(',');
      env.setEnv('nodeEnv', environments.join(','));
    } else {
      let nodeConfigEnv = env.initParam('NODE_CONFIG_ENV');
      let nodeEnv = env.initParam('NODE_ENV');

      if (nodeConfigEnv) {
        env.setEnv('nodeEnv', 'NODE_CONFIG_ENV');
        nodeEnv = nodeConfigEnv;
      } else if (nodeEnv) {
        env.setEnv('nodeEnv', 'NODE_ENV');
        env.setEnv('NODE_CONFIG_ENV', nodeEnv); //TODO: This is a bug asserted in the tests
      } else {
        nodeEnv = 'development';
        env.setEnv('nodeEnv', 'default');
        env.setEnv('NODE_ENV', nodeEnv);
        env.setEnv('NODE_CONFIG_ENV', nodeEnv); //TODO: This is a bug asserted in the tests
      }

      environments = nodeEnv.split(',');
    }

    let configDir = env.initParam('NODE_CONFIG_DIR');
    configDir = configDir && _toAbsolutePath(configDir);

    let appInstance = env.initParam('NODE_APP_INSTANCE');
    let gitCrypt = !env.initParam('CONFIG_SKIP_GITCRYPT');
    let parser = _loadParser(env.initParam('NODE_CONFIG_PARSER'), configDir);
    let hostName = env.initParam('HOST') || env.initParam('HOSTNAME');

    // Determine the host name from the OS module, $HOST, or $HOSTNAME
    // Remove any . appendages, and default to null if not set
    try {
      if (!hostName) {
        const OS = require('os');
        hostName = OS.hostname();
      }
    } catch (e) {
      hostName = '';
    }

    env.setEnv('HOSTNAME', hostName);

    /** @type {LoadOptions} */
    let options = {
      configDir: configDir ?? DEFAULT_CONFIG_DIR,
      nodeEnv: environments,
      hostName,
      parser,
      appInstance,
      gitCrypt
    };

    return new Load(options, env);
  }
}

// Helper functions shared across object members
function _toAbsolutePath (configDir) {
  if (configDir.indexOf('.') === 0) {
    return Path.join(process.cwd(), configDir);
  }

  return configDir;
}

function _loadParser(name, dir) {
  if (name === undefined) {
    return require("../parser.js");
  }

  try {
    const parserModule = Path.isAbsolute(name) ? name : Path.join(dir, name);

    return require(parserModule);
  }
  catch (e) {
    console.warn(`Failed to load config parser from ${name}`);
    console.log(e);
  }
}

module.exports = { Util, Load: Load };
