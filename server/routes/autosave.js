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
  const autosaveFilePath = path.join(
    GLOBAL.PATHS.FOLDERS.NOTEBOOKS,
    folderPath,
    autosaveName,
  );

  if (!validatePath(autosaveFilePath, "Autosave create", res)) {
    return;
  }

  // Turns the saveData into the valid JSON array expected by TipTap.
  const saveArray = [saveData];

  try {
    if (serverMaster.detailLogs) {
      logger.info({ Path: folderPath, Name: name }, "Writing autosave...");
    }

    fs.writeFileSync(autosaveFilePath, JSON.stringify(saveArray), "utf-8");

    if (serverMaster.successLogs) {
      logger.info({ Path: folderPath, Name: name }, "Created autosave.");
    }

    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json(
        error(
          "Autosave create",
          "Failed to create autosave.",
          { Path: folderPath, Name: name },
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
      "Autosave remove: Recieved request.",
    );
    logger.info("Validating path...");
  }

  const autosaveName = createAutosaveName(name);
  const autosaveFilePath = path.join(
    GLOBAL.PATHS.FOLDERS.NOTEBOOKS,
    folderPath,
    autosaveName,
  );

  if (!validatePath(autosaveFilePath, "Autosave create", res)) {
    return;
  }

  try {
    if (serverMaster.detailLogs) {
      logger.info(
        { Path: folderPath, Name: name },
        "Autosave remove: Deleting autosave...",
      );
    }
    fs.rmSync(
      path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, autosaveName),
    );

    if (serverMaster.successLogs) {
      logger.info(
        { Path: folderPath, Name: name },
        "Autosave remove: Removed autosave.",
      );
    }

    res.json({ success: true });
  } catch (err) {
    if (err.code === "ENOENT") {
      if (serverMaster.detailLogs) {
        logger.info(
          { Path: folderPath, Name: name },
          "Autosave remove: No autosave found.",
        );
      }
      res.status(204).json({ success: true });
      return;
    }
    res
      .status(500)
      .json(
        error(
          "Autosave remove",
          "Failed to remove autosave.",
          { Path: folderPath, Name: name },
          err,
        ),
      );
  }
});

router.get("/api/checkForAutosave", async (req, res) => {
  const { folderPath, name } = req.query;

  const autosaveName = createAutosaveName(name);
  const autosaveFilePath = path.join(
    GLOBAL.PATHS.FOLDERS.NOTEBOOKS,
    folderPath,
    autosaveName,
  );

  if (!validatePath(autosaveFilePath, "Autosave check", res)) {
    return;
  }

  try {
    if (fs.existsSync(autosaveFilePath)) {
      res.json({ success: true, autosaveExists: true });
    } else {
      res.json({ success: true, autosaveExists: false });
    }
  } catch (err) {
    res.status(500).json(
      error(
        "Autosave check",
        "Failed to check for autosave.",
        {
          Path: folderPath,
          Name: name,
        },
        err,
      ),
    );
  }
});

// Gets the data of an autosave.
router.get("/api/getAutosave", async (req, res) => {
  const { folderPath, name } = req.query;

  const autosaveName = createAutosaveName(name);

  if (serverMaster.detailLogs) {
    logger.info(
      { Path: folderPath, Name: autosaveName },
      "Recieved autosave get request.",
    );
    logger.info("Validating path...");
  }

  const autosaveFilePath = path.join(
    GLOBAL.PATHS.FOLDERS.NOTEBOOKS,
    folderPath,
    autosaveName,
  );

  if (!validatePath(autosaveFilePath, "Autosave get", res)) {
    return;
  }

  try {
    if (serverMaster.detailLogs) {
      logger.info(
        { Path: folderPath, Name: autosaveName },
        "Getting autosave data...",
      );
    }

    const rawAutosave = fs.readFileSync(path.join(autosaveFilePath), "utf-8");

    if (serverMaster.successLogs) {
      logger.info({ Path: folderPath, Name: autosaveName }, "Got autosave.");
    }
    if (serverMaster.detailLogs) {
      logger.info(
        { Path: folderPath, Name: autosaveName },
        "Sent autosave to Client.",
      );
    }

    res.json(JSON.parse(rawAutosave));
  } catch (err) {
    if (err.code === "ENOENT") {
      res.json(
        404,
        "Autosave get",
        "Failed to find autosave.",
        { Path: folderPath, Name: autosaveName },
        err,
      );
    } else {
      res.json(
        500,
        "Autosave get",
        "Failed to get autosave.",
        { Path: folderPath, Name: autosaveName },
        err,
      );
    }
  }
});

module.exports = router;
