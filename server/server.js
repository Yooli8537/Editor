const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 8510;

const rootPath = path.join(__dirname, "../");
const dataFolder = path.join(rootPath, "data");
const imageFolder = path.join(rootPath, "images");
const attachmentsFolder = path.join(rootPath, "attachments");
const masterFile = path.join(dataFolder, "master.json");

const userDataFolders = [
  { name: "Data", path: dataFolder },
  { name: "Image", path: imageFolder },
  { name: "Attachments", path: attachmentsFolder },
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

if (!fs.existsSync(masterFile)) {
  const masterFileContent = `[
  {
    "usedImages": []
  }
]
`;
  fs.writeFileSync(masterFile, masterFileContent, "utf-8");
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
