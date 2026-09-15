// Document autosaves
// Server imports
const GLOBAL = require("../utils/global");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const serverMaster = require(GLOBAL.PATHS.UTILS.MASTER);
const logger = require(GLOBAL.PATHS.UTILS.LOGGER);
const error = require(GLOBAL.PATHS.UTILS.ERROR);
const validatePath = require(GLOBAL.PATHS.UTILS.VALIDATE_PATH);

// Gets the master.json and returns it.
async function getMasterFile() {
  if (serverMaster.detailLogs) {
    logger.info("Getting master.json");
  }
  try {
    const rawMasterFile = fs.readFileSync(GLOBAL.PATHS.FILES.MASTERFILE, "utf-8");
    return JSON.parse(rawMasterFile);
  } catch (err) {
    error("Get master.json", "Failed to read master.json.", {}, err);
  }
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
      fs.writeFileSync(GLOBAL.PATHS.FILES.MASTERFILE, JSON.stringify(masterFile), "utf-8");
      if (serverMaster.successLogs) {
        logger.info(
          { Name: filename },
          "Added unsaved filename to master.json.",
        );
      }
      return true;
    } catch (err) {
      res
        .status(500)
        .json(
          error(
            "Add unsaved filename to master.json",
            "Failed to add unsaved filename to master.json.",
            { "Full path": filename },
            err,
          ),
        );
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
  const { saveData, name } = req.body;

  if (serverMaster.detailLogs) {
    logger.info({ Path: name }, "Validating path...");
  }

  const dirPath = path.join(GLOBAL.PATHS.FOLDERS.AUTOSAVE, name);

  if (!validatePath(dirPath)) {
    res
      .status(403)
      .json(
        error(
          "Autosave create",
          "Recieved invalid path.",
          { Name: name },
          null,
        ),
      );
    return;
  }

  // Turns the saveData into the valid JSON array expected by TipTap.
  const saveArray = [saveData];
  const autosaveFilePath = path.join(GLOBAL.PATHS.FOLDERS.AUTOSAVE, name); // Full path to the autosave file location.

  if (serverMaster.detailLogs) {
    logger.info({ Name: name }, "Recieved autosave create request.");
  }

  // If the file is successfully added to the unsavedFiles array, it creates the autosave.
  if (addUnsavedToMaster(name)) {
    try {
      if (serverMaster.detailLogs) {
        logger.info({ Name: name }, "Writing autosave...");
      }

      fs.writeFileSync(autosaveFilePath, JSON.stringify(saveArray), "utf-8");

      if (serverMaster.successLogs) {
        logger.info({ Name: name }, "Created autosave.");
      }

      res.json({ success: true });
    } catch (err) {
      res
        .status(500)
        .json(
          error(
            "Autosave create",
            "Failed to create autosave.",
            { Name: name },
            err,
          ),
        );
    }
  }
});

// Removes autosave from the server.
router.delete("/api/removeAutosave", async (req, res) => {
  const { name } = req.body;

  if (serverMaster.detailLogs) {
    logger.info({ Name: name }, "Recieved autosave delete request.");
    logger.info({ Path: name }, "Validating path...");
  }

  const dirPath = path.join(GLOBAL.PATHS.FOLDERS.AUTOSAVE, name);

  if (!validatePath(dirPath)) {
    res
      .status(403)
      .json(
        error(
          "Autosave delete",
          "Recieved invalid path.",
          { Name: name },
          null,
        ),
      );
    return;
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
    fs.writeFileSync(GLOBAL.PATHS.FILES.MASTERFILE, JSON.stringify(masterFile), "utf-8");

    if (serverMaster.detailLogs) {
      logger.info({ Name: name }, "Removed saved filename from master.json.");
      logger.info({ Name: name }, "Deleting autosave...");
    }

    fs.rmSync(path.join(GLOBAL.PATHS.FOLDERS.AUTOSAVE, name));
  } catch (err) {
    res
      .status(500)
      .json(
        error(
          "Autosave remove",
          "Failed to remove autosave.",
          { Name: name },
          err,
        ),
      );
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
    logger.info({ Path: name }, "Validating path...");
  }

  const dirPath = path.join(GLOBAL.PATHS.FOLDERS.AUTOSAVE, name);

  if (!validatePath(dirPath)) {
    res
      .status(403)
      .json(
        error("Autosave get", "Recieved invalid path.", { Name: name }, null),
      );
    return;
  }

  try {
    if (serverMaster.detailLogs) {
      logger.info({ Name: name }, "Getting autosave data...");
    }

    const rawAutosave = fs.readFileSync(
      path.join(GLOBAL.PATHS.FOLDERS.AUTOSAVE, name),
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
      res.json(
        404,
        "Autosave get",
        "Failed to find autosave.",
        { Name: name },
        err,
      );
    } else {
      res.json(
        500,
        "Autosave get",
        "Failed to get autosave.",
        { Name: name },
        err,
      );
    }
  }
});

module.exports = router;
