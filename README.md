Configure your Node.js Applications
===================================

[![NPM](https://nodei.co/npm/config.svg?downloads=true&downloadRank=true)](https://nodei.co/npm/config/)&nbsp;&nbsp;
[![Build Status](https://secure.travis-ci.org/node-config/node-config.svg?branch=master)](https://travis-ci.org/lorenwest/node-config)&nbsp;&nbsp;
[release notes](https://github.com/node-config/node-config/blob/master/History.md)

Introduction
------------

Node-config organizes hierarchical configurations for your app deployments.

It lets you define a set of default parameters,
and extend them for different deployment environments (development, qa,
staging, production, etc.).

Configurations are stored in [configuration files](https://github.com/node-config/node-config/wiki/Configuration-Files) within your application, and can be overridden and extended by [environment variables](https://github.com/lorenwest/node-config/wiki/Environment-Variables),
 [command line parameters](https://github.com/node-config/node-config/wiki/Command-Line-Overrides), or [external sources](https://github.com/lorenwest/node-config/wiki/Configuring-from-an-External-Source).

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
The following examples are in JSON format, but configurations can be in other [file formats](https://github.com/node-config/node-config/wiki/Configuration-Files#file-formats).

**Install in your app directory, and edit the default config file.**

```shell
$ npm install config
$ mkdir config
$ vi config/default.json
```
```js
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
```

**Edit config overrides for production deployment:**

```shell
 $ vi config/production.json
```

```json
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
```

**Use configs in your code:**

```js
const config = require('config');
//...
const dbConfig = config.get('Customer.dbConfig');
db.connect(dbConfig, ...);

if (config.has('optionalFeature.detail')) {
  const detail = config.get('optionalFeature.detail');
  //...
}
```

`config.get()` will throw an exception for undefined keys to help catch typos and missing values.
Use `config.has()` to test if a configuration value is defined.

**Start your app server:**

```shell
$ export NODE_ENV=production
$ node my-app.js
```

Running in this configuration, the `port` and `dbName` elements of `dbConfig`
will come from the `default.json` file, and the `host` element will
come from the `production.json` override file.

Articles
--------

* [Configuration Files](https://github.com/node-config/node-config/wiki/Configuration-Files)
  * [Special features for JavaScript configuration files](https://github.com/node-config/node-config/wiki/Special-features-for-JavaScript-configuration-files)
* [Common Usage](https://github.com/node-config/node-config/wiki/Common-Usage)
* [Environment Variables](https://github.com/node-config/node-config/wiki/Environment-Variables)
* [Reserved Words](https://github.com/node-config/node-config/wiki/Reserved-Words)
* [Command Line Overrides](https://github.com/node-config/node-config/wiki/Command-Line-Overrides)
* [Multiple Node Instances](https://github.com/node-config/node-config/wiki/Multiple-Node-Instances)
* [Sub-Module Configuration](https://github.com/node-config/node-config/wiki/Sub-Module-Configuration)
* [Configuring from a DB / External Source](https://github.com/node-config/node-config/wiki/Configuring-from-an-External-Source)
* [Securing Production Config Files](https://github.com/node-config/node-config/wiki/Securing-Production-Config-Files)
* [External Configuration Management Tools](https://github.com/node-config/node-config/wiki/External-Configuration-Management-Tools)
* [Examining Configuration Sources](https://github.com/node-config/node-config/wiki/Examining-Configuration-Sources)
* [Using Config Utilities](https://github.com/node-config/node-config/wiki/Using-Config-Utilities)
* [Upgrading from Config 0.x](https://github.com/node-config/node-config/wiki/Upgrading-From-Config-0.x)
* [Webpack usage](https://github.com/node-config/node-config/wiki/Webpack-Usage)

Further Information
---------------------
If you still don't see what you are looking for, here are some more resources to check: 

 * The [wiki may have more pages](https://github.com/node-config/node-config/wiki) which are not directly linked from here.
 * Review [questions tagged with node-config](https://stackexchange.com/filters/207096/node-config) on StackExchange. These are monitored by `node-config` contributors.
 * [Search the issue tracker](https://github.com/node-config/node-config/issues). Hundreds of issues have already been discussed and resolved there.

Contributors
------------
<table id="contributors"><tr><td><img src=https://avatars.githubusercontent.com/u/373538?v=4><a href="https://github.com/lorenwest">lorenwest</a></td>
<td><img src=https://avatars.githubusercontent.com/u/25829?v=4><a href="https://github.com/markstos">markstos</a></td>
<td><img src=https://avatars.githubusercontent.com/u/1083065?v=4><a href="https://github.com/iMoses">iMoses</a></td>
<td><img src=https://avatars.githubusercontent.com/u/447151?v=4><a href="https://github.com/elliotttf">elliotttf</a></td>
<td><img src=https://avatars.githubusercontent.com/u/8839447?v=4><a href="https://github.com/jfelege">jfelege</a></td>
<td><img src=https://avatars.githubusercontent.com/u/66902?v=4><a href="https://github.com/leachiM2k">leachiM2k</a></td>
</tr><tr><td><img src=https://avatars.githubusercontent.com/u/791137?v=4><a href="https://github.com/josx">josx</a></td>
<td><img src=https://avatars.githubusercontent.com/u/133277?v=4><a href="https://github.com/enyo">enyo</a></td>
<td><img src=https://avatars.githubusercontent.com/u/4307697?v=4><a href="https://github.com/leosuncin">leosuncin</a></td>
<td><img src=https://avatars.githubusercontent.com/u/1077378?v=4><a href="https://github.com/arthanzel">arthanzel</a></td>
<td><img src=https://avatars.githubusercontent.com/u/1656140?v=4><a href="https://github.com/eheikes">eheikes</a></td>
<td><img src=https://avatars.githubusercontent.com/u/138707?v=4><a href="https://github.com/th507">th507</a></td>
</tr><tr><td><img src=https://avatars.githubusercontent.com/u/506460?v=4><a href="https://github.com/Osterjour">Osterjour</a></td>
<td><img src=https://avatars.githubusercontent.com/u/1751645?v=4><a href="https://github.com/cunneen">cunneen</a></td>
<td><img src=https://avatars.githubusercontent.com/u/842998?v=4><a href="https://github.com/nsabovic">nsabovic</a></td>
<td><img src=https://avatars.githubusercontent.com/u/5138570?v=4><a href="https://github.com/BadgerBadgerBadgerBadger">BadgerBadgerBadgerBadger</a></td>
<td><img src=https://avatars.githubusercontent.com/u/2529835?v=4><a href="https://github.com/simon-scherzinger">simon-scherzinger</a></td>
<td><img src=https://avatars.githubusercontent.com/u/8650543?v=4><a href="https://github.com/leonardovillela">leonardovillela</a></td>
</tr><tr><td><img src=https://avatars.githubusercontent.com/u/175627?v=4><a href="https://github.com/axelhzf">axelhzf</a></td>
<td><img src=https://avatars.githubusercontent.com/u/7782055?v=4><a href="https://github.com/benkroeger">benkroeger</a></td>
<td><img src=https://avatars.githubusercontent.com/u/1872824?v=4><a href="https://github.com/fgheorghe">fgheorghe</a></td>
<td><img src=https://avatars.githubusercontent.com/u/1443067?v=4><a href="https://github.com/IvanVergiliev">IvanVergiliev</a></td>
<td><img src=https://avatars.githubusercontent.com/u/1736957?v=4><a href="https://github.com/jpwilliams">jpwilliams</a></td>
<td><img src=https://avatars.githubusercontent.com/u/1246875?v=4><a href="https://github.com/jaylynch">jaylynch</a></td>
</tr><tr><td><img src=https://avatars.githubusercontent.com/u/145742?v=4><a href="https://github.com/jberrisch">jberrisch</a></td>
<td><img src=https://avatars.githubusercontent.com/u/9355665?v=4><a href="https://github.com/kgoerlitz">kgoerlitz</a></td>
<td><img src=https://avatars.githubusercontent.com/u/8525267?v=4><a href="https://github.com/bertho-zero">bertho-zero</a></td>
<td><img src=https://avatars.githubusercontent.com/u/6686044?v=4><a href="https://github.com/NguyenMatthieu">NguyenMatthieu</a></td>
<td><img src=https://avatars.githubusercontent.com/u/1918551?v=4><a href="https://github.com/nitzan-shaked">nitzan-shaked</a></td>
<td><img src=https://avatars.githubusercontent.com/u/3058150?v=4><a href="https://github.com/robertrossmann">robertrossmann</a></td>
</tr></table>

License
-------

May be freely distributed under the [MIT license](https://raw.githubusercontent.com/node-config/node-config/master/LICENSE).

Copyright (c) 2010-2022 Loren West 
[and other contributors](https://github.com/node-config/node-config/graphs/contributors)

