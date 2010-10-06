/*******************************************************************************
* config.js - Main module for node-config
********************************************************************************
*/

// Dependencies
require('./extensions');

// Saved configurations key=moduleName, value=configObj
var savedConfigs = {};

/*******************************************************************************
* config() - Build a configuration object for the specified module
********************************************************************************
* This takes a default configuration object for a module, and folds in values
* from an application config file ./config/default.js, then folds in runtime 
* specific configurations from ./config/{config}.js.  The configuration name 
* is specified on the command line via -config {name}.  It then folds in module 
* specific values from the command line in the format module.variable=value
* 
* Input:
*   modName - Module name
*   defaultConf - The program default configurations
*   
* Output: 
*   conf - The mixed configuration object
*/
var config = function(modName, origConfig) {

  // Initialize
  var mixedConfig =_.extendDeep({}, origConfig == null ? {} : origConfig);
  if (config.runtimeName == null) config.getRuntimeName();

  // If no origConfig is given, return an existing config or all configs
  if (origConfig == null) {
    return (modName ? savedConfigs[modName] : savedConfigs);
  }

  // Get the path to the application directory
  var appParts = process.mainModule.filename.split('/');
  appParts.splice(-1,1);
  var modParts = module.filename.split('/');
  modParts.splice(-1,1);
  var appDirPath = config.pathFrom(modParts.join('/'), appParts.join('/'));

  // Attempt loading the app and deploy configuration files
  confFiles = [
    appDirPath + "/config/default",
    appDirPath + "/config/" + config.runtimeName
  ];
  _.each(confFiles, function(confFile) {
    try {
      // Extend the mixed configs with the module level config
      _.extendDeep(mixedConfig, require(confFile)[modName]);
    }
    // File not found or modName section not in the file
    catch (e) {}
  });

  // Mixin configurations from the command line
  // mod-name.variable=value
  var modDot = modName + ".";
  _.each(process.argv, function(arg){
    if (arg.indexOf(modDot) == 0) {
      // Remove the module name, split by '=', to extract the name, 
      // and join back in case the value contains an '='
      var argParts = arg.substr(modDot.length).split('=');
      var fldName = argParts.splice(0,1);
      var fldValue = argParts.join('=');
      
      // Add the parameter to the configuration
      mixedConfig[fldName] = fldValue;
    }
  });

  // Remember the configuration, and return it
  return savedConfigs[modName] = mixedConfig;

}; // config()

/*******************************************************************************
* getRuntimeName() - Return the current runtime configuration name
********************************************************************************
* This returns the configuration name from the command line.  If not specified,
* the name is 'local'.  Otherwise it's the value of the -config {name}
* command line parameter.
*/
config.getRuntimeName = function() {

  // Initialize
  var runtimeConfig = 'local';

  // Return if already set
  if (config.runtimeName != null) return config.runtimeName;

  // See if -config {name} is passed in
  var argName = '-config';
  _.each(process.argv, function(arg, pos){
    if (argName == arg && ++pos < process.argv.length) {
      runtimeConfig = process.argv[pos];
    }
  });
  
  // Remember the name & return it
  config.runtimeName = runtimeConfig;
  return runtimeConfig;

}; // getRuntimeName()

/*******************************************************************************
* pathFrom() - Return a path from one absolute directory path to another
********************************************************************************
* This accepts two absolute directory paths, and returns a relative path from
* the first directory to the other.  Example:
* 
*   fromPath: /home/jerry/projects/node/mylib/lib
*     toPath: /home/jerry/projects/node/extern/feature
*    returns: ./../../extern/feature
* 
* Input:
*   fromPath - Absolute path of the directory to build the path from
*     toPath - Absolute path of the directory to build the path to
*   
* Output: 
*   a relative path from one directory to the other.
*/
config.pathFrom = function(fromPath, toPath) {

  // Initialize
  var fromParts = fromPath.split('/');
  var toParts = toPath.split('/');

  // Remove common top level paths
  while (fromParts.length > 0) {
    if (fromParts[0] !== toParts[0]) {break;}
    fromParts.splice(0,1);
    toParts.splice(0,1);
  }

  // Add the appropriate number of '..'s
  for (var i = 0; i < fromParts.length; i++) {
	  toParts.splice(0,0,'..');
  }

  // Add the starting '.'
  toParts.splice(0,0,'.');

  // Return the path
  return toParts.join('/');

}; // pathFrom()

// Export the config function as the main module export
module.exports = config;
