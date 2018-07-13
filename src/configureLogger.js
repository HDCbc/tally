const _ = require('lodash');
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const printf = require('printf');
const winston = require('winston');

// Extend a winston by making it expand errors when passed in as the
// second argument (the first argument is the log level).
function expandErrors(currLogger) {
  const originalLogFunc = currLogger.log;
  // const newLogger = Object.assign({}, currLogger);
  function log() {
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

  console.log('Config', config);

  const createFormatter = () => {
    const formatter = (options) => {
      const time = moment().format('YYYY-MM-DD HH:mm:ss');
      const lvl = options.level.toUpperCase();
      const message = options.message ? options.message : '';
      const meta = options.meta && Object.keys(options.meta).length ? ` ${JSON.stringify(options.meta)}` : '';
      return printf('%s %-5s %-30s %s', time, lvl, message, meta);
    };
    return formatter;
  };

  const createFileTransport = () => {
    // TODO - what about recursive directories? // WHAT IF IT FAILS!!!!!!!

    // Create the log directory if it does not already exist
    // Because Winston is too lazy to do it. Thanks Winston.
    if (!fs.existsSync(path.dirname(filename))) {
      fs.mkdirSync(path.dirname(filename));
    }

    return new winston.transports.File({
      formatter: createFormatter(),
      filename,
      maxsize,
      maxFiles,
      tailable,
      zippedArchive,
      json: false,
    });
  };

  const createConsoleTransport = () => new (winston.transports.Console)({
    colorize: true,
    formatter: createFormatter(),
  });

  winston.configure({
    level,

    transports: [
      createConsoleTransport(),
      createFileTransport(),
    ],
  });

  winston.log = expandErrors(winston);
});
