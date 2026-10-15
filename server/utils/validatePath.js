const path = require("path");
const fs = require("fs");

const GLOBAL = require("./global");
const log = require(GLOBAL.PATHS.UTILS.LOGGER);
const error = require(GLOBAL.PATHS.UTILS.ERROR);

function validatePath(inputPath, operation, res) {
  log.detail(operation, "Validating path...", { Path: inputPath });

  try {
    if (typeof inputPath !== "string" || inputPath === "") {
      return deny(operation, inputPath, res, "Missing path.");
    }

    const root = path.resolve(GLOBAL.PATHS.FOLDERS.NOTEBOOKS);
    const target = path.resolve(inputPath);

    // 1. Plain check: catches "../", absolute paths and the notebooks folder itself.
    if (!isInside(root, target)) {
      return deny(operation, inputPath, res, "Path is outside the notebooks folder.");
    }

    // 2. Real check: resolve symlinks/junctions on the deepest part of the path that exists.
    const realRoot = fs.realpathSync(root);
    let existing = target;
    while (!fs.existsSync(existing)) {
      existing = path.dirname(existing);
    }
    const realTarget = path.join(fs.realpathSync(existing), path.relative(existing, target));

    if (!isInside(realRoot, realTarget)) {
      return deny(operation, inputPath, res, "Path is outside the notebooks folder.");
    }

    log.success(operation, "Path validated.", { Path: inputPath });
    return true;
  } catch (err) {
    return deny(operation, inputPath, res, "Failed to validate path.", err);
  }
}

// True only if `child` is strictly below `root` (the root itself doesn't count).
function isInside(root, child) {
  const relative = path.relative(root, child);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(".." + path.sep) &&
    !path.isAbsolute(relative)
  );
}

function deny(operation, inputPath, res, message, err = null) {
  if (!res.headersSent) {
    res.status(403).json(error(operation, `Invalid path. ${message}`, { Path: inputPath }, err));
  }
  return false;
}

module.exports = validatePath;
