// Server Side Master Data (basically another state.js)
// Server imports
const fs = require("fs");
const GLOBAL = require("./utils/global");

// Gets the masterfile and makes it available to the entire server.
const serverMasterObject = JSON.parse(fs.readFileSync(GLOBAL.PATHS.FILES.MASTERFILE, "utf-8"));
const serverMaster = serverMasterObject[0];

module.exports = serverMaster;
