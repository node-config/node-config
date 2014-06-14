Configure your Node.js Applications
===================================

[![NPM](https://nodei.co/npm/config.png?downloads=true&stars=true)](https://nodei.co/npm/config/)
[![Build Status](https://secure.travis-ci.org/lorenwest/node-config.png?branch=master)](https://travis-ci.org/lorenwest/node-config)

Introduction
------------

Node-config organizes configurations for your Node.js app deployments.

It lets you define a default set of application parameters,
and extend them for different deployment environments (development, qa,
staging, production, etc.).

Project Guidelines
------------------

* *Simple* - Get started fast
* *Predictable* - Well tested and stable
* *Powerful* - For multi-node enterprise deployment
* *Flexible* - Supporting multiple configuration file formats
* *Lightweight* - Small file and memory footprint
* *Stable* - Foundation for module developers

Overview
--------



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

[config] - Online documentation<br>
[monitor] - Remote monitoring for Node.js applications

Contributors
------------
<table id="contributors"><tr><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/373538? style="width:32px; margin-right: 10px;"><a href="https://github.com/lorenwest">lorenwest</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/791137? style="width:32px; margin-right: 10px;"><a href="https://github.com/josx">josx</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/133277? style="width:32px; margin-right: 10px;"><a href="https://github.com/enyo">enyo</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/1656140? style="width:32px; margin-right: 10px;"><a href="https://github.com/eheikes">eheikes</a></td></tr><tr><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/842998? style="width:32px; margin-right: 10px;"><a href="https://github.com/nsabovic">nsabovic</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/506460? style="width:32px; margin-right: 10px;"><a href="https://github.com/Osterjour">Osterjour</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/145742? style="width:32px; margin-right: 10px;"><a href="https://github.com/jberrisch">jberrisch</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/1918551? style="width:32px; margin-right: 10px;"><a href="https://github.com/nitzan-shaked">nitzan-shaked</a></td></tr><tr><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/3058150? style="width:32px; margin-right: 10px;"><a href="https://github.com/Alaneor">Alaneor</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/125062? style="width:32px; margin-right: 10px;"><a href="https://github.com/keis">keis</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/157303? style="width:32px; margin-right: 10px;"><a href="https://github.com/cmcculloh">cmcculloh</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/16861? style="width:32px; margin-right: 10px;"><a href="https://github.com/abh">abh</a></td></tr><tr><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/28898? style="width:32px; margin-right: 10px;"><a href="https://github.com/DMajrekar">DMajrekar</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/2533984? style="width:32px; margin-right: 10px;"><a href="https://github.com/jonjonsonjr">jonjonsonjr</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/157474? style="width:32px; margin-right: 10px;"><a href="https://github.com/k-j-kleist">k-j-kleist</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/12112? style="width:32px; margin-right: 10px;"><a href="https://github.com/GUI">GUI</a></td></tr><tr><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/811927? style="width:32px; margin-right: 10px;"><a href="https://github.com/bolgovr">bolgovr</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/672821? style="width:32px; margin-right: 10px;"><a href="https://github.com/Askelkana">Askelkana</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/941125? style="width:32px; margin-right: 10px;"><a href="https://github.com/hisayan">hisayan</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/937179? style="width:32px; margin-right: 10px;"><a href="https://github.com/Esya">Esya</a></td></tr><tr><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/1087986? style="width:32px; margin-right: 10px;"><a href="https://github.com/jscharlach">jscharlach</a></td><td style="border:none;"><img src=https://avatars.githubusercontent.com/u/3645924? style="width:32px; margin-right: 10px;"><a href="https://github.com/mmoczulski">mmoczulski</a></td></tr></table>

License
-------

May be freely distributed under the MIT license

See `LICENSE` file.

Copyright (c) 2010-2014 Loren West
[and other contributors](https://github.com/lorenwest/node-config/graphs/contributors)

  [config]: http://lorenwest.github.com/node-config/latest
  [monitor]: https://github.com/lorenwest/node-monitor

