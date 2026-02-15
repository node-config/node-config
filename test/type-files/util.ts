import { Util, Load } from 'config/lib/util';
import * as parser from 'config/parser';

const value1: number = Util.getOption({ value: 1 }, 'value', 0);
const value2: string = Util.getOption(undefined, 'name', 'default');

const files: string[] = Util.locateMatchingFiles('config', { 'default.json': 1 });

Util.makeHidden({ a: 1 }, 'a');
Util.makeHidden({ a: 1 }, 'a', 2);

const emptyLoad = new Load();
emptyLoad.initParam('NODE_ENV', 'test');
const envValue: string = emptyLoad.getEnv('NODE_ENV');
emptyLoad.setEnv('NODE_ENV', 'test');

const loadWithNodeEnv = new Load({
  nodeEnv: ['test']
});

const loadWithParser = new Load({
  parser
});

const loadWithOptions = new Load({
  configDir: 'test/5-config',
  nodeEnv: ['test'],
  hostName: 'localhost',
  skipConfigSources: true,
  gitCrypt: true,
  parser
});

const loaded = Util.loadFileConfigs(loadWithOptions);
loaded.addConfig('extra', { a: 1 });

// @ts-expect-error - nodeEnv must be an array
new Load({ nodeEnv: 'test' });
// @ts-expect-error - nodeEnv must be an array
Util.loadFileConfigs({ nodeEnv: 'test' });
// @ts-expect-error - object must be an object
Util.makeHidden('not-an-object', 'a');
