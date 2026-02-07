// Create a deferredConfig prototype so that we can check for it when reviewing the configs later.
/** @typedef {import('./lib/config').Config} Config */
/**
 * Deferred config placeholder.
 * @constructor
 */
function DeferredConfig() {}
/**
 * @param {Config} config
 * @param {any} prop
 * @param {string} property
 * @returns {void}
 */
DeferredConfig.prototype.prepare = function(config, prop, property) {};
/**
 * @returns {any}
 */
DeferredConfig.prototype.resolve = function() {};


// Accept a function that we'll use to resolve this value later and return a 'deferred' configuration value to resolve it later.
/**
 * @template T
 * @param {(config: Config, original: T) => T} func
 * @returns {DeferredConfig}
 */
function deferConfig(func) {
  var obj = Object.create(DeferredConfig.prototype);
  obj.prepare = function(config, prop, property) {
    var original = prop[property]._original;
    obj.resolve = function() {
      var value = func.call(config, config, original);
      Object.defineProperty(prop, property, {value: value});
      return value;
    };
    Object.defineProperty(prop, property, {get: function() { return obj.resolve(); }});
    return obj;
  };
  return obj;
}

module.exports.deferConfig = deferConfig;
module.exports.DeferredConfig = DeferredConfig;
