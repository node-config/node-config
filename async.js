var asyncSymbol = Symbol('asyncSymbol');
var deferConfig = require('./defer').deferConfig;

/**
 * @param promiseOrFunc   the promise will determine a property's value once resolved
 *                        can also be a function to defer which resolves to a promise
 * @returns {Promise}     a marked promise to be resolve later using `resolveAsyncConfigs`
 */
function asyncConfig(promiseOrFunc) {
  if (typeof promiseOrFunc === 'function') {  // also acts as deferConfig
    return deferConfig(function (config, original) {
      var release;
      function registerRelease(resolve) { release = resolve; }
      function callFunc() { return promiseOrFunc.call(config, config, original); }
      var promise = asyncConfig(new Promise(registerRelease).then(callFunc));
      promise.release = release;
      return promise;
    });
  }
  var promise = promiseOrFunc;
  promise.async = asyncSymbol;
  promise.prepare = function(config, prop, property) {
    if (promise.release) {
      promise.release();
    }
    return function() {
      return promise.then(function(value) {
        Object.defineProperty(prop, property, {value: value});
      });
    };
  };
  return promise;
}

/**
 * Do not use `config.get` before executing this method, it will freeze the config object
 * @param config    the main config object, returned from require('config')
 * @returns {Promise<config>}   once all promises are resolved, return the original config object
 */
function resolveAsyncConfigs(config) {
  var promises = [];
  var resolvers = [];
  (function iterate(prop) {
    var propsToSort = [];
    for (var property in prop) {
      if (prop.hasOwnProperty(property) && prop[property] != null) {
        propsToSort.push(property);
      }
    }
    propsToSort.sort().forEach(function(property) {
      if (prop[property].constructor === Object) {
        iterate(prop[property]);
      }
      else if (prop[property].constructor === Array) {
        prop[property].forEach(iterate);
      }
      else if (prop[property] && prop[property].async === asyncSymbol) {
        resolvers.push(prop[property].prepare(config, prop, property));
        promises.push(prop[property]);
      }
    });
  })(config);
  return Promise.all(promises).then(function() {
    resolvers.forEach(function(resolve) { resolve(); });
    return config;
  });
}

module.exports.asyncConfig = asyncConfig;
module.exports.resolveAsyncConfigs = resolveAsyncConfigs;
