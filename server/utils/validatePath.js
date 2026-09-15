const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "../../");

function validatePath(inputPath) {
  try {
    const realPath = fs.realpathSync(inputPath);
    const relativePath = path.relative(ROOT, realPath);

    return (
      relativePath === "" ||
      (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
    );
  } catch {
    return false;
  }
}

module.exports = validatePath;
