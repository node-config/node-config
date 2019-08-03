module.exports.DeferredConfig = DeferredConfig;
module.exports.deferConfig = deferConfig;

/**
 * Accept a function that is used to resolve property's value lazily,
 * after all configuration sources has been merged
 *
 * @param func
 * @return {DeferredConfig}
 */
function deferConfig(func) {
  return Object.create(DeferredConfig.prototype, {handler: {value: func}});
}

function DeferredConfig() {}

/**
 * Used internally to prepare deferred instances before they're resolved
 * The resolver needs to be created earlier, when we can provide details
 * about the property that are needed to redefine it
 *
 * @param config
 * @param object
 * @param key
 * @return {function(): *}
 */
DeferredConfig.prototype.prepare = function(config, object, key) {
  const resolver = createResolver(object, key, this.handler, config, object[key].original);
  Object.defineProperty(object, key, {get: resolver});
  return resolver;
};

/**
 * Execute the deferred function and set the corresponding property's value to the result
 * Deferred function context is set to the configuration object,
 * and as argument we pass config and the original value accordingly
 *
 * @param object
 * @param key
 * @param func
 * @param config
 * @param original
 * @return {function(): *}
 */
function createResolver(object, key, func, config, original) {
  return () => {
    const value = func.call(config, config, original);
    Object.defineProperty(object, key, {value});
    return value;
  };
}