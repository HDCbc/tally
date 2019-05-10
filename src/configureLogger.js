const _ = require('lodash');
// const fs = require('fs');
// const moment = require('moment');
// const path = require('path');
// const printf = require('printf');
const winston = require('winston');

// Extend a winston by making it expand errors when passed in as the
// second argument (the first argument is the log level).
function expandErrors(currLogger) {
  const originalLogFunc = currLogger.log;
  // const newLogger = Object.assign({}, currLogger);
  function log() {
    // eslint-disable-next-line prefer-rest-params
    const args = Array.prototype.slice.call(arguments, 0);
    // TODO This will only work if the 3rd argument (the first is the level) is an Error.
    if (args.length >= 3 && args[2] instanceof Error) {
      const allPropNames = Object.getOwnPropertyNames(args[2]);
      const expanded = {};

      _.each(allPropNames, (p) => {
        if (p !== 'stack') {
          expanded[p] = args[2][p];
        }
      });
      args[2] = expanded;
    }
    return originalLogFunc.apply(this, args);
  }
  return log;
}

module.exports = ((config) => {
  const {
    level,
    filename,
    maxsize,
    maxFiles,
    tailable,
    zippedArchive,
  } = config;
  // eslint-disable-next-line no-console
  console.log('Config', config);

  winston.configure({
    level,
    filename,
    maxsize,
    maxFiles,
    tailable,
    zippedArchive,
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(info => `[${info.timestamp}]  ${info.level} \t [${info.elapsedSec}] || [] \t ${info.message} \t\t [${info.meta}]`),
        ),
      }),
    ],
    exitOnError: false,
  });

  winston.log = expandErrors(winston);
});
