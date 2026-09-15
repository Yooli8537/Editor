// Creates the JSON for server-side errors.
// This way, only res.json() is needed, and all logging is taken care of.
const GLOBAL = require("./global");
const logger = require(GLOBAL.PATHS.UTILS.LOGGER);
const serverMaster = require(GLOBAL.PATHS.UTILS.MASTER);

function createErrorJSON(operation, errorMsg, reqestValues, detailError) {
  if (!detailError || !serverMaster.logErrorDetails) {
    logger.error(
      { "Request values": reqestValues },
      `${operation}: ${errorMsg}`,
    );
  } else {
    logger.error(
      { "Request values": reqestValues, "Detailed Error": detailError },
      `${operation}: ${errorMsg}`,
    );
  }

  // Doesn't give back detailed error because it isn't necessary.
  return {
    operation: operation,
    errorMsg: errorMsg,
    requestValues: reqestValues,
  };
}

module.exports = createErrorJSON;
