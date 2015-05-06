1.13.0 / 2015-05-05
===================

  * Updated CSON library @dsimidzija

1.12.0 / 2015-02-19
===================

  * Better date merging @axelhzf

1.11.0 / 2015-01-14
===================

  * Added Hjson support @laktak

1.10.0 / 2015-01-06
===================

  * Added TOML support (@jasonhansel)
  * Another year - changed copyright messages for 2015
  * Updated contributors list
  * New Strict Mode added in 1.9.0 is now documented. (@markstos)
  * has() now returns false when given an undefined or null key to look up. Previously it threw an exception. (@markstos)
  * When get() is given an undefined or null key to look up, it now throws a more helpful diagnostic (@robludwig, @markstos)

1.9.0 / 2014-12-08
==================

  * New strictness checks have been added to ensure the expected configuration has been loaded. Warnings are now thrown in these cases. If NODE_CONFIG_STRICT_MODE is set, exceptions are thrown instead. (@markstos)
    * There must be an explicit config file matching `NODE_ENV` if `NODE_ENV` is set.
    * There must be an explicit config file matching `NODE_APP_INSTANCE` if `NODE_APP_INSTANCE` is set
    * `NODE_ENV` must not match 'default' or 'local' to avoid ambiguity.

  * Added .iced extension support (@arthanzel)

  * Highlight `config.has()` in the README. Use it to check to if a value exists, since `config.get()`
    throws exceptions on undefined values. (@markstos)

  * API Change: getConfigSources() now starts to return data on config files that are valid-but-empty. (@markstos)

1.8.1 / 2014-11-14
==================

  * Simplify syntax for defer() functions. The 'this' value in the functions is now bound
    to the main configuration object, so it doesn't have to be passed into the function. (@markstos)
  * new defer sub-module introduced in 1.8.0 can now be accessed by require('config/defer')
    For usage, see: https://github.com/lorenwest/node-config/wiki/Configuration-Files#javascript-module---js
  * Add test coverage for array merging cases. (@markstos)
  * Bump dependency on cson package to 1.6.1 (@markstos)

1.8.0 / 2014-11-13
==================

  * Added deferred function for evaluating configs after load (@markstos)
    For details, see: https://github.com/lorenwest/node-config/wiki/Configuration-Files#javascript-module---js
  * Bumped js-yaml dependency (@markstos)

1.7.0 / 2014-10-30
==================

  * Added variable substitution in .properties files (@ncuillery)

1.6.0 / 2014-10-22
==================

  * Added support for property accessors in configs (@jaylynch)

1.5.0 / 2014-10-20
==================

  * Added support for .json5 config files (@bertrandom) 

1.4.0 / 2014-10-16
==================

  * Added support for .properties config files (@superoven)

1.3.0 / 2014-10-15
==================

  * Added support for CSON configuration files (@superoven)

1.2.4 / 2014-10-10
==================

  * Repaired the 1.2.3 fix to work both before and after the first get()

1.2.3 / 2014-10-03
==================

  * Changed test suite to verify a bug in util.setModuleDefaults()
  * Fixed util.setModuleDefaults() to work after a get() (and pass the new test)

1.2.2 / 2014-10-03
==================

  * Added support for regexp and date configurations (@diversario)

1.2.1 / 2014-09-23
==================

  * Wrote test to prove setModuleDefaults() was broken in 1.2.0
  * Fixed setModuleDefaults() to not rely on immutable configs

1.2.0 / 2014-09-15
==================

  * Feature release
  * Delaying immutability until after first get() - for external configs
  * Allowing immutability override with $ALLOW_CONFIG_MUTATIONS=Y


1.1.1 / 2014-09-03
==================

  * @th507 - Update support for Coffee-script >=1.7.0

1.1.0 / 2014-09-03
==================

  * Feature release
  * @bradboro - Custom environment variables
  * @supersheep - Catch error when requiring visionmedia yaml module

1.0.2 / 2014-07-30
===================

  * @bradobro - Fixed a variable from leaking into global
  * @tilfin - Removed un-necessary YAML comment filtering for js-yaml

1.0.1 / 2014-07-25
===================

  * Removed test directory from npm install

1.0.0 / 2014-07-23
===================

  * Major revision.  Upgrade notes:
    https://github.com/lorenwest/node-config/wiki/Upgrading-From-Config-0.x
  * Update to semver versioning
  * Change load ordering
      from hostname.EXT --> deployment.EXT
      to deployment.EXT --> hostname.EXT
  * Allow makeImmutable to accept an array of attributes
  * Allow makeImmutable to accept no attrs, making all attributes immutable
  * Allow recursion in makeImmutable, if an attribute is an object
  * Change node-config behavior to make all configurations immutable
  * Removed getOriginalConfig as no longer necessary post-immutable
  * Removed runtime.json file writing and monitoring
  * Removed previously deprecated $CONFIG_* environment configurations
  * Deprecated the attribute watch functionality
  * Added error output if no configurations found
  * Exposed config loading for alternate configurations
  * Added config.get() and config.has() methods & tests
  * Removed reliance on global.NODE_CONFIG so older versions can work with 1.x
  * Fix empty YAML file causing crash with latest js-yaml
  * Added SUPPRESS_NO_CONFIG_WARNING for better sub-module support
  * Moved all documentation [to the wiki](https://github.com/lorenwest/node-config/wiki).

0.4.37 / 2014-07-22
===================

  * Fix empty YAML file causing crash with latest js-yaml

0.4.36 / 2014-05-27
===================

  * Not writing runtime.json if not used

0.4.35 / 2014-01-16
===================

  * NODE_CONFIG_DIR can now contain a relative path for .js and .coffee configurations

0.4.34 / 2014-01-06
===================

  * Updated copyright year

0.4.33 / 2013-10-25
===================

  * Assure writes to runtime.json are atomic

0.4.32 / 2013-10-24
===================

  * Don't freak out if running without a config directory
  * Don't be so chatty if runtime.json doesn't exist

0.4.31 / 2013-10-18
===================

  * Changed getConfigSources to copy array vs. object

0.4.30 / 2013-09-12
===================

  * More consistent array extension
  * No longer requiring a config directory
  * Not erroneously writing runtime.json
  * Exposing the original configuration sources
  * Added --NODE_CONFIG={json} command line overrides
  * Added $NODE_CONFIG={json} environment variable overrides
  * Consistent handling of environment variables and command line parameters
  * Reached 100 regression tests

0.4.29 / 2013-08-07
===================

  * Added flag for disabling the write of runtime.json

0.4.28 / 2013-07-31
===================

  * Eliminated a totally annoying install warning in newer versions of NPM

0.4.27 / 2013-06-18
===================

  * Fixed a bug preventing double underscores in config environment variables

0.4.26 / 2013-06-10
===================

  * Re-watch file on rename (allows editing runtime.json with vi)
  * Allow runtime.json file watch disable via NODE_CONFIG_DISABLE_FILE_WATCH=Y
  * Change no yaml parser error message to suggest using js-yaml
  * Changed default clone depth from 6 to 20 to allow for deeper configurations

0.4.25 / 2013-05-24
===================

  * Dont fail if config directory doesnt exist

0.4.24 / 2013-04-13
===================

  * Added resetRuntime() to reset the runtime.json file
  * Updated docs to reflect the new public method

0.4.23 / 2013-04-13
===================

  * Multiple application instance support via $NODE_APP_INSTANCE
  * Multi-app testing & documentation

0.4.22 / 2013-03-29
===================

  * Added configuration $CONFIG_* environment variables
  * Added $CONFIG_* documentation and tests
  * Added NodeJS 0.10 integration test

0.4.21 / 2013-03-06
===================

  * Triggering file.watch when an editor saves a file - rename vs. change
  * Installed Travis-CI continuous integration testing framework

0.4.20 / 2013-02-21
===================

  * Merged _diffDeep fix

0.4.19 / 2013-02-21
===================

  * Added discovery of .yml in addition to .yaml for YAML configs (w/doc)
  * Added testing of .yml file discovery
  * Removed licensing inconsistencies

0.4.18 / 2012-10-30
===================

  * Moved coffee-script and js-yaml from optionalDependencies back to
    devDependencies to trim the install size for those not needing
    these packages.
  * Promoted $HOSTNAME and $HOST above OS.hostname()

0.4.17 / 2012-09-26
===================

  * Allow the location of runtime.json to be picked up from the environment
  * Added documentation for the NODE_CONFIG_RUNTIME_JSON environment variable
  * package.json cleanup - created optionalDependencies and devDependencies

0.4.16 / 2012-08-09
===================

  * Allowing a zero interval in watchForConfigFileChanges() to disable file watching.
  * Fixed a comparator bug in _equalsDeep()
  * Added a test to confirm deep extending array functionality

0.4.15 / 2012-06-04
===================

  * Placed YAML and Coffee-Script libraries back into the download.  Still lazy loading into memory.

0.4.14 / 2012-06-01
===================

  * Added the local.EXT and local-deployment.EXT configs.
  * Removed unnecessary debug output
  * Added retry logic on file parse to reduce read/write collisions
  * Added support for a better YAML parser
  * Fixed problems with null configuration values

0.4.13 / 2012-04-25
===================

  * Assuring the runtime.json file exists.  Undocumented fs.watch() requirement.

0.4.12 / 2012-04-25
===================

  * Removed all external dependencies
  * Lazy loading of yaml and coffee-script only if these file types are used
  * Added new style file watching if available (retaining pre 6.0 compatibility)
  * Windows compatibility - file watching changes were required

0.4.11 / 2012-02-15
===================

  * Automatically watching runtime.json for changes
  * Fixed a date comparison bug during file watching
  * Changed require('sys') to require('util')

0.4.10 / 2012-01-18
===================

  * Made sure the CONFIG object is a shared singleton
  * Added NODE_CONFIG_DIR environment variable to point to a different directory
  * Added tests and documentation for the above

0.4.9 / 2012-01-06
==================

  * Added coffee-script file type support with extension .coffee
  * Added an example coffee-script configuration file
  * Added coffee-script module dependency
  * Added a test for coffee-script configuration files
  * Documented coffee-script support, regenerated documentation

0.4.8 / 2011-12-20
==================

  * Fixed a bug where changes to module default configs weren't persisted
  * Added a test to validate the bugfix

0.4.7 / 2011-12-16
==================

  * Created the makeHidden method to hide a property of an object
  * Added a value argument to makeImmutable for creating new properties
  * Fixed setModuleDefaults to hide injected prototype methods
  * Added documentation and unit tests

0.4.6 / 2011-11-29
==================

  * Updated vows from 0.5.8 to 0.5.13

0.4.5 / 2011-11-16
==================

  * Updated YAML dependency from "0.1.x" to ">=0.2.2"
  * Added stripping of comment-only and whitespace-only lines in YAML files for backward compatibility
  * Added more tests for YAML edge cases
  * Added a homepage link in package.json to the online documentation
  * Added History.md

0.4.4 / 2011-11-08
==================

  * Removed deprecated modules from package.json

0.4.3 / 2011-08-02
==================

  * Made watchForConfigFileChanges public

0.4.2 / 2011-07-11
==================

  * Added comment stripping from JSON configuration files

0.4.1 / 2011-07-07
==================

  * Added more tests
  * Return the module config in setModuleDefaults

0.4.0 / 2011-07-06
==================

  * Update to version 0.4.0

    * Online documentation
    * Runtime configuration changes
    * Configuration value watching
    * Multi-instance node deployments
    * Better module developer support
