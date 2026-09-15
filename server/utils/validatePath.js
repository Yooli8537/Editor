const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "../../");

function validatePath(inputPath) {
  try {
    const realPath = fs.realpath(inputPath);
    return realPath.startsWith(ROOT + path.sep);
  } catch {
    return false;
  }
}

module.exports = validatePath;
