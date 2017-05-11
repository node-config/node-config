'use strict';

var DEFAULT_PREFIX = 'NODE_APP';
var DEFAULT_SEPARATOR = '_';
var CASING_UPPER = 'upper';
var CASING_LOWER = 'lower';
var DEFAULT_CASING = CASING_UPPER;
var DEFAULT_EMPTIES = false;

/**
 * Generates an object suitable for use with config's <code>config/custom-environment-variables.json</code>, skipping
 * any functions encountered in the given object.
 * Example:<code>
 *   var fs = require('fs');
 *   var config = require('config');
 *   var cev = config.cev
 *   fs.writeFileSync('config/custom-environment-variables.json', JSON.stringify(cev.generate(config, { prefix: 'MYAPP' }),0,2)));
 * </code>
 * @param obj An object, most likely returned by <code>require('config')</code>
 * @param opts An object containing options to control how the returned object generates environment variable names,
 * containing the following properties:
 * <ul>
 *   <li><code>prefix</code>: prefix, default: NODE_APP (see exported DEFAULT_PREFIX)</li>
 *   <li><code>separator</code>: separator, default: _ (see exported DEFAULT_SEPARATOR)</li>
 *   <li><code>casing</code>: value indicating the casing policy to use;
 *   <ul>
 *     <li>'upper' means force upper case,</li>
 *     <li>'lower' means force lower case, and</li>
 *     <li>any other value means leave the casing unchanged</li></ul>
 *     (see exported DEFAULT_CASING, CASING_UPPER, and CASING_LOWER</li>
 *   <li><code>empties</code>: if true, preserves empty objects that didn't have any environment variables;
 *   if false, skips entries that wouldn't have any environment variables (functions are always skipped).</li>
 * </ul>
 * @returns {{}}
 */
var generate = function generate(obj, opts) {
  obj = obj || {};
  opts = opts || {};

  var prefix = opts.prefix || module.exports.DEFAULT_PREFIX;
  var separator = opts.separator || module.exports.DEFAULT_SEPARATOR;
  var keys = Object.keys(opts);
  var casing = keys.indexOf('casing') != -1
    ? opts.casing.toString().toLowerCase()
    : DEFAULT_CASING;
  var empties = keys.indexOf('empties') != -1
    ? (!!opts.empties)
    : DEFAULT_EMPTIES;

  var vars = {};

  Object.keys(obj).forEach(function (key) {
    if ((obj[key] instanceof Function)) return; // skip
    else if (obj[key] instanceof Object) { // recurse
      var pre = applyCasing((prefix ? (prefix + separator) : '') + key, casing);
      vars[key] = generate(obj[key], {
        prefix: pre,
        separator: separator,
        casing: casing,
        empties: empties
      });
      if ((!Object.keys(vars[key]).length) && !empties) delete vars[key];
    }
    else { // add
      var v = applyCasing((prefix ? prefix + separator : '') + key, casing);
      vars[key] = v;
    }
  });
  return vars;
};

function applyCasing(value, casing) {
  value = value.toString();
  switch (casing) {
    case CASING_UPPER:
      return value.toUpperCase();
    case CASING_LOWER:
      return value.toLowerCase();
    default:
      return value;
  }
}

module.exports = generate;
module.exports.generate = generate;
module.exports.DEFAULT_PREFIX = DEFAULT_PREFIX;
module.exports.DEFAULT_SEPARATOR = DEFAULT_SEPARATOR;
module.exports.DEFAULT_EMPTIES = DEFAULT_EMPTIES;
module.exports.DEFAULT_CASING = DEFAULT_CASING;
module.exports.CASING_UPPER = CASING_UPPER;
module.exports.CASING_LOWER = CASING_LOWER;
module.exports.CASING_UNCHANGED = '';
