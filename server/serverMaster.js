// Server Side Master Data (basically another state.js)
// Server imports
const fs = require("fs");
const path = require("path");

// Data paths
const rootPath = path.join(__dirname, "../");
const dataFolderPath = path.join(rootPath, "data");
const masterFilePath = path.join(dataFolderPath, "master.json");

// Gets the masterfile and makes it available to the entire server.
const serverMasterObject = JSON.parse(fs.readFileSync(masterFilePath, "utf-8"));
const serverMaster = serverMasterObject[0];

module.exports = serverMaster;
