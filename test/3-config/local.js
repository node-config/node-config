var defer = require('../../defer').deferConfig;

var config = {
 siteTitle : 'New Instance!',
};

config.map = {
  centerPoint :  { lat: 3, lon: 4 },
};

var RealServiceAdapter = function() {};
RealServiceAdapter.prototype.message = 'Real thing';
config.service = {
  // Add our service adapter to the regiistry
  registry: {
    'real': new RealServiceAdapter()
  },
  // Override the active service
  name: 'real'
};

var stressConfig = {
  // From issue #231
  images: {
    src: 'foobar',  // override
  },

  a1: 1,
  c1: defer(cfg => cfg.a1),
  d1: defer(cfg => cfg.a1 + cfg.a1),
  e1: defer(cfg => cfg.a1 + cfg.c1 + cfg.d1),
  // This one references an item that (perhaps) is evaluated later
  f1: defer(cfg => cfg.g1 + cfg.a1),
  g1: defer(cfg => cfg.a1),

  // deferreds in descendants
  h1: { ha: 5,
    hb: defer(cfg => cfg.a1 + cfg.e1), },
  h2: {
    a: {
      a: [
        7, 'fleegle',
        defer(cfg => cfg.a1 + cfg.e1),
      ],
    },
  },

  // For i0 - i2: see default.js

  a2: 1,
  b2: defer(cfg => cfg.a2),
  c2: defer(cfg => [
    cfg.d2,
    cfg.e2.e0,
  ]),
  d2: defer(cfg => ({
    d0: 0,
    d1: 1,
  })),
  e2: defer(cfg => ({
    e0: defer(cfg => [
      'hello',
      cfg.b2,
    ]),
  })),

  // For f2: see default.js
};

Object.keys(stressConfig).forEach(function(key) {
  config[key] = stressConfig[key];
});

module.exports = config;
