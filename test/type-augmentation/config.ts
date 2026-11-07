import config = require('config');

declare global {
  namespace Config {
    interface IConfig {
      firstName: string;
      lastName: string;
      fullName: string;
      info: {
        country: string;
        age: number;
        isOlympicAthlete: boolean;
        nest1: {
          nest2: {
            anotherString: string;
            nest3: {
              anotherNumber: number;
              nest4: {
                nest5: {
                  anotherBoolean: boolean;
                };
              };
            };
          };
        };
      };
    }
  }
}

var class1: config.Config = config;

var hasUntyped: boolean = config.has('');
var hasTyped: boolean = config.has('info.age');

var stringReturnType: string = config.get('firstName');
var numberReturnType: number = config.get('info.age');
var deepValue: boolean = config.get('info.nest1.nest2.nest3.nest4.nest5.anotherBoolean');
// @ts-expect-error Type 'boolean' is not assignable to type 'string'
var invalidReturnType: string = config.get('info.isOlympicAthlete');
var directAccessToo: number = config.info.nest1.nest2.nest3.anotherNumber;

// @ts-expect-error can't use type params while using augmented config
config.get<boolean>('info.isOlympicAthlete');
