import config = require('config');

const hasFeature: boolean = config.has('feature.enabled');
const port: number = config.get<number>('port');
const title: string = config.get<string>('site.title');

const defaults = config.util.setModuleDefaults('MyModule', { enabled: true });
const defaultsEnabled: boolean = defaults.enabled;

const loaded = config.util.loadFileConfigs('test/5-config');
const loadedHas: boolean = loaded.number === 42;

const stripped: string = config.util.stripYamlComments('# comment');

config.util.makeImmutable({ a: 1 });
config.util.makeImmutable({ a: 1 }, 'a', 2);

const sources = config.util.getConfigSources();
sources.forEach((source) => {
  const name: string = source.name;
  const parsed: any = source.parsed;
  const original: string | undefined = source.original;
});

// @ts-expect-error - property must be a string
config.get(123);
// @ts-expect-error - property must be a string
config.has(123);
// @ts-expect-error - module name must be a string
config.util.setModuleDefaults(123, {});
// @ts-expect-error - config dir must be a string
config.util.loadFileConfigs(123);
// @ts-expect-error - input must be a string
config.util.stripYamlComments(123);
