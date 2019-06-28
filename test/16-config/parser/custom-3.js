var Parser = require('../../_utils/requireUncached')(__dirname + '/../../../parser');

Parser.setParser('json5', function(filename, content) {
  var json = Parser.json5Parser(filename, content);
  json.custom = {key: 'json5 rules!'};
  return json;
});

Parser.setParserOrder('json5');

module.exports = Parser;
