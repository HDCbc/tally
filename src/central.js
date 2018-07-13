const fs = require('fs');
const logger = require('winston');
const request = require('request');

/**
 * This module will provide the interface with the Central Server.
 *
 * @param {Object} db - An instance of a database connection.
 * @module central
 */
module.exports = (function central() {
  const NO_UPDATES_FOUND = 'No Updates Found';
  const NO_QUERIES_FOUND = 'No Queries Found';

  let config;

  function init(configParam, callback) {
    config = configParam;
    logger.info('central.init');

    // TODO - simple online check
    callback(null);
  }

  function post(urla, json, callback) {
    // FIXME: Mutual Authentication
    // TODO: REMOVE THE BELOW FOR PRODUCTION!
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const options = {
      method: 'POST',
      url: `${config.baseUrl}/${urla}`,
      cert: fs.readFileSync(config.certFile, { encoding: 'utf-8' }),
      key: fs.readFileSync(config.keyFile, { encoding: 'utf-8' }),
      ca: [fs.readFileSync(config.caFile, { encoding: 'utf-8' })],
      json,
    };

    request.post(options, (err, response, body) => {
      if (err) {
        return callback(err);
      }
      if (response.statusCode !== 200) {
        return callback(body);
      }

      return callback(err, body);
    });
  }

  /**
   * Request a new batch of updates from the HDC Central server.
   */
  function requestUpdates(version, callback) {
    logger.info('central.requestUpdates()', { version });

    post('updates', { version }, (err, results) => {
      if (err) {
        return callback(err);
      }

      logger.info('Updates received', { numUpdates: results.length });
      logger.debug('Updates', { results });

      if (!results || results.length === 0) {
        return callback(NO_UPDATES_FOUND);
      }

      // FIXME: Validate the content / structure of the response.
      return callback(null, results);
    });
  }

  /**
   * Request a new batch of queries from the HDC Central server.
   */
  function requestQueries(callback) {
    logger.debug('central.requestQueries()');

    post('queries', {}, (err, results) => {
      if (err) {
        return callback(err);
      }

      logger.info('Queries received', { numQueries: results.length });
      logger.debug('Queries received', { results });

      if (!results || results.length === 0) {
        return callback(NO_QUERIES_FOUND);
      }

      // FIXME: Validate the content / structure of the response.
      return callback(null, results);
      // FIXME: Deal with callback(NO_UPDATES_FOUND);
    });
  }

  /**
   * Sends the result of queries back to the central server.
   */
  function sendResults(results, callback) {
    logger.info('central.sendResults()', { results });

    post('results', results, (postErr, postResults) => {
      if (postErr) {
        return callback(postErr);
      }

      logger.info('Results received', { postResults });

      return callback(null, results);
    });
  }

  return {
    init,
    requestUpdates,
    requestQueries,
    sendResults,
    NO_UPDATES_FOUND,
    NO_QUERIES_FOUND,
  };
}());
