/*
 * instanceof is a more complete check then .constructor ===
 * 
 * It works when using node's built-in util.inherits function
 * and it also honors a class's entire ancestry
 *
 * Here I am only testing the change to vows in suite.js at line 147 to change
 * the check from .constructor === to instanceof.  These tests should demonstrate
 * that this change should work both cases.  For completness I also check
 * the case when EventEmitter is an ancestor, not the parent Class.
 * 
 */
var EventEmitter = process.EventEmitter,
    util = require('util'),
    vows = require('vows'),
    assert = require('assert');
    
vows.describe('EventEmitters as a return value from a topic').addBatch({
    'returning an EventEmitter' : {
        topic : function () {
            //Make an event emitter
            var tmp = new EventEmitter();
            //set it to emit success in a bit
            setTimeout(function () {
                //pass a value to make sure this all works
                tmp.emit('success', 'I work');
            }, 10);
            
            return tmp;
        },
        'will catch what I pass to success' : function (ret) {
            assert.strictEqual(ret, 'I work');
        }
    },
    'returning a class that uses util.inherit to inherit from EventEmitter' : {
        topic : function () {
            //Make a class that will util.inherit from EventEmitter
            var Class = function () {
                    EventEmitter.call(this);
                },
                tmp;
                
            //inherit from EventEmitter
            util.inherits(Class, EventEmitter);
            //Get a new one
            tmp = new Class();
            //set it to emit success in a bit
            setTimeout(function () {
                //pass a value to make sure this all works
                tmp.emit('success', 'I work');
            }, 10);
            
            return tmp;
        },
        'will catch what I pass to success' : function (ret) {
            assert.strictEqual(ret, 'I work');
        }
    },
    'returning a class that uses Class.prototype = new EventEmitter()' : {
        topic : function () {
            //Make a class that will inherit from EventEmitter
            var Class = function () {}, tmp;
            //inherit
            Class.prototype = new EventEmitter();
            //Get a new one
            tmp = new Class();
            //set it to emit success in a bit
            setTimeout(function () {
                //pass a value to make sure this all works
                tmp.emit('success', 'I work');
            }, 10);
            
            return tmp;
        },
        'will catch what I pass to success' : function (ret) {
            assert.strictEqual(ret, 'I work');
        }
    },
    'returning a class that uses util.inherit to inherit from a class that inherits from EventEmitter ' : {
        topic : function () {
            //Class1 inherits from EventEmitter
            var Class1 = function () {
                    var self = this;
                    EventEmitter.call(self);
                },
                //Class2 inherits from Class1
                Class2 = function () {
                    Class1.call(this);
                }, tmp;
            //Inherit
            util.inherits(Class1, EventEmitter);
            util.inherits(Class2, Class1);
            //Get a new one
            tmp = new Class2();
            //set it to emit success in a bit
            setTimeout(function () {
                //pass a value to make sure this all works
                tmp.emit('success', 'I work');
            },10);
            
            return tmp;
        },
        'will catch what I pass to success' : function (ret) {
            assert.strictEqual(ret, 'I work');
        }
    },
    'returning a class that uses Class2.prototype = new Class1() and Class1.prototype = new EventEmitter()' : {
        topic : function () {
            //Class1 will inherit from EventEmitter
            var Class1 = function () {},
                //Class2 will inherit from Class1
                Class2 = function () {}, tmp;
            //Inherit
            Class1.prototype = new EventEmitter();
            Class2.prototype = new Class1();
            //Get a new one
            tmp = new Class2();
            //seit it to emit success in a bit
            setTimeout(function () {
                //pass a value to make sure this all works
                tmp.emit('success', 'I work');
            },10);
            
            return tmp;
        },
        'will catch what I pass to success' : function (ret) {
            assert.strictEqual(ret, 'I work');
        }
    }
}).export(module);



