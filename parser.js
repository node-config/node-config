// External libraries are lazy-loaded only if these file types exist.

// webpack can't solve dynamic module
// @see https://github.com/node-config/node-config/issues/755
// @see https://webpack.js.org/guides/dependency-management/#require-with-expression
const JSON5Module = require('json5');

// webpack resolves json5 with module field out of the box which lead to this usage
// @see https://github.com/node-config/node-config/issues/755
// @see https://github.com/json5/json5/issues/240
const JSON5 = JSON5Module.default || JSON5Module;

var Yaml = null,
    VisionmediaYaml = null,
    Coffee = null,
    Iced = null,
    CSON = null,
    PPARSER = null,
    TOML = null,
    HJSON = null,
    XML = null;

// Define soft dependencies so transpilers don't include everything
var COFFEE_2_DEP = 'coffeescript',
    COFFEE_DEP = 'coffee-script',
    ICED_DEP = 'iced-coffee-script',
    JS_YAML_DEP = 'js-yaml',
    YAML_DEP = 'yaml',
    JSON5_DEP = 'json5',
    HJSON_DEP = 'hjson',
    TOML_DEP = 'toml',
    CSON_DEP = 'cson',
    PPARSER_DEP = 'properties',
    XML_DEP = 'x2js',
    TS_DEP = 'ts-node';

/**
 * @typedef Parser {Object}
 */
var Parser = module.exports;

Parser.parse = function(filename, content) {
  var parserName = filename.substr(filename.lastIndexOf('.') +1);  // file extension
  if (typeof definitions[parserName] === 'function') {
    return definitions[parserName](filename, content);
  }
  // TODO: decide what to do in case of a missing parser
};

Parser.xmlParser = function(filename, content) {
  if (!XML) {
    XML = require(XML_DEP);
  }
  var x2js = new XML();
  var configObject = x2js.xml2js(content);
  var rootKeys = Object.keys(configObject);
  if(rootKeys.length === 1) {
    return configObject[rootKeys[0]];
  }
  return configObject;
};

Parser.jsParser = function(filename, content) {
  var configObject = require(filename);

  if (configObject.__esModule && isObject(configObject.default)) {
    return configObject.default
  }
  return configObject;
};

Parser.tsParser = function(filename, content) {
  if (!require.extensions['.ts']) {
    require(TS_DEP).register({
      lazy: true,
      ignore: ['(?:^|/)node_modules/', '.*(?<!\.ts)$'],
      transpileOnly: true,
      compilerOptions: {
        allowJs: true,
      }
    });
  }

  // Imports config if it is exported via module.exports = ...
  // See https://github.com/node-config/node-config/issues/524
  var configObject = require(filename);

  // Because of ES6 modules usage, `default` is treated as named export (like any other)
  // Therefore config is a value of `default` key.
  if (configObject.default) {
    return configObject.default
  }
  return configObject;
};

Parser.coffeeParser = function(filename, content) {
  // .coffee files can be loaded with either coffee-script or iced-coffee-script.
  // Prefer iced-coffee-script, if it exists.
  // Lazy load the appropriate extension
  if (!Coffee) {
    Coffee = {};

    // The following enables iced-coffee-script on .coffee files, if iced-coffee-script is available.
    // This is commented as per a decision on a pull request.
    //try {
    //  Coffee = require('iced-coffee-script');
    //}
    //catch (e) {
    //  Coffee = require('coffee-script');
    //}
    try {
      // Try to load coffeescript
      Coffee = require(COFFEE_2_DEP);
    }
    catch (e) {
      // If it doesn't exist, try to load it using the deprecated module name
      Coffee = require(COFFEE_DEP);
    }
    // coffee-script >= 1.7.0 requires explicit registration for require() to work
    if (Coffee.register) {
      Coffee.register();
    }
  }
  // Use the built-in parser for .coffee files with coffee-script
  return require(filename);
};

Parser.icedParser = function(filename, content) {
  Iced = require(ICED_DEP);

  // coffee-script >= 1.7.0 requires explicit registration for require() to work
  if (Iced.register) {
    Iced.register();
  }
};

Parser.yamlParser = function(filename, content) {
  if (!Yaml && !VisionmediaYaml) {
    // Lazy loading
    try {
      // Try to load the better js-yaml module
      Yaml = require(JS_YAML_DEP);
    }
    catch (e) {
      try {
        // If it doesn't exist, load the fallback visionmedia yaml module.
        VisionmediaYaml = require(YAML_DEP);
      }
      catch (e) { }
    }
  }
  if (Yaml) {
    return Yaml.load(content);
  }
  else if (VisionmediaYaml) {
    // The yaml library doesn't like strings that have newlines but don't
    // end in a newline: https://github.com/visionmedia/js-yaml/issues/issue/13
    content += '\n';
    if (typeof VisionmediaYaml.eval === 'function') {
      return VisionmediaYaml.eval(Parser.stripYamlComments(content));
    }
    return VisionmediaYaml.parse(Parser.stripYamlComments(content));
  }
  else {
    console.error('No YAML parser loaded.  Suggest adding js-yaml dependency to your package.json file.')
  }
};

Parser.jsonParser = function(filename, content) {
  /**
   * Default JSON parsing to JSON5 parser.
   * This is due to issues with removing supported comments.
   * More information can be found here: https://github.com/node-config/node-config/issues/715
   */
  return JSON5.parse(content);
};

Parser.json5Parser = function(filename, content) {
  return JSON5.parse(content);
};

Parser.hjsonParser = function(filename, content) {
  if (!HJSON) {
    HJSON = require(HJSON_DEP);
  }
  return HJSON.parse(content);
};

Parser.tomlParser = function(filename, content) {
  if(!TOML) {
    TOML = require(TOML_DEP);
  }
  return TOML.parse(content);
};

Parser.csonParser = function(filename, content) {
  if (!CSON) {
    CSON = require(CSON_DEP);
  }
  // Allow comments in CSON files
  if (typeof CSON.parseSync === 'function') {
    return CSON.parseSync(content);
  }
  return CSON.parse(content);
};

Parser.propertiesParser = function(filename, content) {
  if (!PPARSER) {
    PPARSER = require(PPARSER_DEP);
  }
  return PPARSER.parse(content, { namespaces: true, variables: true, sections: true });
};

/**
 * Strip YAML comments from the string
 *
 * The 2.0 yaml parser doesn't allow comment-only or blank lines.  Strip them.
 *
 * @protected
 * @method stripYamlComments
 * @param fileStr {string} The string to strip comments from
 * @return {string} The string with comments stripped.
 */
Parser.stripYamlComments = function(fileStr) {
  // First replace removes comment-only lines
  // Second replace removes blank lines
  return fileStr.replace(/^\s*#.*/mg,'').replace(/^\s*[\n|\r]+/mg,'');
};

/**
 * Parses the environment variable to the boolean equivalent.
 * Defaults to false
 *
 * @param {String} content - Environment variable value
 * @return {boolean} - Boolean value fo the passed variable value
 */
Parser.booleanParser = function(filename, content) {
  return content === 'true';
};

/**
 * Parses the environment variable to the number equivalent.
 * Defaults to undefined
 *
 * @param {String} content - Environment variable value
 * @return {Number} - Number value fo the passed variable value
 */
Parser.numberParser = function(filename, content) {
  const numberValue = Number(content);
  return Number.isNaN(numberValue) ? undefined : numberValue;
};

var order = ['js', 'cjs', 'mjs', 'ts', 'json', 'jsonc', 'json5', 'hjson', 'toml', 'coffee', 'iced', 'yaml', 'yml', 'cson', 'properties', 'xml',
  'boolean', 'number'];
var definitions = {
  cjs: Parser.jsParser,
  coffee: Parser.coffeeParser,
  cson: Parser.csonParser,
  hjson: Parser.hjsonParser,
  iced: Parser.icedParser,
  js: Parser.jsParser,
  json: Parser.jsonParser,
  jsonc: Parser.jsonParser,
  json5: Parser.json5Parser,
  mjs: Parser.jsParser,
  properties: Parser.propertiesParser,
  toml: Parser.tomlParser,
  ts: Parser.tsParser,
  xml: Parser.xmlParser,
  yaml: Parser.yamlParser,
  yml: Parser.yamlParser,
  boolean: Parser.booleanParser,
  number: Parser.numberParser
};

Parser.getParser = function(name) {
  return definitions[name];
};

Parser.setParser = function(name, parser) {
  definitions[name] = parser;
  if (order.indexOf(name) === -1) {
    order.push(name);
  }
};

Parser.getFilesOrder = function(name) {
  if (name) {
    return order.indexOf(name);
  }
  return order;
};

Parser.setFilesOrder = function(name, newIndex) {
  if (Array.isArray(name)) {
    return order = name;
  }
  if (typeof newIndex === 'number') {
    var index = order.indexOf(name);
    order.splice(newIndex, 0, name);
    if (index > -1) {
      order.splice(index >= newIndex ? index +1 : index, 1);
    }
  }
  return order;
};

function isObject(arg) {
  return (arg !== null) && (typeof arg === 'object');
}
