const asyncSymbol = Symbol('asyncSymbol');
const { deferConfig } = require('./defer');
const utils = require('./utils');

module.exports.asyncSymbol = asyncSymbol;
module.exports.asyncConfig = asyncConfig;
module.exports.resolveAsyncConfigs = resolveAsync;

/**
 * Accept a promise who's resolved value will be replaced with whenever `whenReady` is activated
 * Can also accept an async function (which returns a promise) which will be deferred and the
 * resulting promise will be used with asyncConfig to ensure the value is detected and replaced
 *
 * @param promise         the promise will determine a property's value once resolved
 *                        can also be a function to defer which resolves to a promise
 * @returns {Promise}     a marked promise to be resolve later using `whenReady`
 */
function asyncConfig(promise) {
  if (typeof promise === 'function') {
    return deferConfig((config, original) =>
      createDelayedPromise(promise, config, original));
  }
  promise.async = asyncSymbol;
  promise.prepare = (object, key) => {
    if (promise.release) promise.release();
    return () => promise.then(value =>
      Object.defineProperty(object, key, {value}));
  };
  return promise;
}

/**
 * Creates a delayed promise that won't resolve until the release method is executed
 * Used internally to delay the execution of async functions until all deferred values
 * have been resolved
 *
 * @param asyncFunc   any function that returns a promise
 * @param config      configuration object to be passed to the async function
 * @param original    previously defined value to be passed to the async function
 * @return {Promise}  a custom promise which has a release method. the async function awaits
 *                    the execution of `release` to be executed as part of the promise chain
 */
function createDelayedPromise(asyncFunc, config, original) {
  let release;
  const registerRelease = resolve => release = resolve;
  const callFunc = () => asyncFunc.call(config, config, original);
  const promise = asyncConfig(new Promise(registerRelease).then(callFunc));
  promise.release = release;
  return promise;
}

/**
 * Iterates the configuration object to prepare and resolve asyncConfig marked instances
 * Should run after resolveDeferred so that deferred async functions will already by resolved into asyncConfig promises
 *
 * @param config      mutable configuration object
 * @return {Promise}  resolves when all asyncConfigs promises have been resolved
 * @see utils.collect
 */
function resolveAsync(config) {
  const asyncConfigs = utils.collect(config, val => val && val.async === asyncSymbol);
  const asyncResolvers = asyncConfigs.map(([ promise, key, object ]) => promise.prepare(object, key));
  return Promise.all(asyncConfigs.map(([ promise ]) => promise))
    .then(() => asyncResolvers.forEach(resolver => resolver()));
}
