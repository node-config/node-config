node-config
===========

Runtime configuration for node.js deployment

Development order:
x - Addition of tools directory
x - Remove deps.js dependency
o - YUI Documentation setup
o - Underscore cleanup
o - Config directory discovery
o - Metadata object - one for each element
o - Remembering original loaded files & configuration path
o - Config change events (after initial load)
o - Runtime config changes (exposure & persistence)
o - Runtime configuration reporting (including machine name, ram, etc)
o - Middleware component for exposing configuration
o - Documentation hosting via Dropbox


Changes in v0.4.0
-----------------
* Default config directory loading
* Config change events
* Runtime config changes (dynamic & persistent)
* Runtime configuration reporting (including machine name, ram, etc)
* Middleware component for exposing configuration
* YUI Documentation included & exposed as a service
* Static documentation hosted on Dropbox (or github?)
* New directory structure w/tools, doc templates, src, deploy
* No extension of the underscore library



Introduction
------------

node-config lets you apply a consistent pattern to module development
making it easy to work with deployment configuration parameters.

As a module developer, node-config lets you define your parameters,
then gets out of your way.

When running applications following this pattern, node-config lets you
easily discover and set deployment-specific configuration parameters.

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

This gives you a *config* variable for your module, along with default values 
to use during development.

Use the *config* object anywhere in your module:

    // Connect to the database
    var dbConn = db.connect(config.dbHost, config.dbPort);

When running the application, you can specify module configuration overrides
on the command line, or in a configuration file.

For example, the above *dbHost* value of the *Customers* module can be 
overridden on the command line, or in a config file.

    Parameters specified on the command line:
    $ node billing.js -Customers.dbHost smokin-db

    Parameters specified in a configuration file:
    $ node billing.js -config ./smokeTest.js

Any number of command line parameters and/or config files can be specified when
running the application.

Installation & Testing
----------------------

Node-config installs with *npm* and comes with an extensive suite of tests to 
make sure it performs well in your deployment environment.

To install and test node-config:
 
    $ npm install config
    $ npm test config
    
    
How It Works
------------

When developing a module, use the following pattern for defining parameters
and default values:

    // Customers.js - Customer management utilities

    // Configuration parameters and default values
    var config = require('config')('Customers', {
      dbHost: 'localhost',
      dbPort: 5984,
      dbName: 'customers',
      syncFrequency: 60       // Minutes between synchronizations
    });

When the application runs, node-config extends these default values with 
overrides from configuration files, followed by command line overrides,
in the order they're specified on the command line.

Configuration Files
-------------------

Configuration files let you define application deployment configurations in 
one place.

A configuration file is a JavaScript module that exports a single configuration
object containing the modules, parameters, and values you want to override for
your application.

The format of the object is best described by example *smokeTest.js*:

    // Configuration overrides for smoke testing
    module.exports = {
      'mod-sync': {
        remoteHost: 'smokin-sync',
        remotePort: 5984
      },
      Customers: {
        dbHost: 'smokin-db',
        syncFrequency: 1
      }
    };

When running the app, you can specify this config file and additional
parameters at the same time:

    $ node billing.js -config smokeTest.js -Customers.dbPort 5985

This results in a *config* object in the *Customers* module with these values:

    {
      dbHost: 'smokin-db',
      dbPort: 5985,
      dbName: 'customers',
      syncFrequency: 1
    }

Advanced Usage
--------------

**Programmatic configuration**  If you'd rather specify configuration files 
and parameter overrides in your application, just add the command line 
arguments programatically before the module is loaded.

    // Always use port 5994 for the Customers service
    process.argv.push('-Customers.dbPort', 5994);
    require('Customers');

**Configuration discovery**  You can retrieve the current configuration for
any module by omitting the second parameter, or all configurations by 
omitting all parameters to config.

    // Load the Customer module parameters
    var custConfig = require('config')('Customers');

    // Load all application parameters
    var allConfigs = require('config')();

**Complex command line variables**  Variable names and values passed on through 
the command line can be strings, objects, or arrays.

    $ node billing.js -Customers.custTemplate.region North
    $ node billing.js -Customers.mailings[1] WelcomeMailing
    $ node billing.js -Customers.mailingsSent [3,4,6]
    $ node billing.js -Customers.homeOffice '{street:"4778 S. Main"}'
    

See Also
--------

The node-monitor project is a good example of a module that makes use of
the node-config module.  It's also a pretty good way to monitor your running
node.js application.

License
-------
 
Released under the Apache License 2.0
 
See `LICENSE` file.
 
Copyright (c) 2010 Loren West
