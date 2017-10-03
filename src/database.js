const pg = require('pg');

/**
 * @module database
 */
module.exports = (function databaseModule() {
  let pool;
  let logger;

  /**
   * Initialize the database connection.
   */
  function init(config, loggerParam, callback) {
    logger = loggerParam;
    logger.debug('database.init', config);

    pool = new pg.Pool(config);

    pool.on('error', function (err, client) {
      // if an error is encountered by a client while it sits idle in the pool
      // the pool itself will emit an error event with both the error and
      // the client which emitted the original error
      // this is a rare occurrence but can happen if there is a network partition
      // between your application and the database, the database restarts, etc.
      // and so you might want to handle it and at least log it out
      console.error('idle client error', err.message, err.stack);
    });

    // TODO - simple connection check
    callback(null, pool);
  }

  /**
   * Parse the rows retrieved from the database.
   */
  function parseRows(rows, type, callback) {
    // If everything worked then callback the results.
    if (type === 'Single') {
      if (rows.length === 0) {
        return callback(null, null);
      }

      if (rows.length === 1) {
        const row = rows[0];

        if (row === undefined) {
          return callback(null, null);
        }
        const single = row[Object.keys(row)[0]];

        return callback(null, single);
      }

      return callback(`Incorrect number of records found: ${rows}`);
    }

    if (type === 'All') {
      return callback(null, rows);
    }

    return callback('Unknown type for runQuery', type);
  }

  /**
   * Run a query against the database.
   */
  function runQuery(client, query, params, type, callback) {
    logger.debug('database.runQuery()');

    // Run the query against the client.
    client.query(query, params, (queryErr, queryResult) => {
      // If we could not run the query then callback an error.
      if (queryErr) {
        return callback(queryErr);
      }
      return parseRows(queryResult.rows, type, callback);
    });
  }

  return {
    init,
    parseRows,
    runQuery,
  };
}());
