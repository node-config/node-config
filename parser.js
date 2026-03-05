// External libraries are lazy-loaded only if these file types exist.
import Path from 'path';
import { createRequire } from 'node:module';
import JSON5 from 'json5';

const moduleRequire = createRequire(Path.join(process.cwd(), 'package.json'));
const require = createRequire(process.cwd());

let Yaml = null,
    JSYaml = null,
    Coffee = null,
    Iced = null,
    CSON = null,
    PPARSER = null,
    TOML = null,
    HJSON = null,
    XML = null,
    TS = null;

// Define soft dependencies so transpilers don't include everything
let COFFEE_2_DEP = 'coffeescript',
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
 * @template [T=any]
 * @typedef {(filename: string, content: string) => T | undefined} ParserFn<T>
 */

/**
 * @class
 */
class Parser {
  /**
   * @constructor
   */
  constructor() {
  }

  /**
   * @param {string} filename
   * @param {string} content
   * @returns {object | undefined}
   */
  parse(filename, content) {
    let parserName = filename.substr(filename.lastIndexOf('.') + 1);  // file extension
    if (typeof definitions[parserName] === 'function') {
      return definitions[parserName](filename, content);
    }
    // TODO: decide what to do in case of a missing parser
  }

  /**
   * @param {string} filename
   * @param {string} content
   * @returns {object}
   */
  xmlParser(filename, content) {
    if (!XML) {
      XML = moduleRequire(XML_DEP);
    }

    let x2js = new XML();
    let configObject = x2js.xml2js(content);
    let rootKeys = Object.keys(configObject);
    if (rootKeys.length === 1) {
      return configObject[rootKeys[0]];
    }
    return configObject;
  }

  /**
   * @param {string} filename
   * @param {string} content
   * @returns {object}
   */
  jsParser(filename, content) {
    let configObject = require(filename);

    if (configObject.__esModule && isObject(configObject.default)) {
      return configObject.default
    }
    return configObject;
  }

  /**
   * @param {string} filename
   * @param {string} content
   * @returns {object}
   */
  tsParser(filename, content) {
    if (require?.extensions?.['.ts'] === undefined) {
      if (TS === null) {
        TS = moduleRequire(TS_DEP);
        TS.register({
          lazy: true,
          ignore: ['(?:^|/)node_modules/', '.*(?<!\.ts)$'],
          transpileOnly: true,
          compilerOptions: {
            allowJs: true,
          }
        });
      }
    }

    // Imports config if it is exported via module.exports = ...
    // See https://github.com/node-config/node-config/issues/524
    let configObject = require(filename);

    // Because of ES6 modules usage, `default` is treated as named export (like any other)
    // Therefore config is a value of `default` key.
    if (configObject.default) {
      return configObject.default
    }
    return configObject;
  }

  /**
   * @param {string} filename
   * @param {string} content
   * @returns {object}
   */
  coffeeParser(filename, content) {
    // .coffee files can be loaded with either coffee-script or iced-coffee-script.
    // Prefer iced-coffee-script, if it exists.
    // Lazy load the appropriate extension
    if (!Coffee) {
      Coffee = {};

      try {
        // Try to load coffeescript
        Coffee = moduleRequire(COFFEE_2_DEP);
      } catch (e) {
        // If it doesn't exist, try to load it using the deprecated module name
        Coffee = moduleRequire(COFFEE_DEP);
      }
      // coffee-script >= 1.7.0 requires explicit registration for require() to work
      if (Coffee.register) {
        Coffee.register();
      }
    }
    // Use the built-in parser for .coffee files with coffee-script
    return require(filename);
  }

  /**
   * @param {string} filename
   * @param {string} content
   * @returns {object | undefined}
   */
  icedParser(filename, content) {
    Iced = moduleRequire(ICED_DEP);

    // coffee-script >= 1.7.0 requires explicit registration for require() to work
    if (Iced.register) {
      Iced.register();
    }
  }

  /**
   * @param {string} filename
   * @param {string} content
   * @returns {object | undefined}
   */
  yamlParser(filename, content) {
    if (!Yaml && !JSYaml) {
      // Lazy loading
      try {
        Yaml = moduleRequire(YAML_DEP);
      } catch (e) {
        try {
          JSYaml = moduleRequire(JS_YAML_DEP);
        } catch (e) {
        }
      }
    }

    if (Yaml) {
      return Yaml.parse(content);
    } else if (JSYaml) {
      return JSYaml.load(content);
    } else {
      console.error('No YAML parser loaded.  Suggest adding yaml dependency to your package.json file.')
    }
  }

  /**
   * @param {string} filename
   * @param {string} content
   * @returns {object}
   */
  jsonParser(filename, content) {
    /**
     * Default JSON parsing to JSON5 parser.
     * This is due to issues with removing supported comments.
     * More information can be found here: https://github.com/node-config/node-config/issues/715
     */
    return JSON5.parse(content);
  }

  /**
   * @param {string} filename
   * @param {string} content
   * @returns {object}
   */
  json5Parser(filename, content) {
    return JSON5.parse(content);
  }

  /**
   * @param {string} filename
   * @param {string} content
   * @returns {object}
   */
  hjsonParser(filename, content) {
    if (!HJSON) {
      HJSON = moduleRequire(HJSON_DEP);
    }

    return HJSON.parse(content);
  }

  /**
   * @param {string} filename
   * @param {string} content
   * @returns {object}
   */
  tomlParser(filename, content) {
    if (!TOML) {
      TOML = moduleRequire(TOML_DEP);
    }

    return TOML.parse(content);
  }

  /**
   * @param {string} filename
   * @param {string} content
   * @returns {object}
   */
  csonParser(filename, content) {
    if (!CSON) {
      CSON = moduleRequire(CSON_DEP);
    }
    // Allow comments in CSON files
    if (typeof CSON.parseSync === 'function') {
      return CSON.parseSync(content);
    }

    return CSON.parse(content);
  }

  /**
   * @param {string} filename
   * @param {string} content
   * @returns {object}
   */
  propertiesParser(filename, content) {
    if (!PPARSER) {
      PPARSER = moduleRequire(PPARSER_DEP);
    }

    return PPARSER.parse(content, {namespaces: true, variables: true, sections: true});
  }

  /**
   * Strip YAML comments from the string
   *
   * The 2.0 yaml parser doesn't allow comment-only or blank lines.  Strip them.
   *
   * @protected
   * @method stripYamlComments
   * @param {string} fileStr The string to strip comments from
   * @return {string} The string with comments stripped.
   */
  stripYamlComments(fileStr) {
    // First replace removes comment-only lines
    // Second replace removes blank lines
    return fileStr.replace(/^\s*#.*/mg, '').replace(/^\s*[\n|\r]+/mg, '');
  }

  /**
   * Parses the environment variable to the boolean equivalent.
   * Defaults to false
   *
   * @param {string} filename - Filename of the env variable (not used)
   * @param {string} content - Environment variable value
   * @return {boolean} - Boolean value fo the passed variable value
   */
  booleanParser(filename, content) {
    return content === 'true';
  }

  /**
   * Parses the environment variable to the number equivalent.
   * Defaults to undefined
   *
   * @param {string} filename - Filename of the env variable (not used)
   * @param {string} content - Environment variable value
   * @return {number} - Number value fo the passed variable value
   */
  numberParser(filename, content) {
    const numberValue = Number(content);
    return Number.isNaN(numberValue) ? undefined : numberValue;
  }

  /**
   * @param {string} name
   * @returns {ParserFn | undefined}
   */
  getParser(name) {
    return definitions[name];
  }

  /**
   * @param {string} name
   * @param {ParserFn} parser
   */
  setParser(name, parser) {
    definitions[name] = parser;
    if (order.indexOf(name) === -1) {
      order.push(name);
    }
  }

  /**
   * @param {string=} name
   * @returns {string[] | number}
   */
  getFilesOrder(name) {
    if (name) {
      return order.indexOf(name);
    }

    return order;
  }

  /**
   * @param {string|string[]} name
   * @param {number=} newIndex
   * @returns {string[]}
   */
  setFilesOrder(name, newIndex) {
    if (Array.isArray(name)) {
      return order = name;
    }

    if (typeof newIndex === 'number') {
      let index = order.indexOf(name);
      order.splice(newIndex, 0, name);
      if (index > -1) {
        order.splice(index >= newIndex ? index + 1 : index, 1);
      }
    }

    return order;
  }
}

let order = ['js', 'cjs', 'mjs', 'ts', 'json', 'jsonc', 'json5', 'hjson', 'toml', 'coffee', 'iced', 'yaml', 'yml', 'cson', 'properties', 'xml',
  'boolean', 'number'];

let definitions = {
  cjs: Parser.prototype.jsParser,
  coffee: Parser.prototype.coffeeParser,
  cson: Parser.prototype.csonParser,
  hjson: Parser.prototype.hjsonParser,
  iced: Parser.prototype.icedParser,
  js: Parser.prototype.jsParser,
  json: Parser.prototype.jsonParser,
  jsonc: Parser.prototype.jsonParser,
  json5: Parser.prototype.json5Parser,
  mjs: Parser.prototype.jsParser,
  properties: Parser.prototype.propertiesParser,
  toml: Parser.prototype.tomlParser,
  ts: Parser.prototype.tsParser,
  xml: Parser.prototype.xmlParser,
  yaml: Parser.prototype.yamlParser,
  yml: Parser.prototype.yamlParser,
  boolean: Parser.prototype.booleanParser,
  number: Parser.prototype.numberParser
};

function isObject(arg) {
  return (arg !== null) && (typeof arg === 'object');
}

export default new Parser();
export { Parser };
