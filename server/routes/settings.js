// Settings-related server routes
// Server imports
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const serverMaster = require("../serverMaster");
const logger = require("../logger");
const error = require("../error");

// Data paths
const rootPath = path.join(__dirname, "../../");
const logsFolderPath = path.join(rootPath, "logs");
const dataFolderPath = path.join(rootPath, "data");
const notebooksFolderPath = path.join(dataFolderPath, "notebooks");
const imageFolderPath = path.join(dataFolderPath, "images");

// Cleans unused images from the server.
let unusedImages = [];
router.delete("/api/cleanImages", async (req, res) => {
  logger.info("Recieved image clear request.");
  // Puts all the images into the array.
  unusedImages = fs.readdirSync(imageFolderPath);
  // Finds all unused images, removing all used ones from the array.
  await findImages(notebooksFolderPath);
  if (unusedImages.length !== 0 && serverMaster.detailLogs) {
    logger.info({ "Unused images": unusedImages }, "Found unused images.");
  } else if (serverMaster.detailLogs) {
    logger.info("Found no unused images.");
  }

  // Removes all the unused images.
  try {
    for (let i = 0; i < unusedImages.length; i++) {
      fs.rmSync(path.join(imageFolderPath, unusedImages[i]));
    }

    if (serverMaster.successLogs && unusedImages.length !== 0) {
      logger.info({ "Unused images": unusedImages }, "Cleared unused images.");
    }
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json(error("Image clear", "Failed to clear images", {}, null));
  }
});

// Cleans logs from the server.
let logFiles = [];
router.delete("/api/clearLogs", async (req, res) => {
  logger.info("Recieved log clear request.");
  // Puts all the logs into the array.
  logFiles = fs.readdirSync(logsFolderPath);

  console.log(logFiles);

  // Removes logs, excluding the newest one if saving logs is enabled.
  try {
    for (let i = 0; i < logFiles.length - 1; i++) {
      fs.rmSync(path.join(logsFolderPath, logFiles[i]));
    }

    if (serverMaster.successLogs) {
      logger.info("Cleared logs.");
    }
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json(error("Logs clear", "Failed to clear logs.", {}, null));
  }
});

// Searches for images in documents.
async function findImages(dir) {
  const entries = await fs.promises.readdir(dir, {
    withFileTypes: true,
  });

  return Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return findImages(fullPath);
      } else {
        const file = await fs.promises.readFile(fullPath, "utf-8");
        const praseFile = JSON.parse(file);
        return findSrc(praseFile[0].content, fullPath, praseFile[0].title);
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
