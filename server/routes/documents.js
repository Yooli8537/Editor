const { error } = require("console");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const rootPath = path.join(__dirname, "../../");
const dataFolderPath = path.join(rootPath, "data");
const autosavesFolderPath = path.join(dataFolderPath, "autosaves");
const notebooksFolderPath = path.join(dataFolderPath, "notebooks");
const imageFolderPath = path.join(dataFolderPath, "images");
const attachmentsFolderPath = path.join(dataFolderPath, "attachments");
const masterFilePath = path.join(dataFolderPath, "master.json");

// Gets full data folder
async function readDirRecursive(dir) {
  const entries = await fs.promises.readdir(dir, {
    withFileTypes: true,
  });

  return Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return {
          name: entry.name,
          isFolder: true,
          children: await readDirRecursive(fullPath),
        };
      } else {
        return {
          name: entry.name,
          isFolder: false,
        };
      }
    }),
  );
}

async function searchNotebooks(dir, key, searchResults) {
  lowerKey = key.toLowerCase(); // Sets key to be lowercase
  const entries = await fs.promises.readdir(dir, {
    withFileTypes: true,
  });

  return Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return searchNotebooks(fullPath, lowerKey, searchResults);
      } else {
        console.log(fullPath);
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

function findText(node, key, file, searchResults, fileTitle) {
  if (fileTitle) {
    if (fileTitle.toLowerCase().includes(key) && !searchResults.includes(file)) {
      searchResults.push(file);
    }
  }

  if (node.type === "text") {
    if (node.text.toLowerCase().includes(key) && !searchResults.includes(file)) {
      searchResults.push(file);
    }
  }

  if (node.content) {
    node.content.forEach((child) => findText(child, key, file, searchResults));
  }

  return;
}

// GET all documents
router.get("/api/documents", async (req, res) => {
  const resposneArray = await readDirRecursive(notebooksFolderPath);

  res.json(resposneArray);
});

router.get("/api/documents/search", async (req, res) => {
  const { key } = req.query;
  const searchResults = [];
  await searchNotebooks(notebooksFolderPath, key, searchResults);

  console.log(searchResults);

  // Results that can be used by the Sidebar loading function
  const relativeResults = searchResults.map((fullPath) => ({
    path: path.relative(notebooksFolderPath, fullPath),
    name: path.basename(fullPath),
    folderPath: path.relative(notebooksFolderPath, path.dirname(fullPath)),
  }));

  res.json(relativeResults);
});

// Create new Notebook
router.post("/api/documents/newNotebook", async (req, res) => {
  const { name } = req.body;

  try {
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

// Create new File
router.post("/api/documents/newFile", async (req, res) => {
  const { name, folderPath } = req.body;
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
    } else if (name) {
      console.error("No Folder Path found.");
    } else if (folderPath) {
      console.error("No Name found.");
    } else {
      console.error("Required values not found for operation.");
    }
  } catch (err) {
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

// Create new Folder
router.post("/api/documents/newFolder", async (req, res) => {
  const { name, folderPath } = req.body;

  try {
    if (name && folderPath) {
      await fs.mkdirSync(path.join(notebooksFolderPath, folderPath, name));
      res.json({ success: true });
    } else if (name) {
      console.error("No Folder Path found.");
    } else if (folderPath) {
      console.error("No Name found.");
    } else {
      console.error("Required values not found for operation.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create Folder" });
  }
});

// Delete Folder / File
router.delete("/api/documents/deletePath", async (req, res) => {
  // Originally only meant for folders but works for Files too... Happy accidents :)
  const { name, folderPath } = req.body;

  try {
    if (name && folderPath) {
      const fullFolderPath = path.join(notebooksFolderPath, folderPath);

      await fs.promises.rm(fullFolderPath, { recursive: true, force: true });
      res.send("Path successfully deleted.");
    } else if (name) {
      console.error("No Folder Path found.");
    } else if (folderPath) {
      console.error("No Name found.");
    } else {
      console.error("Required values not found for operation.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fulfill deletion Request." });
  }
});

// GET single File
router.get("/api/documents/getFile", async (req, res) => {
  const { name, folderPath } = req.query;

  try {
    const fullFolderPath = path.join(notebooksFolderPath, folderPath, name);
    const file = await fs.promises.readFile(fullFolderPath);
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

// Rename single File
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
    if (newName && folderPath && name) {
      await fs.promises.rename(filePath, newFilePath);

      // Changing Title inside Document
      const fileContent = await fs.promises.readFile(newFilePath, "utf-8");
      const fileData = JSON.parse(fileContent);
      fileData[0].title = newName;
      fs.writeFileSync(newFilePath, JSON.stringify(fileData, null, 2), "utf-8");

      res.json({ success: true });
    } else if (!newName || newName == "") {
      console.error("No new Name found");
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

// Rename Folder
router.post("/api/documents/renameFolder", async (req, res) => {
  console.log(req.body);
  const { newName, folderPath, name } = req.body;

  const currentPath = path.join(notebooksFolderPath, folderPath, name);
  const newPath = path.join(notebooksFolderPath, folderPath, newName);
  /*
  If a Folder is in the "root" directory, no folderPath will be recieved.
  This exception requires a different path to be built.
  */
  const rootPath = path.join(notebooksFolderPath, name);
  const newRootPath = path.join(notebooksFolderPath, newName);

  try {
    if (newName && folderPath && name) {
      await fs.promises.rename(currentPath, newPath);

      res.json({ success: true });
      return;
    } else if (newName && name) {
      await fs.promises.cp(currentPath, newPath, { recursive: true });
      await fs.promises.rm(currentPath, { recursive: true, force: true });

      res.json({ success: true });
    } else if (!newName || newName == "") {
      console.error("No new Name found");
    } else if (!folderPath) {
      console.error("No Folder Path found.");
    } else if (!name) {
      console.error("No Folder found.");
    } else {
      console.error(
        "Multiple values which are required for renaming a Folder were not found.",
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to rename Folder." });
  }
});

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

router.put("/api/documents/updateFile", async (req, res) => {
  const { saveData, name, folderPath } = req.body;

  const filePath = path.join(notebooksFolderPath, folderPath, name);
  const file = await fs.readFileSync(filePath, "utf-8");

  const fileData = JSON.parse(file);
  fileData[0].content = saveData;

  readFileData(fileData);

  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf8");
  res.json({ success: true });
});

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

    const fileName = imageName() + fileEnding;
    location = path.join(imageFolderPath, fileName);
    fs.writeFileSync(location, req.body);

    res.json({
      url: `/data/images/${fileName}`,
    });
  },
);

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
