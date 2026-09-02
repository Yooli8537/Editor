// CRUD for files & folders
// Imports
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const serverMaster = require("../serverMaster");
const logger = require("../logger");
const error = require("../error");

// Data folder paths
const rootPath = path.join(__dirname, "../../");
const dataFolderPath = path.join(rootPath, "data");
const notebooksFolderPath = path.join(dataFolderPath, "notebooks");
const imageFolderPath = path.join(dataFolderPath, "images");

// Recursively reads the full data folder.
async function readDirRecursive(dir) {
  // Reads the specified directory
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
}

// Searches through notebooks & folders (same difference lol)
async function searchNotebooks(dir, key, searchResults) {
  // Sets key to be lowercase to make search case-insensitive.
  lowerKey = key.toLowerCase();
  // Reads specified directory.
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
        return findText(
          praseFile[0].content,
          lowerKey,
          fullPath,
          searchResults,
          praseFile[0].title,
        );
      }
    }),
  );
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
    if (
      node.text.toLowerCase().includes(key) &&
      !searchResults.includes(file)
    ) {
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
  if (serverMaster.detailLogs) {
    logger.info("Recieved notebooks get request.");
  }
  const resposneArray = await readDirRecursive(notebooksFolderPath);

  if (serverMaster.successLogs) {
    logger.info("Sent notebooks to Client.");
  }
  res.json(resposneArray);
});

// Processes search requests.
router.get("/api/documents/search", async (req, res) => {
  const { key } = req.query;
  if (serverMaster.detailLogs) {
    logger.info("Recieved search request.");
  }
  // This array saves all the files which include the search key.
  const searchResults = [];
  if (serverMaster.detailLogs) {
    logger.info("Searching notebooks...");
  }
  await searchNotebooks(notebooksFolderPath, key, searchResults);

  // Results that can be used by the Sidebar loading function (requires paths for the event listeners to open the documents).
  const adjustedResults = searchResults.map((fullPath) => ({
    path: path.relative(notebooksFolderPath, fullPath),
    name: path.basename(fullPath),
    folderPath: path.relative(notebooksFolderPath, path.dirname(fullPath)),
  }));

  if (serverMaster.successLogs) {
    logger.info({ Key: key }, "Sent search results to Client.");
  }
  res.json(adjustedResults);
});

// Creates a new notebook
router.post("/api/documents/newNotebook", async (req, res) => {
  const { name } = req.body;
  if (serverMaster.detailLogs) {
    logger.info("Recieved notebook create request.");
  }

  try {
    // Makes the directory
    fs.mkdirSync(path.join(notebooksFolderPath, name));
    if (serverMaster.successLogs) {
      logger.info({ Name: name }, "Created new notebook.");
    }
    res.json({ success: true });
  } catch (err) {
    if (err.code === "EEXIST") {
      res
        .status(409)
        .json(
          error(
            "Notebook create",
            "A notebook with that name already exists.",
            { Name: name },
            err,
          ),
        );
    } else {
      res
        .status(500)
        .json(
          error(
            "Notebook create",
            "Failed to create new notebook.",
            { Name: name },
            err,
          ),
        );
    }
  }
});

// Creates a new file
router.post("/api/documents/newFile", async (req, res) => {
  const { name, folderPath } = req.body;
  if (serverMaster.detailLogs) {
    logger.info(
      { Name: name, Path: folderPath },
      "Recieved file create request.",
    );
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
      location = path.join(notebooksFolderPath, folderPath, name + ".json");
      // Causing an error on purpose. If this fails, the file is created (or there's a genuine failure, then nothing happens).
      // If it doesn't fail, the file already exists and isn't overwritten.
      if (await fs.promises.readFile(location)) {
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
        .json(
          error(
            "File create",
            "No path or name found to create file.",
            { Name: name, Path: folderPath },
            null,
          ),
        );
    }
  } catch (err) {
    // If the error is a "not found" error, the file is created.
    if (err.code === "ENOENT") {
      fs.writeFileSync(location, defaultContent, "utf8");
      if (serverMaster.successLogs) {
        logger.info({ Name: name, Path: folderPath }, "Created file.");
      }
      res.json({ success: true });
    } else {
      res
        .status(500)
        .json(
          error(
            "File create",
            "Failed to create file.",
            { Name: name, Path: folderPath },
            err,
          ),
        );
    }
  }
});

// Creates a new folder, pretty much the same procedure as above.
router.post("/api/documents/newFolder", async (req, res) => {
  const { name, folderPath } = req.body;
  if (serverMaster.detailLogs) {
    logger.info(
      { Name: name, Path: folderPath },
      "Recieved folder create request.",
    );
  }

  try {
    if (name && folderPath) {
      fs.mkdirSync(path.join(notebooksFolderPath, folderPath, name));
      if (serverMaster.successLogs) {
        logger.info({ Name: name, Path: folderPath }, "Created folder.");
      }
      res.json({ success: true });
    } else {
      res
        .status(404)
        .json(
          error(
            "Folder create",
            "No path or name found.",
            { Name: name, Path: folderPath },
            null,
          ),
        );
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
      res.status(500).json(
        error(
          "Folder create",
          "Failed to create folder.",
          {
            Name: name,
            Path: folderPath,
          },
          err,
        ),
      );
    }
  }
});

// Deletes a certain path, allowing for both files and folders to be deleted with the same function.
router.delete("/api/documents/deletePath", async (req, res) => {
  // Originally only meant for folders but works for files too... happy accidents :)
  const { folderPath } = req.body;
  if (serverMaster.detailLogs) {
    logger.info(
      { Path: folderPath },
      "Recieved path delete request (File / Folder).",
    );
  }

  try {
    if (folderPath) {
      const fullPath = path.join(notebooksFolderPath, folderPath);
      await fs.promises.rm(fullPath, { recursive: true, force: true });
      if (serverMaster.successLogs) {
        logger.info({ Path: folderPath }, "Deleted path.");
      }
      res.send("Path successfully deleted.").json({ success: true });
    } else {
      res
        .status(404)
        .json(
          error(
            "Path delete (folder / file)",
            "Failed to find path to be deleted.",
            { Path: folderPath },
            null,
          ),
        );
    }
  } catch (err) {
    res
      .status(500)
      .json(
        error(
          "Path delete (folder / file)",
          "Failed to delete path.",
          { Path: folderPath },
          err,
        ),
      );
  }
});

// Gets a file
router.get("/api/documents/getFile", async (req, res) => {
  const { name, folderPath } = req.query;
  if (serverMaster.detailLogs) {
    logger.info({ Name: name, Path: folderPath }, "Recieved file get request.");
  }

  try {
    const fullPath = path.join(notebooksFolderPath, folderPath, name);
    const file = fs.readFileSync(fullPath, "utf-8"); // Reads out file data
    if (serverMaster.successLogs) {
      logger.info("Got file.");
    }
    if (serverMaster.detailLogs) {
      logger.info("Sent file to Client.");
    }
    res.send(JSON.parse(file));
  } catch (err) {
    if (err.code === "ENOENT") {
      res
        .status(404)
        .json(
          error(
            "File get",
            "Failed to find file.",
            { Name: name, Path: folderPath },
            err,
          ),
        );
    } else {
      res
        .status(500)
        .json(
          error(
            "File get",
            "Failed to get file.",
            { Name: name, Path: folderPath },
            err,
          ),
        );
    }
  }
});

// Renames a file, which is surprisingly annoying to do without tons of glitches.
router.post("/api/documents/renameFile", async (req, res) => {
  const { newName, folderPath, name } = req.body;
  if (serverMaster.detailLogs) {
    logger.info(
      { "Old name": name, "New name": newName, Path: folderPath },
      "Recieved file rename request.",
    );
  }

  if (serverMaster.detailLogs) {
    logger.info("Building old and new file path.");
  }
  const baseName = path.parse(name).name;
  const filePath = path.join(
    notebooksFolderPath,
    folderPath,
    baseName + ".json",
  );
  const newFilePath = path.join(
    notebooksFolderPath,
    folderPath,
    newName + ".json",
  );

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
      if (serverMaster.detailLogs) {
        logger.info("Renaming file...");
      }
      // Rename operation on the filesystem
      await fs.promises.rename(filePath, newFilePath);

      // Changing title inside document
      if (serverMaster.detailLogs) {
        logger.info("Changing document title inside JSON...");
      }
      const fileContent = await fs.promises.readFile(newFilePath, "utf-8");
      const fileData = JSON.parse(fileContent);
      fileData[0].title = newName;

      if (serverMaster.detailLogs) {
        logger.info("Writing file info.");
      }
      fs.writeFileSync(newFilePath, JSON.stringify(fileData, null, 2), "utf-8");

      if (serverMaster.successLogs) {
        logger.info(
          { "Old name": name, "New name": newName, Path: folderPath },
          "Renamed file.",
        );
      }
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
function childDocumentIsOpen(
  directoryContents,
  directoryFolderPath,
  currentlyOpenDocument,
) {
  for (let i = 0; i < directoryContents.length; i++) {
    if (!directoryContents[i].isFolder) {
      const pathToFile = path.join(
        directoryFolderPath,
        directoryContents[i].name,
      );

      // Compares the file path to the currently open document.
      // Returning true will cancel the renaming operation.
      if (pathToFile === currentlyOpenDocument) {
        return true;
      }
    } else {
      // Checks any child folders of the folder being renamed.
      const childPath = path.join(
        directoryFolderPath,
        directoryContents[i].name,
      );

      childDocumentIsOpen(
        directoryContents[i],
        childPath,
        currentlyOpenDocument,
      );
    }
  }
  return false;
}

// Renames a folder
router.post("/api/documents/renameFolder", async (req, res) => {
  const { newName, folderPath, name, currentlyOpenDocument } = req.body;

  if (serverMaster.detailLogs) {
    logger.info(
      { "Old name": name, "New name": newName, Path: folderPath },
      "Recieved file rename request.",
    );
  }

  const currentPath = path.join(notebooksFolderPath, folderPath, name);
  const newPath = path.join(notebooksFolderPath, folderPath, newName);

  if (serverMaster.detailLogs) {
    logger.info({ currentPath: currentPath, newPath: newPath });
  }

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
        if (serverMaster.detailLogs) {
          logger.info("Renaming folder...");
        }
        fs.renameSync(currentPath, newPath);

        if (serverMaster.successLogs) {
          logger.info("Renamed folder.");
        }
        res.json({ success: true });
        return;
      } else if (newName && name) {
        if (serverMaster.detailLogs) {
          logger.info(
            "To avoid permission issues, a notebook must be fully duplicated under its new name and have its old version removed.",
          );
          logger.info("Copying notebook contents to new directory...");
        }
        // Copies the entire directory under the new name, after which the directory of the previous name will be deleted.
        // This has to be done because Windows doesn't like me messing with direct children of the data/ folder for some reason.
        // Fuck Microslop. I wish Linux supported everything I use. :/
        await fs.promises.cp(currentPath, newPath, { recursive: true });
        await fs.promises.rm(currentPath, { recursive: true, force: true });

        if (serverMaster.successLogs) {
          logger.info("Renamed notebook.");
        }
        res.json({ success: true });
        return;
      } else if (!folderPath || !name) {
        res.status(404).json(
          error(
            "Rename folder",
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
          "Rename folder",
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
        "Rename folder",
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

  if (serverMaster.detailLogs) {
    logger.info(
      { Name: name, Path: folderPath },
      "Recieved file update request.",
    );
  }
  if (serverMaster.detailLogs) {
    logger.info({ Name: name, Path: folderPath }, "Reading file to save to...");
  }

  const filePath = path.join(notebooksFolderPath, folderPath, name);
  const file = fs.readFileSync(filePath, "utf-8");

  const fileData = JSON.parse(file);
  // fileData[0] since everything in JSON is stored in one array.
  fileData[0].content = saveData;

  if (serverMaster.detailLogs) {
    logger.info({ Name: name, Path: folderPath }, "Writing updated file...");
  }

  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf-8");

  if (serverMaster.successLogs) {
    logger.info({ Name: name, Path: folderPath }, "Updated file.");
  }
  res.json({ success: true });
});

// Uploads image files to the server.
router.post(
  "/api/uploadImageFile",
  express.raw({ type: "image/*", limit: "10mb" }),
  async (req, res) => {
    const imgType = req.headers["content-type"];
    if (serverMaster.detailLogs) {
      logger.info({ "Image type": imgType }, "Recieved image upload request.");
    }

    if (serverMaster.detailLogs) {
      logger.info({ "Image type": imgType }, "Assigning file ending...");
    }

    let fileEnding;
    if (imgType === "image/png") {
      fileEnding = ".png";
    } else if (imgType === "image/jpg") {
      fileEnding = ".jpg";
    } else if (imgType === "image/gif") {
      fileEnding = ".gif";
    }

    if (serverMaster.detailLogs) {
      logger.info({ "Image type": imgType }, "Setting image ID...");
    }
    // Sets the image's name to a completely random ID.
    const fileName = imageName() + fileEnding;
    let location = path.join(imageFolderPath, fileName);

    if (serverMaster.detailLogs) {
      logger.info(
        { "Image type": imgType, Name: fileName },
        "Writing image to image folder...",
      );
    }

    fs.writeFileSync(location, req.body);

    if (serverMaster.successLogs) {
      logger.info(
        { "Image type": imgType, Name: fileName },
        "Saved image to Server.",
      );
    }
    if (serverMaster.detailLogs) {
      logger.info(
        { "Image type": imgType, Name: fileName },
        "Sending image URL to Client...",
      );
    }
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
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  for (let i = 0; i < 21; i++) {
    name += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return name;
}

module.exports = router;
