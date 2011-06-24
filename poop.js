var watchable = function(watchThis) {

  // Make the object a watchable if it has no prototype
  if (!watchThis.__proto__ || watchThis.__proto__ == watchThis) {
    watchThis.__proto__ = watchable.prototype;
  }

  // Extend an existing prototype
  else {
    watchThis.__proto__.watch = watchable.prototype.watch;
    watchThis.__proto__.unwatch = watchable.prototype.unwatch;
  }

};

watchable.prototype.watch = function(prop, handler) {

  var t = this;

  function makeHiddenProperty(hiddenProp, initialValue) {
    Object.defineProperty(t, hiddenProp, {
	  value: initialValue,
      writable : true,
      enumerable : false,
      configurable : false
    });
  }

  // Remember the handler
  if (!t.__watchers)
    makeHiddenProperty('__watchers', {});
  if (!t.__watchers[prop])
    t.__watchers[prop] = [];
  t.__watchers[prop].push(handler);

  // Store the current value
  if (!t.__data)
    makeHiddenProperty('__data', {});
  t.__data[prop] = t[prop];

  // Convert the property into a real property
  Object.defineProperty(t, prop, {
    get : function(){ return t.__data[prop]; },
    set : function(newValue) { 

	  // Return early if no change
	  if (t.__data[prop] === newValue)
	    return;

	  // Set the new value
	  var oldValue = t.__data[prop];
	  t.__data[prop] = newValue; 

	  // Call all watchers
	  t.__watchers[prop].forEach(function(watcher) {
	    try {
		  watcher(prop, oldValue, newValue);
		} catch (e) {
		  console.error("Exception in watcher for " + prop);
		}
	  });
	},
    enumerable : true,
    configurable : false
  });
};

watchable.prototype.unwatch = function(prop, handler) {
  var t = this;
  var watchers = t.__watchers[prop];
  if (!watchers)
    return;
  for (var i = 0; i < watchers.length; i++) {
    if (watchers[i] == handler)
	  watchers.splice(i--, 1);
  }
};

a = {hello:'world'};
watchable(a);
a.watch('hello', function(prop, oldVal, newVal) {console.log("hello: " + newVal);});
a.hello = "there";
a.hello = "worldly"

var o = {};

Object.defineProperty(o, "__data", {
  value : {a:22,b:49},
  writable : true,
  enumerable : false,
  configurable : false
});

Object.keys(o.__data).forEach(function(key) {
});

/*
Object.defineProperty(o, "a", {
  get : function(){ return this.__data.a; },
  set : function(newValue){ this.__data.a = newValue; },
  enumerable : true,
  configurable : true
});

Object.defineProperty(o, "b", {
  get : function(){ return this.__data.b; },
  set : function(newValue){ this.__data.b = newValue; },
  enumerable : true,
  configurable : false
});
*/

o.b = 2;

console.log(JSON.stringify(a,null,2));
console.log(JSON.stringify(o,null,2));
console.log(JSON.stringify(o.__data,null,2));
