/**
 * <p>Public extensions to the underscore library</p>
 * 
 * These extensions were written to assist development of the node-config
 * library.  They have been made public for other modules to use.
 * 
 * To use these extensions, simply include the underscore library and
 * call them as if they were a part of the library.
 * 
 * Example:
 * <pre>
 * var _ = require('underscore');
 * _.extendDeep(extendInto, extendFrom, {some:"defaults"});
 * </pre>
 * 
 * @class UnderscoreExtensions
 * @static
 */

// Dependencies
var _ = require('underscore');
var sys = require('sys');
var eyes = require('eyes');

/**
 * Is the specified argument an object?
 * 
 * The argument is an object if it's a JS object, but not an array and
 * not a function.
 * 
 * @method _.isObject
 * @param arg {MIXED} An argument of any type.
 * @return {boolean} TRUE if the arg is an object, FALSE if not
 */
if (!_.isFunction(_.isObject)) {
  _.mixin({isObject : function(obj) {
	  if (_.isArray(obj)) {return false;}
      return typeof obj == 'object';
    }
  });
}

/**
 * Return a deep copy of the specified object.
 * 
 * This returns a new object with all elements copied from the specified
 * object.  Deep copies are made of objects and arrays so you can do anything
 * with the returned object without affecting the input object.
 * 
 * @method _.cloneDeep
 * @param copyFrom {object} The original object to copy from
 * @param depth {integer} An optional depth to prevent recursion.  Default: 20.
 * @return {object} A new object with the elements copied from the copyFrom object
 */
var DEFAULT_DEPTH = 20;
_.mixin({cloneDeep : function(obj, depth) {

  // Recursion detection
  depth = (depth === null ? DEFAULT_DEPTH : depth);
  if (depth === 0) {return {};}

  // Create the copy of the correct type
  var copy = _.isArray(obj) ? [] : {};

  // Cycle through each element
  for (var prop in obj) {

    // Call recursively if an object or array
    if (_.isArray(obj[prop]) || _.isObject(obj[prop])) {
  	  copy[prop] = _.cloneDeep(obj[prop], depth--);
    } else {
  	  copy[prop] = obj[prop];
    }
  }

  // Return the copied object
  return copy;

}}); // cloneDeep()

/**
 * Extend an object, and any object it contains.
 * 
 * This does not replace deep objects like _.extend(), but dives into them 
 * replacing individual elements instead.
 * 
 * @method _.extendDeep
 * @param mergeInto {object} The object to merge into
 * @param mergeFrom... {object...} - Any number of objects to merge from
 * @param depth {integer} An optional depth to prevent recursion.  Default: 20.
 * @return {object} The altered mergeInto object is returned
 */
_.mixin({extendDeep : function(mergeInto) {
	
  // Initialize
  var vargs = Array.prototype.slice.call(arguments, 1);
  var depth = vargs.pop();
  if (!_.isNumber(depth)) {
    vargs.push(depth);
    depth = DEFAULT_DEPTH;
  }

  // Recursion detection
  if (depth === 0) {return mergeInto;}
	
  // Cycle through each object to extend
  vargs.forEach(function(mergeFrom) {

    // Cycle through each element of the object to merge from
    for (var prop in mergeFrom) {

      // Extend recursively if both elements are objects
      if (_.isObject(mergeInto[prop]) && _.isObject(mergeFrom[prop])) {
    	_.extendDeep(mergeInto[prop], mergeFrom[prop], depth--);
      }

      // Copy recursively if the mergeFrom element is an object (or array or fn)
      else if (mergeFrom[prop] && typeof mergeFrom[prop] == 'object') {
        mergeInto[prop] = _.cloneDeep(mergeFrom[prop], depth--);
      }

      // Simple assignment otherwise
      else {
    	mergeInto[prop] = mergeFrom[prop];
      }
    }
  });

  // Chain
  return mergeInto;

}}); // extendDeep()

/**
 * Print to the output stream
 * 
 * This is a handy method for printing stuff to the output stream.
 * 
 * @method _.out
 * @param name {string} (optional) The object name
 * @param obj {object} The object to print
 * @param deep {boolean or integer} Print deep?  Default: 2k output. TRUE prints up to 32k, or specify a size for the output.
 * @param eyesConfig {object} An optional eyes configuration object (see the eyes module)
 * @return {eyes.inspect} Whatever eyes.inspect() returns
 */
_.mixin({out : function(name, obj, deep, eyesConfig) {

  // Set the maxLength 
  // Default 2048, but if TRUE then set big, otherwise set to specified depth)
  var maxLength = (deep === null ? 2048 : (deep === true ? 32727 : deep));

  // Build the eyes config object
  eyesConfig = eyesConfig ? eyesConfig : {};
  var config = _.extendDeep({styles:false, maxLength:maxLength}, eyesConfig);

  // Single arg (and it's a string)
  if (_.isUndefined(obj) && _.isString(name)) {
	if (config.stream) {
	  sys.puts(name);
	  return;
	} else return name;
  }
  
  // Single arg (object)
  if (!obj) {
    obj = name;
    name = "object";
  }

  // Output using the eyes library
  return eyes.inspect(obj, name, config);

}}); // out()

/**
 * Return a string representation of an object
 * 
 * This does the same thing as _.out(), except instead of sending the output to
 * the standard output, the output is returned as a string.
 * 
 * @method _.outStr
 * @param name {string} (optional) The object name
 * @param obj {object} The object to print
 * @param deep {boolean or integer} Print deep?  Default: 2k output. TRUE prints up to 32k, or specify a size for the output.
 * @param eyesConfig {object} An optional eyes configuration object (see the eyes module)
 * @return {string} The formatted object as a string
 */
_.mixin({outStr : function(name, obj, deep, eyesConfig) {

  // Pass onto out(), with a null stream.  This returns the string.
  var config = _.extendDeep({},eyesConfig ? eyesConfig : {},{stream:null});
  return _.out(name, obj, deep, config);

}}); // outStr()
