Configure your Node.js Applications
===================================

[![NPM](https://nodei.co/npm/config.svg?downloads=true&stars=true)](https://nodei.co/npm/config/)&nbsp;&nbsp;
[![Build Status](https://secure.travis-ci.org/lorenwest/node-config.svg?branch=master)](https://travis-ci.org/lorenwest/node-config)&nbsp;&nbsp;
[release notes](https://github.com/lorenwest/node-config/blob/master/History.md)

Introduction
------------

Node-config organizes configurations for your app deployments.

It lets you define a set of default parameters,
and extend them for different deployment environments (development, qa,
staging, production, etc.).

This gives your application a consistent configuration interface shared among a
[growing list of npm modules](https://www.npmjs.org/browse/depended/config) also using node-config.

Project Guidelines
------------------

* *Simple* - Get started fast
* *Powerful* - For multi-node enterprise deployment
* *Flexible* - Supporting multiple config file formats
* *Lightweight* - Small file and memory footprint
* *Predictable* - Well tested foundation for module and app developers

Quick Start
---------------
The following examples are in JSON format, but configurations can be in other [file formats](https://github.com/lorenwest/node-config/wiki/Configuration-Files#file-formats).

**Install in your app directory, and edit the default config file.**

    $ npm install config
    $ mkdir config
    $ vi config/default.json

    {
      // Customter module configs
      "Customer": {
        "dbConfig": {
          "host": "localhost",
          "port": 5984,
          "dbName": "customers"
        },
        "credit": {
          "initialLimit": 100,
          // Set low for development
          "initialDays": 1
        }
      }
    }

**Edit config overrides for production deployment:**

    $ vi config/production.json

    {
      "Customer": {
        "dbConfig": {
          "host": "prod-db-server"
        },
        "credit": {
          "initialDays": 30
        }
      }
    }

**Use configs in your code:**

    var config = require('config');
    ...
    var dbConfig = config.get('Customer.dbConfig');
    db.connect(dbConfig, ...);

**Start your app server:**

    $ export NODE_ENV=production
    $ node my-app.js

Running in this configuration, the `port` and `dbName` elements of `dbConfig`
will come from the `default.json` file, and the `host` element will
come from the `production.json` override file.

Articles
--------

* [Configuration Files](https://github.com/lorenwest/node-config/wiki/Configuration-Files)
* [Common Usage](https://github.com/lorenwest/node-config/wiki/Common-Usage)
* [Environment Variables](https://github.com/lorenwest/node-config/wiki/Environment-Variables)
* [Reserved Words](https://github.com/lorenwest/node-config/wiki/Reserved-Words)
* [Command Line Overrides](https://github.com/lorenwest/node-config/wiki/Command-Line-Overrides)
* [Multiple Node Instances](https://github.com/lorenwest/node-config/wiki/Multiple-Node-Instances)
* [Sub-Module Configuration](https://github.com/lorenwest/node-config/wiki/Sub-Module-Configuration)
* [Configuring from a DB / External Source](https://github.com/lorenwest/node-config/wiki/Configuring-from-an-External-Source)
* [External Configuration Management Tools](https://github.com/lorenwest/node-config/wiki/External-Configuration-Management-Tools)
* [Examining Configuration Sources](https://github.com/lorenwest/node-config/wiki/Examining-Configuration-Sources)
* [Using Config Utilities](https://github.com/lorenwest/node-config/wiki/Using-Config-Utilities)
* [Upgrading from Config 0.x](https://github.com/lorenwest/node-config/wiki/Upgrading-From-Config-0.x)

Contributors
------------
function (data) {
      return render.call(this, data, _);
    }

License
-------

May be freely distributed under the [MIT license](https://raw.githubusercontent.com/lorenwest/node-config/master/LICENSE).

Copyright (c) 2010-2014 Loren West
[and other contributors](https://github.com/lorenwest/node-config/graphs/contributors)

