var config = require('../../lib/config');

// Set the module defaults
config.util.setModuleDefaults('Stooge', {
  bald: false,
  happy: true,
  smart: false,
  canPlayViolin: false
});

/**
 * Create a stooge as you see fit
 * 
 * @param options {object}
 */
function Stooge(options) {
  // Get a unique module config based on your defaults with optional override
  this.moduleConfig = config.util.getModuleConfig('Stooge', options);
}

/**
 * Whether the Stooge is smart or not
 * 
 * @returns {boolean}
 */
Stooge.prototype.isSmart = function() {
  return this.moduleConfig.get('smart');
}

/**
 * Whether the Stooge is happy or not
 * 
 * @returns {boolean}
 */
Stooge.prototype.isHappy = function() {
  return this.moduleConfig.get('happy');
}

/**
 * Whether the Stooge is bald or not
 * 
 * @returns {boolean}
 */
Stooge.prototype.isBald = function() {
  return this.moduleConfig.get('bald');
}

/**
 * Plays the violin
 * 
 * @throws Will throw an error if the Stooge can't play
 * @returns {boolean} Whether the violin was played or not
 */
Stooge.prototype.playViolin = function() {
  if (!this.moduleConfig.get('canPlayViolin')) {
    throw new Error("I'm a victim of soikemstance!")
  }
  return true;
}

module.exports = Stooge;