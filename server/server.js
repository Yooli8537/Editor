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
  { name: "Profiles", path: GLOBAL.PATHS.FOLDERS.PROFILES },
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
  version: "v1.6.5",
  deniedVersion: null,
  rateLimitResetTime: 5,
  rateLimitMaxRequests: 300,
  maxImageSize: 10,
  collapsedFolderUpdateMethod: "Auto",
  formatFontSizesDefault: 16,
  formatFontSizesH1: 32,
  formatFontSizesH2: 24,
  formatFontSizesH3: 20,
  formatFontSizesCode: 12,
  formatFontMarginsH1Top: 3,
  formatFontMarginsH1Bottom: 5,
  formatFontMarginsH2Top: 2,
  formatFontMarginsH2Bottom: 3,
  formatFontMarginsH3Bottom: 1,
  formatFontMarginsListMargin: 0,
  formatTablesCellPadding: 8,
  formatTablesTextAlign: "left",
  clientSideLogging: false,
  clientActionLogging: true,
  clientProcessLogging: false,
  clientSettingsLogging: true,
  clientErrorLogging: true,
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
    fs.writeFileSync(GLOBAL.PATHS.FILES.MASTERFILE, masterFileContent, "utf-8");
  } catch (err) {
    console.error("Server setup: Failed to create master.json.");
  }
}

const serverMaster = require(GLOBAL.PATHS.UTILS.MASTER);
const log = require(GLOBAL.PATHS.UTILS.LOGGER);
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
    fs.writeFileSync(GLOBAL.PATHS.FILES.MASTERFILE, JSON.stringify(masterFile), "utf-8");
    log.success("Master properties update", "Updated properties.", {});
    return true;
  } catch (err) {
    error("Master properties update", "Failed to update properties.", {}, err);
    return false;
  }
}

// Deletes deprecated master.json properties
async function deleteDeprecatedMasterProperties() {
  log.detail("Delete deprecated master properties", "Checking for deprecated master.json properties...");

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
      log.success("Delete deprecated master properties", "Deleted master.json property.", {
        "Deprecated Property": deprecatedProperties[i],
      });
      changesMade = true;
    }
  }

  // Updates the masterfile if changes were made
  if (changesMade) {
    if (updateMasterfile(masterFile)) {
      log.detail("Delete deprecated master properties", "Removed deprecated master.json properties.");
    }
  } else {
    log.detail("Delete deprecated master properties", "No deprecated master.json properties found.");
  }
}

// Adds any missing properties to master.json.
async function addMissingMasterProperties() {
  log.detail("Add missing master properties", "Checking for missing master.json properties...");

  // Getting master.json data. Has to be parsed.
  const rawMasterFile = fs.readFileSync(GLOBAL.PATHS.FILES.MASTERFILE, "utf-8");
  const masterFile = JSON.parse(rawMasterFile);
  let changesMade = false;

  // Adds all the missing properties
  for (const key in allProperties) {
    if (!Object.hasOwn(masterFile[0], key)) {
      masterFile[0][key] = allProperties[key];
      log.success("Add missing master properties", "Added missing master.json property.", { Property: key });
      changesMade = true;
    }
  }

  // Updates master.json if changes were made
  if (changesMade) {
    if (updateMasterfile(masterFile)) {
      log.detail("Add missing master properties", "Added missing master.json properties.");
    }
  } else {
    log.detail("Add missing master properties", "No missing master.json properties found.");
  }
}

// Checks for deprecated and missing master.json properties.
deleteDeprecatedMasterProperties();
addMissingMasterProperties();

// Gets master.json for client.
app.get("/api/getMaster", async (req, res) => {
  log.detail("Master get", "Recived request.");
  try {
    const rawMasterFile = fs.readFileSync(GLOBAL.PATHS.FILES.MASTERFILE, "utf-8");
    const masterFile = JSON.parse(rawMasterFile);
    res.json(masterFile[0]);
    log.success("Master get", "Loaded master.json.");
  } catch (err) {
    res.status(500).json(error("Master get: ", "Failed to get master.json.", {}, err));
  }
});

// Updates master.json from client.
app.put("/api/updateMaster", async (req, res) => {
  const { data } = req.body;
  log.detail("Master update", "Recived request.");

  try {
    fs.writeFileSync(GLOBAL.PATHS.FILES.MASTERFILE, JSON.stringify(data), "utf-8");
    log.success("Master update", "Updated master.json.");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json(error("master.json update", "Failed to update master.json.", { Data: data }, err));
  }
});

// Updates a certain master.json property.
app.put("/api/updateMasterProperty", async (req, res) => {
  const { property, newValue } = req.body;
  log.detail("Master property update", "Recived request.", { Property: property, Value: newValue });

  try {
    // Gets master data
    const rawMasterFile = fs.readFileSync(GLOBAL.PATHS.FILES.MASTERFILE, "utf-8");
    const masterFile = JSON.parse(rawMasterFile);

    // Updates given property
    masterFile[0][property] = newValue;

    // Updates the master.
    fs.writeFileSync(GLOBAL.PATHS.FILES.MASTERFILE, JSON.stringify(masterFile), "utf-8");
    log.success("Master property update", "Master property update: Updated property.", { Property: property });
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json(
        error("Master property update", "Failed to update property.", { Property: property, Value: newValue }, err),
      );
  }
});

app.post("/api/addCollapsedFolder", async (req, res) => {
  const { folder } = req.body;
  log.detail("Collapsed folder add", "Recived request.", { Folder: folder });

  try {
    // Gets master.json data.
    const rawMasterFile = fs.readFileSync(GLOBAL.PATHS.FILES.MASTERFILE, "utf-8");
    const masterFile = JSON.parse(rawMasterFile);

    // Updates collapsedFolders with property
    masterFile[0].collapsedFolders.push(folder);

    // Updates master.json
    fs.writeFileSync(GLOBAL.PATHS.FILES.MASTERFILE, JSON.stringify(masterFile), "utf-8");
    log.success("Collapsed folder add", "Added folder.", { Folder: folder });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json(error("Collapsed folder add", "Failed to add folder.", { Folder: folder }, err));
  }
});

app.post("/api/rmCollapsedFolder", async (req, res) => {
  const { folder } = req.body;
  log.detail("Collapsed folder remove", "Recived request.", { Folder: folder });

  try {
    // Gets master.json data
    const rawMasterFile = fs.readFileSync(GLOBAL.PATHS.FILES.MASTERFILE, "utf-8");
    const masterFile = JSON.parse(rawMasterFile);

    // Removes folder from master.json.
    const rmIndex = masterFile[0].collapsedFolders.indexOf(folder);
    if (rmIndex > -1) {
      masterFile[0].collapsedFolders.splice(rmIndex, 1);
    }

    // Updates master.json
    fs.writeFileSync(GLOBAL.PATHS.FILES.MASTERFILE, JSON.stringify(masterFile), "utf-8");
    log.success("Collapsed folder remove", "Removed folder.", { Folder: folder });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json(error("Collapsed folder remove", "Failed to remove folder.", { Folder: folder }, err));
  }
});

// Applies an update.
app.get("/api/applyAppUpdate", async (req, res) => {
  log.detail("App update", "Recieved request.");
  try {
    await git.pull("origin", "main", ["--rebase"]);
    log.success("App update", "Successfully updated app.");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json(error("App update", "Failed to update app.", {}, err));
  }
});

// Returns a success.
app.get("/api/", async (req, res) => {
  log.detail("Ping", "Received Request.");
  res.json({ success: true });
});

// Sends index.html to the client.
app.get("/", (req, res) => {
  res.sendFile(path.join(GLOBAL.PATHS.FOLDERS.ROOT, "index.html"));
});

app.listen(port, () => {
  log.info("Editor Backend running.", { Port: port });
});
