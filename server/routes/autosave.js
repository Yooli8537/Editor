// Document autosaves
// Server imports
const { error } = require("console");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const serverMaster = require("../serverMaster");
const logger = require("../logger");

// Data paths
const rootPath = path.join(__dirname, "../../");
const dataFolderPath = path.join(rootPath, "data");
const autosavesFolderPath = path.join(dataFolderPath, "autosaves");
const masterFilePath = path.join(dataFolderPath, "master.json");

// Gets the master.json and returns it.
async function getMasterFile() {
  if (serverMaster.detailLogs) {
    logger.info("Getting master.json");
  }
  const rawMasterFile = await fs.readFileSync(masterFilePath, "utf-8");
  return JSON.parse(rawMasterFile);
}

// Adds unsaved filenames to the master.
async function addUnsavedToMaster(filename) {
  if (serverMaster.detailLogs) {
    logger.info(
      { Name: filename },
      "Adding unsaved filename to master.json...",
    );
  }
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
      if (serverMaster.successLogs) {
        logger.info(
          { Name: filename },
          "Added unsaved filename to master.json.",
        );
      }
      return true;
    } catch (err) {
      logger.error(
        { Name: filename, Error: err },
        "Failed to add unsaved filename to master.json.",
      );
      res.status(500).json({ error: err });
      return false;
    }
  } else {
    // Returns true if the file is already in the master.
    if (serverMaster.detailLogs) {
      logger.info(
        { Name: filename },
        "Filename is already in master.json. No changes made.",
      );
    }
    return true;
  }
}

// Creating an autosave
router.post("/api/autosave", async (req, res) => {
  const { saveData, folderPath, name } = req.body;
  // Turns the saveData into the valid JSON array expected by TipTap.
  const saveArray = [saveData];
  const autosaveFilePath = path.join(autosavesFolderPath, name); // Full path to the autosave file location.

  if (serverMaster.detailLogs) {
    logger.info(
      { Name: name, Path: folderPath },
      "Recieved autosave create request.",
    );
  }

  // If the file is successfully added to the unsavedFiles array, it creates the autosave.
  if (addUnsavedToMaster(name)) {
    try {
      if (serverMaster.detailLogs) {
        logger.info({ Name: name, Path: folderPath }, "Writing autosave...");
      }

      await fs.writeFileSync(
        autosaveFilePath,
        JSON.stringify(saveArray),
        "utf-8",
      );

      if (serverMaster.successLogs) {
        logger.info({ Name: name, Path: folderPath }, "Created autosave.");
      }

      res.json({ success: true });
    } catch (err) {
      logger.error(
        { Name: name, Path: folderPath, Error: err },
        "Failed to create autosave.",
      );
      res.status(500).json({ error: err });
    }
  }
});

// Removes autosave from the server.
router.delete("/api/removeAutosave", async (req, res) => {
  const { name } = req.body;

  if (serverMaster.detailLogs) {
    logger.info({ Name: name }, "Recieved autosave delete request.");
  }

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
    if (serverMaster.detailLogs) {
      logger.info(
        { Name: name },
        "Removing saved filename from master.json...",
      );
    }

    // Updates master.json on the fs.
    await fs.writeFileSync(masterFilePath, JSON.stringify(masterFile), "utf-8");

    if (serverMaster.detailLogs) {
      logger.info({ Name: name }, "Removed saved filename from master.json.");
      logger.info({ Name: name }, "Deleting autosave...");
    }

    await fs.rmSync(path.join(autosavesFolderPath, name));
  } catch (err) {
    logger.error({ Name: name, Error: err }, "Failed to delete autosave.");
    res.status(500).json({ error: err });
  }

  if (serverMaster.successLogs) {
    logger.info({ Name: name }, "Deleted autosave.");
  }

  res.json({ success: true });
});

// Gets the data of an autosave.
router.get("/api/getAutosave", async (req, res) => {
  const { name } = req.query;

  if (serverMaster.detailLogs) {
    logger.info({ Name: name }, "Recieved autosave get request.");
  }

  try {
    if (serverMaster.detailLogs) {
      logger.info({ Name: name }, "Getting autosave data...");
    }

    const rawAutosave = await fs.readFileSync(
      path.join(autosavesFolderPath, name),
      "utf-8",
    );

    if (serverMaster.successLogs) {
      logger.info({ Name: name }, "Got autosave.");
    }
    if (serverMaster.detailLogs) {
      logger.info({ Name: name }, "Sent autosave to Client.");
    }

    res.json(JSON.parse(rawAutosave));
  } catch (err) {
    if (err.code === "ENOENT") {
      logger.error({ Name: name, Error: err }, "Failed to find autosave.");
      res.status(404).json({ error: "Couldn't find autosave." });
    } else {
      logger.error({ Name: name, Error: err }, "Failed to get autosave.");
      res.status(500).json({ error: err });
    }
  }
});

module.exports = router;
