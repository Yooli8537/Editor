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
const masterFilePath = path.join(dataFolderPath, "master.json");

// Updates master.json
router.put("/api/updateMaster", async (req, res) => {
  const { data } = req.body;

  try {
    await fs.writeFileSync(masterFilePath, JSON.stringify(data), "utf-8");
    console.log("Successfully updated masterfile.");
    res.json({ success: true });
  } catch (err) {
    console.error("Couldn't update masterfile.");
    res.status(500).json({ error: err });
  }
});

module.exports = router;
