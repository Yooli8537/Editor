// Autosaves & Document versions

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const rootPath = path.join(__dirname, "../../");
const dataFolderPath = path.join(rootPath, "data");
const autosavesFolderPath = path.join(dataFolderPath, "autosaves");
const notebooksFolderPath = path.join(dataFolderPath, "notebooks");
const imageFolderPath = path.join(dataFolderPath, "images");
const attachmentsFolderPath = path.join(dataFolderPath, "attachments");
const masterFilePath = path.join(dataFolderPath, "master.json");

router.post("/api/autosave", async (req, res) => {
  console.log("AUTOSAVE REQUESTED");
});

module.exports = router;
