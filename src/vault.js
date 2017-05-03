const logger = require('winston');

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
  function sanitizeAggregate(row = {}) {
    const clean = {};
    clean.count = Number.isInteger(row.count) ? row.count : null;
    clean.numerator = Number.isInteger(row.numerator) ? row.numerator : null;
    clean.denominator = Number.isInteger(row.denominator) ? row.denominator : null;

    return clean;
  }
  /**
   * This function will perform a query against the Vault by running the api.performAggregateQuery
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
  function performAggregateQuery(query, callback) {
    logger.debug('vault.performAggregateQuery()', query);

    const dbQuery = 'SELECT * FROM api.perform_aggregate_query(p_indicator:=$1, p_clinic:=$2, p_provider:=$3, p_effective_date:=$4);';

    const dbParams = [
      query.indicator,
      query.clinic,
      query.provider,
      query.effectiveDate,
    ];

    db.runQuery(dbQuery, dbParams, 'All', (error, row) => {
      // Sanitize the return rows to ensure that only aggregate data is returned.
      const results = sanitizeAggregate(row);

      // Note that we are "hiding" the error and instead of returning it as the
      // first parameter of the callback, we are including it in the results
      // object. This is because we are running a bunch of queries at the same
      // time and if an error is returned then they will all instantly stop.
      callback(null, { query, error, results });
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
  function performUpdate(change, callback) {
    logger.debug('vault.performUpdate()', change);

    const dbQuery = 'SELECT * FROM api.perform_update(p_change_id:=$1, p_statement:=$2);';

    const dbParams = [
      change.version,
      change.statement,
    ];

    // FIXME: We need to ensure that we cannot return sensitive data in error messages.
    db.runQuery(dbQuery, dbParams, 'All', callback);
  }

  /**
   * Retrieves the current version of the Vault by calling the api.get_version function within the
   * database.
   *
   * @param {Function} callback - A callback to run on completion.
   * @param {Object} callback.error - If an error occured this will include details on the error.
   * @param {int} callback.version - The current version of the Universal Schema.
   *
   * @returns {void}
   */
  function retrieveVersion(callback) {
    logger.debug('vault.retrieveVersion()');

    const dbQuery = 'select * from api.retrieve_version()';
    const dbParams = [];

    db.runQuery(dbQuery, dbParams, 'Single', callback);
  }

  return {
    sanitizeAggregate,
    performAggregateQuery,
    performUpdate,
    retrieveVersion,
  };
}());
