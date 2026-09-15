const path = require("path");
const fs = require("fs");

const GLOBAL = require("./global");

function validatePath(inputPath) {
  try {
    const realRoot = fs.realpathSync(GLOBAL.PATHS.FOLDERS.ROOT);

    const parent = path.dirname(inputPath);
    const filename = path.basename(inputPath);

    const realParent = fs.realpathSync(parent);
    const realPath = path.join(realParent, filename);

    const relativePath = path.relative(realRoot, realPath);

    return (
      relativePath === "" ||
      (relativePath !== ".." &&
        !relativePath.startsWith(".." + path.sep) &&
        !path.isAbsolute(relativePath))
    );
  } catch (err) {
    console.log(err);
    return false;
  }
}

module.exports = validatePath;
