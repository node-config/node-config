3.3.6 / 2021-03-08
==================

* Added publishConfig element to package.json to prevent publishing to the wrong repository - @lorenwest

3.3.5 / 2021-03-05
==================

* FIX [#628](https://github.com/lorenwest/node-config/issues/628) Uncaught ReferenceError: node_env_var_name is not defined @prnake

3.3.4 / 2021-02-26
==================

* FIX #517 0 loadFileConfigs incorrectly adds to getConfigSources @NguyenMatthieu

3.3.3 / 2020-11-26
==================

* FIX #460 - Strict mode warning refer to appropriate env variable @iCodeOkay
* Use Buffer.alloc and Buffer.from instead of contrsuctor @Fcmam5
* Add support for experimental .cjs modules @lenkan


3.3.2 / 2020-09-24
==================

* Fixed issue with Buffers in config throwing error in util.makeImmutable (#608) - Michal Wadas
* Added boolean and numeric types to custom environment variables - Ankur Narkhede @ankurnarkhede

3.3.1 / 2020-03-25
==================

  * Fix security vulnerability in json5 dependency - @twkel

3.3.0 / 2020-02-26
==================

  * Allow all defined values in `substituteDeep` - @fostyfost

3.2.6 / 2020-02-21
==================

  * Updated copyright date ranges

3.2.5 / 2020-01-16
==================

  * Fixed issue with getCustomEnvVars and multiple config dirs #585 - @dekelev

3.2.4 / 2019-10-25
==================

  * Improved error handling of env variables value parse - @leonardovillela

3.2.3 / 2019-10-03
==================

  * Fixed strict mode warning #460 - @fedulovivan

3.2.2 / 2019-07-20
==================

  * Fixed delimiter bug in configDirs to match O/S delimiter - @iMoses

3.2.1 / 2019-07-18
==================

  * Fixed TypeError: obj.toString is not a function - @leosuncin

3.2.0 / 2019-07-11
==================

  * Asynchronous configs - @iMoses
  * Multiple config directories - @iMoses
  * Improved parser support - @iMoses

3.1.0 / 2019-04-07
==================

  * Support of module.exports syntax for TS config files @keenondrums

3.0.1 / 2018-12-16
==================

  * Fixed bug where dot notation extended own key @exogen

3.0.0 / 2018-11-20
==================

   * Ensure config array items and objects are sealed @fgheorghe
     - This required a major version bump in case someone
     - relied on the ability to mutate non-sealed data.


2.0.2 / 2018-08-28
==================

   * Added dot notation to setModuleDefaults - bertho-zero
   * Updated copyright year - JemiloII

2.0.1 / 2018-07-26
==================

  * Removed deprecated code - jpwilliams

2.0.0 / 2018-07-26
==================

Potential for backward incompatibility requiring a major version bump.

Safe to upgrade to major version 2 if you're using a recent NodeJS version
and you're not trying to mutate config arrays.

  * Added array immutability - jacobemerick
  * Removed Node V.4 support

1.31.0 / 2018-05-22
===================

  * Load new coffeescript module instead of coffee-script - bastbijl

1.30.0 / 2018-02-26
===================

  * Support for nested raw() in javascript configurations - patrickpilch

1.29.4 / 2018-02-03
===================

  * Re-publish - last changes didn't make it to npm

1.29.3 / 2018-02-03
===================

  * Added soft dependencies so transpilers don't include everything - gewentao

1.29.2 / 2018-01-12
===================

  * Patch, and added a test to ts-node - electroma

1.29.1 / 2018-01-07
===================

  * Prevent re-registration of ts-node - electroma
  * Fixed bug in contributor table tool - lorenwest

1.29.0 / 2017-12-26
===================

  * Update docs for JavaScript-formatted config files and link them from the README - markstos
  * Fixed 'hostname' value selection when there is no environment variable for that - wmangelardo


1.28.1 / 2017-11-09
===================

  * add nodejs9 to travisci - jfelege

1.28.0 / 2017-11-07
===================

  * allow overrides of `NODE_ENV` with `NODE_CONFIG_ENV` - jfelege

1.27.0 / 2017-10-17
===================

  * Add method to output plain JS object - willsoto
  * Updated Node versions in Travis CI - lorenwest

1.26.2 / 2017-08-11
===================

  * Update supported nodejs platforms - jfelege

1.26.1 / 2017-05-03
===================

  * Fix: failed while merging from RegExp @XadillaX
  * Chore: reduce package size. @evilebottnawi

1.26.0 / 2017-03-30
===================

  * Added tests for extendDeep @IvanVergiliev
  * Added TypeScript support @cypherq
  * Update config.js with correctly cased type def @ScionOfBytes

1.25.1 / 2017-02-01
===================

  * Fixed undefined CONFIG_SKIP_GITCRYPT variable @lorenwest

1.25.0 / 2017-01-31
===================

  * Add support for configuration files stored with git-crypt @cunneen

1.24.0 / 2016-11-02
===================

  * Prevent accidental publish to private repository

1.23.0 / 2016-11-02
===================

  * Re-publishing because npmjs didn't see 1.22

1.22.0 / 2016-10-25
===================

  * original/previous value for deferredConfig @simon-scherzinger
  * util.loadFileConfigs: support optional source dir @wmertens
  * Adding raw wrapper to prevent object modification in config @patrickpilch

1.21.0 / 2016-06-01
===================

  * Added XML configuration @tusharmath

1.20.4 / 2016-05-23
===================

  * Fixed a regression with extending prototype methods @tahoemph

1.20.3 / 2016-05-18
===================

  * Fixed a regression with 1.20.2 @kgoerlitz
  * Added test to prevent this in the future @kgoerlitz

1.20.2 / 2016-05-17
===================

  * node v6 compatiblity: remove deprecated __lookupGetter__ use - @thetalecrafter
  * node v6 compatiblity: handle different SyntaxError format - @pwwolf

1.20.1 / 2016-04-08
===================

  * Simplify truthiness check - @markstos
  * Remove errant console.log - @markstos

1.20.0 / 2016-04-06
===================

  * Typo fix @jchip
  * Handle null sub-object @wmertens
  * Bug fix for NODE_CONFIG_STRICT_MODE check @markstos
  * Ran node security check on 4/6/2016 with the following output

    $ nsp check
    (+) No known vulnerabilities found

1.19.0 / 2016-01-08
===================

  * Resolve defered values in predictable order for consistent results. 
    Fixes #265 @elliotttf @markstos

1.18.0 / 2015-11-17
===================

  * More robust handling of JSON @elliotttf

1.17.1 / 2015-11-17
===================

  * Patch release for regex bugfix
 
1.17.0 / 2015-11-17
===================

  * Update warning about missing configuration files to mention how to disable the warning #245 @markstos 
  * Upgrade to run CI with travis containers @lorenwest
  * Fixed bug with comments and inline json @elliotttf

1.16.0 / 2015-09-03
===================

  * Change == to === to tighten equality tests #242 @wgpsutherland
  * Fix attachProtoDeep for setModuleDefaults #243 @benkroeger

1.15.0 / 2015-07-30
===================

  * Added full hostname in addition to first segment @vicary

1.14.0 / 2015-06-02
===================

  * Added JSON parsing to custom environment variables @leachiM2k
  * Handle unicode BOM characters @johndkane

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
