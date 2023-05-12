/**
 * Checks for the presence of environment variables and returns the list of missing ones.
 *
 * @param {object} _Config Config object.
 * @param {object|string} _elt A value representing a subset of the configuration structure,
 * or a string representing an environment variable name.
 * @param {string} _path The property configuration path to check (ex: "service.name")
 * @param {string[]} _missingEnvVariables List of missing environment variables.
 * @returns {string[]} List of missing environment variables.
 *@private
 */
function recurseCheck(_Config, _elt, _path, _missingEnvVariables) {
    if (typeof _elt === "object") {
        for (const propName in _elt) {
            // The "__name" property represents an environment variable, the value is checked
            if (propName === "__name") {
                recurseCheck(_Config, _elt[propName], _path, _missingEnvVariables);
            // Ignore the "__format" property which should not have an environment variable name as value
            } else if (propName !== "__format") {
                const propPath = _path === "" ? propName : `${_path}.${propName}`;
                recurseCheck(_Config, _elt[propName], propPath, _missingEnvVariables);
            }
        }
    } else if (
        typeof _elt === "string" &&
        // If no value defined in configuration (no fallback found)
        !_Config.has(_path) &&
        // If no value defined in an environment variable
        // eslint-disable-next-line node/no-process-env
        !(_elt in process.env)
    ) {
        _missingEnvVariables.push(_elt);
    }
    return _missingEnvVariables;
}

/**
 * Checks for the presence of environment variables.
 *
 * For each environment variables,
 *
 * 1. Check if it exists and use its value
 * 2. Otherwise, fallback to default configuration for the value
 * 3. Not exists, and no fallback, then add environment variable to missing environment variables array
 *
 * If at least one environment variable is missing, then raise an error with missing environment variables list.
 *
 * @param {object} _Config Config object.
 * @param {string} _path Config dir path.
 * @returns {void} Nothing.
 * @throws {Error} Raises an error if at least one environment variable is missing.
 */
function checkEnvVariables(_Config, _path) {
    console.info("INFO: Run checkEnvVariables...");

    const customConfig = require(`${_path}/custom-environment-variables.js`);
    // console.debug(`config: ${JSON.stringify(customConfig)}`);
    const missingEnvVariables = recurseCheck(_Config, customConfig, "", []);
    // Raises an error if at least one environment variable is missing
    if (missingEnvVariables.length > 0) {
        throw new Error(`Missing environment variable(s): ${missingEnvVariables.join(", ")}`);
    }
}

module.exports = checkEnvVariables;
