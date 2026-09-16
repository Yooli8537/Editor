const path = require("path");
const fs = require("fs");

const GLOBAL = require("./global");
const logger = require(GLOBAL.PATHS.UTILS.LOGGER);
const error = require(GLOBAL.PATHS.UTILS.ERROR);
const serverMaster = require(GLOBAL.PATHS.UTILS.MASTER);

async function validatePath(inputPath, operation, res) {
  try {
    const realRoot = fs.realpathSync(GLOBAL.PATHS.FOLDERS.ROOT);

    const parent = path.dirname(inputPath);
    const filename = path.basename(inputPath);

    const realParent = fs.realpathSync(parent);
    const realPath = path.join(realParent, filename);

    const relativePath = path.relative(realRoot, realPath);

    let isValid;
    if (
      relativePath === "" ||
      (relativePath !== ".." &&
        !relativePath.startsWith(".." + path.sep) &&
        !path.isAbsolute(relativePath))
    ) {
      isValid = true;
    } else {
      isValid = false;
    }

    if (isValid && serverMaster.detailLogs) {
      logger.info({ Path: inputPath }, `${operation}: Path validated.`);
    }

    return isValid;
  } catch (err) {
    res
      .status(403)
      .json(error(operation, "Invalid path.", { Path: inputPath }, err));
    return false;
  }
}

module.exports = validatePath;
