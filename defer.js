const { deferConfig, DeferredConfig } = require('./lib/defer.js');

/**
 * @deprecated please use the new callback mechanism
 * @see lib/defer.js
 */
module.exports.deferConfig = (...args) => {
  const { Util } = require('./lib/util.js');

  Util.errorOnce("DEFER_CONFIG", 'node-config now supports config file callbacks in place of deferConfig(), which is deprecated.');
  return deferConfig(...args);
}

/**
 * @deprecated please use the new callback mechanism
 */
module.exports.DeferredConfig = DeferredConfig;
