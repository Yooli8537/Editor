// Main Server File
// Mainly used for one-time Operations (creating missing Data Folders, loading things into the state, etc.)
const express = require("express");
const fs = require("fs");
const path = require("path");
const gitJS = require("simple-git");
const git = gitJS.default();

const GLOBAL = require("./utils/global");

const app = express();
const port = 8510;

const userDataFolders = [
  { name: "Logs", path: GLOBAL.PATHS.FOLDERS.LOGS },
  { name: "Data", path: GLOBAL.PATHS.FOLDERS.DATA },
  { name: "Notebooks", path: GLOBAL.PATHS.FOLDERS.NOTEBOOKS },
  { name: "Image", path: GLOBAL.PATHS.FOLDERS.IMAGES },
  { name: "Attachments", path: GLOBAL.PATHS.FOLDERS.ATTACHMENTS },
];

// Every property and default value which should be in master.json.
const allProperties = {
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
  version: "v1.6.3",
  deniedVersion: null,
  clientActionLogging: false,
  rateLimitResetTime: 5,
  rateLimitMaxRequests: 300,
  maxImageSize: 10,
};

// Creates any missing data folders.
for (let i = 0; i < userDataFolders.length; i++) {
  if (!fs.existsSync(userDataFolders[i].path)) {
    fs.mkdirSync(userDataFolders[i].path);
  }
}

// Masterfile to store config across sessions
if (!fs.existsSync(GLOBAL.PATHS.FILES.MASTERFILE)) {
  try {
    const masterFileContent = `[${JSON.stringify(allProperties)}]`;
    fs.writeFileSync(GLOBAL.PATHS.MASTERFILE, masterFileContent, "utf-8");
  } catch (err) {
    console.error("Server setup: Failed to create master.json.");
  }
}

const serverMaster = require(GLOBAL.PATHS.UTILS.MASTER);
const logger = require(GLOBAL.PATHS.UTILS.LOGGER);
const error = require(GLOBAL.PATHS.UTILS.ERROR);

// Limits requests
// Placement to allow user settings to be used (must be placed after serverMaster).
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: serverMaster.rateLimitResetTime * 60 * 1000,
  max: serverMaster.rateLimitMaxRequests,
});

// Server routes
const documentsRoute = require(GLOBAL.PATHS.ROUTES.DOCUMENTS);
const exportRoute = require(GLOBAL.PATHS.ROUTES.EXPORT);
const autosaveRoute = require(GLOBAL.PATHS.ROUTES.AUTOSAVE);
const settingsRoute = require(GLOBAL.PATHS.ROUTES.SETTINGS);

app.use(express.json());
app.use(express.static(GLOBAL.PATHS.FOLDERS.ROOT));
app.use(limiter);
app.use(documentsRoute);
app.use(exportRoute);
app.use(autosaveRoute);
app.use(settingsRoute);

// Updates the masterfile and gives feedback on success.
// This function is used after deprecated / missing properties are found.
async function updateMasterfile(masterFile) {
  try {
    fs.writeFileSync(
      GLOBAL.PATHS.FILES.MASTERFILE,
      JSON.stringify(masterFile),
      "utf-8",
    );
    if (serverMaster.successLogs) {
      logger.info("Master properties update: Updated properties.");
    }
    return true;
  } catch (err) {
    error("Master properties update", "Failed to update properties.", {}, err);
    return false;
  }
}

// Deletes deprecated master.json properties
async function deleteDeprecatedMasterProperties() {
  logger.info("Checking for deprecated master.json properties...");

  // Getting the masterfile data. Has to be parsed.
  const rawMasterFile = fs.readFileSync(GLOBAL.PATHS.FILES.MASTERFILE, "utf-8");
  const masterFile = JSON.parse(rawMasterFile);
  let changesMade = false;
  // Array of ever property to be released and later be deprecated.
  const deprecatedProperties = ["usedImages", "applyAppUpdate", "unsavedFiles"];

  // Deletes deprecated properties
  for (let i = 0; i < deprecatedProperties.length; i++) {
    if (masterFile[0][deprecatedProperties[i]]) {
      delete masterFile[0][deprecatedProperties[i]];
      logger.info(
        { "Deprecated Property": deprecatedProperties[i] },
        "Deleted deprecated master.json property.",
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

// Adds any missing properties to master.json.
async function addMissingMasterProperties() {
  logger.info("Checking for missing master.json properties...");

  // Getting master.json data. Has to be parsed.
  const rawMasterFile = fs.readFileSync(GLOBAL.PATHS.FILES.MASTERFILE, "utf-8");
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

  // Updates master.json if changes were made
  if (changesMade) {
    if (updateMasterfile(masterFile)) {
      logger.info("Added missing master.json properties.");
    }
  } else {
    logger.info("No missing master.json properties found.");
  }
}

// Checks for deprecated and missing master.json properties.
deleteDeprecatedMasterProperties();
addMissingMasterProperties();

// Gets master.json for client.
app.get("/api/getMaster", async (req, res) => {
  if (serverMaster.detailLogs) {
    logger.info("Recived master.json get request.");
  }
  try {
    const rawMasterFile = fs.readFileSync(
      GLOBAL.PATHS.FILES.MASTERFILE,
      "utf-8",
    );
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
    logger.info("Master update: Recived request.");
  }

  try {
    fs.writeFileSync(
      GLOBAL.PATHS.FILES.MASTERFILE,
      JSON.stringify(data),
      "utf-8",
    );
    if (serverMaster.successLogs) {
      logger.info("Master update: Updated master.json.");
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
      "Master property update: Recived request.",
    );
  }

  try {
    // Gets master data
    const rawMasterFile = fs.readFileSync(
      GLOBAL.PATHS.FILES.MASTERFILE,
      "utf-8",
    );
    const masterFile = JSON.parse(rawMasterFile);

    // Updates given property
    masterFile[0][property] = newValue;

    // Updates the master.
    fs.writeFileSync(
      GLOBAL.PATHS.FILES.MASTERFILE,
      JSON.stringify(masterFile),
      "utf-8",
    );
    if (serverMaster.successLogs) {
      logger.info(
        { Property: property },
        "Master property update: Updated property.",
      );
    }
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json(
        error("Master property update", "Failed to update property.", {}, err),
      );
  }
});

// Applies an update.
app.get("/api/applyAppUpdate", async (req, res) => {
  logger.info("App update: Recieved request.");
  try {
    await git.pull("origin", "main", ["--rebase"]);
    if (serverMaster.successLogs) {
      logger.info("App update: Successfully updated app.");
    }
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
  res.sendFile(path.join(GLOBAL.PATHS.FOLDERS.ROOT, "index.html"));
});

app.listen(port, () => {
  logger.info({ Port: port }, "Editor Backend running.");
});
