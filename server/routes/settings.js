// Settings-related server routes
// Server imports
const GLOBAL = require("../utils/global");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const serverMaster = require(GLOBAL.PATHS.UTILS.MASTER);
const log = require(GLOBAL.PATHS.UTILS.LOGGER);
const error = require(GLOBAL.PATHS.UTILS.ERROR);

// Cleans unused images from the server.
let unusedImages = [];
router.delete("/api/cleanImages", async (req, res) => {
  log.detail("Image clear", "Recieved request.");
  // Puts all the images into the array.
  unusedImages = fs.readdirSync(GLOBAL.PATHS.FOLDERS.IMAGES);
  // Finds all unused images, removing all used ones from the array.
  await findImages(GLOBAL.PATHS.FOLDERS.DATA);
  if (unusedImages.length !== 0) {
    log.detail("Image clear", "Found unused images.", { "Unused images": unusedImages });
  } else {
    log.detail("Image clear", "Found no unused images.");
  }

  // Removes all the unused images.
  try {
    for (let i = 0; i < unusedImages.length; i++) {
      fs.rmSync(path.join(GLOBAL.PATHS.FOLDERS.IMAGES, unusedImages[i]));
    }

    console.log(unusedImages.length);
    if (unusedImages.length > 0) {
      log.success("Image clear", "Image clear: Cleared unused images.", { "Unused images": unusedImages });
    }
    res.json({ success: true, amount: unusedImages.length });
  } catch (err) {
    res.status(500).json(error("Image clear", "Failed to clear images", {}, null));
  }
});

// Cleans logs from the server.
let logFiles = [];
router.delete("/api/clearLogs", async (req, res) => {
  log.detail("Log clear: Recieved request.");
  // Puts all the logs into the array.
  logFiles = fs.readdirSync(GLOBAL.PATHS.FOLDERS.LOGS);

  log.detail("Log clear", "Got logs folder.", { "Log files": logFiles });

  let logFilesLength;
  // Removes logs, excluding the newest one if saving logs is enabled.
  try {
    for (let i = 0; i < logFiles.length - 1; i++) {
      fs.rmSync(path.join(GLOBAL.PATHS.FOLDERS.LOGS, logFiles[i]));
      logFilesLength = logFiles.length - 1;
    }

    // Deletes the newest file if logs aren't supposed to be saved.
    if (!serverMaster.saveLogs) {
      fs.rmSync(path.join(GLOBAL.PATHS.FOLDERS.LOGS, logFiles[logFiles.length - 1]));
      logFilesLength = logFiles.length;
    }

    if (logFiles.length > 0) {
      log.success("Log clear", "Cleared logs.");
    }

    res.json({ success: true, amount: logFilesLength });
  } catch (err) {
    res.status(500).json(error("Log clear", "Failed to clear logs.", {}, null));
  }
});

// Searches for images in documents.
async function findImages(dir) {
  let entries;
  try {
    entries = await fs.promises.readdir(dir, {
      withFileTypes: true,
    });
  } catch (err) {
    error("Find images", "Failed to read directory.", { Directory: dir }, err);
  }

  return Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return findImages(fullPath);
      }

      if (path.extname(entry.name).toLowerCase() !== ".json") {
        return;
      } else if (entry.name === "master.json") {
        return;
      }

      try {
        const file = await fs.promises.readFile(fullPath, "utf-8");
        const parseFile = JSON.parse(file);
        return findSrc(parseFile[0].content, fullPath, parseFile[0].title);
      } catch (err) {
        error("Find images", "Failed to read file source.", { Path: fullPath }, err);
      }
    }),
  );
}

function findSrc(node, file) {
  if (node.type === "image") {
    // Removes /data/images/
    let currentImage = node.attrs.src.slice(13);
    // Sees if the image is found within the array.
    const index = unusedImages.indexOf(currentImage);
    if (index > -1) {
      // Removes from the array if found.
      unusedImages.splice(index, 1);
    }
  }

  // Searches the children of nodes
  if (node.content) {
    node.content.forEach((child) => findSrc(child, file));
  }
  return;
}

module.exports = router;
