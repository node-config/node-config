
/**
 * <p>Runtime configuration for Node.js deployments</p>
 * 
 * @module Config
 */

// Dependencies
var _ = require('underscore');
var ext = require('./extensions');
var File = require('fs');
var Yaml = require('yaml');

// Saved configurations key=moduleName, value=configObj
var savedConfigs = {};

// Saved configuration files.  key=filename, value=configObj
var savedConfigFiles = {};

/**
 * <p>Main configuration class</p>
 * This takes a default configuration object for a module, and folds in values
 * from configuration files and values passed in from the command line.
 *
 * @class Config
 * @constructor
 * @param config {object} Configuration object (see Configuration attributes)
 * @return config {object} the requested configuration object
 */
module.exports = function(modName, origConfig) {

  // Initialize
  var mixedConfig =_.cloneDeep(origConfig || {});

  // If no origConfig is given, return an existing config or all configs
  if (origConfig === null) {
    return (modName ? savedConfigs[modName] : savedConfigs);
  }

  // Mixin configuration files
  var argName = '-config';
  _.each(process.argv, function(arg, pos){
    if (argName == arg && ++pos < process.argv.length) {

      // If the filename is relative, make it relative to the process cwd
      var configFile = process.argv[pos];
      if (configFile.indexOf('./') === 0 || configFile.indexOf('../') === 0) {
        configFile = process.cwd() + '/' + configFile;
      }

      // Get the configuration object from the file
      var configObject = savedConfigFiles[configFile];
      if (!configObject) {

        // Determine the file type
        var fileParts = configFile.split('.');
        var lastPart = fileParts[fileParts.length - 1].toLowerCase();
        var isYAML = (lastPart == 'yaml');
        var isJSON = (lastPart == 'json');
        var isJS = (!isYAML && !isJSON);

        // Load and parse the file into a javascript object
        try {
          if (isYAML) {
            var yamlText = File.readFileSync(configFile).toString();
            //  Yaml library doesn't like strings that have newlines but don't end in
            //  a newline: https://github.com/visionmedia/js-yaml/issues/issue/13
            yamlText += '\n';
            configObject = Yaml.eval(yamlText);
          }
          else if (isJSON) {
            var jsonText = File.readFileSync(configFile).toString();
            configObject = JSON.parse(jsonText);
          }
          else {
            configObject = require(configFile);
          }
          
          // Remember the object so the file doesn't have to be parsed
          // again for the next module.
          savedConfigFiles[configFile] = configObject;
        }
        catch (e)
        {
          console.log("\nError parsing config file: " + configFile);
          console.log(e.message);
          process.exit(1);
        }
      }

      // Mixin the module from the configuration file object
      _.extendDeep(mixedConfig, configObject[modName]);

    }
  });

  // Remember the configuration, and return it
  savedConfigs[modName] = mixedConfig;
  return mixedConfig;

};
