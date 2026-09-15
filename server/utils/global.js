const path = require("path");

// Paths
// Folders
const rootPath = path.join(__dirname, "../../");
const serverFolderPath = path.join(rootPath, "server");
const routesFolderPath = path.join(serverFolderPath, "routes");
const utilsFolderPath = path.join(serverFolderPath, "utils");
const logsFolderPath = path.join(rootPath, "logs");
const dataFolderPath = path.join(rootPath, "data");
const autosavesFolderPath = path.join(dataFolderPath, "autosaves");
const notebooksFolderPath = path.join(dataFolderPath, "notebooks");
const imagesFolderPath = path.join(dataFolderPath, "images");
const attachmentsFolderPath = path.join(dataFolderPath, "attachments");
// Files
const masterFilePath = path.join(dataFolderPath, "master.json");
// Routes
const autosaveRoutePath = path.join(routesFolderPath, "autosave.js");
const documentsRoutePath = path.join(routesFolderPath, "documents.js");
const exportRoutePath = path.join(routesFolderPath, "export.js");
const settingsRoutePath = path.join(routesFolderPath, "settings.js");
// Utils
const errorUtilPath = path.join(utilsFolderPath, "error.js");
const loggerUtilPath = path.join(utilsFolderPath, "logger.js");
const validatePathUtilPath = path.join(utilsFolderPath, "validatePath.js");
const serverMasterUtilPath = path.join(serverFolderPath, "serverMaster.js");

const GLOBAL = {
  PATHS: {
    FOLDERS: {
      ROOT: rootPath,
      SERVER: serverFolderPath,
      LOGS: logsFolderPath,
      DATA: dataFolderPath,
      AUTOSAVES: autosavesFolderPath,
      NOTEBOOKS: notebooksFolderPath,
      IMAGES: imagesFolderPath,
      ATTACHMENTS: attachmentsFolderPath,
    },
    FILES: {
      MASTERFILE: masterFilePath,
    },
    ROUTES: {
      AUTOSAVE: autosaveRoutePath,
      DOCUMENTS: documentsRoutePath,
      EXPORT: exportRoutePath,
      SETTINGS: settingsRoutePath,
    },
    UTILS: {
      ERROR: errorUtilPath,
      LOGGER: loggerUtilPath,
      VALIDATE_PATH: validatePathUtilPath,
      MASTER: serverMasterUtilPath,
    },
  },
};

module.exports = GLOBAL;
