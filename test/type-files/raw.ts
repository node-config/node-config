import { raw, RawConfig } from 'config/raw';

const rawConfig = raw({ value: 1 });
const resolved = rawConfig.resolve();
const instance: RawConfig = rawConfig;

// @ts-expect-error - raw requires an argument
raw();
