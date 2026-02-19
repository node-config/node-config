import Parser from '../../../parser.js';

Parser.setParser('json5', function(filename, content) {
  var json = Parser.json5Parser(filename, content);
  json.custom = {key: 'json5 rules!'};
  return json;
});

Parser.setFilesOrder(['yaml', 'yml', 'json5']);

export default Parser;
