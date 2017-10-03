const fs = require('fs');
const path = require('path');
const winston = require('winston');

/**
 * Initializes the logger (console & file).
 */
const init = (config) => {
  const logDir = path.dirname(config.file.filename);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const logger = new (winston.Logger)({
    transports: [
      new winston.transports.Console(config.console),
      new winston.transports.File(config.file),
    ],
    exitOnError: false,
  });

  return logger;
};

module.exports = {
  init,
};
