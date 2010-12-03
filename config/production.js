// Production configuration overrides
// (extends base parameter set)
var deps = require('../deps');
var _ = deps._;
_.extendDeep(module.exports, require('./base'), {
  Customers: {
	  dbHost:'production',
	  dbPort:4456,
	  custTemplate: {region: 'North'}
  }
});
