
require.paths.unshift('spec', './spec/lib', 'lib')
require('jspec')
yaml = require('yaml')

JSpec
  .exec('spec/spec.core.js')
  .run({ reporter: JSpec.reporters.Terminal, fixturePath: 'spec/fixtures', failuresOnly: true })
  .report()
