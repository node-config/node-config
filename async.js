var deferConfig = require('./defer').deferConfig;

function AsyncConfig () {}
AsyncConfig.prototype.getPromise = function () { return Promise.resolve(); };

/**
 * @param promiseOrFunc   the promise will determine a property's value once resolved
 *                        can also be a function to defer which resolves to a promise
 * @returns {AsyncConfig}   a 'async' configuration value to resolve later with `resolveAsyncConfigs`
 */
function asyncConfig (promiseOrFunc) {
  if (typeof promiseOrFunc === 'function') {  // also acts as deferConfig
    return deferConfig(function (config, original) {
      return asyncConfig(promiseOrFunc.call(config, config, original));
    });
  }
  var obj = Object.create(AsyncConfig.prototype);
  obj.getPromise = function() { return promiseOrFunc; };
  return obj;
}

/**
 * Do not use `config.get` before executing this method, it will freeze the config object
 * @param config    the main config object, returned from require('config')
 * @returns {Promise<config>}   once all promises are resolved, return the original config object
 */
function resolveAsyncConfigs(config) {
  var promises = [];
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
      else if (prop[property] instanceof AsyncConfig) {
        promises.push(
          prop[property].getPromise().then(function(val) { prop[property] = val; }, function(err) {
            prop[property] = undefined;
            console.error(err);
          })
        );
      }
    });
  })(config);
  return Promise.all(promises).then(function() { return config; });
}

module.exports.asyncConfig = asyncConfig;
module.exports.AsyncConfig = AsyncConfig;

module.exports.resolveAsyncConfigs = resolveAsyncConfigs;
