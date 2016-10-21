var defer = require('../../defer').deferConfig;

var config = {
 siteTitle : 'New Instance!',
};

config.map = {
  centerPoint :  { lat: 3, lon: 4 },
};

config.original = {
  // An original value passed to deferred function
  original: defer(function(cfg, original) {
    return original;
  }),

  // This deferred function "skips" the previous one
  deferredOriginal: defer(function(cfg, original) {
    return original; // undefined
  }),
};

module.exports = config;
