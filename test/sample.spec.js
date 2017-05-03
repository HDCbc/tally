const chai = require('chai');

const assert = chai.assert;
const vault = require('../src/vault');

describe('Vault', () => {
  it('Should not return non-aggregate data');
  it('Should never return an error');
  it('Should return the same query that it was passed');

  describe('sanitizeAggregate', () => {
    it('Should return count, numerator, denominator fields that are numeric', () => {
      const actual = vault.sanitizeAggregate({ numerator: -1000, denominator: 5, count: 900000000, confidental: 'Tokyo' });
      const expected = { numerator: -1000, denominator: 5, count: 900000000 };

      assert.deepEqual(actual, expected);
    });
    it('Should not return fields other than count, numerator, denominator', () => {
      const actual = vault.sanitizeAggregate({ numerator: 1, denominator: 5, count: 0, confidental: 'Tokyo' });
      const expected = { numerator: 1, denominator: 5, count: 0 };

      assert.deepEqual(actual, expected);
    });
    it('Should return null for fields that are not numbers', () => {
      const actual = vault.sanitizeAggregate({ numerator: '42', denominator: 'Tokyo', count: ['John Smith'] });
      const expected = { numerator: null, denominator: null, count: null };

      assert.deepEqual(actual, expected);
    });
    it('Should return null for fields that are missing', () => {
      const actual = vault.sanitizeAggregate({});
      const expected = { numerator: null, denominator: null, count: null };

      assert.deepEqual(actual, expected);
    });
    it('Should return null for fields if parameter is undefined', () => {
      const actual = vault.sanitizeAggregate({});
      const expected = { numerator: null, denominator: null, count: null };

      assert.deepEqual(actual, expected);
    });
  });
});
