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

async function getMasterFile() {
  const rawMasterFile = await fs.readFileSync(masterFilePath, "utf-8");
  return JSON.parse(rawMasterFile);
}

router.post("/api/autosave", async (req, res) => {
  const { saveData, path, name } = req.body;

  let masterFile = await getMasterFile();
  let unsavedFiles = masterFile[0].unsavedFiles;
  let saveNameToArray = true;

  for (let i = 0; i < unsavedFiles.length; i++) {
    // If the name of the file is already included within the array, it doesn't have to be added again.
    if (unsavedFiles[i] === name) {
      saveNameToArray = false;
    }
  }

  if (saveNameToArray) {
    // Updates variable copy of master.json with new data.
    unsavedFiles.push(name);
    masterFile[0].unsavedFiles = unsavedFiles;

    try {
      // Updates master.json on the fs.
      fs.writeFileSync(masterFilePath, JSON.stringify(masterFile), "utf-8");
      console.log("Successfully added unsaved filename to master.json.");
    } catch (err) {
      console.error("Failed to add unsaved filename to master.json.");
      console.error(err);
      res.status(500).json({ error: err });
    }
  }

  res.json({ success: true });
});

router.delete("/api/removeAutosave", async (req, res) => {
  const { name } = req.body;

  let masterFile = await getMasterFile();
  let unsavedFiles = masterFile[0].unsavedFiles;

  // Removed the saved file from the unsavedFiles array within master.json
  const removeIndex = unsavedFiles.indexOf(name);
  if (removeIndex > -1) {
    unsavedFiles.splice(removeIndex, 1);
  }

  // Updates variable copy of master.json with new data.
  masterFile[0].unsavedFiles = unsavedFiles;

  try {
    // Updates master.json on the fs.
    fs.writeFileSync(masterFilePath, JSON.stringify(masterFile), "utf-8");
    console.log("Successfully added unsaved filename to master.json.");
  } catch (err) {
    console.error("Failed to add unsaved filename to master.json.");
    console.error(err);
    res.status(500).json({ error: err });
  }

  res.json({ success: true });
});

module.exports = router;
