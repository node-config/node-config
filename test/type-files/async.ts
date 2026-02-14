import { asyncConfig, resolveAsyncConfigs } from 'config/async';
import config = require('config');

const promiseValue = asyncConfig(Promise.resolve(123));
const typedPromise: Promise<number> = promiseValue;

const deferred = asyncConfig(async (cfg, original: unknown) => {
  return String(cfg.get<string>('site.title'));
});

deferred.prepare(config, { value: 1 }, 'value');

deferred.resolve();

const resolvedConfig: Promise<typeof config> = resolveAsyncConfigs(config);

// @ts-expect-error - must be a promise or function
asyncConfig(123);
