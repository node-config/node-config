'use strict';

const requireUncached = require('./_utils/requireUncached');
const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const Parser = require('../parser');

describe('Tests for parsing TOML files', function() {
  describe('Using the default parser - Array of Tables', function() {
    let config;
    beforeEach(function() {
      process.env.NODE_CONFIG_DIR = __dirname + '/17-config';
      config = requireUncached(__dirname + '/../lib/config');
    });

    it('validate array of tables is supported', function() {
        assert.deepStrictEqual(config.get('messages'), [
          {
            field1: '1',
            field2: '2'
          },
          {
            field1: 'a',
            field3: '3'
          }
        ]);
      });
    });
  });
