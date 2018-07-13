// Import npm modules.
const async = require('async');
const logger = require('winston');
const vault = require('./vault');

/**
 * This module is the backbone of the application. It contains the the majority of the business
 * logic and dictates the flow of the application.
 *
 * @module app
 */
module.exports = (function app() {
  let central;
  let db;

  function init(centralParam, dbParam, callback) {
    central = centralParam;
    db = dbParam;

    logger.info('app.init');
    callback(null);
  }

  /**
   * This function will perform the specified updates against the Universal Schema.
   * <br/><br/>
   * The updates will be applied one at a time in the order they are specified. If any
   * of the updates fail, the previous updates that succeeded will still persist, but
   * an error will be returned in the callback and further updates will not be attempted.
   *
   * @param {array} updates - An array of updates to perform.
   * @param {Function} callback - A callback to run on completion of the updates.
   * @param {Object} callback.error - If an error occured this will include details on the error.
   * @returns {void}
   */
  function updatePerform(client, updates, callback) {
    logger.info('app.updatePeform()', { numUpdates: updates.length });

    async.mapSeries(updates, async.apply(vault.change, client), (err) => {
      callback(err);
    });
  }

  /**
   * This function will perform a single batch of updates. A batch includes the following steps:
   * <ol>
   * <li>Retrieve the current version from the Universal Schema.</li>
   * <li>Request a list of updates from the Central Server based on the current version.</li>
   * <li>Perform the updates against the Universal Schema.</li>
   * </ol>
   * Note that the Central Server dictates how many updates will be sent in a single batch.
   *
   * @param {Function} callback - A callback to run on completion of the batch of updates.
   * @param {Object} callback.error - If an error occured this will include details on the error.
   * @returns {void}
   */
  function updateBatch(client, callback) {
    logger.info('app.updateBatch()');

    async.waterfall([
      async.apply(vault.version, client),
      // The below command will callback a specific error if there are no updates which will
      // cause this function to instantly callback without trying to perform updates.
      central.requestUpdates,
      async.apply(updatePerform, client),
    ], callback);
  }

  /**
   * This function will continually perform batches of updates until the Universal Schema is
   * completely updated.
   *
   * @param {Function} callback - A callback to run on completion of all updates.
   * @param {Object} callback.error - If an error occured this will include details on the error.
   * @returns {void}
   */
  function updateAll(client, callback) {
    logger.info('app.updateAll()');

    async.forever(async.apply(updateBatch, client), (err) => {
      // Hide the 'fake' update complete error.
      if (err === central.NO_UPDATES_FOUND) {
        logger.info('app.updateAll complete');
        return callback(null);
      }

      return callback(err);
    });
  }

  /**
   * This function will perform the specified queries against the Universal Schema. The queries
   * will be run in parallel (up to 5 at once).
   *
   * Note that if any of the queries fail to run, then an error will be returned in the callback.
   *
   * @param {array} queryList - An array of queries to perform.
   * @param {Function} callback - A callback to run on completion of the queries.
   * @param {Object} callback.error - If an error occured this will include details on the error.
   * @param {int} callback.results - An array containing the results of the query.
   * @returns {void}
   */
  function queryPerform(client, queryList, maxParallelQueries, callback) {
    logger.info('app.queryPerform()', { numQueries: queryList.length, maxParallelQueries });

    async.mapLimit(queryList, maxParallelQueries, async.apply(vault.aggregate, client), (err, results) => {
      callback(err, results);
    });
  }

  /**
   * This function will handle a single batch of queries. A batch includes the following steps:
   * <ol>
   * <li>Request the queries from the Central Server.</li>
   * <li>Perform those queries against the Universal Schema.</li>
   * <li>Send the results back to the Central Server.</li>
   * </ol>
   * Note that the Central Server dictates how many queries will be sent in a single batch.
   *
   * @param {Function} callback - A callback to run on completion of the batch of queries.
   * @param {Object} callback.error - If an error occured this will include details on the error.
   * @returns {void}
   */
  function queryBatch(client, maxParallelQueries, callback) {
    logger.info('app.queryBatch()');

    async.autoInject({
      version: cb => vault.version(client, cb),
      queries: cb => central.requestQueries(cb),
      results: (queries, cb) => queryPerform(client, queries, maxParallelQueries, cb),
      mappedResults: (version, results, cb) => {
        cb(null, results.map(o => Object.assign(o, { reported_version: version })));
      },
      sent: (mappedResults, cb) => central.sendResults(mappedResults, cb),
    }, callback);
  }

  /**
   * This function will continually perform batches of queries until the Central Server has no
   * queries left to run.
   *
   * @param {Function} callback - A callback to run on completion of all queries.
   * @param {Object} callback.error - If an error occured this will include details on the error.
   * @returns {void}
   */
  function queryAll(client, maxParallelQueries, callback) {
    logger.info('app.queryAll()');

    async.forever(async.apply(queryBatch, client, maxParallelQueries), (err) => {
      // Hide the 'fake' queries complete error.
      if (err === central.NO_QUERIES_FOUND) {
        return callback(null);
      }

      return callback(err);
    });
  }


  function run(appParams) {
    const { maxParallelQueries } = appParams;
    logger.info('app.run()', { maxParallelQueries });

    async.autoInject({
      updated: cb => updateAll(db, cb),
      initialQueries: (updated, cb) => central.requestQueries(cb),
      prepared: (initialQueries, cb) => vault.prepare(db, cb),
      queried: (prepared, cb) => queryAll(db, maxParallelQueries, cb),
    }, (err) => {
      // If the initial query returned no queries then just exist without preparing.
      if (err === central.NO_QUERIES_FOUND) {
        logger.info('No queries found. Exit before prepare');
        process.exit(0);
      }
      if (err) {
        logger.error('The application encountered a fatal error.', err);
        process.exit(1);
      }

      process.exit(0);
    });
  }

  return {
    init,
    run,
  };
}());
