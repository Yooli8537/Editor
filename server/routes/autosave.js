// Document autosaves
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
    const rawMasterFile = fs.readFileSync(
      GLOBAL.PATHS.FILES.MASTERFILE,
      "utf-8",
    );
    return JSON.parse(rawMasterFile);
  } catch (err) {
    error("Get master.json", "Failed to read master.json.", {}, err);
  }
}

function createAutosaveName(filename) {
  let autosaveName = filename.slice(0, -5);
  autosaveName += ".autosave.json";
  return autosaveName;
}

// Creating an autosave
router.post("/api/autosave", async (req, res) => {
  const { saveData, folderPath, name } = req.body;
  //folderPath ends in /
  //name ends in .json

  if (serverMaster.detailLogs) {
    logger.info(
      { Path: folderPath, Name: name },
      "Recieved autosave create request.",
    );
    logger.info("Validating path...");
  }

  const autosaveName = createAutosaveName(name);

  const dirPath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, name);

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
  const autosaveFilePath = path.join(
    GLOBAL.PATHS.FOLDERS.NOTEBOOKS,
    folderPath,
    autosaveName,
  );

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
});

// Removes autosave from the server.
router.delete("/api/removeAutosave", async (req, res) => {
  const { folderPath, name } = req.body;

  if (serverMaster.detailLogs) {
    logger.info(
      { Path: folderPath, Name: name },
      "Recieved autosave delete request.",
    );
    logger.info("Validating path...");
  }

  logger.info({
    Notebooks: GLOBAL.PATHS.FOLDERS.NOTEBOOKS,
    Path: folderPath,
    Name: name,
  });
  const dirPath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, name);

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

  try {
    if (serverMaster.detailLogs) {
      logger.info({ Name: name }, "Deleting autosave...");
    }

    const autosaveName = createAutosaveName(name);
    fs.rmSync(
      path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, autosaveName),
    );

    if (serverMaster.successLogs) {
      logger.info({ Name: name }, "Deleted autosave.");
    }

    res.json({ success: true });
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
});

// Gets the data of an autosave.
router.get("/api/getAutosave", async (req, res) => {
  const { name } = req.query;

  if (serverMaster.detailLogs) {
    logger.info({ Name: name }, "Recieved autosave get request.");
    logger.info({ Path: name }, "Validating path...");
  }

  const dirPath = path.join(GLOBAL.PATHS.FOLDERS.AUTOSAVES, name);

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
      path.join(GLOBAL.PATHS.FOLDERS.AUTOSAVES, name),
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
