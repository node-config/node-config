//
// Because require'ing config creates and caches a global singleton,
// We have to invalidate the cache to build new object based on the environment variables above
module.exports = function requireUncached(module){
   delete require.cache[require.resolve(module)];
   return require(module);
}