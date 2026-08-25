// Setting up Pino logger
const pino = require("pino");

const logger = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname",
      levelFirst: false,
    },
  },
});

module.exports = logger;
