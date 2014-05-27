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
