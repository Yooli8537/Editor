// Document autosaves
// Server imports
const { error } = require("console");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Data paths
const rootPath = path.join(__dirname, "../../");
const dataFolderPath = path.join(rootPath, "data");
const autosavesFolderPath = path.join(dataFolderPath, "autosaves");
const masterFilePath = path.join(dataFolderPath, "master.json");

// Gets the masterfile and returns it.
async function getMasterFile() {
  const rawMasterFile = await fs.readFileSync(masterFilePath, "utf-8");
  return JSON.parse(rawMasterFile);
}

// Adds unsaved filenames to the master.
async function addUnsavedToMaster(filename) {
  let masterFile = await getMasterFile();
  let unsavedFiles = masterFile[0].unsavedFiles; // Adds file to unsavedFiles array.
  let addFile = true;

  // If the filename is already included within the array, it isn't added again.
  for (let i = 0; i < unsavedFiles.length; i++) {
    if (unsavedFiles[i] === filename) {
      addFile = false;
    }
  }

  if (addFile) {
    // Updates variable copy of master.json with new data.
    unsavedFiles.push(filename);
    masterFile[0].unsavedFiles = unsavedFiles;
    try {
      // Updates master.json on the fs.
      await fs.writeFileSync(
        masterFilePath,
        JSON.stringify(masterFile),
        "utf-8",
      );
      console.log("Successfully added unsaved filename to master.json.");
      return true;
    } catch (err) {
      console.error("Failed to add unsaved filename to master.json.");
      console.error(err);
      res.status(500).json({ error: err });
      return false;
    }
  } else {
    // Returns true if the file is already in the master.
    return true;
  }
}

// Creating an autosave
router.post("/api/autosave", async (req, res) => {
  const { saveData, folderPath, name } = req.body;
  // Turns the saveData into the valid JSON array expected by TipTap.
  const saveArray = [saveData];
  const autosaveFilePath = path.join(autosavesFolderPath, name); // Full path to the autosave file location.

  // If the file is successfully added to the unsavedFiles array, it creates the autosave.
  if (addUnsavedToMaster(name)) {
    try {
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
  }
});

// Removes autosave from the server.
router.delete("/api/removeAutosave", async (req, res) => {
  const { name } = req.body;

  let masterFile = await getMasterFile();
  let unsavedFiles = masterFile[0].unsavedFiles;

  // Removes the saved file from the unsavedFiles array within master.json
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

// Gets the data of an autosave.
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
