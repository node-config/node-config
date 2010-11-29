// Production configuration overrides
// (extends base parameter set)
_.extendDeep(module.exports, require('./base'), {
  Customers: {
	  dbHost:'production',
	  dbPort:4456,
	  custTemplate: {region: 'North'}
  }
});
