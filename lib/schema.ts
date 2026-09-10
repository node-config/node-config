// Type-level support for typed config.get(). This file emits declarations
// only (types/lib/schema.d.ts) — it has no runtime counterpart.
import type { Get, Paths } from 'dot.paths';

declare global {
  namespace NodeConfig {
    /**
     * Augment this interface with the shape of your configuration to get
     * dot-notation path autocomplete and correctly typed return values
     * from config.get():
     *
     * <pre>
     * declare global {
     *   namespace NodeConfig {
     *     interface Schema {
     *       port: number;
     *       customer: {
     *         dbName: string;
     *       };
     *     }
     *   }
     * }
     * </pre>
     *
     * When left unaugmented, config.get() keeps its untyped signature.
     */
    interface Schema {}
  }
}

/** Resolves to true once NodeConfig.Schema has been augmented. */
type Augmented = keyof NodeConfig.Schema extends never ? false : true;

/**
 * The type of config.get(): path-constrained with typed return values once
 * the schema is known, the classic untyped signature otherwise.
 */
export type ConfigGet = Augmented extends true
  ? {
      // 1: path inference — get('port') infers P = 'port', returns Get<Schema, 'port'>
      <P extends Paths<NodeConfig.Schema>>(property: P): Get<NodeConfig.Schema, P>;
      // 2: explicit-T compat — get<number>('port') lands here
      <T>(property: Paths<NodeConfig.Schema>): T;
    }
  : <T>(property: string) => T;
