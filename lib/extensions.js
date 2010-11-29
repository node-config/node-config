/*******************************************************************************
* extensions.js - Extensions for common libraries
********************************************************************************
*/

// Dependencies
var deps = require('../deps');
var sys = deps.sys;
var eyes = deps.eyes;

/*******************************************************************************
* _.isObject() - Extend the underscore library with isObject()
********************************************************************************
* Extend the underscore library if _.isObject(obj) doesn't exist.
*/
if (!_.isFunction(_.isObject)) {
  _.mixin({isObject : function(obj) {
	  if (_.isArray(obj)) {return false;}
      return typeof obj == 'object';
    }
  });
}

/*******************************************************************************
* _.cloneDeep() - Return a deep copy of the specified object
********************************************************************************
* This returns a new object with all elements copied from the specified
* object.  Deep copies are made of objects and arrays so you can do anything
* with the returned object without affecting the input object.
* 
* Input:
*   copyFrom - An object (or array) to copy from
*   depth - An optional depth to prevent recursion.  Defaults to 20.
*   
* Output: 
*   copiedObject - The copied object
*/
var DEFAULT_DEPTH = 20;
_.mixin({cloneDeep : function(obj, depth) {

  // Recursion detection
  depth = (depth === null ? DEFAULT_DEPTH : depth);
  if (depth == 0) {return {};}

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

/*******************************************************************************
* _.extendDeep() - Extend an object, and any object it contains
********************************************************************************
* This does not replace deep objects like _.extend(), but dives into them 
* replacing individual elements instead.
* 
* Input:
*   mergeInto - The object to merge into
*   mergeFrom... - Any number of objects to merge from
*   depth - An optional depth to prevent recursion.  Defaults to 20.
*   
* Output: 
*   mergeInto - The merged object
*/
_.mixin({extendDeep : function(obj) {

  // Recursion detection
  var depth = _.last(arguments);
  depth = _.isNumber(depth) ? depth : DEFAULT_DEPTH;
  if (depth === 0) {return obj;}
	
  // Cycle through each argument
  _.each(_.rest(arguments), function(source) {
    for (var prop in source) {

      // Extend recursively if both are objects
      if (_.isObject(obj[prop]) && _.isObject(source[prop])) {
    	_.extendDeep(obj[prop], source[prop], depth--);
      }

      // Copy recursively if the source is an object (or array or fn)
      else if (source[prop] && typeof source[prop] == 'object') {
        obj[prop] = _.cloneDeep(source[prop], depth--);
      }

      // Simple assignment otherwise
      else {
    	obj[prop] = source[prop];
      }
    }
  });

  // Chain
  return obj;

}}); // extendDeep()

/*******************************************************************************
* _.out() - Print to the output stream
********************************************************************************
* This is a handy method for printing stuff to the output stream.  You don't
* need to require() anything, because the underscore library is in the global
* namespace, and _.out() is installed as an extension.
* 
* Input:
*   name - Object name (or object if obj isn't supplied)
*   obj - Object to print
*   deep - Print deep?  Default: 2k output. TRUE prints up to 32k, or specify 
*          a size for the output.
*   eyesConfig - An optional eyes configuration object
*   
* Output: The output of eyes.inspect()
*/
_.mixin({out : function(name, obj, deep, eyesConfig) {

  // Set the maxLength 
  // Default 2048, but if TRUE then set big, otherwise set to specified depth)
  var maxLength = (deep == null ? 2048 : (deep === true ? 32727 : deep));

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
  if (obj == null) {
    obj = name;
    name = "object";
  }

  // Output using the eyes library
  return eyes.inspect(obj, name, config);

}}); // out()

/*******************************************************************************
* _.outStr() - Return a string representation of an object
********************************************************************************
* This does the same thing as _.out(), except instead of sending the output to
* the standard output, the output is returned as a string.
* 
* Input:
*   name - Object name (or object if obj isn't supplied)
*   obj - Object to print
*   deep - Print deep?  Default: 2k output. TRUE prints up to 32k, or specify 
*          a size for the output.
*   eyesConfig - An optional eyes configuration object
*   
* Output: String
*/
_.mixin({outStr : function(name, obj, deep, eyesConfig) {

  // Pass onto out(), with a null stream.  This returns the string.
  var config = _.extendDeep({},eyesConfig ? eyesConfig : {},{stream:null});
  return _.out(name, obj, deep, config);

}}); // outStr()
