'use strict';

const path = require('path');
const Benchmark = require('faceoff').default;
const configDir = path.join(__dirname, 'config');
const SAMPLE_DATA = loadConfig();

process.env.NODE_ENV = 'benchmark';
process.env.NODE_CONFIG_DIR = configDir;

function loadConfig() {
  const { Load, Util } = require("../lib/util.js");
  const load = new Load({ configDir });

  load.scan();

  return Util.toObject(load.config);
}

const benchmarks = new Benchmark({
  '4.0.1': 'config@4.0.1',
  '4.2.0': 'config@4.2.0',
  '4.3.0': 'config@4.3.0',
  '4.4.0': 'config@4.4.0',
  'trunk': 'git@github.com:node-config/node-config.git',
  'branch': { location: __dirname + '/../' },
});

benchmarks.suite('access functions', function(suite) {
  suite.add('get', (config, keys) => {
    keys.map((key) => config[key]);
  });

  suite.add('get()', (config, keys) => {
    keys.map((key) => config.get(key));
  });
}, {
  minSamples: 50,
  setup: (client) => {
    let keys = Object.keys(client);

    client.get('util');

    global.gc();
    return keys;
  }
});

benchmarks.suite('Util functions', function(suite) {
  suite.add('extendDeep', (config, { Util }) => {
    let ext = Util.extendDeep({}, SAMPLE_DATA, SAMPLE_DATA);
  });

  suite.add('cloneDeep', (config, { Util }) => {
    let clone = Util.cloneDeep(SAMPLE_DATA);
  });

  suite.add('loadFileConfigs', (config, { Util }) => {
    let data = Util.loadFileConfigs({ configDir });
  });
}, {
  minTime: 0.4,
  minSamples: 50,
  setup: async (client, location) => {
    const { Util } = require(path.join(location, "lib/util.js"));
    return { Util };
  },
});

benchmarks.suite('config.util functions', function(suite) {
  suite.add('makeImmutable', (config, { util }) => {
    let obj = structuredClone(SAMPLE_DATA);
    util.makeImmutable(obj);
  });
}, {
  minTime: 0.4,
  setup: async (client) => {
    return { util: client.util };
  },
});

(async () => {
  try {
    await benchmarks.run();
  } catch (err) {
    console.error('Failure', err);
    console.error(err.stack);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
})();
