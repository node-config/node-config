import { describe, it, before } from 'node:test';
import assert from 'assert';
import { requireUncached } from './_utils/requireUncached.mjs';

/**
 * Regression tests for: fix: prevent setEnv from clobbering envConfig when merging NODE_CONFIG.
 *
 * The bug: extendDeep(envConfig, cmdLineConfig, {}) used envConfig as the merge target,
 * mutating it in-place. This test verifies both that:
 *   1. --NODE_CONFIG overrides $NODE_CONFIG for shared keys in the final config.
 *   2. $NODE_CONFIG exclusive keys are preserved in the final config.
 *   3. --NODE_CONFIG exclusive keys appear in the final config.
 *   4. The $NODE_CONFIG source entry (envConfig) is not mutated by the merge
 *      (i.e. cmd-only keys do not bleed into the $NODE_CONFIG source).
 */
describe('setEnv NODE_CONFIG merge regression', function () {
  let CONFIG;

  before(async function () {
    process.env.NODE_CONFIG_DIR = import.meta.dirname + '/config';
    process.env.NODE_ENV = 'test';

    // EnvOverride.parm3 exists in both sources → cmd wins
    // EnvOverride.parmEnvOnly exists only in $NODE_CONFIG
    // EnvOverride.parmCmdOnly exists only in --NODE_CONFIG
    process.env.NODE_CONFIG = JSON.stringify({
      EnvOverride: { parm3: 'env-value', parmEnvOnly: 'env-exclusive' }
    });
    process.argv = [
      undefined,
      undefined,
      '--NODE_CONFIG={"EnvOverride":{"parm3":"cmd-value","parmCmdOnly":"cmd-exclusive"}}',
    ];

    CONFIG = await requireUncached('./lib/config.mjs');
  });

  it('--NODE_CONFIG overrides $NODE_CONFIG for shared keys', function () {
    assert.strictEqual(
      CONFIG.get('EnvOverride.parm3'),
      'cmd-value',
      '--NODE_CONFIG parm3 should override $NODE_CONFIG parm3'
    );
  });

  it('$NODE_CONFIG exclusive keys survive the merge', function () {
    assert.strictEqual(
      CONFIG.get('EnvOverride.parmEnvOnly'),
      'env-exclusive',
      '$NODE_CONFIG-exclusive key must be present in merged result'
    );
  });

  it('--NODE_CONFIG exclusive keys are present in merged result', function () {
    assert.strictEqual(
      CONFIG.get('EnvOverride.parmCmdOnly'),
      'cmd-exclusive',
      '--NODE_CONFIG-exclusive key must be present in merged result'
    );
  });

  it('$NODE_CONFIG source is not mutated: cmd-only keys must not bleed into it', function () {
    // The config sources list contains the parsed envConfig and cmdLineConfig objects.
    // Before the fix, extendDeep used envConfig as the target, causing cmd keys to appear in it.
    // We verify indirectly: the "$NODE_CONFIG" source should only contain the original env keys.
    const sources = CONFIG.util.getConfigSources();
    const envSource = sources.find(s => s.name === '$NODE_CONFIG');

    assert.ok(envSource, '$NODE_CONFIG source must be present');
    assert.strictEqual(
      envSource.parsed.EnvOverride.parmCmdOnly,
      undefined,
      'cmd-only key must NOT appear in the $NODE_CONFIG source (mutation check)'
    );
    assert.strictEqual(
      envSource.parsed.EnvOverride.parm3,
      'env-value',
      '$NODE_CONFIG source must retain its original value for shared keys'
    );
  });
});
