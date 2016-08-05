/**
 * This is meant to wrap configuration objects that should be left as is,
 * meaning that the object or its protoype will not be modified in any way
 */
function RawConfig () {
}

function raw(rawObj) {
  var obj = Object.create(RawConfig.prototype);
  obj.resolve = function () { return rawObj; }
  return obj;
}

module.exports.RawConfig = RawConfig;
module.exports.raw = raw;
