const path = require("path");

const rootPath = path.join(__dirname, "../../");
const logsFolderPath = path.join(rootPath, "logs");
const dataFolderPath = path.join(rootPath, "data");
const autosavesFolderPath = path.join(dataFolderPath, "autosaves");
const notebooksFolderPath = path.join(dataFolderPath, "notebooks");
const imagesFolderPath = path.join(dataFolderPath, "images");
const attachmentsFolderPath = path.join(dataFolderPath, "attachments");
const masterFilePath = path.join(dataFolderPath, "master.json");

const GLOBAL = {
  PATHS: {
    ROOT: rootPath,
    LOGS: logsFolderPath,
    DATA: dataFolderPath,
    AUTOSAVES: autosavesFolderPath,
    NOTEBOOKS: notebooksFolderPath,
    IMAGES: imagesFolderPath,
    ATTACHMENTS: attachmentsFolderPath,
    MASTERFILE: masterFilePath,
  },
};

module.exports = GLOBAL;
