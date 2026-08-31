// Setting up Pino logger
const pino = require("pino");
const path = require("path");

const serverMaster = require("./serverMaster");

// Gets date and time of server start.
const currentdate = new Date();
let year = currentdate.getFullYear();
let month = currentdate.getMonth() + 1;
let day = currentdate.getDate();
let hour = currentdate.getHours();
let minutes = currentdate.getMinutes();
let seconds = currentdate.getSeconds();

// Adding a 0 whenever there's no
if (month < 10) {
  month = `0${month}`;
}
if (day < 10) {
  day = `0${day}`;
}
if (hour < 10) {
  hour = `0${hour}`;
}
if (minutes < 10) {
  minutes = `0${minutes}`;
}
if (seconds < 10) {
  seconds = `0${seconds}`;
}

const logPath = path.join(
  __dirname,
  `../logs/${year}-${month}-${day}-${hour}-${minutes}-${seconds}.log`,
);

let logger;
if (serverMaster.saveLogs) {
  const transport = pino.transport({
    targets: [
      {
        target: "pino/file",
        options: { destination: logPath },
      },
      {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
          levelFirst: false,
        },
      },
    ],
  });
  logger = pino(transport);
} else {
  logger = pino({
    level: "info",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname",
        levelFirst: false,
      },
    },
  });
}

module.exports = logger;
