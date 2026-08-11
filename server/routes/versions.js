// Autosaves & Document versions
const { error } = require("console");
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
  const saveArray = [saveData];
  const autosaveFilePath = path.join(autosavesFolderPath, name); // Full path to the autosave file location.

  let masterFile = await getMasterFile();
  let unsavedFiles = masterFile[0].unsavedFiles;
  let addFileName = true;

  for (let i = 0; i < unsavedFiles.length; i++) {
    // If the name of the file is already included within the array, it doesn't have to be added again.
    if (unsavedFiles[i] === name) {
      addFileName = false;
    }
  }

  if (addFileName) {
    // Updates variable copy of master.json with new data.
    unsavedFiles.push(name);
    masterFile[0].unsavedFiles = unsavedFiles;
    try {
      // Updates master.json on the fs.
      await fs.writeFileSync(
        masterFilePath,
        JSON.stringify(masterFile),
        "utf-8",
      );
      console.log("Successfully added unsaved filename to master.json.");
    } catch (err) {
      console.error("Failed to add unsaved filename to master.json.");
      console.error(err);
      res.status(500).json({ error: err });
    }
  }

  try {
    // Creates the autosave
    await fs.writeFileSync(
      autosaveFilePath,
      JSON.stringify(saveArray),
      "utf-8",
    );
    console.log("Successfully created autosave.");
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to create autosave.");
    console.error(err);
    res.status(500).json({ error: err });
  }
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
    await fs.writeFileSync(masterFilePath, JSON.stringify(masterFile), "utf-8");
    console.log("Successfully removed filename from master.json.");

    await fs.rmSync(path.join(autosavesFolderPath, name));
  } catch (err) {
    console.error("Failed to remove autosave.");
    console.error(err);
    res.status(500).json({ error: err });
  }

  res.json({ success: true });
});

router.get("/api/getAutosave", async (req, res) => {
  const { name } = req.query;

  try {
    const rawAutosave = await fs.readFileSync(
      path.join(autosavesFolderPath, name),
      "utf-8",
    );
    res.json(JSON.parse(rawAutosave));
  } catch (err) {
    if (err.code === "ENOENT") {
      res.status(404).json({ error: "Couldn't find autosave." });
    } else {
      res.status(500).json({ error: err });
    }
  }
});

module.exports = router;
