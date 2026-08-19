// Main Server File
// Mainly used for one-time Operations (creating missing Data Folders, loading things into the state, etc.)
const express = require("express");
const fs = require("fs");
const path = require("path");
const serverMaster = require("./serverMaster");
const logger = require("./logger");

const app = express();
const port = 8510;

// Paths to Folders which need to exist within the data folder.
const rootPath = path.join(__dirname, "../");
const dataFolderPath = path.join(rootPath, "data");
const autosavesFolderPath = path.join(dataFolderPath, "autosaves");
const notebooksFolderPath = path.join(dataFolderPath, "notebooks");
const imageFolderPath = path.join(dataFolderPath, "images");
const attachmentsFolderPath = path.join(dataFolderPath, "attachments");
const masterFilePath = path.join(dataFolderPath, "master.json");

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

const userDataFolders = [
  { name: "Data", path: dataFolderPath },
  { name: "Autosaves", path: autosavesFolderPath },
  { name: "Notebooks", path: notebooksFolderPath },
  { name: "Image", path: imageFolderPath },
  { name: "Attachments", path: attachmentsFolderPath },
];

// Creates any missing data folders.
let foldersCreated = false;
for (let i = 0; i < userDataFolders.length; i++) {
  if (!fs.existsSync(userDataFolders[i].path)) {
    fs.mkdirSync(userDataFolders[i].path);
    logger.warn(
      { "missing folder": userDataFolders[i].name },
      "Created missing folder",
    );
    foldersCreated = true;
  }
}

if (foldersCreated) {
  logger.info(
    "This is standard if you've freshly cloned the Repository or updated to a newer version, as the data folder is ignored by git.",
  );
}

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
    logger.error(
      { error: err },
      "Something went wrong updating master.json properties.",
    );
    return false;
  }
}

// Deletes deprecated master.json properties
async function deleteDeprecatedMasterProperties() {
  logger.info("Checking for deprecated master.json properties...");

  // Getting the masterfile data. Has to be parsed.
  const rawMasterFile = await fs.readFileSync(masterFilePath, "utf-8");
  const masterFile = JSON.parse(rawMasterFile);
  let changesMade = false;
  // Array of ever property to be released and later be deprecated.
  const deprecatedProperties = ["usedImages"];

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
  const rawMasterFile = await fs.readFileSync(masterFilePath, "utf-8");
  const masterFile = JSON.parse(rawMasterFile);
  let changesMade = false;
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
  };

  // Adds all the missing properties
  for (const key in allProperties) {
    if (!Object.hasOwn(masterFile[0], key)) {
      masterFile[0][key] = allProperties[key];
      logger.info({ property: key }, "Added missing master.json property.");
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

// Masterfile to store config across sessions
if (!fs.existsSync(masterFilePath)) {
  const masterFileContent = `[{}]
`;
  fs.writeFileSync(masterFilePath, masterFileContent, "utf-8");
  logger.warn("Created missing master.json file.");
  logger.info(
    "This is standard if you've freshly cloned the Repository, as the data folder is ignored by git.",
  );
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
    const rawMasterFile = await fs.readFileSync(masterFilePath, "utf-8");
    const masterFile = JSON.parse(rawMasterFile);
    res.json(masterFile[0]);
    if (serverMaster.successLogs) {
      logger.info("Loaded Masterfile.");
    }
  } catch (err) {
    logger.error({ error: err }, "Failed to load master.json.");
  }
});

// Updates master.json from client.
app.put("/api/updateMaster", async (req, res) => {
  const { data } = req.body;
  if (serverMaster.detailLogs) {
    logger.info("Recived master.json update request.");
  }

  try {
    await fs.writeFileSync(masterFilePath, JSON.stringify(data), "utf-8");
    if (serverMaster.successLogs) {
      logger.info("Updated master.json.");
      if (serverMaster.detailLogs) {
        logger.info({ "Updated master.json": data });
      }
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ error: err }, "Failed to update master.json.");
    res.status(500).json({ error: err });
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
    const rawMasterFile = await fs.readFileSync(masterFilePath, "utf-8");
    const masterFile = JSON.parse(rawMasterFile);

    // Updates given property
    masterFile[0][property] = newValue;

    // Updates the master.
    await fs.writeFileSync(masterFilePath, JSON.stringify(masterFile), "utf-8");
    if (serverMaster.successLogs) {
      logger.info({ property: property }, "Updated master.json property.");
    }
    res.json({ success: true });
  } catch (err) {
    logger.error({ error: err }, "Failed to update master.json.");
    res.status(500).json({ error: err });
  }
});

// Sends index.html to the client.
app.get("/", (req, res) => {
  res.sendFile(path.join(rootPath, "index.html"));
});

app.listen(port, () => {
  logger.info({ port: port }, "Editor Backend running");
});
