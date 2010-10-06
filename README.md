node-config
===========

Runtime configuration for node.js modules

Introduction
------------

node-config lets you apply a consistent pattern to module development
making it easy to work with configuration parameters.

As a module developer, node-config lets you define your parameters,
then gets out of your way.

As a module consumer, this pattern gives you a place to look for 
available module parameters and their default values.  It then gives you 
a consistent place to override module parameters for different deployment
configurations.

Synopsis
--------

Configurations are defined at the top of your module. The following example
is for a *Customers* module:

    // Configuration parameters and default values
    var config = require('config')('Customers', {
      dbHost: 'localhost',
      dbPort: 5984,
      dbName: 'customers',
      syncFrequency: 60       // Minutes between synchronizations
    });

That gives you a *config* variable for your module, and default values to
use during development.

Use the *config* values anywhere in your module:

    // Connect to the database
    var dbConn = db.connect(config.dbHost, config.dbPort);

When running an application that uses this module, node-config looks into the
application's *./config* directory for a file containing configurations for
this runtime instance.

For example, if your application were started with `-config smokeTest` 
arguments, and a file named *./config/smokeTest.js* contains the following:

    // smokeTest.js - Configurations for smoke testing
    module.exports = {
      ...
      Customers: {
        dbHost: 'smokin-db',
        syncFrequency: 1
      },
      ...
    };

Then the Customer module's *config* object would contain:

    {
      dbHost: 'smokin-db',
      dbPort: 5984,
      dbName: 'customers',
      syncFrequency: 1
    }

From a deployment perspective, this allows you to maintain configurations
for all modules in one place, grouped by deployment type.

Installation
------------

The easiest way (requires npm):
 
    $ npm install config
    
Almost as easy:

    $ cd /my/extension/dir
    $ git clone http://github.com/openforbiz/node-config.git


For Module Developers
---------------------

The node-config module is exposed as a function for ease of use.  The two
parameters to the function are your module name, and an object containing
the default parameters.  

Be liberal with your documentation in this code block, as this is the place 
others will go to find the parameters they can override.

Example:

    // Configuration parameters and default values
    var config = require('config')('Customers', {
      dbHost: 'localhost',
      dbPort: 5984,
      dbName: 'customers',
      syncFrequency: 60       // Minutes between synchronizations
    });

When placed at (or near) the top of your module, the config variable has
module scope and can be used anywhere in your module code below it.

Usually default values are specified for development - to make it easy to test
your module during development without having to include a *-config* 
argument to your test program.

For Module Developers
---------------------
       

License
-------
 
Released under the Apache License 2.0
 
See `LICENSE` file.
 
Copyright (c) 2010 Loren West
