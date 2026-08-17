// Settings-related server routes
// Server imports
const { error } = require("console");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Data paths
const rootPath = path.join(__dirname, "../../");
const dataFolderPath = path.join(rootPath, "data");
const notebooksFolderPath = path.join(dataFolderPath, "notebooks");
const imageFolderPath = path.join(dataFolderPath, "images");
const masterFilePath = path.join(dataFolderPath, "master.json");

// Cleans unused images from the server.
let unusedImages = [];
router.delete("/api/cleanImages", async (req, res) => {
  // Puts all the images into the array.
  unusedImages = await fs.readdirSync(imageFolderPath);
  // Removes all the used images.
  await findImages(notebooksFolderPath);
  console.log(unusedImages);

  for (let i = 0; i < unusedImages.length; i++) {
    await fs.rmSync(path.join(imageFolderPath, unusedImages[i]));
  }

  res.json({ success: true });
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
