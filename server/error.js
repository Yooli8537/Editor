// Creates the JSON for server-side errors.
// This way, only res.json() is needed, and all logging is taken care of.
const logger = require("./logger");
const serverMaster = require("./serverMaster");

// createError(404, "Not found", { name: "Example.json" });
function createErrorJSON(
  status,
  operation,
  errorMsg,
  reqestValues,
  detailError,
) {
  if (!detailError || !serverMaster.logErrorDetails) {
    logger.error(
      {
        Status: status,
        "Request values": reqestValues,
      },
      `${operation}: ${errorMsg}`,
    );
  } else {
    logger.error(
      {
        Status: status,
        "Request values": reqestValues,
        "Detailed Error": detailError,
      },
      `${operation}: ${errorMsg}`,
    );
  }

  return {
    Operation: operation,
    "Error Message": errorMsg,
    Status: status,
    "Request values": reqestValues,
  };
}

module.exports = createErrorJSON;
