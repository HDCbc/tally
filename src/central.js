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
    const url = `${config.baseUrl}/${urla}`;
    const options = {
      method: 'POST',
      url,
      cert: fs.readFileSync(config.certFile, { encoding: 'utf-8' }),
      key: fs.readFileSync(config.keyFile, { encoding: 'utf-8' }),
      ca: [fs.readFileSync(config.caFile, { encoding: 'utf-8' })],
      json,
      timeout: parseInt(config.timeout, 10),
    };

    request(options, (err, response, body) => {
      if (err) {
        logger.error('central.post error', { err });
        return callback(err);
      }
      if (response.statusCode !== 200) {
        logger.error('central.post bad response code', { statusCode: response.statusCode });
        return callback(body);
      }

      return callback(err, body);
    });
  }

  /**
   * Request a new batch of updates from the HDC Central server.
   */
  function requestUpdates(version, callback) {
    const start = Date.now();
    logger.info('Central RequestUpdates Started', { version });

    post('updates', { version }, (err, results) => {
      const elapsedSec = (Date.now() - start) / 1000;
      if (err) {
        logger.error('Central RequestUpdates Failure', err);
        return callback(err);
      }

      logger.debug('Central RequestUpdates Results', { results });

      if (!results || results.length === 0) {
        logger.info('Central RequestUpdates Success (No Updates)', { elapsedSec, numUpdates: results.length });
        return callback(NO_UPDATES_FOUND);
      }

      logger.info('Central RequestUpdates Success', { elapsedSec, numUpdates: results.length });
      return callback(null, results);
    });
  }

  /**
   * Request a new batch of queries from the HDC Central server.
   */
  function requestQueries(callback) {
    const start = Date.now();
    logger.info('Central RequestQueries Started');

    post('queries', {}, (err, results) => {
      const elapsedSec = (Date.now() - start) / 1000;

      if (err) {
        logger.error('Central RequestQueries Failure', err);
        return callback(err);
      }

      logger.debug('Central RequestQueries Results', { results });

      if (!results || results.length === 0) {
        logger.info('Central RequestQueries Success (No Queries)', { elapsedSec, numQueries: results.length });
        return callback(NO_QUERIES_FOUND);
      }

      logger.info('Central RequestQueries Success', { elapsedSec, numQueries: results.length });
      return callback(null, results);
    });
  }

  /**
   * Sends the result of queries back to the central server.
   */
  function sendResults(results, callback) {
    const start = Date.now();
    logger.info('Central Send Results Started', { results });

    post('results', results, (postErr, postResults) => {
      const elapsedSec = (Date.now() - start) / 1000;
      if (postErr) {
        logger.error('Central Send Results Failure', postErr);
        return callback(postErr);
      }
      logger.info('Central Send Results Success', { elapsedSec });
      return callback(null, postResults);
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
