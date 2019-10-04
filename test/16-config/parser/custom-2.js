var Parser = require('../../_utils/requireUncached')(__dirname + '/../../../parser');

Parser.setParser('custom', function(filename, content) {
  return content.split(/\n/g).reduce(function(res, line) {
    var matches = line.match(/([a-z_\-]+)\s*:\s*(.*)\s*$/i);
    if (matches) {
      matches[1].split(/-/g).reduce(function(obj, key, index, keys) {
        if (index === keys.length -1) {
          obj[key] = matches[2];
        }
        return obj[key] || (obj[key] = {});
      }, res);
    }
    return res;
  }, {});
});

// change parser order
Parser.setFilesOrder(['custom', 'json5', 'json', 'yml']);


module.exports = Parser;
