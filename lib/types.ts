/**
 * Concatenate two primitives types with a "." delimeter.
 *
 * @example
 * const path: Join<'myConfig', 'myString'>;
 * path satisfies 'myConfig.myString';
 */
type Join<K, P> =
  K extends string | number
    ? P extends string | number ? `${K}${'' extends P ? '' : '.'}${P}` : never
    : never;

/**
 * Returns all config keys for a type. Decends the type recursively, collecting
 * keys for all object and their nested properties.
 *
 * @example
 * const paths: ConfigPaths<{
 *   myConfig: {
 *     myString: string;
 *     myNumber: number;
 *   }
 * }>;
 * paths satisfies 'myConfig' | 'myConfig.myString' | 'myConfig.myNumber';
 */
export type ConfigPaths<T> =
  T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? `${K}` | Join<K, ConfigPaths<T[K]>> : never;
      }[keyof T]
    : '';

/**
 * Returns the type associated with a config key using a dot (.) delimeted path.
 *
 * @example
 * const value: ConfigPathValues<{
 *   myConfig: {
 *     myString: string;
 *     myNumber: number;
 *   }
 * }, 'myConfig.myNumber'>;
 * value satisfies number;
 */
export type ConfigPathValues<O, P extends string> =
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof O ? ConfigPathValues<O[K], Rest> : never
    : P extends keyof O ? O[P] : never;

/**
 * Returns true if the {@link Config.IConfig} interface has been augmented
 * through declaration merging, otherwise returns false.
 */
export type HasBeenAugmented = keyof Config.IConfig extends never ? false : true;

declare global {
  namespace Config {
    /**
     * By augmenting this interface with your own config, you can greatly
     * improve the IntelliSense for the get method:
     *
     * - dot notation paths for the <code>setting</code> parameter.
     * - correctly typed return values.
     *
     * @example
     * declare global {
     *   namespace Config {
     *     interface IConfig extends MyConfig {}
     *   }
     * }
     *
     * @example
     * declare global {
     *   namespace Config {
     *     interface IConfig {
     *       myConfig: {
     *         myString: string;
     *         myNumber: number;
     *       };
     *     }
     *   }
     * }
     *
     * @example
     * const knownToBeStringTyped = config.get('myConfig.myString');
     */
    interface IConfig {}
  }
}

export interface IConfig extends Config.IConfig {}
