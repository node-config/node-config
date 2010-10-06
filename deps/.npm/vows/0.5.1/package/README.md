Vows
====

> Asynchronous BDD & continuous integration for node.js

#### <http://vowsjs.org> #

introduction
------------
There are two reasons why we might want asynchronous testing. The first, and obvious reason is that node.js is asynchronous, and therefore our tests need to be. The second reason is to make test suites which target I/O libraries run much faster.

_Vows_ is an experiment in making this possible, while adding a minimum of overhead.

synopsis
--------

    var vows = require('vows'),
        assert = require('assert');

    vows.describe('Deep Thought').addBatch({
        'An instance of DeepThought': {
            topic: new DeepThought,

            'should know the answer to the ultimate question of life': function (deepThought) {
                assert.equal (deepThought.question('what is the answer to the universe?'), 42);
            }
        }
    });

installation
------------

    $ npm install vows

documentation
-------------

Head over to <http://vowsjs.org>

