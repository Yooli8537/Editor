const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "../../");

function validatePath(inputPath) {
  try {
    const realRoot = fs.realpathSync(ROOT);

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
