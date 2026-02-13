const { Util, RawConfig } = require('./lib/util')

/**
 * @param {any} rawObj
 * @returns {RawConfig & { resolve: () => any }}
 */
function raw(rawObj) {
  Util.errorOnce('RAW_CONFIG', 'node-config now supports config file callbacks in place of raw(), which is deprecated.');

  return RawConfig.raw(rawObj);
}

/** @deprecated please use callback function */
module.exports.RawConfig = RawConfig;
/** @deprecated please use callback function */
module.exports.raw = raw;
