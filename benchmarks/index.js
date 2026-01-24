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
  '3.3.12': 'config@3.3.12',
  '4.0.1': 'config@4.0.1',
  '4.2.0': 'config@4.2.0',
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
  minTime: 0.2,
  setup: (client) => {
    let keys = Object.keys(client);
    return keys;
  }
});

benchmarks.suite('Util functions', function(suite) {
  suite.add('extendDeep', function(config, { Util }) {
    let ext = Util.extendDeep({}, SAMPLE_DATA, SAMPLE_DATA);
  });

  suite.add('cloneDeep', function(config, { Util }) {
    let clone = Util.cloneDeep(SAMPLE_DATA);
  });
}, {
  minTime: 0.4,
  setup: async (client, location) => {
    const { Util } = require(path.join(location, "lib/util.js"));
    return { Util };
  },
  skip: ['3.3.12']
});

benchmarks.suite('config.util functions', function(suite) {
  suite.add('makeImmutable', function(config, { util }) {
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
