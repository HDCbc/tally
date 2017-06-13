const logger = require('winston');

/**
 * @module database
 */
module.exports = (function databaseModule() {
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
    parseRows,
    runQuery,
  };
}());
