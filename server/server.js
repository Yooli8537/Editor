// Main Server File
// Mainly used for one-time Operations (creating missing Data Folders, loading things into the state, etc.)
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 8510;

const rootPath = path.join(__dirname, "../");
const dataFolderPath = path.join(rootPath, "data");
const notebooksFolderPath = path.join(dataFolderPath, "notebooks");
const imageFolderPath = path.join(dataFolderPath, "images");
const attachmentsFolderPath = path.join(dataFolderPath, "attachments");
const masterFilePath = path.join(dataFolderPath, "master.json");

const userDataFolders = [
  { name: "Data", path: dataFolderPath },
  { name: "Notebooks", path: notebooksFolderPath },
  { name: "Image", path: imageFolderPath },
  { name: "Attachments", path: attachmentsFolderPath },
];

for (let i = 0; i < userDataFolders.length; i++) {
  if (!fs.existsSync(userDataFolders[i].path)) {
    fs.mkdirSync(userDataFolders[i].path);
    console.warn(`Created missing ${userDataFolders[i].name} Folder.`);
    console.log(
      "This is standard if you've freshly cloned the Repository, as the data folder is ignored by git.",
    );
  }
}

// Master File for config across Sessions
if (!fs.existsSync(masterFilePath)) {
  const masterFileContent = `[
  {
    "usedImages": []
  }
]
`;
  fs.writeFileSync(masterFilePath, masterFileContent, "utf-8");
  console.warn("Created missing Master JSON File.");
  console.log(
    "This is standard if you've freshly cloned the Repository, as the data folder is ignored by git.",
  );
}

const exportRoute = require("./routes/export");
const documentsRoute = require("./routes/documents");

app.use(express.json());
app.use(express.static(rootPath));
app.use(exportRoute);
app.use(documentsRoute);

app.get("/", (req, res) => {
  res.sendFile(path.join(rootPath, "index.html"));
});

app.listen(port, () => {});
