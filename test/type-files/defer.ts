import { deferConfig, DeferredConfig } from 'config/defer';
import config = require('config');

const deferred = deferConfig((cfg, original: number) => original + 1);
const deferredConfig: DeferredConfig = deferred;

deferred.prepare(config, { value: 1 }, 'value');

deferred.resolve();

// @ts-expect-error - must be a function
deferConfig(123);
