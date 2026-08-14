// Settings page
// Server imports
const { error } = require("console");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Data paths
const rootPath = path.join(__dirname, "../../");
const dataFolderPath = path.join(rootPath, "data");
const masterFilePath = path.join(dataFolderPath, "master.json");

module.exports = router;
