// Main Server File
// Mainly used for one-time Operations (creating missing Data Folders, loading things into the state, etc.)
const express = require("express");
const fs = require("fs");
const path = require("path");

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

const userDataFolders = [
  { name: "Data", path: dataFolderPath },
  { name: "Autosaves", path: autosavesFolderPath },
  { name: "Notebooks", path: notebooksFolderPath },
  { name: "Image", path: imageFolderPath },
  { name: "Attachments", path: attachmentsFolderPath },
];

// Creates any missing data folders.
for (let i = 0; i < userDataFolders.length; i++) {
  if (!fs.existsSync(userDataFolders[i].path)) {
    fs.mkdirSync(userDataFolders[i].path);
    console.warn(`Created missing ${userDataFolders[i].name} Folder.`);
    console.log(
      "This is standard if you've freshly cloned the Repository or updated to a newer version, as the data folder is ignored by git.",
    );
  }
}

// Masterfile to store config across Sessions
if (!fs.existsSync(masterFilePath)) {
  const masterFileContent = `[
  {
    "unsavedFiles": []
  }
]
`;
  fs.writeFileSync(masterFilePath, masterFileContent, "utf-8");
  console.warn("Created missing Master JSON File.");
  console.log(
    "This is standard if you've freshly cloned the Repository, as the data folder is ignored by git.",
  );
} else {
  // If the masterfile is found, it's checked for any deprecated or missing properties, making updates to it automatic.
  deleteDeprecatedMasterProperties();
  addMissingMasterProperties();
}

// Updates the masterfile and gives feedback on success.
// This function is used after deprecated / missing properties are found.
async function updateMasterfile(masterFile) {
  try {
    fs.writeFileSync(masterFilePath, JSON.stringify(masterFile), "utf-8");
    return true;
  } catch (err) {
    console.error("Something went wrong trying to update master.json.");
    console.error(err);
    return false;
  }
}

// Deletes deprecated master.json properties
async function deleteDeprecatedMasterProperties() {
  console.log("Checking for deprecated master.json properties...");

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
      console.log(`Deleted masterfile property "${deprecatedProperties[i]}".`);
      changesMade = true;
    }
  }

  // Updates the masterfile if changes were made
  if (changesMade) {
    if (updateMasterfile(masterFile)) {
      console.log("Successfully removed deprecated masterfile properties.");
    } else {
      console.error(
        "Something went wrong trying to remove deprecated masterfile properties.",
      );
    }
  } else {
    console.log("No deprecated masterfile properties found.");
  }
}

// Adds any missing properties to the master.json file.
async function addMissingMasterProperties() {
  console.log("Checking for missing master.json properties...");

  // Getting the masterfile data. Has to be parsed.
  const rawMasterFile = await fs.readFileSync(masterFilePath, "utf-8");
  const masterFile = JSON.parse(rawMasterFile);
  let changesMade = false;
  // Every property which should be in the masterfile.
  const allProperties = { unsavedFiles: [], autosaveInterval: 10000 };

  // Adds all the missing properties
  for (const key in allProperties) {
    if (!masterFile[0][key]) {
      masterFile[0][key] = allProperties[key];
      console.log(`Added missing masterfile property "${key}".`);
    }
    changesMade = true;
  }

  // Updates the masterfile if changes were made
  if (changesMade) {
    if (updateMasterfile(masterFile)) {
      console.log("Successfully added missing masterfile properties.");
    } else {
      console.log("Failed to add missing masterfile properties.");
    }
  } else {
    console.log(
      "No missing masterfile properties found. Starting App without changes.",
    );
  }
}

app.get("/api/getMaster", async (req, res) => {
  try {
    const rawMasterFile = await fs.readFileSync(masterFilePath, "utf-8");
    const masterFile = JSON.parse(rawMasterFile);
    res.json(masterFile[0]);
    console.log("Successfully loaded Masterfile.");
  } catch (err) {
    console.error("Couldn't load Masterfile.");
    console.error(err);
  }
});

// Server routes
const documentsRoute = require("./routes/documents");
const exportRoute = require("./routes/export");
const versionsRoute = require("./routes/versions");

app.use(express.json());
app.use(express.static(rootPath));
app.use(documentsRoute);
app.use(exportRoute);
app.use(versionsRoute);

// Sends index.html to the client.
app.get("/", (req, res) => {
  res.sendFile(path.join(rootPath, "index.html"));
});

app.listen(port, () => {});
