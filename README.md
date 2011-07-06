node-config
===========

Configuration control for production node deployments

Introduction
------------

Node-config is a configuration system for Node.js application server 
deployments.  It lets you define a default set of application parameters,
and tune them for different runtime environments (development, qa, 
staging, production, etc.).

Parameters defined by node-config can be monitored and tuned at runtime
without bouncing your production servers.

Online documentation is available at <http://lorenwest.github.com/node-config/latest>

Quick Start
-----------

**In your project directory, install and verify using npm:**

    my-project$ npm install config
    my-project$ npm test config

**Edit the default configuration file (.js, .json, or .yaml):**

    my-project$ mkdir config 
    my-project$ vi config/default.yaml

    (example default.yaml file):

    Customer:
      dbHost: localhost
      dbPort: 5984
      dbName: customers

**Edit the production configuration file:**

    my-project$ vi config/production.yaml

    (example production.yaml file):

    Customer:
      dbHost: prod-db-server

**Use the configuration in your code:**

    var CONFIG = require('config').Customer;
    ...
    db.connect(CONFIG.dbHost, CONFIG.dbPort, CONFIG.dbName);

**Start your application server:**

    my-project$ export NODE_ENV=production
    my-project$ node app.js
    
Running in this configuration, CONFIG.dbPort and CONFIG.dbName 
will come from the `default.yaml` file, and CONFIG.dbHost will
come from the `production.yaml` file.


See Also
--------

[node-config] - Online documentation<br>
[node-monitor] - Monitor your running node applications

License
-------
 
Released under the Apache License 2.0
 
See `LICENSE` file.
 
Copyright (c) 2011 Loren West

  [node-config]: http://lorenwest.github.com/node-config/latest
  [node-monitor]: http://lorenwest.github.com/node-monitor/latest
