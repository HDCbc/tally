/**
 * The interface to all configuration values.
 */
const dotenv = require('dotenv');
const nconf = require('nconf');

/**
 * Loads all of the configuration values used by the application from various sources
 * and ensures that required values are specified.
 */
const init = () => {
  // Load the environment variables from project/.env first.
  // Note that this will not override pre-existing env variables.
  dotenv.load();

  nconf.use('memory');
  // 1. Command-line arguments are top priority.
  nconf.argv();
  // 2. Environment variables are middle priority.
  nconf.env();
  // 3. Values from config file are lowest priority.
  nconf.file({ file: `config/${nconf.get('NODE_ENV')}.json` });
  // 4. Defaults are very lowest priority.
  nconf.defaults({
    logger: {
      console: {
        level: 'info',
      },
      file: {
        filename: 'logs/log',
      },
    },
    morgan: {
      format: 'tiny',
      options: {},
    },
  });

  // If the following variables are not specified then an error will be thrown.
  nconf.required([
    'db:database',
    'db:user',
    'db:password',
  ]);

  return nconf;
};

module.exports = {
  init,
};
