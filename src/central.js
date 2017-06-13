const fs = require('fs');
const request = require('request');
const logger = require('winston');

const config = require('../config/central-config');

/**
 * This module will provide the interface with the Central Server.
 *
 * @param {Object} db - An instance of a database connection.
 * @param {Object} logger - An instance of a logger.
 * @module central
 */
module.exports = (function central() {
  const NO_UPDATES_FOUND = 'No Updates Found';
  const NO_QUERIES_FOUND = 'No Queries Found';

  function post(urla, json, callback) {
    // FIXME: Mutual Authentication
    const options = {
      method: 'POST',
      url: config.baseUrl + '/' + urla,
      cert: fs.readFileSync(config.certFile, { encoding: 'utf-8' }),
      key: fs.readFileSync(config.keyFile, { encoding: 'utf-8' }),
      ca: [fs.readFileSync(config.caFile, { encoding: 'utf-8' })],
      // ca: fs.readFileSync(config.caFile),
      json,
    };

    request.post(options, (err, response, body) => {
      return callback(err, body);
    });
  }

  /**
   * Request a new batch of updates from the HDC Central server.
   */
  function requestUpdates(version, callback) {
    logger.debug('central.requestUpdates()', { version });

    post('updates', { version }, (err, results) => {
      if (err) {
        return callback(err);
      }

      logger.debug('Updates received', results.length);

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

      logger.debug('Queries received', results.length);

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
    logger.debug('central.sendResults()');

    post('results', results, (postErr, postResults) => {
      if (postErr) {
        return callback(postErr);
      }

      logger.debug('Results received', postResults);

      return callback(null, results);
    });
  }

  return {
    requestUpdates,
    requestQueries,
    sendResults,
    NO_UPDATES_FOUND,
    NO_QUERIES_FOUND,
  };
}());
