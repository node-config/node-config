// Create a deferredConfig prototype so that we can check for it when reviewing the configs later.
function DeferredConfig () {
}
DeferredConfig.prototype.resolve = function (config) {};

// Accept a function that we'll use to resolve this value later and return a 'deferred' configuration value to resolve it later.
function deferConfig (func, dependency) {
  var obj = Object.create(DeferredConfig.prototype);
  obj.resolve = func;

  // A dependency on another deferred valuemay also also be declared as string.
  // At resolution time, we will then make sure the deferred dependency gets resolved first.
  // Ref: https://github.com/lorenwest/node-config/issues/266
  if (dependency) {
    obj.dependency = dependency;
  }
  return obj;
}

module.exports.deferConfig = deferConfig;
module.exports.DeferredConfig = DeferredConfig;
