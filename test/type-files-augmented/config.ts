import config = require('config');

declare global {
  namespace NodeConfig {
    interface Schema {
      port: number;
      site: {
        title: string;
        deep: {
          flag: boolean;
        };
      };
    }
  }
}

const port: number = config.get('port');
const title: string = config.get('site.title');
const flag: boolean = config.get('site.deep.flag');
const site: { title: string; deep: { flag: boolean } } = config.get('site');

const direct: string = config.site.title;

const hasTyped: boolean = config.has('site.title');
const hasUnknown: boolean = config.has('not.in.schema');

const explicitPort: number = config.get<number>('port');
// @ts-expect-error - explicit generic does not bypass path checking
config.get<number>('nope');
// @ts-expect-error - value at 'port' is a number, not a string
const bad: string = config.get('port');
