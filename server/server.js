const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

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
