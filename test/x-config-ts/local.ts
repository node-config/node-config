import { Config } from './types';

function bootstrap({defer}) {
  const localConfig: Config = {
    siteTitle: 'New Instance!',
  };

  localConfig['map'] = {
    centerPoint: {lat: 3, lon: 4},
  };

  localConfig['original'] = {
    // An original value passed to deferred function
    original: defer((cfg, original) => original),

    // This deferred function "skips" the previous one
    deferredOriginal: defer((cfg, original) => original),
  };

  return localConfig;
}

export default bootstrap;
