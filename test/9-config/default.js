var raw = require('../../raw').raw;

module.exports = {
  circularReference: raw(process.stdout),
  testObj: raw({ foo: 'bar' }),
  yell: raw(function(input) {
    return input + '!';
  }),
  aPromise: Promise.resolve('this is a promise result'),
  innerRaw: {
    innerCircularReference: raw(process.stdout)
  },
  nestedRaw: raw({
    nested: {
      test: process.stdout
    }
  })
}
