/**
 * Main initialization script that pulls the various components together.
 */
const config = require('./config.js');
const logger = require('./logger.js');
const central = require('./central.js');
const database = require('./database.js');
const app = require('./app.js');

// Load all of the configuration values.
const cfg = config.init();

// Configure the logger.
const log = logger.init(cfg.get('log'));

log.info('info test');

// Initialize the database
database.init(cfg.get('db'), log, (dbErr, pool) => {
  if (dbErr) {
    log.error('Unable to initialize database', dbErr);
    process.exit(1);
    return;
  }

  central.init(cfg.get('central'), log, (centralErr) => {
    if (centralErr) {
      log.error('Unable to initialize central', centralErr);
      process.exit(1);
    }

    app.init(log, central, pool, (appErr) => {
      if (appErr) {
        log.error('Unable to initialize app', appErr);
        process.exit(1);
      }
      app.run((runErr) => {
        if (runErr) {
          log.error('Unable to run app', runErr);
          process.exit(1);
        }
      });
    });
  });
});
