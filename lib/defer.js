const { isAsyncFunction } = require('node:util/types');

/** @typedef {import('./config').Config} Config */

/**
 * Deferred config placeholder.
 * @constructor
 */
function DeferredConfig() {}

/**
 * Prepare this deferred value for lazy resolution.
 *
 * @param {Config} config
 * @param {any} prop
 * @param {string | number} property
 * @returns {DeferredConfig}
 */
DeferredConfig.prototype.prepare = function(config, prop, property) {};

/**
 * Resolve the deferred value.
 *
 * @returns {any}
 */
DeferredConfig.prototype.resolve = function() {};

/**
 * Accept a function that we will execute later and return a deferred placeholder.
 *
 * @template TOriginal
 * @template TResult
 * @param {(this: Config, config: Config, original: TOriginal) => TResult | Promise<TResult>} func
 * @returns {DeferredConfig}
 */
function deferConfig(func) {
  /** @type {DeferredConfig} */
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
