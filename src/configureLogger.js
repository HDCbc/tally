const _ = require('lodash');
const moment = require('moment-timezone');
// const fs = require('fs');
// const moment = require('moment');
// const path = require('path');
const printf = require('printf');
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
    timezone,
  } = config;

  winston.configure({
    level,
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.metadata(),
          winston.format.timestamp({ format: () => moment.tz(timezone).format('YYYY-MM-DD hh:mm:ss z') }),
          winston.format.printf((info) => printf('%s  %-15s %-30s %s', info.timestamp, info.level, info.message, info.metadata && Object.keys(info.metadata).length ? JSON.stringify(info.metadata) : '')), // (info.meta && Object.keys(info.meta).length ? ` ${JSON.stringify(info.meta)}` : ''))),
        ),
      }),
    ],
    exitOnError: false,
  });

  if (filename) {
    winston.add(
      new winston.transports.File({
        filename,
        maxsize,
        maxFiles,
        tailable,
        zippedArchive,
        format: winston.format.combine(
          winston.format.metadata(),
          winston.format.timestamp({ format: () => moment.tz(timezone).format('YYYY-MM-DD hh:mm:ss z') }),
          winston.format.printf((info) => printf('%s  %-6s %-30s %s', info.timestamp, info.level, info.message, info.metadata && Object.keys(info.metadata).length ? JSON.stringify(info.metadata) : '')), // (info.meta && Object.keys(info.meta).length ? ` ${JSON.stringify(info.meta)}` : ''))),
        ),
      }),
    );
  }

  winston.log = expandErrors(winston);
});
