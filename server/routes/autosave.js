// Document autosaves
const GLOBAL = require("../utils/global");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const serverMaster = require(GLOBAL.PATHS.UTILS.MASTER);
const log = require(GLOBAL.PATHS.UTILS.LOGGER);
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

  log.detail("Autosave create", "Recieved request.", { Path: folderPath, Name: name });

  const autosaveName = createAutosaveName(name);
  const autosaveFilePath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, autosaveName);

  if (!validatePath(autosaveFilePath, "Autosave create", res)) {
    return;
  }

  // Turns the saveData into the valid JSON array expected by TipTap.
  const saveArray = [saveData];

  try {
    log.detail("Autosave create", "Creating autosave...", { Path: folderPath, Name: name });
    fs.writeFileSync(autosaveFilePath, JSON.stringify(saveArray), "utf-8");
    log.success("Autosave create", "Created autosave.", { Path: folderPath, Name: name });

    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json(error("Autosave create", "Failed to create autosave.", { Path: folderPath, Name: name }, err));
  }
});

// Removes autosave from the server.
router.delete("/api/removeAutosave", async (req, res) => {
  const { folderPath, name } = req.body;

  log.detail("Autosave remove", "Recieved request.", { Path: folderPath, Name: name });

  const autosaveName = createAutosaveName(name);
  const autosaveFilePath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, autosaveName);

  if (!validatePath(autosaveFilePath, "Autosave create", res)) {
    return;
  }

  try {
    log.detail("Autosave remove", "Deleting autosave...", { Path: folderPath, Name: name });
    fs.rmSync(path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, autosaveName));

    log.detail("Autosave remove", "Removed autosave.", { Path: folderPath, Name: name });

    res.json({ success: true });
  } catch (err) {
    if (err.code === "ENOENT") {
      log.detail("Autosave remove", "No autosave found.", { Path: folderPath, Name: name });
      res.status(204).json({ success: true });
      return;
    }
    res
      .status(500)
      .json(error("Autosave remove", "Failed to remove autosave.", { Path: folderPath, Name: name }, err));
  }
});

router.get("/api/checkForAutosave", async (req, res) => {
  const { folderPath, name } = req.query;
  const autosaveName = createAutosaveName(name);
  log.detail("Autosave check", "Recieved request.", { Path: folderPath, Name: name });

  const autosaveFilePath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, autosaveName);

  if (!validatePath(autosaveFilePath, "Autosave check", res)) {
    return;
  }

  try {
    log.detail("Autosave check", "Reading file path...", { Path: folderPath, Name: name });
    if (fs.existsSync(autosaveFilePath)) {
      log.success("Autosave check", "Autosave file found.", { Path: folderPath, Name: name });
      res.json({ success: true, autosaveExists: true });
    } else {
      log.success("Autosave check", "No autosave file found.");
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
          "Autosave Name": autosaveName,
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
  log.detail("Autosave get", "Recieved request.", { Path: folderPath, Name: name });

  const autosaveFilePath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, autosaveName);

  if (!validatePath(autosaveFilePath, "Autosave get", res)) {
    return;
  }

  try {
    log.detail("Autosave get", "Getting autosave data...", { Path: folderPath, Name: name });

    const rawAutosave = fs.readFileSync(path.join(autosaveFilePath), "utf-8");

    log.success("Autosave get", "Got autosave.", { Path: folderPath, Name: name });
    log.detail("Autosave get", "Sent autosave to Client.", { Path: folderPath, Name: name });
    res.json(JSON.parse(rawAutosave));
  } catch (err) {
    if (err.code === "ENOENT") {
      res.json(404, "Autosave get", "Failed to find autosave.", { Path: folderPath, Name: name }, err);
    } else {
      res.json(500, "Autosave get", "Failed to get autosave.", { Path: folderPath, Name: name }, err);
    }
  }
});

module.exports = router;
