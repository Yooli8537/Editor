const GLOBAL = require("../utils/global");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const serverMaster = require(GLOBAL.PATHS.UTILS.MASTER);
const log = require(GLOBAL.PATHS.UTILS.LOGGER);
const error = require(GLOBAL.PATHS.UTILS.ERROR);
const validatePath = require(GLOBAL.PATHS.UTILS.VALIDATE_PATH);

// Recursively reads the full data folder.
async function readDirRecursive(dir) {
  // Reads the specified directory
  try {
    const entries = await fs.promises.readdir(dir, {
      withFileTypes: true,
    });

    // Returns data
    return Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);

        // If a folder is detected, it's read through again.
        if (entry.isDirectory()) {
          return {
            name: entry.name,
            isFolder: true,
            children: await readDirRecursive(fullPath),
          };
        } else {
          // Otherwise, it just gives back the file name.
          return {
            name: entry.name,
            isFolder: false,
          };
        }
      }),
    );
  } catch (err) {
    error("Get directory recursively", "Failed to read specified directory.", { Directory: dir }, err);
  }
}

// Searches through notebooks & folders (same difference lol)
async function searchNotebooks(dir, key, searchResults) {
  // Sets key to be lowercase to make search case-insensitive.
  lowerKey = key.toLowerCase();
  // Reads specified directory.
  try {
    const entries = await fs.promises.readdir(dir, {
      withFileTypes: true,
    });

    // Returns results, just like with the full data folder reading.
    return Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Folders aren't included in search results, instead their contents are searched.
          return searchNotebooks(fullPath, lowerKey, searchResults);
        } else {
          const file = await fs.promises.readFile(fullPath, "utf-8");
          const praseFile = JSON.parse(file);
          return findText(praseFile[0].content, lowerKey, fullPath, searchResults, praseFile[0].title);
        }
      }),
    );
  } catch (err) {
    error("Search notebooks", "Failed to read specified directory.", { Directory: dir, Key: key }, err);
  }
}

// Finds the search key within the text of files.
function findText(node, key, file, searchResults, fileTitle) {
  // If the key is found within the title of the file, it is also presented in the search results.
  if (fileTitle) {
    if (
      // .toLowerCase() makes the searched content also case-insensitive.
      fileTitle.toLowerCase().includes(key) &&
      !searchResults.includes(file)
    ) {
      searchResults.push(file);
    }
  }

  // Only searches through text nodes, ensuring that other nodes (like src attributes) are ignored.
  if (node.type === "text") {
    if (node.text.toLowerCase().includes(key) && !searchResults.includes(file)) {
      searchResults.push(file);
    }
  }

  // Searches the children of nodes
  if (node.content) {
    node.content.forEach((child) => findText(child, key, file, searchResults));
  }

  return;
}

// Gets all documents & folders.
router.get("/api/documents", async (req, res) => {
  log.detail("Notebooks get", "Recieved request.");
  const resposneArray = await readDirRecursive(GLOBAL.PATHS.FOLDERS.NOTEBOOKS);

  log.success("Notebooks get", "Sent notebooks to Client.");
  res.json(resposneArray);
});

// Processes search requests.
router.get("/api/documents/search", async (req, res) => {
  const { key } = req.query;
  log.detail("Search", "Recieved request.");
  // This array saves all the files which include the search key.
  const searchResults = [];
  log.detail("Search", "Searching notebooks...");
  await searchNotebooks(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, key, searchResults);

  // Results that can be used by the Sidebar loading function (requires paths for the event listeners to open the documents).
  const adjustedResults = searchResults.map((fullPath) => ({
    path: path.relative(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, fullPath),
    name: path.basename(fullPath),
    folderPath: path.relative(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, path.dirname(fullPath)),
  }));

  log.success("Search", "Sent search results to Client.", { Key: key });
  res.json(adjustedResults);
});

// Creates a new notebook
router.post("/api/documents/newNotebook", async (req, res) => {
  const { name } = req.body;
  log.detail("Notebook create", "Recieved request.");

  const dirPath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, name);

  if (!validatePath(dirPath, "Notebook create", res)) {
    return;
  }

  try {
    // Makes the directory
    fs.mkdirSync(path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, name));
    log.success("Notebook create", "Created new notebook.", { Name: name });
    res.json({ success: true });
  } catch (err) {
    if (err.code === "EEXIST") {
      res
        .status(409)
        .json(error("Notebook create", "A notebook with that name already exists.", { Name: name }, err));
    } else {
      res.status(500).json(error("Notebook create", "Failed to create new notebook.", { Name: name }, err));
    }
  }
});

// Creates a new file
router.post("/api/documents/newFile", async (req, res) => {
  const { name, folderPath } = req.body;
  log.detail("File create", "Recieved request.", { Name: name, Path: folderPath });

  const dirPath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, name);

  if (!validatePath(dirPath, "File create", res)) {
    return;
  }

  // Builds up the expected content of a TipTap document.
  const defaultContent = JSON.stringify(
    [
      {
        title: name,
        content: {
          type: "doc",
          content: [{ type: "paragraph" }],
        },
      },
    ],
    null,
    2,
  );

  // Initialization of the variable outside the `try` function so that `catch` can also access the value.
  let location;

  try {
    if (name && folderPath) {
      location = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, name + ".json");
      // Causing an error on purpose. If this fails, the file is created (or there's a genuine failure, then nothing happens).
      // If it doesn't fail, the file already exists and isn't overwritten.
      if (fs.readFileSync(location)) {
        res
          .status(409)
          .json(
            error(
              "File create",
              "A file with that name already exists within the specified directory.",
              { Name: name, Path: folderPath },
              null,
            ),
          );
      }
      // Checking for the required values to create the file.
    } else {
      res
        .status(404)
        .json(error("File create", "No path or name found to create file.", { Name: name, Path: folderPath }, null));
    }
  } catch (err) {
    // If the error is a "not found" error, the file is created.
    if (err.code === "ENOENT") {
      fs.writeFileSync(location, defaultContent, "utf8");
      log.success("File create", "Created file.", { Name: name, Path: folderPath });
      res.json({ success: true });
    } else {
      res.status(500).json(error("File create", "Failed to create file.", { Name: name, Path: folderPath }, err));
    }
  }
});

// Creates a new folder, pretty much the same procedure as above.
router.post("/api/documents/newFolder", async (req, res) => {
  const { name, folderPath } = req.body;
  log.detail("Folder create", "Recieved request.", { Name: name, Path: folderPath });

  const dirPath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, name);

  if (!validatePath(dirPath, "Folder create", res)) {
    return;
  }

  try {
    if (name && folderPath) {
      fs.mkdirSync(path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, name));
      log.success("Folder create", "Created folder.", { Name: name, Path: folderPath });
      res.json({ success: true });
    } else {
      res.status(404).json(error("Folder create", "No path or name found.", { Name: name, Path: folderPath }, null));
    }
  } catch (err) {
    if (err.code === "EEXIST") {
      res
        .status(409)
        .json(
          error(
            "Folder create",
            "A folder with that name already exists within the specified directory",
            { Name: name, Path: folderPath },
            err,
          ),
        );
    } else {
      res
        .status(500)
        .json(error("Folder create", "Failed to create folder.", { Name: name, Path: folderPath }, err));
    }
  }
});

// Deletes a certain path, allowing for both files and folders to be deleted with the same function.
router.delete("/api/documents/deletePath", async (req, res) => {
  // Originally only meant for folders but works for files too... happy accidents :)
  const { folderPath } = req.body;
  log.detail("Path delete", "Recieved request.", { Path: folderPath });

  const dirPath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath);

  if (!validatePath(dirPath, "Path delete", res)) {
    return;
  }

  try {
    if (folderPath) {
      const fullPath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath);
      await fs.promises.rm(fullPath, { recursive: true, force: true });
      log.success("Path delete", "Deleted path.", { Path: folderPath });
      res.json({ success: true });
    } else {
      res.status(404).json(error("Path delete", "Failed to find path to be deleted.", { Path: folderPath }, null));
    }
  } catch (err) {
    res.status(500).json(error("Path delete", "Failed to delete path.", { Path: folderPath }, err));
  }
});

// Gets a file
router.get("/api/documents/getFile", async (req, res) => {
  const { name, folderPath } = req.query;
  log.detail("File get", "Recieved request.", { Name: name, Path: folderPath });

  const dirPath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, name);

  if (!validatePath(dirPath, "File get", res)) {
    return;
  }

  try {
    const fullPath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, name);
    const file = fs.readFileSync(fullPath, "utf-8");
    log.success("File get", "Got file.");
    log.detail("File get", "Sent file to Client.");
    res.send(JSON.parse(file));
  } catch (err) {
    if (err.code === "ENOENT") {
      res.status(404).json(error("File get", "Failed to find file.", { Name: name, Path: folderPath }, err));
    } else {
      res.status(500).json(error("File get", "Failed to get file.", { Name: name, Path: folderPath }, err));
    }
  }
});

// Renames a file, which is surprisingly annoying to do without tons of glitches.
router.post("/api/documents/renameFile", async (req, res) => {
  const { newName, folderPath, name } = req.body;
  log.detail("File rename", "Recieved request.", { "Old name": name, "New name": newName, Path: folderPath });

  const dirPath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, name);

  if (!validatePath(dirPath, "File rename", res)) {
    return;
  }

  log.detail("File rename", "Building old and new file path.");
  const baseName = path.parse(name).name; // 19.09.26 - WTF
  const filePath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, baseName + ".json");
  const newFilePath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, newName + ".json");

  try {
    // Checks for a missing newName first.
    // If the operation goes through even though the name is empty, there will be issues.
    if (!newName || newName == "") {
      res
        .status(404)
        .json(
          error(
            "File rename",
            "Failed to find new file name.",
            { "Old name": name, "New name": newName, Path: folderPath },
            null,
          ),
        );
    } else if (newName && folderPath && name) {
      log.detail("File rename", "Renaming file...");
      // Rename operation on the filesystem
      await fs.promises.rename(filePath, newFilePath);

      // Changing title inside document
      log.detail("File rename", "Changing document title inside JSON...");
      const fileContent = await fs.promises.readFile(newFilePath, "utf-8");
      const fileData = JSON.parse(fileContent);
      fileData[0].title = newName;

      log.detail("File rename", "Writing file info.");
      fs.writeFileSync(newFilePath, JSON.stringify(fileData, null, 2), "utf-8");

      log.success("File rename", "Renamed file.", { "Old name": name, "New name": newName, Path: folderPath });
      res.json({ success: true });
    } else {
      res
        .status(404)
        .json(
          error(
            "File rename",
            "Failed to find path or old file name.",
            { "Old name": name, "New name": newName, Path: folderPath },
            null,
          ),
        );
    }
  } catch (err) {
    res
      .status(500)
      .json(
        error(
          "File rename",
          "Failed to rename file.",
          { "Old name": name, "New name": newName, Path: folderPath },
          err,
        ),
      );
  }
});

// Builds the full path for each of a folder's children.
// Expects the output to look like the output from readDirRecursive().
function childDocumentIsOpen(directoryContents, directoryFolderPath, currentlyOpenDocument) {
  for (let i = 0; i < directoryContents.length; i++) {
    if (!directoryContents[i].isFolder) {
      const pathToFile = path.join(directoryFolderPath, directoryContents[i].name);

      // Compares the file path to the currently open document.
      // Returning true will cancel the renaming operation.
      if (pathToFile === currentlyOpenDocument) {
        return true;
      }
    } else {
      // Checks any child folders of the folder being renamed.
      const childPath = path.join(directoryFolderPath, directoryContents[i].name);

      if (childDocumentIsOpen(directoryContents[i].children, childPath, currentlyOpenDocument)) {
        return true;
      }
    }
  }
  return false;
}

// Renames a folder
router.post("/api/documents/renameFolder", async (req, res) => {
  const { newName, folderPath, name } = req.body;
  let { currentlyOpenDocument } = req.body;

  if (!currentlyOpenDocument) {
    currentlyOpenDocument = "";
  }

  log.detail("Folder rename", "Recieved request.", { "Old name": name, "New name": newName, Path: folderPath });

  const dirPath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, name);

  if (!validatePath(dirPath, "Folder rename", res)) {
    return;
  }

  const currentPath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, name);
  const newPath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, newName);

  const folderContents = await readDirRecursive(currentPath);

  if (
    !childDocumentIsOpen(
      folderContents,
      // If currentPath is used, it'll use the full path starting from C:, which is not how currentlyOpenDocument is saved.
      path.join(folderPath, name),
      // currentlyOpenDocument uses the forwards slash / instead of the backslash \, using path.join() conveniently fixes this lmao.
      path.join(currentlyOpenDocument),
    )
  ) {
    try {
      if (!newName || newName == "") {
        res
          .status(404)
          .json(
            error(
              "Folder rename",
              "No new name found to rename folder.",
              { "Old name": name, "New name": newName, Path: folderPath },
              null,
            ),
          );
      } else if (newName && folderPath && name) {
        log.detail("Folder rename", "Renaming folder...");
        fs.renameSync(currentPath, newPath);

        if (serverMaster.successLogs) {
          log.success("Folder rename: Renamed folder.");
        }
        res.json({ success: true });
        return;
      } else if (newName && name) {
        log.detail(
          "Notebook rename",
          "To avoid permission issues, a notebook must be fully duplicated under its new name and have its old version removed.",
        );
        log.detail("Notebook rename", "Copying notebook contents to new directory...");
        // Copies the entire directory under the new name, after which the directory of the previous name will be deleted.
        // This has to be done because Windows doesn't like me messing with direct children of the data/ folder for some reason.
        // Fuck Microslop. I wish Linux supported everything I use. :/
        await fs.promises.cp(currentPath, newPath, { recursive: true });
        await fs.promises.rm(currentPath, { recursive: true, force: true });

        log.success("Notebook rename", "Renamed notebook.");
        res.json({ success: true });
        return;
      } else if (!folderPath || !name) {
        res.status(404).json(
          error(
            "Folder rename",
            "No path or name found to rename folder.",
            {
              "Old name": name,
              "New name": newName,
              Path: folderPath,
            },
            null,
          ),
        );
      }
    } catch (err) {
      res.status(500).json(
        error(
          "Folder rename",
          "Something went wrong.",
          {
            "Old name": name,
            "New name": newName,
            Path: folderPath,
          },
          err,
        ),
      );
    }
  } else {
    res.status(409).json(
      error(
        "Folder rename",
        "A file within the folder is open.",
        {
          "Old name": name,
          "New name": newName,
          Path: folderPath,
        },
        null,
      ),
    );
  }
});

// Updates a file with new content.
router.put("/api/documents/updateFile", async (req, res) => {
  const { saveData, name, folderPath } = req.body;
  log.detail("File update", "Recieved request.", { Name: name, Path: folderPath });

  const dirPath = path.join(GLOBAL.PATHS.FOLDERS.NOTEBOOKS, folderPath, name);

  if (!validatePath(dirPath, "File update", res)) {
    return;
  }

  log.detail("File update", "Reading file to save to...", { Name: name, Path: folderPath });
  const file = fs.readFileSync(dirPath, "utf-8");

  const fileData = JSON.parse(file);
  // fileData[0] since everything in JSON is stored in one array.
  fileData[0].content = saveData;

  log.detail("File update", "Writing updated file...", { Name: name, Path: folderPath });
  fs.writeFileSync(dirPath, JSON.stringify(fileData, null, 2), "utf-8");

  log.success("File update", "Updated file.", { Name: name, Path: folderPath });
  res.json({ success: true });
});

// Uploads image files to the server.
router.post(
  "/api/uploadImageFile",
  express.raw({ type: "image/*", limit: `${serverMaster.maxImageSize}mb` }),
  async (req, res) => {
    const imgType = req.headers["content-type"];
    log.detail("Image upload", "Recieved request.", { "Image type": imgType });
    log.detail("Image upload", "Assigning file ending...", { "Image type": imgType });

    let fileEnding;
    if (imgType === "image/png") {
      fileEnding = ".png";
    } else if (imgType === "image/jpg") {
      fileEnding = ".jpg";
    } else if (imgType === "image/gif") {
      fileEnding = ".gif";
    }

    log.detail("Image upload", "Setting image ID...", { "Image type": imgType });
    // Sets the image's name to a completely random ID.
    const fileName = imageName() + fileEnding;
    let location = path.join(GLOBAL.PATHS.FOLDERS.IMAGES, fileName);

    log.detail("Image upload", "Writing image to image folder...", { "Image type": imgType, Name: fileName });
    fs.writeFileSync(location, req.body);

    log.success("Image upload", "Saved image to Server.");
    log.detail({ "Image type": imgType, Name: fileName }, "Image upload: Sending image URL to Client...", {
      "Image type": imgType,
      Name: fileName,
    });
    // Sends the URL back so that TipTap can set it as the src.
    res.json({
      url: `/data/images/${fileName}`,
    });
  },
);

// Generates a completely random image name, starting with Y and followed by 20 random symbols.
// Y functions as a sort of backup identifier. If the image src doesn't start with "Y", there must be an issue.
function imageName() {
  let name = "Y";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  for (let i = 0; i < 21; i++) {
    name += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return name;
}

module.exports = router;
