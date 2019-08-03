console.warn(`WARNING: config/raw is deprecated and will be removed in the next versions.\n` +
  `This method is obsolete and no longer needed, simply remove any usage of it.`);
module.exports.raw = val => val;
