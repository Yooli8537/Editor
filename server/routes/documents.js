// CRUD for files & folders
// Imports
const { error } = require("console");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

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
  const resposneArray = await readDirRecursive(notebooksFolderPath);

  res.json(resposneArray);
});

// Processes search requests.
router.get("/api/documents/search", async (req, res) => {
  const { key } = req.query;
  // This array saves all the files which include the search key.
  const searchResults = [];
  await searchNotebooks(notebooksFolderPath, key, searchResults);

  // Results that can be used by the Sidebar loading function (requires paths for the event listeners to open the documents).
  const adjustedResults = searchResults.map((fullPath) => ({
    path: path.relative(notebooksFolderPath, fullPath),
    name: path.basename(fullPath),
    folderPath: path.relative(notebooksFolderPath, path.dirname(fullPath)),
  }));

  res.json(adjustedResults);
});

// Creates a new notebook
router.post("/api/documents/newNotebook", async (req, res) => {
  const { name } = req.body;

  try {
    // Makes the directory
    await fs.mkdirSync(path.join(notebooksFolderPath, name));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    if (err.code === "EEXIST") {
      res
        .status(409)
        .json({ error: "A Notebook with that name already exists" });
    } else {
      res.status(500).json({ error: "Failed to create Notebook" });
    }
  }
});

// Creates a new file
router.post("/api/documents/newFile", async (req, res) => {
  const { name, folderPath } = req.body;
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
          .json({ error: "A File with that name already exists." });
      }
      // Checking for the required values to create the file.
    } else if (name) {
      console.error("No Folder Path found.");
    } else if (folderPath) {
      console.error("No Name found.");
    } else {
      console.error("Required values not found for operation.");
    }
  } catch (err) {
    // If the error is a "not found" error, the file is created.
    if (err.code === "ENOENT") {
      fs.writeFileSync(location, defaultContent, "utf8");
      console.log("Successfully created File.");
      res.json({ success: true });
    } else {
      console.error(err);
      res.status(500).json({ error: "Failed to create File." });
    }
  }
});

// Creates a new folder, pretty much the same procedure as above.
router.post("/api/documents/newFolder", async (req, res) => {
  const { name, folderPath } = req.body;

  try {
    if (name && folderPath) {
      await fs.mkdirSync(path.join(notebooksFolderPath, folderPath, name));
      res.json({ success: true });
    } else if (name) {
      console.error("No folder path found.");
    } else if (folderPath) {
      console.error("No name found.");
    } else {
      console.error("Required values not found for operation.");
    }
  } catch (err) {
    if (err.code === "EEXIST") {
      console.error(err);
      res
        .status(409)
        .json({ error: "A folder with this name already exists." });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create folder" });
  }
});

// Deletes a certain path, allowing for both files and folders to be deleted with the same function.
router.delete("/api/documents/deletePath", async (req, res) => {
  // Originally only meant for folders but works for files too... happy accidents :)
  const { folderPath } = req.body;

  try {
    if (folderPath) {
      const fullPath = path.join(notebooksFolderPath, folderPath);
      await fs.promises.rm(fullPath, { recursive: true, force: true });
      res.send("Path successfully deleted.");
    } else {
      console.error("Couldn't find path to file / folder to be deleted.");
      res
        .status(404)
        .json({ error: "Failed to fulfill deletion request: Path not found." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fulfill deletion Request." });
  }
});

// Gets a file
router.get("/api/documents/getFile", async (req, res) => {
  const { name, folderPath } = req.query;

  try {
    const fullPath = path.join(notebooksFolderPath, folderPath, name);
    const file = await fs.readFileSync(fullPath, "utf-8"); // Reads out file data
    res.send(JSON.parse(file));
  } catch (err) {
    console.error(err);
    if (err.code === "ENOENT") {
      res.status(404).json({ error: "Couldn't find file." });
    } else {
      res.status(500).json({ error: "Something went wrong." });
    }
  }
});

// Renames a file, which is surprisingly annoying to do without tons of glitches.
router.post("/api/documents/renameFile", async (req, res) => {
  console.log(req.body);
  const { newName, folderPath, name } = req.body;

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
      console.error("No new Name found");
    } else if (newName && folderPath && name) {
      // Rename operation on the filesystem
      await fs.promises.rename(filePath, newFilePath);

      // Changing title inside document
      const fileContent = await fs.promises.readFile(newFilePath, "utf-8");
      const fileData = JSON.parse(fileContent);
      fileData[0].title = newName;
      fs.writeFileSync(newFilePath, JSON.stringify(fileData, null, 2), "utf-8");

      res.json({ success: true });
    } else if (!folderPath) {
      console.error("No Folder Path found.");
    } else if (!name) {
      console.error("No File found.");
    } else {
      console.error(
        "Multiple values which are required for renaming a File were not found.",
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to rename File." });
  }
});

// Renames a folder
router.post("/api/documents/renameFolder", async (req, res) => {
  console.log(req.body);
  const { newName, folderPath, name } = req.body;

  const currentPath = path.join(notebooksFolderPath, folderPath, name);
  const newPath = path.join(notebooksFolderPath, folderPath, newName);

  // If a Folder is in the highest directory, no folderPath will be recieved.
  // This exception requires a different path to be built.
  const rootPath = path.join(notebooksFolderPath, name);
  const newRootPath = path.join(notebooksFolderPath, newName);

  try {
    if (!newName || newName == "") {
      console.error("No new Name found");
    } else if (newName && folderPath && name) {
      await fs.promises.rename(currentPath, newPath);

      res.json({ success: true });
      return;
    } else if (newName && name) {
      // Copies the entire directory under the new name, after which the directory of the previous name will be deleted.
      await fs.promises.cp(currentPath, newPath, { recursive: true });
      await fs.promises.rm(currentPath, { recursive: true, force: true });

      res.json({ success: true });
    } else if (!folderPath) {
      console.error("No folder path found.");
    } else if (!name) {
      console.error("No folder found.");
    } else {
      console.error(
        "Multiple values which are required for renaming a folder were not found.",
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to rename folder." });
  }
});

// Experimental function for detecting images inside of TipTap documents. Not used right now.
async function readFileData(file) {
  const masterFileLoc = path.join(dataFolderPath, "master.json");
  const rawMasterFile = await fs.readFileSync(masterFileLoc, "utf-8");
  const masterFile = JSON.parse(rawMasterFile)[0];
  const usedImages = masterFile.usedImages;

  function loopThroughJSON(obj) {
    for (let key in obj) {
      if (typeof obj[key] === "object") {
        if (Array.isArray(obj[key])) {
          // loop through array
          for (let i = 0; i < obj[key].length; i++) {
            loopThroughJSON(obj[key][i]);
          }
        } else {
          // call function recursively for object
          loopThroughJSON(obj[key]);
        }
      } else {
        const searchObj = obj[key];
        if (
          key === "src" &&
          searchObj.search(/\/images\/Y\w{20}\.\w{3}/) !== -1
        ) {
          console.log(searchObj);
          const image = key + ": " + searchObj;
          // TODO: READ OUT NEW IMAGES & IMAGES WHICH HAVE BEEN DELETED AND ADD / REMOVE THEM
          // OH GOD THAT SOUNDS COMPLICATED
        }
      }
    }
  }

  loopThroughJSON(file);
}

// Updates a file with new content.
router.put("/api/documents/updateFile", async (req, res) => {
  const { saveData, name, folderPath } = req.body;

  const filePath = path.join(notebooksFolderPath, folderPath, name);
  const file = await fs.readFileSync(filePath, "utf-8");

  const fileData = JSON.parse(file);
  // fileData[0] since everything in JSON is stored in one array.
  fileData[0].content = saveData;

  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf8");
  res.json({ success: true });
});

// Uploads image files to the server.
router.post(
  "/api/uploadImageFile",
  express.raw({ type: "image/*", limit: "10mb" }),
  async (req, res) => {
    const imgType = req.headers["content-type"];

    let fileEnding;
    if (imgType === "image/png") {
      fileEnding = ".png";
    } else if (imgType === "image/jpg") {
      fileEnding = ".jpg";
    } else if (imgType === "image/gif") {
      fileEnding = ".gif";
    }

    // Sets the image's name to a completely random ID.
    const fileName = imageName() + fileEnding;
    let location = path.join(imageFolderPath, fileName);
    fs.writeFileSync(location, req.body);

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
