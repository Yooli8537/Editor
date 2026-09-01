// Creates the JSON for server-side errors.
// This way, only res.json() is needed, and all logging is taken care of.
const logger = require("./logger");

// createError(404, "Not found", { name: "Example.json" });
function createErrorJSON(
  status,
  operation,
  errorMsg,
  reqestValues,
  detailError,
) {
  logger.error(
    {
      Status: status,
      "Request values": reqestValues,
      "Detailed Error": detailError,
    },
    `${operation}: ${errorMsg}`,
  );

  return {
    Operation: operation,
    "Error Message": errorMsg,
    Status: status,
    "Request values": reqestValues,
  };
}

module.exports = createErrorJSON;
