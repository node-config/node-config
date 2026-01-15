const { isAsyncFunction } = require('node:util/types');

// Create a deferredConfig prototype so that we can check for it when reviewing the configs later.
function DeferredConfig() {}
DeferredConfig.prototype.prepare = function() {};
DeferredConfig.prototype.resolve = function() {};

// Accept a function that we'll use to resolve this value later and return a 'deferred' configuration value to resolve it later.
function deferConfig(func) {
  const obj = Object.create(DeferredConfig.prototype);
  obj.prepare = function(config, prop, property) {
    const original = prop[property]._original;

    if (isAsyncFunction(func)) {
      obj.resolve = async function () {
        const promise = func.call(config, config, original);

        Object.defineProperty(prop, property, { value: promise });
        Object.defineProperty(prop, property, { value: await promise });

        return promise;
      }
    } else {
      obj.resolve = function() {
        const value = func.call(config, config, original);

        Object.defineProperty(prop, property, {value: value});

        return value;
      };
    }

    Object.defineProperty(prop, property, { get: function() { return obj.resolve(); } });

    return obj;
  };

  return obj;
}

module.exports.deferConfig = deferConfig;
module.exports.DeferredConfig = DeferredConfig;
