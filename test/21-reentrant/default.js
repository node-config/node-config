var util = require('../../lib/config').util;

var config = {
  testValue : 'from js',
  nested: util.loadFileConfigs(__dirname +  "/nested")
};

module.exports = config;
