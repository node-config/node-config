import * as parser from 'config/parser';

const parsedMaybe: object | undefined = parser.parse('test.json', '{}');
const yamlParsed: object | undefined = parser.yamlParser('test.yaml', 'a: 1');
const tsParsed: object = parser.tsParser('test.ts', 'module.exports = {}');

const parserFn = parser.getParser('json');
if (parserFn) {
  const value = parserFn('test.json', '{}');
}

parser.setParser('custom', (filename, content) => ({ filename, content }));

const defaultOrder = parser.getFilesOrder();
const jsonOrder = parser.getFilesOrder('json');
const newOrder = parser.setFilesOrder(['json', 'yaml']);

const boolVal: boolean = parser.booleanParser('BOOL', 'true');
const numVal: number = parser.numberParser('NUM', '1');

// @ts-expect-error - name must be a string
parser.getParser(123);
// @ts-expect-error - name must be a string or string[]
parser.setFilesOrder(123);
