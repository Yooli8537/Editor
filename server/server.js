const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 8510;

const dataFolder = path.join(__dirname, "../data");

if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder);
  console.warn("Created missing Data Folder.");
  console.log("This is standard if you've freshly cloned the Repository, as the data folder is ignored by git.");
}

const exportRoute = require("./routes/export");
const documentsRoute = require("./routes/documents");

app.use(express.json());
app.use(express.static(path.join(__dirname, "../")));
app.use(exportRoute);
app.use(documentsRoute);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../", "index.html"));
});

app.listen(port, () => {});
