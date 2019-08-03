const { DeferredConfig } = require('./defer');

module.exports.getArgv = getArgv;
module.exports.getOption = getOption;
module.exports.isObject = isObject;
module.exports.isPlainObject = isPlainObject;
module.exports.isPromise = isPromise;
module.exports.collect = collect;
module.exports.makePath = makePath;
module.exports.cloneDeep = cloneDeep;
module.exports.extendDeep = extendDeep;
module.exports.deepFreeze = deepFreeze;
module.exports.reduceObject = reduceObject;
module.exports.attachLazyProperty = attachLazyProperty;
module.exports.attachPropertyValue = attachPropertyValue;
module.exports.attachPropertyGetter = attachPropertyGetter;
module.exports.enforceArrayProperty = enforceArrayProperty;

/**
 * Get argument value from CLI arguments (process.argv)
 *
 * Supported syntax:
 *    --VAR_NAME=value    value separated by an equality sign
 *    --VAR_NAME value    value separated by spaces
 *    --BOOL_VAR          boolean - no value automatically returns true
 *
 * @param name
 * @returns {string|boolean}  returns false if no matching argument was found
 */
function getArgv(name) {
  const argName = `--${name}`;
  const argv = process.argv.slice(2);
  for (let i = argv.length -1; i > -1; i--) {
    if (argv[i].startsWith(argName)) {
      if (argv[i] === argName) {
        return argv[i +1] && !argv[i +1].startsWith('--') ? argv[i +1] : true;
      }
      if (argv[i].indexOf('=') === argName.length) {
        return argv[i].substr(argName.length +1);
      }
    }
  }
  return false;
}

/**
 * @param name
 * @param defaultValue
 * @returns {*}
 */
function getOption(name, defaultValue) {
  return getArgv(name) || (name in process.env ? process.env[name] : defaultValue);
}

/**
 * Returns true if argument is an object but not null or an array
 *
 * @param obj
 * @returns {boolean}
 */
function isObject(obj) {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

/**
 * Returns true if argument is an object but not null or an array
 *
 * @param obj
 * @returns {boolean}
 */
function isPlainObject(obj) {
  return isObject(obj) && obj.constructor === Object;
}

/**
 * Returns true if argument is a promise
 *
 * @param obj
 * @returns {boolean}
 */
function isPromise(obj) {
  return isObject(obj) && Object.prototype.toString.call(obj) === '[object Promise]';
}

/**
 * @param object
 * @param key
 * @param defaultValue
 * @returns {*}
 */
function makePath(object, key, defaultValue) {
  return key.split('.').reduce((obj, key, index, { length }) =>
      (obj[key] || (obj[key] = obj[key] || (index === length -1 ? defaultValue : {}))),
    object);
}

/**
 * Reduces an object by iterating over its entries
 *
 * @param object
 * @param reducer
 * @param initialValue
 * @returns {*}
 */
function reduceObject(object, reducer, initialValue) {
  return Object.keys(object).reduce((res, key) => reducer(res, object[key], key, object), initialValue);
}

/**
 * Iterates recursively over `origin` and collects matching values along with metadata
 * Returns a list of arrays containing `value`, `key` and `object` respectively
 *
 * @param origin
 * @param matcher
 * @param coll
 */
function collect(origin, matcher, coll = []) {
  return reduceObject(origin, collectReducer, coll);
  function collectReducer(coll, value, key, object) {
    if (matcher(value)) {
      coll.push([value, key, object]);
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        matcher(value[i])
          ? coll.push([value[i], i, value])
          : collectReducer(coll, value[i], i, value);
      }
    }
    else if (value && isPlainObject(value)) {
      reduceObject(value, collectReducer, coll);
    }
    return coll;
  }
}

/**
 * @param object
 * @returns {*}
 */
function cloneDeep(object) {
  if (object && typeof object === 'object') {
    if (Array.isArray(object)) {
      object = object.slice();
      for (let i = 0; i < object.length; i++) {
        object[i] = cloneDeep(object[i]);
      }
      return object;
    }
    else if (isPlainObject(object)) {
      const origin = object;
      object = Object.assign({}, object);
      for (const key in origin) {
        if (typeof object[key] === 'object') {
          object[key] = cloneDeep(object[key]);
        }
        else if (Object.getOwnPropertyDescriptor(origin, key)) {
          Object.defineProperty(object, key, Object.getOwnPropertyDescriptor(origin, key))
        }
      }
    }
  }
  return object;
}

/**
 * @param object
 * @returns {*}
 */
function extendDeep(object) {
  const sources = Array.prototype.slice.call(arguments, 1);
  const copyProperty = (key, from, to) =>
    Object.getOwnPropertyDescriptor(from, key)
      ? Object.defineProperty(to, key, Object.getOwnPropertyDescriptor(from, key))
      : (to[key] = from[key]);

  for (const source of sources) {
    if (!isObject(source)) continue;
    // use getOwnPropertyNames and for..in to
    // get non-enumerable and prototype properties
    const keys = Object.getOwnPropertyNames(source);
    for (const key in source) keys.includes(key) || keys.push(key);
    for (const key of keys) {
      if (source.hasOwnProperty(key)) {
        const value = source[key];
        const isDeferred = object[key] instanceof DeferredConfig;
        if (value instanceof DeferredConfig && object.hasOwnProperty(key)) {
          value.original = isDeferred ? object[key].original : object[key];
        }
        if (isObject(object[key]) && isObject(value) && !(
          value instanceof Date || value instanceof RegExp || isPromise(value) || isDeferred)) {
          extendDeep(object[key], value);
          continue;
        }
        if (value && typeof value === 'object') {
          object[key] = cloneDeep(value);
          continue;
        }
      }
      copyProperty(key, source, object);
    }
  }
  return object;
}

/**
 * Applies Object.freeze() recursively
 *
 * @param object
 */
function deepFreeze(object) {
  if (isPlainObject(object)) {
    reduceObject(object, function reducer(res, value, key, obj) {
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            reducer(null, value[i], i, value);
          }
          attachPropertyValue(obj, key, Object.freeze(value));
        }
        else {
          if (isPlainObject(value)) {
            reduceObject(value, reducer);
            Object.preventExtensions(value);
            Object.freeze(value);
          }
          attachPropertyValue(obj, key, value);
        }
      }
      return obj;
    });
  }
  return Object.freeze(object);
}

/**
 * Sets an enumerable property that cannot be changed or reconfigured with a value.
 *
 * @param object
 * @param key
 * @param value
 */
function attachPropertyValue(object, key, value) {
  Object.defineProperty(object, key, {value, enumerable: true, configurable: false, writable: false});
}

/**
 * Sets an enumerable property that cannot be reconfigured with a getter method.
 *
 * @param object
 * @param key
 * @param get
 */
function attachPropertyGetter(object, key, get) {
  Object.defineProperty(object, key, {get, enumerable: true, configurable: false});
}

/**
 * Sets an enumerable property that cannot be reconfigured (after it is resolved) with a
 * getter handler that resolves on first access and replaces itself with the returned value.
 *
 * @param object
 * @param key
 * @param handler
 */
function attachLazyProperty(object, key, handler) {
  Object.defineProperty(object, key, {
    configurable: true,
    enumerable: true,
    get() {
      attachPropertyValue(object, key, handler(object, key));
      return object[key];
    },
  });
}

/**
 * Sets an enumerable property that cannot be reconfigured and enforces value to be an array.
 * Can take a `validator` as an argument which will validate array items anytime the property is set.
 *
 * @param object
 * @param key
 * @param array
 * @param validator
 * @return {any}
 */
function enforceArrayProperty(object, key, array, validator) {
  validateValue(array);
  Object.defineProperty(object, key, {
    enumerable: true,
    get: () => array,
    set(value) {
      validateValue(value);
      return array = value;
    },
  });
  function validateValue(value) {
    if (!Array.isArray(value)) {
      throw new Error(`Illegal set of ${key} with a non-array argument`);
    }
    if (validator && !value.every(validator)) {
      throw new Error(`Invalid items schema, ${key} failed validations`);
    }
  }
}
