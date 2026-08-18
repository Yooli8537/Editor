// Server Side Master Data (basically another state.js)
// Server imports
const fs = require("fs");
const path = require("path");

// Data paths
const rootPath = path.join(__dirname, "../");
const dataFolderPath = path.join(rootPath, "data");
const masterFilePath = path.join(dataFolderPath, "master.json");

// Gets the masterfile and makes it available to the entire server.
const serverMaster = JSON.parse(fs.readFileSync(masterFilePath, "utf-8"));

console.log(serverMaster);

module.exports = serverMaster;
