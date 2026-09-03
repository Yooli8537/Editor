// Main Server File
// Mainly used for one-time Operations (creating missing Data Folders, loading things into the state, etc.)
const express = require("express");
const fs = require("fs");
const path = require("path");

// Git for JS
const gitJS = require("simple-git");
const git = gitJS.default();

const app = express();
const port = 8510;

// Paths to Folders which need to exist within the data folder.
const rootPath = path.join(__dirname, "../");
const logsFolderPath = path.join(rootPath, "logs");
const dataFolderPath = path.join(rootPath, "data");
const autosavesFolderPath = path.join(dataFolderPath, "autosaves");
const notebooksFolderPath = path.join(dataFolderPath, "notebooks");
const imageFolderPath = path.join(dataFolderPath, "images");
const attachmentsFolderPath = path.join(dataFolderPath, "attachments");
const masterFilePath = path.join(dataFolderPath, "master.json");

const userDataFolders = [
  { name: "Logs", path: logsFolderPath },
  { name: "Data", path: dataFolderPath },
  { name: "Autosaves", path: autosavesFolderPath },
  { name: "Notebooks", path: notebooksFolderPath },
  { name: "Image", path: imageFolderPath },
  { name: "Attachments", path: attachmentsFolderPath },
];

// Every property which should be in the masterfile.
const allProperties = {
  unsavedFiles: [],
  autosaveInterval: 10,
  helpTextHoverTime: 1.5,
  confirmSave: true,
  collapsedFolders: [],
  updateCollapsedFolders: 15,
  sliceIndex: 20,
  maxCharacterLength: 30,
  warningLogs: true,
  detailLogs: false,
  successLogs: true,
  saveLogs: false,
  confirmExport: false,
  version: "v1.5.7",
  deniedVersion: null,
};

// Creates any missing data folders.
for (let i = 0; i < userDataFolders.length; i++) {
  if (!fs.existsSync(userDataFolders[i].path)) {
    fs.mkdirSync(userDataFolders[i].path);
  }
}

// Masterfile to store config across sessions
if (!fs.existsSync(masterFilePath)) {
  try {
    const masterFileContent = `[${JSON.stringify(allProperties)}]`;
    fs.writeFileSync(masterFilePath, masterFileContent, "utf-8");
  } catch (err) {
    logger.error("Failed to create master.json.");
  }
}

const serverMaster = require("./serverMaster");
const logger = require("./logger");
const error = require("./error");

// Server routes
const documentsRoute = require("./routes/documents");
const exportRoute = require("./routes/export");
const autosaveRoute = require("./routes/autosave");
const settingsRoute = require("./routes/settings");

app.use(express.json());
app.use(express.static(rootPath));
app.use(documentsRoute);
app.use(exportRoute);
app.use(autosaveRoute);
app.use(settingsRoute);

// Updates the masterfile and gives feedback on success.
// This function is used after deprecated / missing properties are found.
async function updateMasterfile(masterFile) {
  try {
    fs.writeFileSync(masterFilePath, JSON.stringify(masterFile), "utf-8");
    if (serverMaster.successLogs) {
      logger.warn("Updated masterfile properties.");
    }
    return true;
  } catch (err) {
    error(
      "master.json properties update",
      "Failed to update master.json properties.",
      {},
      err,
    );
    return false;
  }
}

// Deletes deprecated master.json properties
async function deleteDeprecatedMasterProperties() {
  logger.info("Checking for deprecated master.json properties...");

  // Getting the masterfile data. Has to be parsed.
  const rawMasterFile = fs.readFileSync(masterFilePath, "utf-8");
  const masterFile = JSON.parse(rawMasterFile);
  let changesMade = false;
  // Array of ever property to be released and later be deprecated.
  const deprecatedProperties = ["usedImages", "applyAppUpdate"];

  // Deletes deprecated properties
  for (let i = 0; i < deprecatedProperties.length; i++) {
    if (masterFile[0][deprecatedProperties[i]]) {
      delete masterFile[0][deprecatedProperties[i]];
      logger.info(
        { "Deprecated Property": deprecatedProperties[i] },
        "Deleted master.json property.",
      );
      changesMade = true;
    }
  }

  // Updates the masterfile if changes were made
  if (changesMade) {
    if (updateMasterfile(masterFile)) {
      logger.info("Removed deprecated master.json properties.");
    }
  } else {
    logger.info("No deprecated master.json properties found.");
  }
}

// Adds any missing properties to the master.json file.
async function addMissingMasterProperties() {
  logger.info("Checking for missing master.json properties...");

  // Getting the masterfile data. Has to be parsed.
  const rawMasterFile = fs.readFileSync(masterFilePath, "utf-8");
  const masterFile = JSON.parse(rawMasterFile);
  let changesMade = false;

  // Adds all the missing properties
  for (const key in allProperties) {
    if (!Object.hasOwn(masterFile[0], key)) {
      masterFile[0][key] = allProperties[key];
      logger.info({ Property: key }, "Added missing master.json property.");
      changesMade = true;
    }
  }

  // Updates the masterfile if changes were made
  if (changesMade) {
    if (updateMasterfile(masterFile)) {
      logger.info("Added missing master.json properties.");
    }
  } else {
    logger.info("No missing masterfile properties found.");
  }
}

// Checks for deprecated and missing masterfile properties.
deleteDeprecatedMasterProperties();
addMissingMasterProperties();

// Gets master.json for client.
app.get("/api/getMaster", async (req, res) => {
  if (serverMaster.detailLogs) {
    logger.info("Recived master.json get request.");
  }
  try {
    const rawMasterFile = fs.readFileSync(masterFilePath, "utf-8");
    const masterFile = JSON.parse(rawMasterFile);
    res.json(masterFile[0]);
    if (serverMaster.successLogs) {
      logger.info("Loaded Masterfile.");
    }
  } catch (err) {
    res
      .status(500)
      .json(error("master.json get", "Failed to get master.json.", {}, err));
  }
});

// Updates master.json from client.
app.put("/api/updateMaster", async (req, res) => {
  const { data } = req.body;
  if (serverMaster.detailLogs) {
    logger.info("Recived master.json update request.");
  }

  try {
    fs.writeFileSync(masterFilePath, JSON.stringify(data), "utf-8");
    if (serverMaster.successLogs) {
      logger.info("Updated master.json.");
      if (serverMaster.detailLogs) {
        logger.info({ "Updated master.json": data });
      }
    }

    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json(
        error(
          "master.json update",
          "Failed to update master.json.",
          { Data: data },
          err,
        ),
      );
  }
});

// Updates a certain master.json property.
app.put("/api/updateMasterProperty", async (req, res) => {
  const { property, newValue } = req.body;
  if (serverMaster.detailLogs) {
    logger.info(
      { Property: property, Value: newValue },
      "Recived master.json property update request.",
    );
  }

  try {
    // Gets master data
    const rawMasterFile = fs.readFileSync(masterFilePath, "utf-8");
    const masterFile = JSON.parse(rawMasterFile);

    // Updates given property
    masterFile[0][property] = newValue;

    // Updates the master.
    fs.writeFileSync(masterFilePath, JSON.stringify(masterFile), "utf-8");
    if (serverMaster.successLogs) {
      logger.info({ Property: property }, "Updated master.json property.");
    }
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json(
        error(
          "Update master.json property",
          "Failed to update master.json property.",
          {},
          err,
        ),
      );
  }
});

// Applies an update.
app.get("/api/applyAppUpdate", async (req, res) => {
  try {
    await git.pull("origin", "main", ["--rebase"]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json(error("App update", "Failed to update app.", {}, err));
  }
});

// Returns a success.
app.get("/api/", async (req, res) => {
  if (serverMaster.detailLogs) {
    logger.info("Got ping request.");
  }
  res.json({ success: true });
});

// Sends index.html to the client.
app.get("/", (req, res) => {
  res.sendFile(path.join(rootPath, "index.html"));
});

app.listen(port, () => {
  logger.info({ Port: port }, "Editor Backend running");
});
