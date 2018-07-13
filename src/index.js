/**
 * Main initialization script that pulls the various components together.
 */
const config = require('./config.js');
const configureLogger = require('./configureLogger');

const central = require('./central.js');
const database = require('./database.js');
const app = require('./app.js');

// Load all of the configuration values.
const cfg = config.init();

configureLogger(cfg.get('logger'));

// Dont get the logger until after it is configured.
const logger = require('winston');

// Initialize the database
database.init(cfg.get('db'), (dbErr, pool) => {
  if (dbErr) {
    logger.error('Unable to initialize database', dbErr);
    process.exit(1);
    return;
  }

  central.init(cfg.get('central'), (centralErr) => {
    if (centralErr) {
      logger.error('Unable to initialize central', centralErr);
      process.exit(1);
    }

    app.init(central, pool, (appErr) => {
      if (appErr) {
        logger.error('Unable to initialize app', appErr);
        process.exit(1);
      }
      app.run(cfg.get('app'), (runErr) => {
        if (runErr) {
          logger.error('Unable to run app', runErr);
          process.exit(1);
        }
      });
    });
  });
});
