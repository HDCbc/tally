const winston = require('winston');

const db = require('./database');

/**
 * This module will provide the interface with the Vault. All queries and updates that hit the Vault
 * including the Indicator, Concept, and Universal schema are run through this module. Furthermore
 * it should all run through functions in the API schema.
 *
 * @param {Object} db - An instance of the database module.
 * @module vault
 */
module.exports = (function vault() {
  let logger;

  function init() {
    logger = winston.loggers.get('app');
    logger.debug('vault.init');
  }

  function sanitizeAggregate(row = {}) {
    const clean = {};

    clean.count = Number.isInteger(row.count) ? row.count : null;
    clean.numerator = Number.isInteger(row.numerator) ? row.numerator : null;
    clean.denominator = Number.isInteger(row.denominator) ? row.denominator : null;

    return clean;
  }
  /**
   * This function will perform a query against the Vault by running the api.aggregate()
   * database function and returning an aggregate numerator/denominator or count.
   *
   * The database function should ensure that only aggregate results are returned. However, since it
   * is possible that it may be compromised, this code function also performs its own check to
   * ensure that only aggregate results are returned.
   *
   * @param {Object} query - The query to run against the Vault.
   * @param {string} query.indicator - The name of the indicator to run. This
   * must directly match the name of a function within the Indicator schema in the Vault.
   * @param {string} query.clinic - The clinic to run the query against.
   * This must match a guid within universal.clinic.hdc_reference.
   * @param {string} query.provider - The provider to run the query against.
   * @param {string} query.effectiveDate - The effective date of the query.
   *
   * @param {Function} callback - A callback to run on completion.
   * @param {Object} callback.error - This will always be null! Errors will be found in the results
   * object as specified below.
   * @param {Object} callback.results - The results of the query.
   * @param {Object} callback.results.query - The original query object that was passed to this
   * function.
   * @param {Object} callback.results.error - If an error occured this will include details
   * on the error.
   * @param {Object} callback.results.results - The results (rows) of the SQL query.
   *
   * @returns {void}
   */
  function aggregate(client, query, callback) {
    const startTime = Date.now();
    logger.info('Vault Aggregate Started');
    logger.debug('Vault Aggregate Query', { query });

    const dbQuery = 'SELECT * FROM api.aggregate(p_indicator:=$1, p_clinic:=$2, p_provider:=$3, p_effective_date:=$4);';

    const dbParams = [
      query.indicator,
      query.clinic,
      query.provider,
      query.effective_date,
    ];

    db.runQuery(client, dbQuery, dbParams, 'All', (dbErr, dbRow) => {
      const endTime = Date.now();
      const elapsedSec = (endTime - startTime) / 1000;

      // Note that api.aggregate returns zero rows if it fails.
      // If a database exception was thrown then use that error.
      // If no row then there is an unspecified error.
      const error = (dbErr && dbErr.message) || (dbRow && dbRow.length === 1 ? null : 'Database error. See log.');

      const results = {
        query_id: query.id,
        // reported_version gets populated in App.queryBatch
        execution_start_time: new Date(startTime),
        execution_end_time: new Date(endTime),
        error,
      };

      if (!error && dbRow && dbRow.length === 1) {
        results.denominator = Number.isInteger(dbRow[0].denominator) ? dbRow[0].denominator : null;
        results.numerator = Number.isInteger(dbRow[0].numerator) ? dbRow[0].numerator : null;

        // Note that the results from the database are in column "kount" to deal with SQL keywords.
        results.count = Number.isInteger(dbRow[0].kount) ? dbRow[0].kount : null;
      }

      if (error) {
        logger.error('Vault Aggregate Failed', error);
        // Note that we do not callback here, as per below comment.
      } else {
        logger.debug('Vault Aggregate Results', { results });
        logger.info('Vault Aggregate Success', { elapsedSec });
      }

      // Note that we are "hiding" the error and instead of returning it as the
      // first parameter of the callback, we are including it in the results
      // object. This is because we are running a bunch of queries at the same
      // time and if an error is returned then they will all instantly stop.
      callback(null, results);
    });
  }

  /**
   * Performs an update to the Vault by calling the api.change() function within the database.
   *
   * Note that no results will be returned from the update queries to ensure that patient data
   * cannot be returned.
   *
   * @param {Object} change - The change to be applied to the Universal Schema.
   * @param {int} change.version - The version that the change relates to.
   * @param {string} change.statement - The SQL statement to run against the Universal Schema
   * that performs the update.
   *
   * @param {Function} callback - A callback to run on completion.
   * @param {Object} callback.error - If an error occured this will include details on the error.
   *
   * @returns {void}
   */
  function change(client, changeObject, callback) {
    const start = Date.now();
    logger.info('Vault Change Started', { toVersion: changeObject.version });

    const dbQuery = 'SELECT * FROM api.change(p_change_id:=$1, p_statement:=$2, p_signature:=$3);';

    const dbParams = [
      changeObject.version,
      changeObject.statement,
      changeObject.signature,
    ];

    db.runQuery(client, dbQuery, dbParams, 'Single', (dbErr, dbRes) => {
      const elapsedSec = (Date.now() - start) / 1000;

      // Note that api.change returns false if it fails.
      // If a database exception was thrown then use that error.
      // If the result is false then there is an unspecified error.
      const error = dbErr || (dbRes ? undefined : 'Database error. See log.');

      if (error) {
        logger.error('Vault Change Failure', error);
        return callback(error);
      }

      logger.info('Vault Change Success', { elapsedSec });
      return callback(null, dbRes);
    });
  }

  /**
   * Retrieves the current version of the Vault by calling the api.version() function within the
   * database.
   *
   * @param {Function} callback - A callback to run on completion.
   * @param {Object} callback.error - If an error occured this will include details on the error.
   * @param {int} callback.version - The current version of the Universal Schema.
   *
   * @returns {void}
   */
  function version(client, callback) {
    const start = Date.now();
    logger.info('Vault Version Started');

    const dbQuery = 'SELECT * FROM api.version()';
    const dbParams = [];

    db.runQuery(client, dbQuery, dbParams, 'Single', (err, res) => {
      const elapsedSec = (Date.now() - start) / 1000;
      if (err) {
        logger.error('Vault Version Failure', err);
        return callback(err);
      }
      logger.info('Vault Version Success', { elapsedSec, version: res });
      return callback(null, res);
    });
  }

  /**
   * Retrieves the current version of the Vault by calling the api.version() function within the
   * database.
   *
   * @param {Function} callback - A callback to run on completion.
   * @param {Object} callback.error - If an error occured this will include details on the error.
   * @param {int} callback.version - The current version of the Universal Schema.
   *
   * @returns {void}
   */
  function prepare(client, callback) {
    const start = Date.now();
    logger.info('Vault Prepare Started');

    const dbQuery = 'SELECT * FROM api.prepare()';
    const dbParams = [];

    db.runQuery(client, dbQuery, dbParams, 'Single', (err) => {
      const elapsedSec = (Date.now() - start) / 1000;
      if (err) {
        logger.error('Vault Prepare Failure', err);
        return callback(err);
      }
      logger.info('Vault Prepare Success', { elapsedSec });
      return callback(null);
    });
  }

  return {
    init,
    sanitizeAggregate,
    aggregate,
    change,
    prepare,
    version,
  };
}());
