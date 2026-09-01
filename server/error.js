// Creates the JSON for server-side errors.
// This way, only res.json() is needed, and all logging is taken care of.
const logger = require("./logger");
const serverMaster = require("./serverMaster");

function createErrorJSON(operation, errorMsg, reqestValues, detailError) {
  if (!detailError || !serverMaster.logErrorDetails) {
    logger.error(
      {
        "Request values": reqestValues,
      },
      `${operation}: ${errorMsg}`,
    );
  } else {
    logger.error(
      {
        "Request values": reqestValues,
        "Detailed Error": detailError,
      },
      `${operation}: ${errorMsg}`,
    );
  }

  // Doesn't give back detailed error because it isn't necessary.
  return {
    Operation: operation,
    "Error Message": errorMsg,
    "Request values": reqestValues,
  };
}

module.exports = createErrorJSON;
