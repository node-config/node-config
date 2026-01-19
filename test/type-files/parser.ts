import Parser from '../../types/parser';

const parsedMaybe: object | undefined = Parser.parse('test.json', '{}');
const yamlParsed: object | undefined = Parser.yamlParser('test.yaml', 'a: 1');
const tsParsed: object = Parser.tsParser('test.ts', 'module.exports = {}');

const parserFn = Parser.getParser('json');
if (parserFn) {
  const value = parserFn('test.json', '{}');
}

Parser.setParser('custom', (filename, content) => ({ filename, content }));

const defaultOrder = Parser.getFilesOrder();
const jsonOrder = Parser.getFilesOrder('json');
const newOrder = Parser.setFilesOrder(['json', 'yaml']);

const boolVal: boolean = Parser.booleanParser('BOOL', 'true');
const numVal: number = Parser.numberParser('NUM', '1');

// @ts-expect-error - name must be a string
Parser.getParser(123);
// @ts-expect-error - name must be a string or string[]
Parser.setFilesOrder(123);
