// Common configuration parameters
module.exports = {
  TestModule: {
    parm1:"value1"
  },
  Customers: {
    dbHost:'base',
    dbName:'from_default_js',
    dbPort: 'this_is_overridden',
    get dbString() {
      return '' + this.dbName + ':' + this.dbPort;
    },
    get random() {
      return Math.random();
    }
  },
  EnvOverride: {
    parm_number_1: "from_default_js",
    parm2: 22
  },
  MuteThis: 'hello',
  get customerDbPort() {
    return '' + this.Customers.dbPort;
  }
};
