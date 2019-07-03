var asyncConfig = require('../../async').asyncConfig;

var config = {
  siteTitle : 'New Instance!',
  promiseSubject: asyncConfig(async function(cfg) {
    var subject = await cfg.welcomeEmail.subject;
    return this.siteTitle+' '+subject;
  })
};

config.map = {
  centerPoint :  { lat: 3, lon: 4 },
};

config.original = {
  // An original value passed to deferred function
  original: asyncConfig(async function(cfg, original) {
    return await Promise.resolve(original);
  }),
  // An original value passed to deferred function
  originalPromise: asyncConfig(Promise.resolve("not an original value")),
};

module.exports = config;
