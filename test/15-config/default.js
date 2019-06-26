
var asyncConfig = require('../../async').asyncConfig;

var config = {
  siteTitle : 'Site title',
  latitude  : 1,
  longitude : 2,
};

// Set up a default value which refers to another value.
// The resolution of the value is deferred until all the config files have been loaded
// So that if 'config.siteTitle' is overridden, this will point to the correct value.
config.welcomeEmail = {
  subject :  asyncConfig(async function (cfg) {
    var siteTitle = await Promise.resolve(cfg.siteTitle);
    return "Welcome to "+siteTitle;
  }),
  promiseSubject: asyncConfig(Promise.resolve("Welcome to Promise response")),
  // A plain function should be not disturbed.
  aFunc  : function () {
    return "Still just a function.";
  },
  // Look ma, no arg passing. The main config object is bound to 'this'
  justThis: asyncConfig(async function () {
    var siteTitle = await Promise.resolve(this.siteTitle);
    return "Welcome to this "+siteTitle;
  }),
};

config.map = {
  centerPoint : asyncConfig(async function () {
    var latitude = await Promise.resolve(this.latitude);
    return { lat: latitude, lon: this.longitude };
  }),
};

config.original = {
  // An original value passed to deferred function
  original: "an original value",
  // An original value passed to deferred function
  originalPromise: asyncConfig(Promise.resolve("this will not be used")),
};

module.exports = config;
