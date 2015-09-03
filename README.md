Configure your Node.js Applications
===================================

[![NPM](https://nodei.co/npm/config.svg?downloads=true&downloadRank=true)](https://nodei.co/npm/config/)&nbsp;&nbsp;
[![Build Status](https://secure.travis-ci.org/lorenwest/node-config.svg?branch=master)](https://travis-ci.org/lorenwest/node-config)&nbsp;&nbsp;
[release notes](https://github.com/lorenwest/node-config/blob/master/History.md)

Introduction
------------

Node-config organizes hierarchical configurations for your app deployments.

It lets you define a set of default parameters,
and extend them for different deployment environments (development, qa,
staging, production, etc.).

Configurations are stored in [configuration files](https://github.com/lorenwest/node-config/wiki/Configuration-Files) within your application, and can be overridden and extended by [environment variables](https://github.com/lorenwest/node-config/wiki/Environment-Variables),
 [command line parameters](https://github.com/lorenwest/node-config/wiki/Command-Line-Overrides), or [external sources](https://github.com/lorenwest/node-config/wiki/Configuring-from-an-External-Source).

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
      // Customer module configs
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

    if (config.has('optionalFeature.detail')) {
      var detail = config.get('optionalFeature.detail');
      ...
    }

`config.get()` will throw an exception for undefined keys to help catch typos and missing values.
Use `config.has()` to test if a configuration value is defined.

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
<table id="contributors"><tr><td><img src=https://avatars.githubusercontent.com/u/373538?v=3><a href="https://github.com/lorenwest">lorenwest</a></td><td><img src=https://avatars.githubusercontent.com/u/25829?v=3><a href="https://github.com/markstos">markstos</a></td><td><img src=https://avatars.githubusercontent.com/u/66902?v=3><a href="https://github.com/leachiM2k">leachiM2k</a></td><td><img src=https://avatars.githubusercontent.com/u/791137?v=3><a href="https://github.com/josx">josx</a></td><td><img src=https://avatars.githubusercontent.com/u/133277?v=3><a href="https://github.com/enyo">enyo</a></td><td><img src=https://avatars.githubusercontent.com/u/1077378?v=3><a href="https://github.com/arthanzel">arthanzel</a></td></tr><tr><td><img src=https://avatars.githubusercontent.com/u/1656140?v=3><a href="https://github.com/eheikes">eheikes</a></td><td><img src=https://avatars.githubusercontent.com/u/355800?v=3><a href="https://github.com/diversario">diversario</a></td><td><img src=https://avatars.githubusercontent.com/u/138707?v=3><a href="https://github.com/th507">th507</a></td><td><img src=https://avatars.githubusercontent.com/u/506460?v=3><a href="https://github.com/Osterjour">Osterjour</a></td><td><img src=https://avatars.githubusercontent.com/u/85772?v=3><a href="https://github.com/vicary">vicary</a></td><td><img src=https://avatars.githubusercontent.com/u/842998?v=3><a href="https://github.com/nsabovic">nsabovic</a></td></tr><tr><td><img src=https://avatars.githubusercontent.com/u/175627?v=3><a href="https://github.com/axelhzf">axelhzf</a></td><td><img src=https://avatars.githubusercontent.com/u/7782055?v=3><a href="https://github.com/benkroeger">benkroeger</a></td><td><img src=https://avatars.githubusercontent.com/u/1246875?v=3><a href="https://github.com/jaylynch">jaylynch</a></td><td><img src=https://avatars.githubusercontent.com/u/145742?v=3><a href="https://github.com/jberrisch">jberrisch</a></td><td><img src=https://avatars.githubusercontent.com/u/1918551?v=3><a href="https://github.com/nitzan-shaked">nitzan-shaked</a></td><td><img src=https://avatars.githubusercontent.com/u/3058150?v=3><a href="https://github.com/Alaneor">Alaneor</a></td></tr><tr><td><img src=https://avatars.githubusercontent.com/u/498929?v=3><a href="https://github.com/roncli">roncli</a></td><td><img src=https://avatars.githubusercontent.com/u/1355559?v=3><a href="https://github.com/superoven">superoven</a></td><td><img src=https://avatars.githubusercontent.com/u/4425455?v=3><a href="https://github.com/ncuillery">ncuillery</a></td><td><img src=https://avatars.githubusercontent.com/u/157303?v=3><a href="https://github.com/cmcculloh">cmcculloh</a></td><td><img src=https://avatars.githubusercontent.com/u/959858?v=3><a href="https://github.com/laktak">laktak</a></td><td><img src=https://avatars.githubusercontent.com/u/57770?v=3><a href="https://github.com/bertrandom">bertrandom</a></td></tr><tr><td><img src=https://avatars.githubusercontent.com/u/125062?v=3><a href="https://github.com/keis">keis</a></td><td><img src=https://avatars.githubusercontent.com/u/28898?v=3><a href="https://github.com/DMajrekar">DMajrekar</a></td><td><img src=https://avatars.githubusercontent.com/u/5358976?v=3><a href="https://github.com/dsimidzija">dsimidzija</a></td><td><img src=https://avatars.githubusercontent.com/u/535667?v=3><a href="https://github.com/jasonhansel">jasonhansel</a></td><td><img src=https://avatars.githubusercontent.com/u/171934?v=3><a href="https://github.com/jthomerson">jthomerson</a></td><td><img src=https://avatars.githubusercontent.com/u/280710?v=3><a href="https://github.com/johndkane">johndkane</a></td></tr></table>

License
-------

May be freely distributed under the [MIT license](https://raw.githubusercontent.com/lorenwest/node-config/master/LICENSE).

Copyright (c) 2010-2015 Loren West 
[and other contributors](https://github.com/lorenwest/node-config/graphs/contributors)

