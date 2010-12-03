/*******************************************************************************
* config.js - Main module for node-config
********************************************************************************
*/

// Dependencies
var deps = require('../deps');
var _ = deps._;
var ext = require('./extensions');

// Saved configurations key=moduleName, value=configObj
var savedConfigs = {};

/*******************************************************************************
* config() - Build a module configuration object
********************************************************************************
* This takes a default configuration object for a module, and folds in values
* from configuration files and values passed in from the command line.
* 
* See README.md for more information
* 
* Input:
*   modName - Module name
*   defaultConf - The program default configurations
*   
* Output: 
*   conf - The mixed configuration object
*/
module.exports = function(modName, origConfig) {

  // Initialize
  var mixedConfig =_.cloneDeep(origConfig || {});

  // If no origConfig is given, return an existing config or all configs
  if (origConfig == null) {
    return (modName ? savedConfigs[modName] : savedConfigs);
  }

  // Mixin configuration files
  var argName = '-config';
  _.each(process.argv, function(arg, pos){
    if (argName == arg && ++pos < process.argv.length) {
      // If the filename starts with "./", then make it relative to
      // the process CWD vs. this modules file location
      var confFile = process.argv[pos];
      if (confFile.indexOf('./') == 0) {
        confFile = process.cwd() + confFile.substr(1);
      }

      // This will fail if it can't load the file
      _.extendDeep(mixedConfig, require(confFile)[modName]);
    }
  });

  // Mixin configurations from the command line
  // -ModName.FldName FldValue
  var modDot = '-' + modName + '.';
  _.each(process.argv, function(arg, pos){

	// Process if this is in the right format
    if (arg.indexOf(modDot) == 0 && ++pos < process.argv.length) {
      // Get the field name & value
      var fldName = arg.substr(modDot.length);
      var fldValue = process.argv[pos];
      
      // Quote the field value unless it's complex
      if (fldValue[0] != '{' && fldValue[0] != '[') {
    	  fldValue = "'" + fldValue.replace(/'/,"\\'") + "'";
      }

      // Variable names & values can be complex, so execute them.
      eval('mixedConfig.' + fldName + '=' + fldValue);
    }
  });

  // Remember the configuration, and return it
  return savedConfigs[modName] = mixedConfig;

};
