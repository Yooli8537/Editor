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
  const { saveData, folderPath, name } = req.body;
  const fullFilePath = path.join(folderPath, name); // Full path of the file from the notebooks folder onwards.
  const autosaveFolderPath = path.join(autosavesFolderPath, folderPath); // Full path to the autosave folder location
  const autosaveFilePath = path.join(autosaveFolderPath, name); // Full path to the autosave file location

  let masterFile = await getMasterFile();
  let unsavedFiles = masterFile[0].unsavedFiles;
  let createAutosave = true;

  for (let i = 0; i < unsavedFiles.length; i++) {
    // If the name of the file is already included within the array, it doesn't have to be added again.
    if (unsavedFiles[i] === fullFilePath) {
      createAutosave = false;
    }
  }

  if (createAutosave) {
    // Updates variable copy of master.json with new data.
    unsavedFiles.push(fullFilePath);
    masterFile[0].unsavedFiles = unsavedFiles;

    console.log("TEST");
    try {
      // Updates master.json on the fs.
      await fs.writeFileSync(
        masterFilePath,
        JSON.stringify(masterFile),
        "utf-8",
      );
      console.log("Successfully added unsaved filename to master.json.");

      // Creates the autosave folder & file
      await fs.mkdirSync(autosaveFolderPath);
      await fs.writeFileSync(
        autosaveFilePath,
        JSON.stringify(saveData),
        "utf-8",
      );
      console.log("Successfully created autosave.");
      res.json({ success: true });
    } catch (err) {
      if (err.code === "EEXIST") {
        await fs.writeFileSync(
          autosaveFilePath,
          JSON.stringify(saveData),
          "utf-8",
        );
      }
      console.error("Failed to create autosave.");
      console.error(err);
      res.status(500).json({ error: err });
    }
  } else {
    res.json({ success: true });
  }
});

router.delete("/api/removeAutosave", async (req, res) => {
  const { folderPath, name } = req.body;
  const fullFilePath = path.join(folderPath, name); // Full path to the file

  let masterFile = await getMasterFile();
  let unsavedFiles = masterFile[0].unsavedFiles;

  // Removed the saved file from the unsavedFiles array within master.json
  const removeIndex = unsavedFiles.indexOf(fullFilePath);
  if (removeIndex > -1) {
    unsavedFiles.splice(removeIndex, 1);
  }

  // Updates variable copy of master.json with new data.
  masterFile[0].unsavedFiles = unsavedFiles;

  try {
    // Updates master.json on the fs.
    await fs.writeFileSync(masterFilePath, JSON.stringify(masterFile), "utf-8");
    console.log("Successfully removed filename from master.json.");

    await fs.rmSync(path.join(autosavesFolderPath, fullFilePath));
    await fs.rmdirSync(path.join(autosavesFolderPath, folderPath));
  } catch (err) {
    console.error("Failed to remove filename from master.json.");
    console.error(err);
    res.status(500).json({ error: err });
  }

  res.json({ success: true });
});

module.exports = router;
