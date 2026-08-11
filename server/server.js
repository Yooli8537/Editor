// Main Server File
// Mainly used for one-time Operations (creating missing Data Folders, loading things into the state, etc.)
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 8510;

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

for (let i = 0; i < userDataFolders.length; i++) {
  if (!fs.existsSync(userDataFolders[i].path)) {
    fs.mkdirSync(userDataFolders[i].path);
    console.warn(`Created missing ${userDataFolders[i].name} Folder.`);
    console.log(
      "This is standard if you've freshly cloned the Repository or updated to a newer version, as the data folder is ignored by git.",
    );
  }
}

// Master File for config across Sessions
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
  deleteDeprecatedMasterProperties();
  //addMissingMasterProperties();
}

// Deletes deprecated master.json properties
async function deleteDeprecatedMasterProperties() {
  console.log("Checking for deprecated master.json properties...");

  // Getting the masterfile data. Has to be parsed.
  const rawMasterFile = await fs.readFileSync(masterFilePath, "utf-8");
  const masterFile = JSON.parse(rawMasterFile);
  let changesMade = false;
  const deprecatedProperties = ["usedImages"];

  // Deletes the usedImages property
  for (let i = 0; i < deprecatedProperties.length; i++) {
    if (masterFile[0][deprecatedProperties[i]]) {
      delete masterFile[0][deprecatedProperties[i]];
      console.log(`Deleted masterfile property "${deprecatedProperties[i]}".`);
      changesMade = true;
    }
  }

  if (changesMade) {
    try {
      // Updates the masterfile
      fs.writeFileSync(masterFilePath, JSON.stringify(masterFile), "utf-8");
      console.log("Successfully removed deprecated masterfile properties.");
    } catch (err) {
      console.error("Something went wrong trying to update master.json.");
      console.error(err);
    }
  } else {
    console.log(
      "No deprecated masterfile properties found. Starting App without changes.",
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

const documentsRoute = require("./routes/documents");
const exportRoute = require("./routes/export");
const versionsRoute = require("./routes/versions");

app.use(express.json());
app.use(express.static(rootPath));
app.use(documentsRoute);
app.use(exportRoute);
app.use(versionsRoute);

app.get("/", (req, res) => {
  res.sendFile(path.join(rootPath, "index.html"));
});

app.listen(port, () => {});
