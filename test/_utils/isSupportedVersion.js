var semver = require('semver');

module.exports = function (version) {
    return !semver.lt(process.versions.node, version);
}