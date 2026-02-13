import { deferConfig, DeferredConfig } from 'config/defer';
import config = require('config');

const deferred = deferConfig((cfg, original: number) => original + 1);
const deferredConfig: DeferredConfig = deferred;

deferred.prepare(config, { value: 1 }, 'value');
deferred.prepare(config, [1], 0);

deferred.resolve();

const asyncDeferred = deferConfig(async function (cfg, original: string) {
  const fromConfig: string = cfg.get<string>('site.title');
  const fromThis: string = this.get<string>('site.title');
  return `${fromConfig}${original}`;
});

asyncDeferred.prepare(config, { value: 1 }, 'value');
asyncDeferred.resolve();

// @ts-expect-error - must be a function
deferConfig(123);
