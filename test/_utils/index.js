const semver = require('semver');

module.exports.isSupportedVersion = function(version) {
  return semver.gte(process.versions.node, version);
};

// Because require'ing config creates and caches a default singleton
// We have to invalidate the cache to build a new default instance
module.exports.requireUncached = function(module){
  delete require.cache[require.resolve(module)];
  return require(module);
};

module.exports.processScope = function(options, handler) {
  const { argv, env } = process;
  return function() {
    if (options.argv) {
      process.argv = argv.slice(2).concat(options.argv);
    }
    if (options.env) {
      process.env = options.env;
    }
    const res = handler.apply(this, arguments);
    process.argv = argv;
    process.env = env;
    return res;
  };
};
